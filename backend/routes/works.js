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
const path = require('path');
const fs = require('fs');
const { REVENUE_SHARES, generateAgreementHash } = require('../config/revenue');

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

    for (const r of resolved) {
        const already = existing.find(ex => ex.role === r.role && ex.user_id === r.userId);
        if (already) continue; // 署名状態を保持

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
                   w.is_adult, w.is_ai_generated, w.ai_tools_used,
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
            `SELECT wc.role, wc.revenue_share, wc.target_language, wc.created_at, wc.status,
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
             WHERE wc.user_id = $1 AND wc.status IN ('pending', 'active') AND w.status != 'deleted'
             ORDER BY wc.created_at DESC`,
            [req.user.userId]
        );
        res.json({ success: true, collaborations: result.rows });
    } catch (error) {
        console.error('Get my collaborations error:', error);
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

        const result = await db.query(
            `SELECT * FROM works WHERE work_id = $1 AND status = 'published'`,
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

        // Check if work is free
        if (work.is_free || work.price === 0 || work.price === null) {
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

        return res.status(403).json({
            error: 'Purchase required to access full content',
            price: work.price
        });
    } catch (error) {
        console.error('Get full work error:', error);
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
            aiTranslationUsage
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
                    ai_text_usage, ai_cover_usage, ai_translation_usage
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
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
                    isAdult || false,
                    isAiGenerated || (aiText !== 'none') || false,
                    aiToolsUsed || null,
                    previewPercent || 10,
                    wordCount,
                    pageCount,
                    workCurrency,
                    workStatus,
                    aiText,
                    aiCover,
                    aiTranslation
                ]
            );
            work = result.rows[0];
            await syncWorkCollaborators(client, work.work_id, resolvedCollabs, work, req.user.userId);
            await client.query('COMMIT');
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
            aiTextUsage, aiCoverUsage, aiTranslationUsage
        } = req.body;

        const SUPPORTED_CURRENCIES = ['USD', 'JPY', 'EUR', 'GBP', 'KRW', 'CNY', 'BRL', 'SAR'];
        const workCurrency = SUPPORTED_CURRENCIES.includes((currency || '').toUpperCase())
            ? currency.toUpperCase() : null;
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
                 is_adult = COALESCE($11, is_adult),
                 is_ai_generated = COALESCE($12, is_ai_generated),
                 ai_tools_used = COALESCE($13, ai_tools_used),
                 preview_percent = COALESCE($14, preview_percent),
                 word_count = COALESCE($15, word_count),
                 page_count = COALESCE($16, page_count),
                 currency = COALESCE($18, currency),
                 ai_text_usage = COALESCE($19, ai_text_usage),
                 ai_cover_usage = COALESCE($20, ai_cover_usage),
                 ai_translation_usage = COALESCE($21, ai_translation_usage),
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
                aiText, aiCover, aiTranslation
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
                await syncWorkCollaborators(client, req.params.workId, resolvedCollabs, result.rows[0], req.user.userId);
                await client.query('COMMIT');
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