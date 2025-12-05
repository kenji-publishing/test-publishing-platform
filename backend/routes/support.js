// =============================================
// Phase 8: Support System API
// FAQ・問い合わせチケット管理
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ---------------------------------------------
// ヘルパー関数
// ---------------------------------------------

/**
 * チケット番号を生成
 * 形式: TKT-YYYYMMDD-XXXX
 */
function generateTicketNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TKT-${dateStr}-${random}`;
}

/**
 * 認証チェック（ログイン必須のエンドポイント用）
 */
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ 
            success: false, 
            error: 'ログインが必要です' 
        });
    }
    next();
}

/**
 * 管理者チェック
 */
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ 
            success: false, 
            error: 'ログインが必要です' 
        });
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            error: '管理者権限が必要です' 
        });
    }
    next();
}

// =============================================
// FAQ関連API（公開）
// =============================================

/**
 * FAQカテゴリ一覧取得
 * GET /api/support/faq/categories
 */
router.get('/faq/categories', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                c.*,
                COUNT(f.id) as item_count
            FROM faq_categories c
            LEFT JOIN faq_items f ON c.id = f.category_id AND f.is_active = true
            WHERE c.is_active = true
            GROUP BY c.id
            ORDER BY c.display_order ASC
        `);

        res.json({
            success: true,
            categories: result.rows
        });
    } catch (error) {
        console.error('FAQカテゴリ取得エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'カテゴリの取得に失敗しました' 
        });
    }
});

/**
 * FAQ一覧取得（カテゴリ別）
 * GET /api/support/faq?category_id=1
 */
router.get('/faq', async (req, res) => {
    try {
        const { category_id } = req.query;
        
        let query = `
            SELECT 
                f.*,
                c.name_ja as category_name_ja,
                c.name_en as category_name_en
            FROM faq_items f
            JOIN faq_categories c ON f.category_id = c.id
            WHERE f.is_active = true AND c.is_active = true
        `;
        const params = [];

        if (category_id) {
            params.push(category_id);
            query += ` AND f.category_id = $${params.length}`;
        }

        query += ' ORDER BY f.category_id, f.display_order ASC';

        const result = await db.query(query, params);

        res.json({
            success: true,
            faqs: result.rows
        });
    } catch (error) {
        console.error('FAQ取得エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'FAQの取得に失敗しました' 
        });
    }
});

/**
 * FAQ検索
 * GET /api/support/faq/search?q=パスワード
 */
router.get('/faq/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ 
                success: false, 
                error: '検索キーワードは2文字以上入力してください' 
            });
        }

        const searchTerm = `%${q.trim()}%`;

        const result = await db.query(`
            SELECT 
                f.*,
                c.name_ja as category_name_ja,
                c.name_en as category_name_en
            FROM faq_items f
            JOIN faq_categories c ON f.category_id = c.id
            WHERE f.is_active = true AND c.is_active = true
            AND (
                f.question_ja ILIKE $1 OR
                f.question_en ILIKE $1 OR
                f.answer_ja ILIKE $1 OR
                f.answer_en ILIKE $1 OR
                f.keywords ILIKE $1
            )
            ORDER BY f.view_count DESC, f.display_order ASC
            LIMIT 20
        `, [searchTerm]);

        res.json({
            success: true,
            query: q,
            faqs: result.rows
        });
    } catch (error) {
        console.error('FAQ検索エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: '検索に失敗しました' 
        });
    }
});

/**
 * FAQ詳細取得（閲覧数カウント付き）
 * GET /api/support/faq/:id
 */
router.get('/faq/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 閲覧数をインクリメント
        const result = await db.query(`
            UPDATE faq_items 
            SET view_count = view_count + 1
            WHERE id = $1 AND is_active = true
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'FAQが見つかりません' 
            });
        }

        res.json({
            success: true,
            faq: result.rows[0]
        });
    } catch (error) {
        console.error('FAQ詳細取得エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'FAQの取得に失敗しました' 
        });
    }
});

/**
 * FAQの「役に立った」投票
 * POST /api/support/faq/:id/vote
 */
router.post('/faq/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { helpful } = req.body; // true: 役に立った, false: 役に立たなかった

        const column = helpful ? 'helpful_count' : 'not_helpful_count';
        
        const result = await db.query(`
            UPDATE faq_items 
            SET ${column} = ${column} + 1
            WHERE id = $1 AND is_active = true
            RETURNING helpful_count, not_helpful_count
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'FAQが見つかりません' 
            });
        }

        res.json({
            success: true,
            message: 'フィードバックありがとうございます',
            helpful_count: result.rows[0].helpful_count,
            not_helpful_count: result.rows[0].not_helpful_count
        });
    } catch (error) {
        console.error('FAQ投票エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: '投票に失敗しました' 
        });
    }
});

// =============================================
// チケット関連API（ユーザー向け）
// =============================================

/**
 * チケット作成
 * POST /api/support/tickets
 * ログインユーザーまたはゲストが問い合わせ可能
 */
router.post('/tickets', async (req, res) => {
    try {
        const { 
            category, 
            subject, 
            message,
            guest_email,
            guest_name,
            related_work_id,
            related_order_id
        } = req.body;

        // バリデーション
        if (!category || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'カテゴリ、件名、内容は必須です' 
            });
        }

        // ゲストの場合はメールアドレス必須
        const userId = req.session?.user?.user_id || null;
        if (!userId && !guest_email) {
            return res.status(400).json({ 
                success: false, 
                error: 'メールアドレスを入力してください' 
            });
        }

        const ticketNumber = generateTicketNumber();

        // チケット作成
        const result = await db.query(`
            INSERT INTO support_tickets (
                ticket_number, user_id, guest_email, guest_name,
                category, subject, initial_message,
                related_work_id, related_order_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            ticketNumber, userId, guest_email, guest_name,
            category, subject, message,
            related_work_id || null, related_order_id || null
        ]);

        const ticket = result.rows[0];

        // 最初のメッセージをticket_messagesにも追加
        await db.query(`
            INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message)
            VALUES ($1, $2, $3, $4)
        `, [ticket.id, userId, userId ? 'user' : 'guest', message]);

        res.status(201).json({
            success: true,
            message: 'お問い合わせを受け付けました',
            ticket: {
                id: ticket.id,
                ticket_number: ticket.ticket_number,
                status: ticket.status
            }
        });
    } catch (error) {
        console.error('チケット作成エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'お問い合わせの送信に失敗しました' 
        });
    }
});

/**
 * 自分のチケット一覧取得
 * GET /api/support/tickets
 */
router.get('/tickets', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const { status } = req.query;

        let query = `
            SELECT 
                t.*,
                (SELECT COUNT(*) FROM ticket_messages tm 
                 WHERE tm.ticket_id = t.id AND tm.is_read = false 
                 AND tm.sender_type = 'admin') as unread_count
            FROM support_tickets t
            WHERE t.user_id = $1
        `;
        const params = [userId];

        if (status && status !== 'all') {
            params.push(status);
            query += ` AND t.status = $${params.length}`;
        }

        query += ' ORDER BY t.last_message_at DESC';

        const result = await db.query(query, params);

        res.json({
            success: true,
            tickets: result.rows
        });
    } catch (error) {
        console.error('チケット一覧取得エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'チケットの取得に失敗しました' 
        });
    }
});

/**
 * チケット詳細取得
 * GET /api/support/tickets/:id
 */
router.get('/tickets/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.user_id;
        const isAdmin = req.session.user.role === 'admin';

        // チケット取得
        let ticketQuery = `
            SELECT t.*, u.first_name || ' ' || u.last_name as user_name
            FROM support_tickets t
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE t.id = $1
        `;
        
        // 管理者でなければ自分のチケットのみ
        if (!isAdmin) {
            ticketQuery += ' AND t.user_id = $2';
        }

        const ticketResult = await db.query(
            ticketQuery, 
            isAdmin ? [id] : [id, userId]
        );

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'チケットが見つかりません' 
            });
        }

        const ticket = ticketResult.rows[0];

        // メッセージ取得
        let messagesQuery = `
            SELECT 
                m.*,
                u.first_name || ' ' || u.last_name as sender_name
            FROM ticket_messages m
            LEFT JOIN users u ON m.sender_id = u.user_id
            WHERE m.ticket_id = $1
        `;
        
        // 管理者でなければ内部メモは非表示
        if (!isAdmin) {
            messagesQuery += ' AND m.is_internal_note = false';
        }
        
        messagesQuery += ' ORDER BY m.created_at ASC';

        const messagesResult = await db.query(messagesQuery, [id]);

        // ユーザー側のメッセージを既読にする
        if (!isAdmin) {
            await db.query(`
                UPDATE ticket_messages 
                SET is_read = true
                WHERE ticket_id = $1 AND sender_type = 'admin'
            `, [id]);
        }

        res.json({
            success: true,
            ticket: ticket,
            messages: messagesResult.rows
        });
    } catch (error) {
        console.error('チケット詳細取得エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'チケットの取得に失敗しました' 
        });
    }
});

/**
 * チケットに返信
 * POST /api/support/tickets/:id/messages
 */
router.post('/tickets/:id/messages', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const userId = req.session.user.user_id;
        const isAdmin = req.session.user.role === 'admin';

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'メッセージを入力してください' 
            });
        }

        // チケット存在確認＆権限チェック
        const ticketCheck = await db.query(`
            SELECT * FROM support_tickets WHERE id = $1
        `, [id]);

        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'チケットが見つかりません' 
            });
        }

        const ticket = ticketCheck.rows[0];

        // 管理者でなければ自分のチケットのみ返信可能
        if (!isAdmin && ticket.user_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                error: 'このチケットに返信する権限がありません' 
            });
        }

        // クローズ済みチケットには返信不可
        if (ticket.status === 'closed') {
            return res.status(400).json({ 
                success: false, 
                error: 'クローズ済みのチケットには返信できません' 
            });
        }

        // メッセージ追加
        const senderType = isAdmin ? 'admin' : 'user';
        const newMessage = await db.query(`
            INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [id, userId, senderType, message.trim()]);

        // チケットのステータスと最終メッセージ日時を更新
        const newStatus = isAdmin ? 'waiting_user' : 'waiting_admin';
        await db.query(`
            UPDATE support_tickets 
            SET last_message_at = CURRENT_TIMESTAMP,
                status = CASE 
                    WHEN status = 'open' THEN 'in_progress'
                    WHEN status = 'resolved' THEN status
                    ELSE $2
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id, newStatus]);

        res.status(201).json({
            success: true,
            message: '返信しました',
            ticket_message: newMessage.rows[0]
        });
    } catch (error) {
        console.error('チケット返信エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: '返信に失敗しました' 
        });
    }
});

/**
 * チケットをクローズ
 * POST /api/support/tickets/:id/close
 */
router.post('/tickets/:id/close', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.user_id;

        const result = await db.query(`
            UPDATE support_tickets 
            SET status = 'closed', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2 AND status != 'closed'
            RETURNING *
        `, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'チケットが見つからないか、既にクローズされています' 
            });
        }

        res.json({
            success: true,
            message: 'チケットをクローズしました'
        });
    } catch (error) {
        console.error('チケットクローズエラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'クローズに失敗しました' 
        });
    }
});

/**
 * チケット満足度評価
 * POST /api/support/tickets/:id/rate
 */
router.post('/tickets/:id/rate', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.session.user.user_id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                error: '評価は1〜5の間で入力してください' 
            });
        }

        // チケットが自分のもので、解決済みか確認
        const ticketCheck = await db.query(`
            SELECT * FROM support_tickets 
            WHERE id = $1 AND user_id = $2 AND status IN ('resolved', 'closed')
        `, [id, userId]);

        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: '評価できるチケットが見つかりません' 
            });
        }

        // 評価を保存（既存があれば更新）
        await db.query(`
            INSERT INTO ticket_ratings (ticket_id, rating, comment)
            VALUES ($1, $2, $3)
            ON CONFLICT (ticket_id) DO UPDATE
            SET rating = $2, comment = $3, created_at = CURRENT_TIMESTAMP
        `, [id, rating, comment || null]);

        res.json({
            success: true,
            message: '評価ありがとうございます'
        });
    } catch (error) {
        console.error('チケット評価エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: '評価に失敗しました' 
        });
    }
});

// =============================================
// 管理者用API
// =============================================

/**
 * 管理者：チケット一覧取得
 * GET /api/support/admin/tickets
 */
router.get('/admin/tickets', requireAdmin, async (req, res) => {
    try {
        const { status, priority, assigned_to, category, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                t.*,
                u.first_name || ' ' || u.last_name as user_name,
                u.email as user_email,
                a.first_name || ' ' || a.last_name as assigned_name,
                (SELECT COUNT(*) FROM ticket_messages tm 
                 WHERE tm.ticket_id = t.id AND tm.is_read = false 
                 AND tm.sender_type = 'user') as unread_count
            FROM support_tickets t
            LEFT JOIN users u ON t.user_id = u.user_id
            LEFT JOIN users a ON t.assigned_to = a.user_id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            params.push(status);
            query += ` AND t.status = $${params.length}`;
        }

        if (priority) {
            params.push(priority);
            query += ` AND t.priority = $${params.length}`;
        }

        if (assigned_to) {
            if (assigned_to === 'unassigned') {
                query += ' AND t.assigned_to IS NULL';
            } else {
                params.push(assigned_to);
                query += ` AND t.assigned_to = $${params.length}`;
            }
        }

        if (category) {
            params.push(category);
            query += ` AND t.category = $${params.length}`;
        }

        // カウント取得
        const countResult = await db.query(
            query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // データ取得
        query += ` ORDER BY 
            CASE t.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'normal' THEN 3 
                ELSE 4 
            END,
            t.last_message_at DESC
        `;
        params.push(limit, offset);
        query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await db.query(query, params);

        res.json({
            success: true,
            tickets: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('管理者チケット一覧エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'チケットの取得に失敗しました' 
        });
    }
});

/**
 * 管理者：チケット更新（ステータス・担当者・優先度）
 * PATCH /api/support/admin/tickets/:id
 */
router.patch('/admin/tickets/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, assigned_to } = req.body;
        const adminId = req.session.user.user_id;

        const updates = [];
        const params = [id];
        let paramIndex = 2;

        if (status) {
            updates.push(`status = $${paramIndex++}`);
            params.push(status);
            if (status === 'resolved' || status === 'closed') {
                updates.push(`resolved_at = CURRENT_TIMESTAMP`);
            }
        }

        if (priority) {
            updates.push(`priority = $${paramIndex++}`);
            params.push(priority);
        }

        if (assigned_to !== undefined) {
            updates.push(`assigned_to = $${paramIndex++}`);
            params.push(assigned_to || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: '更新する項目がありません' 
            });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const result = await db.query(`
            UPDATE support_tickets 
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'チケットが見つかりません' 
            });
        }

        // システムメッセージを追加（ステータス変更時）
        if (status) {
            const statusLabels = {
                'open': '新規',
                'in_progress': '対応中',
                'waiting_user': 'お客様の返答待ち',
                'waiting_admin': 'サポートの対応待ち',
                'resolved': '解決済み',
                'closed': 'クローズ'
            };
            await db.query(`
                INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message)
                VALUES ($1, $2, 'system', $3)
            `, [id, adminId, `ステータスが「${statusLabels[status] || status}」に変更されました`]);
        }

        res.json({
            success: true,
            message: 'チケットを更新しました',
            ticket: result.rows[0]
        });
    } catch (error) {
        console.error('管理者チケット更新エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: '更新に失敗しました' 
        });
    }
});

/**
 * 管理者：内部メモ追加
 * POST /api/support/admin/tickets/:id/notes
 */
router.post('/admin/tickets/:id/notes', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const adminId = req.session.user.user_id;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'メモを入力してください' 
            });
        }

        const result = await db.query(`
            INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message, is_internal_note)
            VALUES ($1, $2, 'admin', $3, true)
            RETURNING *
        `, [id, adminId, message.trim()]);

        res.status(201).json({
            success: true,
            message: '内部メモを追加しました',
            note: result.rows[0]
        });
    } catch (error) {
        console.error('内部メモ追加エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'メモの追加に失敗しました' 
        });
    }
});

/**
 * 管理者：サポート統計
 * GET /api/support/admin/stats
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
    try {
        // ステータス別チケット数
        const statusStats = await db.query(`
            SELECT status, COUNT(*) as count
            FROM support_tickets
            GROUP BY status
        `);

        // 優先度別チケット数（未解決のみ）
        const priorityStats = await db.query(`
            SELECT priority, COUNT(*) as count
            FROM support_tickets
            WHERE status NOT IN ('resolved', 'closed')
            GROUP BY priority
        `);

        // カテゴリ別チケット数（今月）
        const categoryStats = await db.query(`
            SELECT category, COUNT(*) as count
            FROM support_tickets
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            GROUP BY category
        `);

        // 平均解決時間（過去30日）
        const avgResolutionTime = await db.query(`
            SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours
            FROM support_tickets
            WHERE resolved_at IS NOT NULL
            AND resolved_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        // 平均満足度
        const avgRating = await db.query(`
            SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
            FROM ticket_ratings
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        // 今日の新規チケット数
        const todayTickets = await db.query(`
            SELECT COUNT(*) as count
            FROM support_tickets
            WHERE DATE(created_at) = CURRENT_DATE
        `);

        res.json({
            success: true,
            stats: {
                by_status: statusStats.rows,
                by_priority: priorityStats.rows,
                by_category: categoryStats.rows,
                avg_resolution_hours: parseFloat(avgResolutionTime.rows[0].avg_hours) || 0,
                avg_rating: parseFloat(avgRating.rows[0].avg_rating) || 0,
                total_ratings: parseInt(avgRating.rows[0].total_ratings) || 0,
                today_new_tickets: parseInt(todayTickets.rows[0].count) || 0
            }
        });
    } catch (error) {
        console.error('サポート統計エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: '統計の取得に失敗しました' 
        });
    }
});

// =============================================
// 管理者用FAQ管理API
// =============================================

/**
 * 管理者：FAQカテゴリ作成
 * POST /api/support/admin/faq/categories
 */
router.post('/admin/faq/categories', requireAdmin, async (req, res) => {
    try {
        const { name_ja, name_en, description_ja, description_en, icon, display_order } = req.body;

        if (!name_ja || !name_en) {
            return res.status(400).json({ 
                success: false, 
                error: 'カテゴリ名（日本語・英語）は必須です' 
            });
        }

        const result = await db.query(`
            INSERT INTO faq_categories (name_ja, name_en, description_ja, description_en, icon, display_order)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name_ja, name_en, description_ja, description_en, icon || 'question-circle', display_order || 0]);

        res.status(201).json({
            success: true,
            message: 'カテゴリを作成しました',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('FAQカテゴリ作成エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'カテゴリの作成に失敗しました' 
        });
    }
});

/**
 * 管理者：FAQカテゴリ更新
 * PATCH /api/support/admin/faq/categories/:id
 */
router.patch('/admin/faq/categories/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name_ja, name_en, description_ja, description_en, icon, display_order, is_active } = req.body;

        const result = await db.query(`
            UPDATE faq_categories 
            SET name_ja = COALESCE($2, name_ja),
                name_en = COALESCE($3, name_en),
                description_ja = COALESCE($4, description_ja),
                description_en = COALESCE($5, description_en),
                icon = COALESCE($6, icon),
                display_order = COALESCE($7, display_order),
                is_active = COALESCE($8, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id, name_ja, name_en, description_ja, description_en, icon, display_order, is_active]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'カテゴリが見つかりません' 
            });
        }

        res.json({
            success: true,
            message: 'カテゴリを更新しました',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('FAQカテゴリ更新エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'カテゴリの更新に失敗しました' 
        });
    }
});

/**
 * 管理者：FAQ項目作成
 * POST /api/support/admin/faq
 */
router.post('/admin/faq', requireAdmin, async (req, res) => {
    try {
        const { 
            category_id, 
            question_ja, question_en, 
            answer_ja, answer_en,
            keywords,
            display_order
        } = req.body;

        if (!category_id || !question_ja || !question_en || !answer_ja || !answer_en) {
            return res.status(400).json({ 
                success: false, 
                error: 'カテゴリ、質問、回答（日本語・英語）は必須です' 
            });
        }

        const result = await db.query(`
            INSERT INTO faq_items (category_id, question_ja, question_en, answer_ja, answer_en, keywords, display_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [category_id, question_ja, question_en, answer_ja, answer_en, keywords, display_order || 0]);

        res.status(201).json({
            success: true,
            message: 'FAQを作成しました',
            faq: result.rows[0]
        });
    } catch (error) {
        console.error('FAQ作成エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'FAQの作成に失敗しました' 
        });
    }
});

/**
 * 管理者：FAQ項目更新
 * PATCH /api/support/admin/faq/:id
 */
router.patch('/admin/faq/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            category_id, 
            question_ja, question_en, 
            answer_ja, answer_en,
            keywords,
            display_order,
            is_active
        } = req.body;

        const result = await db.query(`
            UPDATE faq_items 
            SET category_id = COALESCE($2, category_id),
                question_ja = COALESCE($3, question_ja),
                question_en = COALESCE($4, question_en),
                answer_ja = COALESCE($5, answer_ja),
                answer_en = COALESCE($6, answer_en),
                keywords = COALESCE($7, keywords),
                display_order = COALESCE($8, display_order),
                is_active = COALESCE($9, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id, category_id, question_ja, question_en, answer_ja, answer_en, keywords, display_order, is_active]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'FAQが見つかりません' 
            });
        }

        res.json({
            success: true,
            message: 'FAQを更新しました',
            faq: result.rows[0]
        });
    } catch (error) {
        console.error('FAQ更新エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'FAQの更新に失敗しました' 
        });
    }
});

/**
 * 管理者：FAQ項目削除
 * DELETE /api/support/admin/faq/:id
 */
router.delete('/admin/faq/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            DELETE FROM faq_items WHERE id = $1 RETURNING id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'FAQが見つかりません' 
            });
        }

        res.json({
            success: true,
            message: 'FAQを削除しました'
        });
    } catch (error) {
        console.error('FAQ削除エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: 'FAQの削除に失敗しました' 
        });
    }
});

module.exports = router;
