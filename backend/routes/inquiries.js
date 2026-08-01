/**
 * Contact inquiries — お問い合わせフォーム（ヘルプセンターの最終到達点）
 *
 * ユーザー側: POST /（ログイン必須・レート制限あり）
 * 管理側: 一覧/件数/返信/クローズ。返信は既存のDM（conversations/messages）として
 * 送られ、ユーザーにはナビバーの未読バッジで届く（メール・SES非依存）。
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const db = require('../config/database');
const { emailRequestLimiter } = require('../middleware/rateLimits');
const { createNotification } = require('../services/notificationService');

const VALID_CATEGORIES = ['1', '2', '3', '4', '5', '6', '7', '8']; // faq_categories.id

/**
 * POST /api/inquiries
 * 問い合わせの送信（ログイン必須）
 */
router.post('/', authenticate, emailRequestLimiter, async (req, res) => {
    try {
        const { category, subject, body } = req.body;
        const cat = String(category || '');
        if (!VALID_CATEGORIES.includes(cat)) {
            return res.status(400).json({ error: 'Invalid category' });
        }
        const subj = (subject || '').trim();
        const text = (body || '').trim();
        if (!subj || subj.length > 200) {
            return res.status(400).json({ error: 'Subject is required (max 200 chars)' });
        }
        if (!text || text.length > 5000) {
            return res.status(400).json({ error: 'Message is required (max 5000 chars)' });
        }

        const row = (await db.query(
            `INSERT INTO contact_inquiries (user_id, category, subject, body)
             VALUES ($1, $2, $3, $4) RETURNING inquiry_id, created_at`,
            [req.user.userId, cat, subj, text]
        )).rows[0];

        res.status(201).json({ success: true, inquiryId: row.inquiry_id });
    } catch (error) {
        console.error('Create inquiry error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== 以下は管理者専用 =====
router.use('/admin', authenticate, authorize('admin'));

/** GET /api/inquiries/admin/stats — 未対応件数（サイドバーバッジ用） */
router.get('/admin/stats', async (req, res) => {
    try {
        const r = (await db.query(
            `SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open,
                    COUNT(*)::int AS total
             FROM contact_inquiries`
        )).rows[0];
        res.json({ success: true, open: r.open, total: r.total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** GET /api/inquiries/admin?status=open — 一覧 */
router.get('/admin', async (req, res) => {
    try {
        const { status } = req.query;
        const params = [];
        let where = '';
        if (status && ['open', 'answered', 'closed'].includes(status)) {
            params.push(status);
            where = `WHERE i.status = $1`;
        }
        const rows = (await db.query(
            `SELECT i.inquiry_id, i.category, i.subject, i.body, i.status,
                    i.created_at, i.answered_at,
                    u.user_id, u.email,
                    COALESCE(NULLIF(u.pen_name, ''), TRIM(u.first_name || ' ' || u.last_name)) AS user_name
             FROM contact_inquiries i
             JOIN users u ON u.user_id = i.user_id
             ${where}
             ORDER BY (i.status = 'open') DESC, i.created_at DESC
             LIMIT 200`,
            params
        )).rows;
        res.json({ success: true, inquiries: rows });
    } catch (error) {
        console.error('List inquiries error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/inquiries/admin/:inquiryId/reply
 * アプリ内メッセージで返信し、status='answered' にする
 */
router.post('/admin/:inquiryId/reply', async (req, res) => {
    try {
        const message = (req.body.message || '').trim();
        if (!message) return res.status(400).json({ error: 'Reply message is required' });

        const inquiry = (await db.query(
            `SELECT inquiry_id, user_id, subject, status FROM contact_inquiries WHERE inquiry_id = $1`,
            [req.params.inquiryId]
        )).rows[0];
        if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

        const adminId = req.user.userId;
        const userId = inquiry.user_id;

        // 既存のDMの流儀そのまま: 会話をfind-or-createしてメッセージを入れる
        let conversationId;
        const existing = await db.query(
            `SELECT conversation_id FROM conversations
             WHERE (participant_1 = $1 AND participant_2 = $2)
                OR (participant_1 = $2 AND participant_2 = $1)`,
            [adminId, userId]
        );
        if (existing.rows.length > 0) {
            conversationId = existing.rows[0].conversation_id;
        } else {
            conversationId = (await db.query(
                `INSERT INTO conversations (participant_1, participant_2)
                 VALUES ($1, $2) RETURNING conversation_id`,
                [adminId, userId]
            )).rows[0].conversation_id;
        }
        // 件名を引用してどの問い合わせへの返信か分かるようにする
        const content = `【お問い合わせへの返信 / Re: ${inquiry.subject}】\n${message}`;
        await db.query(
            `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)`,
            [conversationId, adminId, content]
        );
        await db.query(
            `UPDATE conversations SET last_message_at = NOW() WHERE conversation_id = $1`,
            [conversationId]
        );

        await db.query(
            `UPDATE contact_inquiries
             SET status = 'answered', answered_at = CURRENT_TIMESTAMP
             WHERE inquiry_id = $1`,
            [inquiry.inquiry_id]
        );

        // 返信はアプリ内メッセージが本体。ただし問い合わせた人はアプリを
        // 開いていないことが多いので、通知＋メールでも届いたことを知らせる
        // （返信本文もメールに載せる＝ログインしなくても読める）
        try {
            await createNotification({
                userId,
                type: 'system',
                title: 'お問い合わせに返信しました / We replied to your enquiry',
                message: `「${inquiry.subject}」への返信が届いています。メッセージからご確認ください。`,
                actionUrl: '/pages/messages.html',
                icon: 'fa-headset',
                email: {
                    subject: `お問い合わせへの返信 / Re: ${inquiry.subject}`,
                    lines: [
                        'AuctLectサポートです。お問い合わせいただいた件について回答いたします。',
                        `件名: ${inquiry.subject}`,
                        message,
                        '続けてご相談がある場合は、アプリ内のメッセージからそのままご返信いただけます。'
                    ],
                    actionLabel: 'メッセージを開く'
                }
            });
        } catch (e) { console.error('Inquiry reply notification failed:', e.message); }

        res.json({ success: true, conversationId });
    } catch (error) {
        console.error('Reply inquiry error:', error);
        res.status(500).json({ error: error.message });
    }
});

/** POST /api/inquiries/admin/:inquiryId/close — 返信不要な問い合わせを閉じる */
router.post('/admin/:inquiryId/close', async (req, res) => {
    try {
        const r = await db.query(
            `UPDATE contact_inquiries SET status = 'closed' WHERE inquiry_id = $1 RETURNING inquiry_id`,
            [req.params.inquiryId]
        );
        if (!r.rows.length) return res.status(404).json({ error: 'Inquiry not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
