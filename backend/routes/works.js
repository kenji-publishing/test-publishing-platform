/**
 * Works Routes
 * 
 * Handles work creation, retrieval, management, synopsis, and preview
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const multer = require('multer');

// 不正なUUIDのパスは即404にする（そのままDBに渡すと22P02で500になる。ボットの変則URL対策）
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('workId', (req, res, next, value) => {
    if (!UUID_RE.test(value)) return res.status(404).json({ error: 'Work not found' });
    next();
});
router.param('collaboratorId', (req, res, next, value) => {
    if (!UUID_RE.test(value)) return res.status(404).json({ error: 'Not found' });
    next();
});
const path = require('path');
const fs = require('fs');
const { REVENUE_SHARES, generateAgreementHash } = require('../config/revenue');
const { createNotification } = require('../services/notificationService');

// ===== 対象年齢と内容の注意表示（migration 047）=====
// 運用方針: 露骨な性的描写は禁止のため '18' は受け付けない（全年齢に丸める）。
// 解禁する場合はここを緩め、年齢確認の実装とセットで行うこと。
const ALLOWED_AGE_RATINGS = ['all', '15'];
const ALLOWED_WARNINGS = ['violence', 'horror', 'sexual_themes', 'substances', 'discrimination', 'self_harm'];

function normalizeAgeRating(v) {
    return ALLOWED_AGE_RATINGS.includes(v) ? v : 'all';
}
function normalizeWarnings(v) {
    if (!Array.isArray(v)) return [];
    return ALLOWED_WARNINGS.filter(w => v.includes(w)); // 未知の値は捨てる・順序も固定
}

/** 同意書発行をコラボレーターに通知（失敗しても本処理は止めない） */
async function notifyNewCollaborators(newCollabs, workTitle) {
    for (const n of newCollabs) {
        try {
            await createNotification({
                userId: n.userId,
                type: 'system',
                title: '同意書が届きました / New agreement',
                message: `「${workTitle}」の${n.role === 'translator' ? '翻訳' : '編集'}同意書が届いています。内容を確認して署名してください。 / You have a new ${n.role === 'translator' ? 'translation' : 'editing'} agreement for "${workTitle}". Please review and sign it.`,
                actionUrl: '/pages/agreements.html'
            });
        } catch (e) {
            console.error('Notify collaborator failed:', e.message);
        }
    }
}

// ===== Collaborators (editor / translator revenue sharing) =====

// Platform-fixed shares per role — clients cannot set arbitrary percentages
const COLLAB_SHARES = {
    editor: REVENUE_SHARES.EDITOR,        // 10
    translator: REVENUE_SHARES.TRANSLATOR // 20
};

/**
 * Resolve collaborator identifiers (registered email or pen name) to users.
 * Input: [{ role: 'editor'|'translator', identifier, targetLanguage? }]
 * Throws an Error with .code / .role / .identifier on validation failure so
 * the route can return a 400 the frontend can translate for the author.
 */
async function resolveCollaborators(collaborators, authorId) {
    if (!Array.isArray(collaborators) || collaborators.length === 0) return [];
    const seenRoles = new Set();
    const resolved = [];
    for (const c of collaborators) {
        const role = c && c.role;
        const identifier = (c && typeof c.identifier === 'string') ? c.identifier.trim() : '';
        if (!COLLAB_SHARES[role] || seenRoles.has(role)) continue; // unknown/duplicate roles ignored
        seenRoles.add(role);
        if (!identifier) {
            const err = new Error(`Missing ${role} email or pen name`);
            err.code = 'COLLABORATOR_IDENTIFIER_REQUIRED';
            err.role = role;
            throw err;
        }
        const result = await db.query(
            `SELECT user_id FROM users
             WHERE (LOWER(email) = LOWER($1) OR LOWER(pen_name) = LOWER($1))
               AND deleted_at IS NULL
             LIMIT 1`,
            [identifier]
        );
        if (result.rows.length === 0) {
            const err = new Error(`${role} not found: ${identifier}`);
            err.code = 'COLLABORATOR_NOT_FOUND';
            err.role = role;
            err.identifier = identifier;
            throw err;
        }
        if (result.rows[0].user_id === authorId) {
            const err = new Error(`The author cannot be added as ${role}`);
            err.code = 'COLLABORATOR_IS_AUTHOR';
            err.role = role;
            throw err;
        }
        resolved.push({
            userId: result.rows[0].user_id,
            role,
            share: COLLAB_SHARES[role],
            targetLanguage: role === 'translator' ? (c.targetLanguage || null) : null
        });
    }
    return resolved;
}

/**
 * Sync a work's collaborators with the resolved set (inside caller's txn).
 * - Removed collaborators are deleted (their agreement rows cascade away).
 * - Unchanged collaborators keep their row and signing status.
 * - New collaborators start as 'pending' with a collaboration agreement to
 *   sign on agreements.html; they become 'active' (revenue-eligible) only
 *   after signing. Until then their share goes to the author.
 */
async function syncWorkCollaborators(client, workId, resolved, workInfo, authorId) {
    const existing = (await client.query(
        `SELECT collaborator_id, user_id, role FROM work_collaborators
         WHERE work_id = $1 AND status != 'removed'`,
        [workId]
    )).rows;

    for (const ex of existing) {
        const kept = resolved.find(r => r.role === ex.role && r.userId === ex.user_id);
        if (!kept) {
            await client.query('DELETE FROM work_collaborators WHERE collaborator_id = $1', [ex.collaborator_id]);
        }
    }

    const newCollabs = []; // COMMIT後に通知するため呼び出し元へ返す

    for (const r of resolved) {
        const already = existing.find(ex => ex.role === r.role && ex.user_id === r.userId);
        if (already) continue; // 署名状態を保持
        newCollabs.push({ userId: r.userId, role: r.role });

        const ins = await client.query(
            `INSERT INTO work_collaborators (work_id, user_id, role, revenue_share, target_language, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             RETURNING collaborator_id`,
            [workId, r.userId, r.role, r.share, r.targetLanguage]
        );

        const terms = {
            version: '1.0',
            workId,
            workTitle: (workInfo && workInfo.title) || '',
            role: r.role,
            revenueShare: r.share,
            platformShare: REVENUE_SHARES.PLATFORM,
            targetLanguage: r.targetLanguage || null,
            authorId,
            collaboratorUserId: r.userId,
            createdAt: new Date().toISOString()
        };
        await client.query(
            `INSERT INTO collaboration_agreements (collaborator_id, work_id, author_id, user_id, terms, terms_hash)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [ins.rows[0].collaborator_id, workId, authorId, r.userId, JSON.stringify(terms), generateAgreementHash(terms)]
        );
    }

    return newCollabs;
}

/** 400 payload for collaborator validation errors, null for other errors. */
function collaboratorErrorResponse(error) {
    if (!error || !String(error.code || '').startsWith('COLLABORATOR_')) return null;
    return { error: error.message, code: error.code, role: error.role || null, identifier: error.identifier || null };
}

// Cover image upload (multer) — stored under uploads/covers, served via /uploads
const COVER_DIR = path.join(__dirname, '..', 'uploads', 'covers');
fs.mkdirSync(COVER_DIR, { recursive: true });

const coverStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, COVER_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `cover_${req.user.userId}_${Date.now()}${ext}`);
    }
});

const coverUpload = multer({
    storage: coverStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ok = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            .includes(path.extname(file.originalname).toLowerCase());
        cb(ok ? null : new Error('Only image files are allowed'), ok);
    }
});

/**
 * POST /api/works/upload-cover
 * Upload a cover image (authenticated). Returns the public URL.
 */
router.post('/upload-cover', authenticate, coverUpload.single('cover'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ success: true, url: `/uploads/covers/${req.file.filename}` });
});

// 挿絵（Word原稿内の画像）— 表紙と同じ公開静的配信、uploads/illustrations 配下
const ILLUST_DIR = path.join(__dirname, '..', 'uploads', 'illustrations');
fs.mkdirSync(ILLUST_DIR, { recursive: true });

const illustUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, ILLUST_DIR),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase() || '.png';
            cb(null, `il_${req.user.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ok = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            .includes(path.extname(file.originalname).toLowerCase());
        cb(ok ? null : new Error('Only image files are allowed'), ok);
    }
});

/**
 * POST /api/works/upload-illustration
 * 本文用の挿絵を1枚アップロード（要ログイン）。公開URLを返す
 */
router.post('/upload-illustration', authenticate, illustUpload.single('illustration'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ success: true, url: `/uploads/illustrations/${req.file.filename}` });
});

/**
 * GET /api/works/my
 * Get the authenticated user's own works, all statuses (drafts included)
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT work_id, title, status, cover_image, cover_image_url,
                    view_count, like_count, comment_count, page_count,
                    price, currency, is_free, language, original_language,
                    content_type, genre, ai_text_usage, ai_cover_usage,
                    created_at, updated_at, published_at
             FROM works
             WHERE author_id = $1 AND status != 'deleted'
             ORDER BY updated_at DESC`,
            [req.user.userId]
        );
        res.json({ success: true, works: result.rows });
    } catch (error) {
        console.error('Get my works error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works/my/:workId
 * Get one of the authenticated user's own works, full row (content
 * included, any status) — used by the upload page's edit mode.
 */
router.get('/my/:workId', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM works WHERE work_id = $1 AND author_id = $2`,
            [req.params.workId, req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Work not found' });
        }
        const work = result.rows[0];
        // Collaborators for the edit form (email shown so the author can fix it)
        const collabs = await db.query(
            `SELECT wc.role, wc.revenue_share, wc.target_language, wc.status, u.email,
                    COALESCE(u.pen_name, u.first_name || ' ' || u.last_name) AS name
             FROM work_collaborators wc
             JOIN users u ON wc.user_id = u.user_id
             WHERE wc.work_id = $1 AND wc.status IN ('pending', 'active')`,
            [req.params.workId]
        );
        work.collaborators = collabs.rows;
        res.json({ success: true, work });
    } catch (error) {
        console.error('Get my work error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works
 * Get all published works (public)
 */
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, limit = 20, genre, language, authorId,
            sort = 'newest', excludeAdult = 'true'
        } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT w.work_id, w.title, w.description, w.synopsis, w.cover_image_url,
                   w.cover_image, w.genre, w.original_language, w.language,
                   w.content_type, w.price, w.currency, w.is_free,
                   w.view_count, w.like_count, w.comment_count,
                   w.rating_average, w.rating_count, w.published_at,
                   w.is_adult, w.age_rating, w.content_warnings,
                   w.is_ai_generated, w.ai_tools_used,
                   w.ai_text_usage, w.ai_cover_usage, w.ai_translation_usage,
                   u.user_id as author_id, u.pen_name as author_name,
                   u.first_name, u.last_name
            FROM works w
            JOIN users u ON w.author_id = u.user_id
            WHERE w.status = 'published'
        `;

        const params = [];
        let paramCount = 1;

        if (genre) {
            query += ` AND w.genre = $${paramCount}`;
            params.push(genre);
            paramCount++;
        }

        if (language) {
            query += ` AND (w.original_language = $${paramCount} OR w.language = $${paramCount})`;
            params.push(language);
            paramCount++;
        }

        if (authorId) {
            query += ` AND w.author_id = $${paramCount}`;
            params.push(authorId);
            paramCount++;
        }

        if (excludeAdult === 'true') {
            query += ` AND (w.is_adult = FALSE OR w.is_adult IS NULL)`;
        }

        // Sorting
        switch (sort) {
            case 'popular':
                query += ` ORDER BY w.like_count DESC NULLS LAST, w.view_count DESC NULLS LAST`;
                break;
            case 'views':
                query += ` ORDER BY w.view_count DESC NULLS LAST`;
                break;
            case 'oldest':
                query += ` ORDER BY w.published_at ASC NULLS LAST`;
                break;
            default:
                query += ` ORDER BY w.published_at DESC NULLS LAST`;
        }

        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) FROM works WHERE status = 'published'`;
        if (excludeAdult === 'true') {
            countQuery += ` AND (is_adult = FALSE OR is_adult IS NULL)`;
        }
        const countResult = await db.query(countQuery);

        res.json({
            success: true,
            works: result.rows,
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        console.error('Get works error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works/my/all
 * Get current user's works (authenticated)
 */
router.get('/my/all', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM works
             WHERE author_id = $1
             ORDER BY created_at DESC`,
            [req.user.userId]
        );

        res.json({ 
            success: true,
            works: result.rows 
        });
    } catch (error) {
        console.error('Get my works error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works/collaborations/mine
 * Works where the authenticated user is an active collaborator
 * (editor/translator), with the revenue earned so far per work.
 * NOTE: must stay defined before GET /:workId or it gets shadowed.
 */
router.get('/collaborations/mine', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT wc.collaborator_id, wc.role, wc.revenue_share, wc.target_language, wc.created_at, wc.status,
                    w.work_id, w.title, w.status AS work_status,
                    COALESCE(u.pen_name, u.first_name || ' ' || u.last_name) AS author_name,
                    COALESCE((SELECT SUM(rs.amount) FROM revenue_splits rs
                              WHERE rs.recipient_id = wc.user_id AND rs.work_id = wc.work_id), 0) AS earned,
                    (SELECT rs2.currency FROM revenue_splits rs2
                     WHERE rs2.recipient_id = wc.user_id AND rs2.work_id = wc.work_id
                     ORDER BY rs2.created_at DESC LIMIT 1) AS earned_currency
             FROM work_collaborators wc
             JOIN works w ON wc.work_id = w.work_id
             JOIN users u ON w.author_id = u.user_id
             WHERE wc.user_id = $1 AND wc.status IN ('requested', 'pending', 'active', 'partner') AND w.status != 'deleted'
             ORDER BY wc.created_at DESC`,
            [req.user.userId]
        );
        res.json({ success: true, collaborations: result.rows });
    } catch (error) {
        console.error('Get my collaborations error:', error);
        res.status(500).json({ error: error.message });
    }
});

/** 同意書を1件発行（承認フローとsyncWorkCollaboratorsで共用の形） */
async function createAgreementRow(client, { collaboratorId, workId, workTitle, authorId, userId, role, share, targetLanguage }) {
    const terms = {
        version: '1.0', workId, workTitle: workTitle || '', role,
        revenueShare: share, platformShare: REVENUE_SHARES.PLATFORM,
        targetLanguage: targetLanguage || null, authorId, collaboratorUserId: userId,
        createdAt: new Date().toISOString()
    };
    await client.query(
        `INSERT INTO collaboration_agreements (collaborator_id, work_id, author_id, user_id, terms, terms_hash)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [collaboratorId, workId, authorId, userId, JSON.stringify(terms), generateAgreementHash(terms)]
    );
}

/**
 * GET /api/works/collaboration-requests/incoming
 * 自分の作品への申請一覧（著者向け）。/:workIdより先に定義すること
 */
router.get('/collaboration-requests/incoming', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT wc.collaborator_id, wc.role, wc.revenue_share, wc.target_language, wc.created_at,
                    w.work_id, w.title,
                    u.user_id AS applicant_id, u.bio AS applicant_bio,
                    u.country_code AS applicant_country, u.verified AS applicant_verified,
                    u.profile_image_url AS applicant_image,
                    COALESCE(u.pen_name, u.first_name || ' ' || u.last_name) AS applicant_name
             FROM work_collaborators wc
             JOIN works w ON wc.work_id = w.work_id
             JOIN users u ON wc.user_id = u.user_id
             WHERE w.author_id = $1 AND wc.status = 'requested'
             ORDER BY wc.created_at DESC`,
            [req.user.userId]
        );
        res.json({ success: true, requests: result.rows });
    } catch (error) {
        console.error('Get collaboration requests error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works/collaboration-partners/mine
 * 承認済みの次回作編集パートナー一覧（著者向け）。
 * アップロード画面の「この編集者を指定しますか？」サジェスト用。/:workIdより先に定義すること
 */
router.get('/collaboration-partners/mine', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT DISTINCT ON (u.user_id)
                    u.user_id, u.email,
                    COALESCE(u.pen_name, u.first_name || ' ' || u.last_name) AS name,
                    wc.updated_at AS approved_at
             FROM work_collaborators wc
             JOIN works w ON wc.work_id = w.work_id
             JOIN users u ON wc.user_id = u.user_id
             WHERE w.author_id = $1 AND wc.role = 'editor' AND wc.status = 'partner'
             ORDER BY u.user_id, wc.updated_at DESC`,
            [req.user.userId]
        );
        res.json({ success: true, partners: result.rows });
    } catch (error) {
        console.error('Get collaboration partners error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/works/:workId/apply
 * 翻訳者「この作品を翻訳したい」/ 編集者「この著者の次回作を編集したい」の申請
 */
router.post('/:workId/apply', authenticate, async (req, res) => {
    try {
        const { role, targetLanguage } = req.body;
        if (!COLLAB_SHARES[role]) return res.status(400).json({ error: 'Invalid role' });

        const workResult = await db.query(
            `SELECT work_id, title, author_id FROM works WHERE work_id = $1 AND status = 'published'`,
            [req.params.workId]
        );
        if (workResult.rows.length === 0) return res.status(404).json({ error: 'Work not found' });
        const work = workResult.rows[0];
        if (work.author_id === req.user.userId) {
            return res.status(400).json({ error: 'You cannot apply to your own work' });
        }

        // 同役割の既存行を確認（declined/removedなら上書き申請を許可）
        const existing = (await db.query(
            `SELECT collaborator_id, status FROM work_collaborators WHERE work_id = $1 AND role = $2`,
            [work.work_id, role]
        )).rows[0];
        if (existing && ['requested', 'pending', 'active'].includes(existing.status)) {
            return res.status(409).json({ error: 'This role already has an applicant or collaborator', code: 'ROLE_TAKEN' });
        }
        if (existing) {
            await db.query('DELETE FROM work_collaborators WHERE collaborator_id = $1', [existing.collaborator_id]);
        }

        await db.query(
            `INSERT INTO work_collaborators (work_id, user_id, role, revenue_share, target_language, status)
             VALUES ($1, $2, $3, $4, $5, 'requested')`,
            [work.work_id, req.user.userId, role, COLLAB_SHARES[role], role === 'translator' ? (targetLanguage || null) : null]
        );

        try {
            const applicant = (await db.query(
                `SELECT COALESCE(pen_name, first_name || ' ' || last_name) AS name FROM users WHERE user_id = $1`,
                [req.user.userId]
            )).rows[0];
            await createNotification({
                userId: work.author_id,
                type: 'system',
                title: role === 'translator' ? '翻訳の申請が届きました / Translation request' : '次回作の編集パートナー申請が届きました / Editing partner request',
                message: role === 'translator'
                    ? `「${work.title}」に${applicant.name}さんから翻訳の申請が届いています。ダッシュボードのコラボレーションタブから承認・却下できます。 / ${applicant.name} applied to translate "${work.title}". Approve or decline from the dashboard collaboration tab.`
                    : `「${work.title}」を見た${applicant.name}さんが、あなたの次回作の編集を希望しています。ダッシュボードのコラボレーションタブから承認・却下できます。 / ${applicant.name} would like to edit your next work (after seeing "${work.title}"). Approve or decline from the dashboard collaboration tab.`,
                actionUrl: '/pages/dashboard.html'
            });
        } catch (e) { console.error('Notify author failed:', e.message); }

        res.json({ success: true, status: 'requested' });
    } catch (error) {
        console.error('Apply error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/works/collaborators/:collaboratorId/approve | /reject
 * 著者が申請を承認（→pending+同意書発行）または却下
 */
async function handleRequestDecision(req, res, approve) {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const row = (await client.query(
            `SELECT wc.*, w.title, w.author_id FROM work_collaborators wc
             JOIN works w ON wc.work_id = w.work_id
             WHERE wc.collaborator_id = $1 FOR UPDATE OF wc`,
            [req.params.collaboratorId]
        )).rows[0];
        if (!row) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Request not found' }); }
        if (row.author_id !== req.user.userId) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Not your work' }); }
        if (row.status !== 'requested') { await client.query('ROLLBACK'); return res.status(400).json({ error: `Request already ${row.status}` }); }

        // 編集者の申請は「次回作パートナー」: 公開済みの現作品には編集の余地がないため、
        // 同意書・収益は紐付けない。次回作アップロード時に編集者指定→同意書発行（パターンA）で確定する。
        const isPartner = approve && row.role === 'editor';
        const newStatus = approve ? (isPartner ? 'partner' : 'pending') : 'declined';

        if (approve) {
            await client.query(
                `UPDATE work_collaborators SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE collaborator_id = $1`,
                [row.collaborator_id, newStatus]
            );
            if (!isPartner) {
                await createAgreementRow(client, {
                    collaboratorId: row.collaborator_id, workId: row.work_id, workTitle: row.title,
                    authorId: row.author_id, userId: row.user_id, role: row.role,
                    share: parseFloat(row.revenue_share), targetLanguage: row.target_language
                });
            }
        } else {
            await client.query(
                `UPDATE work_collaborators SET status = 'declined', updated_at = CURRENT_TIMESTAMP WHERE collaborator_id = $1`,
                [row.collaborator_id]
            );
        }
        await client.query('COMMIT');

        try {
            let title, message, actionUrl;
            if (!approve) {
                title = '申請が却下されました / Request declined';
                message = `「${row.title}」への${row.role === 'translator' ? '翻訳' : '編集'}申請は見送られました。 / Your request for "${row.title}" was declined.`;
                actionUrl = '/pages/browse.html';
            } else if (isPartner) {
                title = '次回作パートナーとして承認されました / Approved as next-work partner';
                message = `「${row.title}」の著者があなたを次回作の編集パートナーとして承認しました。メッセージで作品の内容を相談しましょう。同意書と収益分配は、著者が次回作をアップロードしてあなたを編集者に指定した時点で発行されます。 / The author approved you as an editing partner for their next work. Discuss the project via messages — the agreement and revenue share will be issued when the next work is uploaded with you designated as its editor.`;
                actionUrl = '/pages/messages.html';
            } else {
                title = '申請が承認されました / Request approved';
                message = `「${row.title}」への翻訳申請が承認されました。同意書ページで条件を確認して署名してください。 / Your request for "${row.title}" was approved. Please review and sign the agreement.`;
                actionUrl = '/pages/agreements.html';
            }
            await createNotification({ userId: row.user_id, type: 'system', title, message, actionUrl });
        } catch (e) { console.error('Notify applicant failed:', e.message); }

        res.json({ success: true, status: newStatus });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Request decision error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
router.post('/collaborators/:collaboratorId/approve', authenticate, (req, res) => handleRequestDecision(req, res, true));
router.post('/collaborators/:collaboratorId/reject', authenticate, (req, res) => handleRequestDecision(req, res, false));

/**
 * POST /api/works/collaborators/:collaboratorId/progress
 * コラボレーター本人が進捗を報告（著者に通知）
 */
router.post('/collaborators/:collaboratorId/progress', authenticate, async (req, res) => {
    try {
        const { percent, status, comment } = req.body;
        const pct = parseInt(percent, 10);
        if (isNaN(pct) || pct < 0 || pct > 100) return res.status(400).json({ error: 'percent must be 0-100' });
        const st = ['on-track', 'behind', 'need-help'].includes(status) ? status : 'on-track';

        const row = (await db.query(
            `SELECT wc.*, w.title, w.author_id FROM work_collaborators wc
             JOIN works w ON wc.work_id = w.work_id WHERE wc.collaborator_id = $1`,
            [req.params.collaboratorId]
        )).rows[0];
        if (!row) return res.status(404).json({ error: 'Collaboration not found' });
        if (row.user_id !== req.user.userId) return res.status(403).json({ error: 'Not your collaboration' });
        if (row.status !== 'active') return res.status(400).json({ error: 'Collaboration is not active' });

        await db.query(
            `INSERT INTO collaboration_progress (collaborator_id, percent, status, comment)
             VALUES ($1, $2, $3, $4)`,
            [row.collaborator_id, pct, st, (comment || '').slice(0, 2000)]
        );

        try {
            const reporter = (await db.query(
                `SELECT COALESCE(pen_name, first_name || ' ' || last_name) AS name FROM users WHERE user_id = $1`,
                [req.user.userId]
            )).rows[0];
            await createNotification({
                userId: row.author_id,
                type: 'system',
                title: '進捗報告が届きました / Progress report',
                message: `「${row.title}」の${row.role === 'translator' ? '翻訳' : '編集'}進捗: ${pct}%（${reporter.name}さん）${comment ? ' — ' + String(comment).slice(0, 100) : ''}`,
                actionUrl: '/pages/dashboard.html'
            });
        } catch (e) { console.error('Notify author failed:', e.message); }

        res.json({ success: true });
    } catch (error) {
        console.error('Progress report error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works/:workId
 * Get single work details (public)
 */
router.get('/:workId', async (req, res) => {
    try {
        const { userId } = req.query;

        const result = await db.query(
            `SELECT w.*, 
                    u.pen_name as author_name, u.user_id as author_id,
                    u.first_name, u.last_name,
                    COALESCE(w.like_count, 0) as like_count,
                    COALESCE(w.comment_count, 0) as comment_count
             FROM works w
             JOIN users u ON w.author_id = u.user_id
             WHERE w.work_id = $1 AND w.status = 'published'`,
            [req.params.workId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Work not found' });
        }

        const work = result.rows[0];

        // Check if user has liked
        let userLiked = false;
        if (userId) {
            const likeCheck = await db.query(
                `SELECT * FROM likes WHERE work_id = $1 AND user_id = $2`,
                [req.params.workId, userId]
            );
            userLiked = likeCheck.rows.length > 0;
        }

        // Increment view count
        await db.query(
            'UPDATE works SET view_count = COALESCE(view_count, 0) + 1 WHERE work_id = $1',
            [req.params.workId]
        );

        res.json({ 
            success: true,
            work: {
                ...work,
                userLiked,
                content: undefined // Don't send full content
            }
        });
    } catch (error) {
        console.error('Get work error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works/:workId/preview
 * Get work preview - synopsis + first 10% of content
 */
router.get('/:workId/preview', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT w.work_id, w.title, w.description, w.synopsis, 
                    w.content, w.preview_percent, w.is_free, w.price,
                    w.word_count, w.page_count,
                    u.pen_name as author_name, u.first_name, u.last_name
             FROM works w
             JOIN users u ON w.author_id = u.user_id
             WHERE w.work_id = $1 AND w.status = 'published'`,
            [req.params.workId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Work not found' });
        }

        const work = result.rows[0];
        const content = work.content || '';
        const previewPercent = work.preview_percent || 10;

        // Calculate preview length
        const previewLength = Math.floor(content.length * (previewPercent / 100));

        // Find a good break point (end of sentence or paragraph)
        let previewContent = content.substring(0, previewLength);

        // Try to end at a sentence
        const lastPeriod = Math.max(
            previewContent.lastIndexOf('。'),
            previewContent.lastIndexOf('.'),
            previewContent.lastIndexOf('！'),
            previewContent.lastIndexOf('!'),
            previewContent.lastIndexOf('？'),
            previewContent.lastIndexOf('?'),
            previewContent.lastIndexOf('\n\n')
        );

        if (lastPeriod > previewLength * 0.7) {
            previewContent = previewContent.substring(0, lastPeriod + 1);
        }

        res.json({
            success: true,
            preview: {
                workId: work.work_id,
                title: work.title,
                authorName: work.author_name || `${work.first_name} ${work.last_name}`,
                description: work.description,
                synopsis: work.synopsis,
                previewContent: previewContent,
                previewPercent: previewPercent,
                totalLength: content.length,
                wordCount: work.word_count,
                pageCount: work.page_count,
                isFree: work.is_free,
                price: work.price,
                hasMore: content.length > previewContent.length
            }
        });
    } catch (error) {
        console.error('Get preview error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works/:workId/full
 * Get full work content (requires purchase or ownership)
 */
router.get('/:workId/full', authenticate, async (req, res) => {
    try {
        // Identity must come from the verified JWT. Author IDs are public
        // (returned by GET /works), so a client-supplied userId would let
        // anyone read paid content for free.
        const userId = req.user.userId;

        // 公開停止（著者の退会=archived、規約違反の差し止め=suspended）でも、
        // **すでに購入した人は読めるままにする**（買った本を取り上げないため）。
        // 完全削除(deleted)だけは誰も読めない
        const result = await db.query(
            `SELECT * FROM works WHERE work_id = $1 AND status <> 'deleted'`,
            [req.params.workId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Work not found' });
        }

        const work = result.rows[0];

        // Check if user is author
        if (work.author_id === userId) {
            return res.json({
                success: true,
                work,
                access: 'author'
            });
        }

        // 無料作品は「公開中」の間だけ誰でも読める（取り下げ後に新規で読めるのは不適切）
        if (work.status === 'published' && (work.is_free || work.price === 0 || work.price === null)) {
            return res.json({
                success: true,
                work,
                access: 'free'
            });
        }

        // Check if user has purchased the work
        const purchaseCheck = await db.query(
            `SELECT 1 FROM purchases
             WHERE user_id = $1 AND work_id = $2 AND payment_status = 'completed'`,
            [userId, req.params.workId]
        );
        if (purchaseCheck.rows.length > 0) {
            return res.json({
                success: true,
                work,
                access: 'purchased'
            });
        }

        // 未購入で、かつ公開されていない作品は存在を伏せる
        if (work.status !== 'published') {
            return res.status(404).json({ error: 'Work not found' });
        }

        return res.status(403).json({
            error: 'Purchase required to access full content',
            price: work.price
        });
    } catch (error) {
        console.error('Get full work error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== マンガ作品のページ画像（migration 035: work_pages） =====
// 1枚ずつアップロード（15MB制限内）。読者アクセスは/fullと同じ規則。
const MANGA_PAGES_DIR = path.join(__dirname, '..', 'uploads', 'manga-pages');
fs.mkdirSync(MANGA_PAGES_DIR, { recursive: true });

const workPageUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(MANGA_PAGES_DIR, req.params.workId);
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = (path.extname(file.originalname).toLowerCase() || '.jpg').replace(/[^.a-z0-9]/g, '');
            cb(null, `p${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
        }
    }),
    limits: { fileSize: 14 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
});

/** ページ閲覧の権限判定（/fullと同じ: 著者 / 無料 / 購入済み。下書きは著者のみ） */
async function checkPageReadAccess(workId, userId) {
    const result = await db.query(
        `SELECT w.work_id, w.author_id, w.status, w.is_free, w.price, w.title,
                COALESCE(u.pen_name, u.first_name || ' ' || u.last_name) AS author_name
         FROM works w
         LEFT JOIN users u ON u.user_id = w.author_id
         WHERE w.work_id = $1 AND w.status != 'deleted'`,
        [workId]
    );
    const work = result.rows[0];
    if (!work) return { error: 404 };
    if (work.author_id === userId) return { access: 'author', work };
    // 無料で読めるのは公開中の間だけ
    if (work.status === 'published' && (work.is_free || work.price === 0 || work.price === null)) {
        return { access: 'free', work };
    }
    // 購入済みなら公開停止後（archived/suspended）でも読める（/fullと同じ規則）
    const purchased = await db.query(
        `SELECT 1 FROM purchases WHERE user_id = $1 AND work_id = $2 AND payment_status = 'completed'`,
        [userId, workId]
    );
    if (purchased.rows.length > 0) return { access: 'purchased', work };
    if (work.status !== 'published') return { error: 404 };
    return { error: 403, price: work.price };
}

/**
 * POST /api/works/:workId/pages
 * ページ画像を1枚アップロード（著者のみ・マンガ作品のみ）。同じpage_noは置き換え
 */
router.post('/:workId/pages', authenticate, workPageUpload.single('page'), async (req, res) => {
    try {
        const work = (await db.query(
            `SELECT author_id, content_type FROM works WHERE work_id = $1 AND status != 'deleted'`,
            [req.params.workId]
        )).rows[0];
        if (!work) return res.status(404).json({ error: 'Work not found' });
        if (work.author_id !== req.user.userId) return res.status(403).json({ error: 'Not your work' });
        if (work.content_type !== 'manga') return res.status(400).json({ error: 'Not a manga work' });
        if (!req.file) return res.status(400).json({ error: 'Image file is required (jpeg/png/webp)' });

        const pageNo = parseInt(req.body.pageNo, 10);
        if (isNaN(pageNo) || pageNo < 1 || pageNo > 2000) {
            fs.unlink(req.file.path, () => {});
            return res.status(400).json({ error: 'pageNo must be 1-2000' });
        }
        const chapterTitle = (req.body.chapterTitle || '').trim().slice(0, 200) || null;

        // 同じページ番号の再アップロードは置き換え（旧ファイルも削除）
        const old = (await db.query(
            `DELETE FROM work_pages WHERE work_id = $1 AND page_no = $2 RETURNING file_name`,
            [req.params.workId, pageNo]
        )).rows[0];
        if (old) fs.unlink(path.join(MANGA_PAGES_DIR, req.params.workId, old.file_name), () => {});

        await db.query(
            `INSERT INTO work_pages (work_id, page_no, chapter_title, file_name) VALUES ($1, $2, $3, $4)`,
            [req.params.workId, pageNo, chapterTitle, req.file.filename]
        );
        res.json({ success: true, pageNo });
    } catch (error) {
        console.error('Upload work page error:', error);
        if (req.file) fs.unlink(req.file.path, () => {});
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/works/:workId/pages?from=N
 * page_no >= N のページを削除（著者のみ）。差し替えでページ数が減った時の掃除用
 */
router.delete('/:workId/pages', authenticate, async (req, res) => {
    try {
        const work = (await db.query(
            `SELECT author_id FROM works WHERE work_id = $1 AND status != 'deleted'`,
            [req.params.workId]
        )).rows[0];
        if (!work) return res.status(404).json({ error: 'Work not found' });
        if (work.author_id !== req.user.userId) return res.status(403).json({ error: 'Not your work' });

        const from = parseInt(req.query.from, 10);
        if (isNaN(from) || from < 1) return res.status(400).json({ error: 'from must be >= 1' });

        const removed = (await db.query(
            `DELETE FROM work_pages WHERE work_id = $1 AND page_no >= $2 RETURNING file_name`,
            [req.params.workId, from]
        )).rows;
        for (const r of removed) {
            fs.unlink(path.join(MANGA_PAGES_DIR, req.params.workId, r.file_name), () => {});
        }
        res.json({ success: true, deleted: removed.length });
    } catch (error) {
        console.error('Delete work pages error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works/:workId/pages
 * ページ一覧（番号・章タイトル）。閲覧権限が必要
 */
router.get('/:workId/pages', authenticate, async (req, res) => {
    try {
        const check = await checkPageReadAccess(req.params.workId, req.user.userId);
        if (check.error === 404) return res.status(404).json({ error: 'Work not found' });
        if (check.error === 403) return res.status(403).json({ error: 'Purchase required', price: check.price });

        const rows = (await db.query(
            `SELECT page_no, chapter_title FROM work_pages WHERE work_id = $1 ORDER BY page_no`,
            [req.params.workId]
        )).rows;
        res.json({
            success: true,
            access: check.access,
            title: check.work.title,
            authorName: check.work.author_name,
            totalPages: rows.length,
            pages: rows.map(r => ({ pageNo: r.page_no, chapterTitle: r.chapter_title }))
        });
    } catch (error) {
        console.error('List work pages error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/works/:workId/pages/:pageNo/image
 * ページ画像の本体。閲覧権限が必要
 */
router.get('/:workId/pages/:pageNo/image', authenticate, async (req, res) => {
    try {
        const check = await checkPageReadAccess(req.params.workId, req.user.userId);
        if (check.error === 404) return res.status(404).json({ error: 'Work not found' });
        if (check.error === 403) return res.status(403).json({ error: 'Purchase required', price: check.price });

        const pageNo = parseInt(req.params.pageNo, 10);
        const row = (await db.query(
            `SELECT file_name FROM work_pages WHERE work_id = $1 AND page_no = $2`,
            [req.params.workId, pageNo]
        )).rows[0];
        if (!row) return res.status(404).json({ error: 'Page not found' });
        const p = path.join(MANGA_PAGES_DIR, req.params.workId, row.file_name);
        if (!fs.existsSync(p)) return res.status(404).json({ error: 'Page file missing' });
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.sendFile(p);
    } catch (error) {
        console.error('Serve work page error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/works
 * Create new work (authenticated)
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            title,
            description,
            synopsis,
            content,
            originalLanguage,
            language,
            contentType,
            genre,
            tags,
            price,
            isFree,
            coverImage,
            isAdult,
            isAiGenerated,
            aiToolsUsed,
            previewPercent,
            currency,
            status,
            aiTextUsage,
            aiCoverUsage,
            aiTranslationUsage,
            ageRating,
            contentWarnings
        } = req.body;

        // Whitelist currency and publish status
        const SUPPORTED_CURRENCIES = ['USD', 'JPY', 'EUR', 'GBP', 'KRW', 'CNY', 'BRL', 'SAR'];
        const workCurrency = SUPPORTED_CURRENCIES.includes((currency || '').toUpperCase())
            ? currency.toUpperCase() : 'USD';
        const workStatus = status === 'published' ? 'published' : 'draft';
        // content_type is a DB enum: only 'text' | 'manga' | 'art'
        const workContentType = ['text', 'manga', 'art'].includes(contentType) ? contentType : 'text';
        // AI disclosure levels
        const AI_LEVELS = ['none', 'assisted', 'generated', 'full_ai', 'na'];
        const aiLevel = (v) => AI_LEVELS.includes(v) ? v : 'none';
        const aiText = aiLevel(aiTextUsage);
        const aiCover = aiLevel(aiCoverUsage);
        const aiTranslation = aiLevel(aiTranslationUsage);
        // 対象年齢。'18'は方針上まだ受け付けない（露骨な性的描写は禁止）ため
        // 全年齢に丸める。解禁する時はここと works_age_rating_check を見直す
        const rating = normalizeAgeRating(ageRating);
        const warnings = normalizeWarnings(contentWarnings);

        // Calculate word count
        const textContent = content || '';
        const wordCount = textContent.replace(/\s+/g, ' ').trim().split(/\s+/).length;
        const pageCount = Math.ceil(wordCount / 250);

        // Resolve collaborators (editor/translator) BEFORE any write so a
        // typo'd email fails the publish cleanly with a 400
        let resolvedCollabs = [];
        try {
            resolvedCollabs = await resolveCollaborators(req.body.collaborators, req.user.userId);
        } catch (collabError) {
            const payload = collaboratorErrorResponse(collabError);
            if (payload) return res.status(400).json(payload);
            throw collabError;
        }

        // Work + collaborators must be created atomically
        const client = await db.pool.connect();
        let work;
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `INSERT INTO works (
                    author_id, title, description, synopsis, content,
                    original_language, language, content_type, genre, tags,
                    price, is_free, cover_image, is_adult,
                    is_ai_generated, ai_tools_used, preview_percent,
                    word_count, page_count, currency, status,
                    ai_text_usage, ai_cover_usage, ai_translation_usage,
                    age_rating, content_warnings
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
                 RETURNING *`,
                [
                    req.user.userId,
                    title,
                    description || '',
                    synopsis || '',
                    content || '',
                    originalLanguage || 'ja',
                    language || originalLanguage || 'ja',
                    workContentType,
                    genre || 'general',
                    tags || [],
                    price || 0,
                    isFree || false,
                    coverImage || null,
                    rating === '18',   // is_adult は一覧除外に使われているので同期させる
                    isAiGenerated || (aiText !== 'none') || false,
                    aiToolsUsed || null,
                    previewPercent || 10,
                    wordCount,
                    pageCount,
                    workCurrency,
                    workStatus,
                    aiText,
                    aiCover,
                    aiTranslation,
                    rating,
                    JSON.stringify(warnings)
                ]
            );
            work = result.rows[0];
            const newCollabs = await syncWorkCollaborators(client, work.work_id, resolvedCollabs, work, req.user.userId);
            await client.query('COMMIT');
            notifyNewCollaborators(newCollabs, work.title); // 非同期・失敗しても本処理に影響なし
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

        res.status(201).json({
            success: true,
            message: 'Work created successfully',
            work
        });
    } catch (error) {
        console.error('Create work error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/works/:workId
 * Update work (authenticated, author only)
 */
router.put('/:workId', authenticate, async (req, res) => {
    try {
        // Check if user is the author
        const checkResult = await db.query(
            'SELECT author_id FROM works WHERE work_id = $1',
            [req.params.workId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Work not found' });
        }

        if (checkResult.rows[0].author_id !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized to edit this work' });
        }

        const {
            title, description, synopsis, content, genre, tags,
            price, status, isFree, coverImage, isAdult,
            isAiGenerated, aiToolsUsed, previewPercent, currency,
            aiTextUsage, aiCoverUsage, aiTranslationUsage,
            ageRating, contentWarnings
        } = req.body;

        const SUPPORTED_CURRENCIES = ['USD', 'JPY', 'EUR', 'GBP', 'KRW', 'CNY', 'BRL', 'SAR'];
        const workCurrency = SUPPORTED_CURRENCIES.includes((currency || '').toUpperCase())
            ? currency.toUpperCase() : null;
        // 送られてこなければ既存値のまま（COALESCE）
        const rating = ageRating === undefined ? null : normalizeAgeRating(ageRating);
        const warnings = contentWarnings === undefined ? null : JSON.stringify(normalizeWarnings(contentWarnings));
        const AI_LEVELS = ['none', 'assisted', 'generated', 'full_ai', 'na'];
        const aiLevel = (v) => AI_LEVELS.includes(v) ? v : null; // null = keep existing
        const aiText = aiLevel(aiTextUsage);
        const aiCover = aiLevel(aiCoverUsage);
        const aiTranslation = aiLevel(aiTranslationUsage);

        // Calculate word count if content changed
        let wordCount = null;
        let pageCount = null;
        if (content) {
            wordCount = content.replace(/\s+/g, ' ').trim().split(/\s+/).length;
            pageCount = Math.ceil(wordCount / 250);
        }

        const result = await db.query(
            `UPDATE works
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 synopsis = COALESCE($3, synopsis),
                 content = COALESCE($4, content),
                 genre = COALESCE($5, genre),
                 tags = COALESCE($6, tags),
                 price = COALESCE($7, price),
                 status = COALESCE($8, status),
                 is_free = COALESCE($9, is_free),
                 cover_image = COALESCE($10, cover_image),
                 is_ai_generated = COALESCE($12, is_ai_generated),
                 ai_tools_used = COALESCE($13, ai_tools_used),
                 preview_percent = COALESCE($14, preview_percent),
                 word_count = COALESCE($15, word_count),
                 page_count = COALESCE($16, page_count),
                 currency = COALESCE($18, currency),
                 ai_text_usage = COALESCE($19, ai_text_usage),
                 ai_cover_usage = COALESCE($20, ai_cover_usage),
                 ai_translation_usage = COALESCE($21, ai_translation_usage),
                 age_rating = COALESCE($22, age_rating),
                 content_warnings = COALESCE($23::jsonb, content_warnings),
                 is_adult = CASE WHEN $22 IS NULL THEN COALESCE($11, is_adult) ELSE ($22 = '18') END,
                 updated_at = CURRENT_TIMESTAMP,
                 published_at = CASE
                     WHEN $8 = 'published' AND published_at IS NULL THEN CURRENT_TIMESTAMP
                     ELSE published_at
                 END
             WHERE work_id = $17
             RETURNING *`,
            [
                title, description, synopsis, content, genre, tags,
                price, status, isFree, coverImage, isAdult,
                isAiGenerated, aiToolsUsed, previewPercent,
                wordCount, pageCount, req.params.workId, workCurrency,
                aiText, aiCover, aiTranslation, rating, warnings
            ]
        );

        // Sync collaborators only when the client sent the field
        // (older clients that omit it keep the existing collaborators)
        if (Object.prototype.hasOwnProperty.call(req.body, 'collaborators')) {
            let resolvedCollabs;
            try {
                resolvedCollabs = await resolveCollaborators(req.body.collaborators, req.user.userId);
            } catch (collabError) {
                const payload = collaboratorErrorResponse(collabError);
                if (payload) return res.status(400).json(payload);
                throw collabError;
            }
            const client = await db.pool.connect();
            try {
                await client.query('BEGIN');
                const newCollabs = await syncWorkCollaborators(client, req.params.workId, resolvedCollabs, result.rows[0], req.user.userId);
                await client.query('COMMIT');
                notifyNewCollaborators(newCollabs, result.rows[0].title); // 非同期・失敗しても本処理に影響なし
            } catch (txError) {
                await client.query('ROLLBACK');
                throw txError;
            } finally {
                client.release();
            }
        }

        res.json({
            success: true,
            message: 'Work updated successfully',
            work: result.rows[0]
        });
    } catch (error) {
        console.error('Update work error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/works/:workId
 * Delete work (authenticated, author only)
 */
router.delete('/:workId', authenticate, async (req, res) => {
    try {
        // Check if user is the author
        const checkResult = await db.query(
            'SELECT author_id FROM works WHERE work_id = $1',
            [req.params.workId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Work not found' });
        }

        if (checkResult.rows[0].author_id !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this work' });
        }

        // Soft delete (change status to deleted)
        await db.query(
            `UPDATE works SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE work_id = $1`,
            [req.params.workId]
        );

        res.json({
            success: true,
            message: 'Work deleted successfully'
        });
    } catch (error) {
        console.error('Delete work error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;