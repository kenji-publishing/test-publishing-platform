/**
 * Content reports — 読者からの通報
 *
 * 読者が作品の描写を「おかしい」と知らせ、管理者が確認して
 * 却下 / 著者へ警告 / 作品を非公開（差し止め）を選ぶ。
 * 著者への連絡は通知（アプリ内）で行う＝SESの承認状況に依存しない。
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const db = require('../config/database');
const { createNotification } = require('../services/notificationService');

const VALID_REASONS = ['sexual', 'violence', 'hate', 'illegal', 'wrong_rating', 'copyright', 'other'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 管理画面と著者通知で使う日本語ラベル
const REASON_LABELS = {
    sexual: '性的表現',
    violence: '暴力・残虐表現',
    hate: '差別・ヘイト',
    illegal: '違法・危険な内容',
    wrong_rating: '対象年齢の申告が実態と違う',
    copyright: '著作権侵害の疑い',
    other: 'その他'
};

/**
 * POST /api/reports
 * 作品を通報する（ログイン必須）
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { workId, reason, details } = req.body;
        if (!UUID_RE.test(String(workId || ''))) {
            return res.status(400).json({ error: 'Invalid work' });
        }
        if (!VALID_REASONS.includes(reason)) {
            return res.status(400).json({ error: 'Invalid reason' });
        }
        const detail = (details || '').trim().slice(0, 2000) || null;

        const work = (await db.query(
            `SELECT work_id, author_id, title FROM works WHERE work_id = $1 AND status <> 'deleted'`,
            [workId]
        )).rows[0];
        if (!work) return res.status(404).json({ error: 'Work not found' });

        // 自分の作品は通報できない（間違いか嫌がらせのどちらかで、対応する意味がない）
        if (String(work.author_id) === String(req.user.userId)) {
            return res.status(400).json({ error: 'You cannot report your own work', code: 'OWN_WORK' });
        }

        const inserted = await db.query(
            `INSERT INTO content_reports (work_id, reporter_id, reason, details)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (work_id, reporter_id) DO NOTHING
             RETURNING report_id`,
            [workId, req.user.userId, reason, detail]
        );
        if (inserted.rowCount === 0) {
            // 既に通報済み。二重に受け付けない（が、利用者には失敗に見せない）
            return res.json({ success: true, alreadyReported: true });
        }

        // 管理者に知らせる（審査待ちを見落とさないように）
        try {
            const admins = (await db.query(`SELECT user_id FROM users WHERE role = 'admin'`)).rows;
            for (const a of admins) {
                await createNotification({
                    userId: a.user_id,
                    type: 'system',
                    title: '作品への通報が届きました',
                    message: `「${work.title}」に「${REASON_LABELS[reason]}」の通報がありました。内容を確認してください。`,
                    actionUrl: '/pages/admin/reports.html',
                    icon: 'fa-flag',
                    iconColor: 'warning'
                });
            }
        } catch (e) { console.error('Report notification failed:', e.message); }

        res.status(201).json({ success: true, reportId: inserted.rows[0].report_id });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== 以下は管理者専用 =====
router.use('/admin', authenticate, authorize('admin'));

/** GET /api/reports/admin/stats — 未対応件数（サイドバーバッジ用） */
router.get('/admin/stats', async (req, res) => {
    try {
        const r = (await db.query(
            `SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open,
                    COUNT(*)::int AS total
             FROM content_reports`
        )).rows[0];
        res.json({ success: true, open: r.open, total: r.total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** GET /api/reports/admin?status=open — 一覧（同じ作品への通報はまとめて数える） */
router.get('/admin', async (req, res) => {
    try {
        const { status } = req.query;
        const params = [];
        let where = '';
        if (status && ['open', 'dismissed', 'warned', 'removed'].includes(status)) {
            params.push(status);
            where = `WHERE r.status = $1`;
        }
        const rows = (await db.query(
            `SELECT r.report_id, r.work_id, r.reason, r.details, r.status, r.admin_note,
                    r.created_at, r.resolved_at,
                    w.title AS work_title, w.status AS work_status, w.age_rating, w.content_type,
                    COALESCE(NULLIF(a.pen_name, ''), TRIM(a.first_name || ' ' || a.last_name)) AS author_name,
                    w.author_id,
                    COALESCE(NULLIF(u.pen_name, ''), TRIM(u.first_name || ' ' || u.last_name)) AS reporter_name,
                    (SELECT COUNT(*)::int FROM content_reports r2
                      WHERE r2.work_id = r.work_id AND r2.status = 'open') AS open_reports_for_work,
                    (SELECT COUNT(*)::int FROM author_warnings aw WHERE aw.author_id = w.author_id) AS author_warning_count
             FROM content_reports r
             JOIN works w ON w.work_id = r.work_id
             JOIN users a ON a.user_id = w.author_id
             JOIN users u ON u.user_id = r.reporter_id
             ${where}
             ORDER BY (r.status = 'open') DESC, r.created_at DESC
             LIMIT 200`,
            params
        )).rows;
        res.json({ success: true, reports: rows });
    } catch (error) {
        console.error('List reports error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/reports/admin/:reportId/resolve
 * body: { action: 'dismiss' | 'warn' | 'remove', note }
 *   dismiss = 問題なし（通報を閉じる）
 *   warn    = 著者に警告（作品は公開のまま）
 *   remove  = 作品を非公開にして著者に通知（差し止め）
 */
router.post('/admin/:reportId/resolve', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { action, note } = req.body;
        if (!['dismiss', 'warn', 'remove'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }
        const reason = (note || '').trim();
        if (action !== 'dismiss' && !reason) {
            return res.status(400).json({ error: 'A reason is required when warning or removing', code: 'REASON_REQUIRED' });
        }

        await client.query('BEGIN');

        const report = (await client.query(
            `SELECT r.report_id, r.work_id, r.reason, r.status, w.author_id, w.title
             FROM content_reports r JOIN works w ON w.work_id = r.work_id
             WHERE r.report_id = $1 FOR UPDATE OF r`,
            [req.params.reportId]
        )).rows[0];
        if (!report) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Report not found' });
        }
        if (report.status !== 'open') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'This report is already resolved', code: 'ALREADY_RESOLVED' });
        }

        const newStatus = action === 'dismiss' ? 'dismissed' : (action === 'warn' ? 'warned' : 'removed');

        if (action === 'remove') {
            // 差し止め = 非公開。購入済みの読者のアクセスは残す（買った本を
            // 取り上げないため）。完全削除が必要なら別途 status='deleted' で対応
            await client.query(
                `UPDATE works SET status = 'suspended', updated_at = CURRENT_TIMESTAMP WHERE work_id = $1`,
                [report.work_id]
            );
        }

        if (action !== 'dismiss') {
            await client.query(
                `INSERT INTO author_warnings (author_id, work_id, report_id, action, reason, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [report.author_id, report.work_id, report.report_id, newStatus === 'warned' ? 'warned' : 'removed', reason, req.user.userId]
            );
        }

        await client.query(
            `UPDATE content_reports
             SET status = $2, admin_note = $3, resolved_at = CURRENT_TIMESTAMP, resolved_by = $4
             WHERE report_id = $1`,
            [report.report_id, newStatus, reason || null, req.user.userId]
        );

        // 同じ作品の未対応の通報も一緒に閉じる（同じ判断が二度要らないように）
        const alsoClosed = await client.query(
            `UPDATE content_reports
             SET status = $2, admin_note = $3, resolved_at = CURRENT_TIMESTAMP, resolved_by = $4
             WHERE work_id = $1 AND status = 'open' AND report_id <> $5`,
            [report.work_id, newStatus, reason || null, req.user.userId, report.report_id]
        );

        await client.query('COMMIT');

        // 著者への連絡（トランザクション外・非致死）
        if (action !== 'dismiss') {
            try {
                await createNotification({
                    userId: report.author_id,
                    type: 'system',
                    title: action === 'remove'
                        ? '作品を非公開にしました / Your work has been unpublished'
                        : 'コンテンツガイドラインに関する警告 / Content guideline warning',
                    message: action === 'remove'
                        ? `「${report.title}」はコンテンツガイドラインに反するとの判断により非公開にしました。理由: ${reason}\n心当たりがない場合はお問い合わせください。`
                        : `「${report.title}」について、コンテンツガイドラインに関する警告です。理由: ${reason}\n7日以内にご確認・修正をお願いします。`,
                    actionUrl: '/pages/my-works.html',
                    icon: 'fa-triangle-exclamation',
                    iconColor: 'warning'
                });
            } catch (e) { console.error('Author warning notification failed:', e.message); }
        }

        res.json({ success: true, status: newStatus, alsoClosed: alsoClosed.rowCount });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Resolve report error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

/** POST /api/reports/admin/works/:workId/restore — 非公開にした作品を戻す */
router.post('/admin/works/:workId/restore', async (req, res) => {
    try {
        const r = await db.query(
            `UPDATE works SET status = 'published', updated_at = CURRENT_TIMESTAMP
             WHERE work_id = $1 AND status = 'suspended' RETURNING work_id, author_id, title`,
            [req.params.workId]
        );
        if (!r.rows.length) return res.status(404).json({ error: 'Suspended work not found' });
        const w = r.rows[0];
        try {
            await createNotification({
                userId: w.author_id,
                type: 'system',
                title: '作品を再公開しました / Your work is public again',
                message: `「${w.title}」の非公開を解除しました。`,
                actionUrl: '/pages/my-works.html'
            });
        } catch (e) { console.error('Restore notification failed:', e.message); }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
