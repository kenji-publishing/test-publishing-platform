/**
 * Notification Routes
 * Phase 9A: 通知センター機能
 * Phase 9C: 自動通知生成機能追加
 * 
 * - 通知一覧取得
 * - 未読件数取得
 * - 既読化（単一/一括）
 * - 通知設定
 * - 通知作成（内部/管理者用）
 * - デモ通知生成
 * - メール通知送信（既存機能）
 */

const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const db = require('../config/database');
const { sendEmail, templates } = require('../config/email');

// =============================================================
// 通知タイプの定義
// =============================================================

const NOTIFICATION_TYPES = {
  sale: {
    icon: 'fa-dollar-sign',
    color: 'success',
    label: '売上'
  },
  translation_complete: {
    icon: 'fa-language',
    color: 'info',
    label: '翻訳完了'
  },
  translation_request: {
    icon: 'fa-paper-plane',
    color: 'warning',
    label: '翻訳依頼'
  },
  comment: {
    icon: 'fa-comment',
    color: 'primary',
    label: 'コメント'
  },
  feedback: {
    icon: 'fa-star',
    color: 'warning',
    label: 'フィードバック'
  },
  system: {
    icon: 'fa-bell',
    color: 'secondary',
    label: 'システム'
  },
  ticket_reply: {
    icon: 'fa-headset',
    color: 'info',
    label: 'サポート'
  },
  account: {
    icon: 'fa-user',
    color: 'primary',
    label: 'アカウント'
  }
};

// =============================================================
// GET /api/notifications - 通知一覧取得
// =============================================================

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 20, 
      type,         // 通知タイプでフィルター
      unread_only   // 未読のみ
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // クエリ構築
    let whereConditions = ['user_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    // タイプフィルター
    if (type) {
      whereConditions.push(`notification_type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    // 未読のみ
    if (unread_only === 'true') {
      whereConditions.push('is_read = FALSE');
    }

    // 期限切れを除外
    whereConditions.push('(expires_at IS NULL OR expires_at > NOW())');

    const whereClause = whereConditions.join(' AND ');

    // 通知取得
    const notificationsResult = await db.query(
      `SELECT 
        notification_id,
        notification_type,
        title,
        message,
        icon,
        icon_color,
        action_url,
        metadata,
        is_read,
        read_at,
        created_at
       FROM notifications
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    // 総件数取得
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      notifications: notificationsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// GET /api/notifications/unread-count - 未読件数取得
// =============================================================

router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 
         AND is_read = FALSE 
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );

    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// PUT /api/notifications/:id/read - 既読にする
// =============================================================

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = NOW()
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      success: true,
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// PUT /api/notifications/read-all - すべて既読
// =============================================================

router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING notification_id`,
      [userId]
    );

    res.json({
      success: true,
      message: `${result.rows.length} notifications marked as read`,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// DELETE /api/notifications/:id - 通知削除
// =============================================================

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM notifications 
       WHERE notification_id = $1 AND user_id = $2
       RETURNING notification_id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// DELETE /api/notifications/clear-all - すべての通知を削除
// =============================================================

router.delete('/clear-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { read_only } = req.query; // 既読のみ削除するか

    let query, params;

    if (read_only === 'true') {
      query = 'DELETE FROM notifications WHERE user_id = $1 AND is_read = TRUE RETURNING notification_id';
    } else {
      query = 'DELETE FROM notifications WHERE user_id = $1 RETURNING notification_id';
    }

    const result = await db.query(query, [userId]);

    res.json({
      success: true,
      message: `${result.rows.length} notifications deleted`,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// GET /api/notifications/preferences - 通知設定取得
// =============================================================

router.get('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT 
        notification_type,
        in_app_enabled,
        email_enabled
       FROM notification_preferences
       WHERE user_id = $1
       ORDER BY notification_type`,
      [userId]
    );

    // タイプラベルを追加
    const preferences = result.rows.map(pref => ({
      ...pref,
      label: NOTIFICATION_TYPES[pref.notification_type]?.label || pref.notification_type
    }));

    res.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// PUT /api/notifications/preferences - 通知設定更新
// =============================================================

router.put('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notification_type, in_app_enabled, email_enabled } = req.body;

    if (!notification_type) {
      return res.status(400).json({ error: 'notification_type is required' });
    }

    const result = await db.query(
      `INSERT INTO notification_preferences 
        (user_id, notification_type, in_app_enabled, email_enabled, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, notification_type) 
       DO UPDATE SET 
         in_app_enabled = COALESCE($3, notification_preferences.in_app_enabled),
         email_enabled = COALESCE($4, notification_preferences.email_enabled),
         updated_at = NOW()
       RETURNING *`,
      [userId, notification_type, in_app_enabled, email_enabled]
    );

    res.json({
      success: true,
      preference: result.rows[0]
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// POST /api/notifications/create - 通知作成（内部用）
// =============================================================

router.post('/create', authenticate, async (req, res) => {
  try {
    const {
      user_id,           // 通知先ユーザーID（管理者のみ指定可能）
      notification_type,
      title,
      message,
      action_url,
      metadata,
      expires_in_days    // 有効期限（日数）
    } = req.body;

    // 管理者以外は自分宛の通知のみ作成可能（テスト用）
    const targetUserId = req.user.role === 'admin' && user_id 
      ? user_id 
      : req.user.userId;

    // 通知タイプに基づくアイコン設定
    const typeConfig = NOTIFICATION_TYPES[notification_type] || NOTIFICATION_TYPES.system;

    // 有効期限計算
    let expiresAt = null;
    if (expires_in_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expires_in_days));
    }

    const result = await db.query(
      `INSERT INTO notifications 
        (user_id, notification_type, title, message, icon, icon_color, action_url, metadata, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        targetUserId,
        notification_type,
        title,
        message,
        typeConfig.icon,
        typeConfig.color,
        action_url || null,
        metadata ? JSON.stringify(metadata) : '{}',
        expiresAt
      ]
    );

    res.json({
      success: true,
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// POST /api/notifications/send - 通知送信（アプリ内+メール）
// 他のモジュールから呼び出される内部関数
// =============================================================

async function sendNotification(options) {
  const {
    userId,
    notificationType,
    title,
    message,
    actionUrl,
    metadata,
    expiresInDays
  } = options;

  try {
    // ユーザーの通知設定を確認
    const prefResult = await db.query(
      `SELECT in_app_enabled, email_enabled 
       FROM notification_preferences 
       WHERE user_id = $1 AND notification_type = $2`,
      [userId, notificationType]
    );

    const preferences = prefResult.rows[0] || {
      in_app_enabled: true,
      email_enabled: false
    };

    // 通知タイプ設定
    const typeConfig = NOTIFICATION_TYPES[notificationType] || NOTIFICATION_TYPES.system;

    // 有効期限計算
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    let notificationId = null;

    // アプリ内通知
    if (preferences.in_app_enabled) {
      const result = await db.query(
        `INSERT INTO notifications 
          (user_id, notification_type, title, message, icon, icon_color, action_url, metadata, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING notification_id`,
        [
          userId,
          notificationType,
          title,
          message,
          typeConfig.icon,
          typeConfig.color,
          actionUrl || null,
          metadata ? JSON.stringify(metadata) : '{}',
          expiresAt
        ]
      );
      notificationId = result.rows[0].notification_id;
    }

    // メール通知（将来的に実装拡張）
    // if (preferences.email_enabled) {
    //   // メール送信処理
    // }

    return {
      success: true,
      notificationId,
      inAppSent: preferences.in_app_enabled,
      emailSent: false // 将来実装
    };

  } catch (error) {
    console.error('Send notification error:', error);
    throw error;
  }
}

// モジュールとしてエクスポート
router.sendNotification = sendNotification;

// =============================================================
// GET /api/notifications/types - 通知タイプ一覧
// =============================================================

router.get('/types', (req, res) => {
  const types = Object.entries(NOTIFICATION_TYPES).map(([key, value]) => ({
    type: key,
    ...value
  }));

  res.json({
    success: true,
    types
  });
});

// =============================================================
// Phase 9C: デモ通知生成エンドポイント
// =============================================================

/**
 * POST /api/notifications/demo/generate-all
 * すべてのタイプのデモ通知を一括生成
 */
router.post('/demo/generate-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // ユーザー名を取得
    const userResult = await db.query(
      'SELECT first_name, pen_name FROM users WHERE user_id = $1',
      [userId]
    );
    const userName = userResult.rows[0]?.pen_name || 
                    userResult.rows[0]?.first_name || 
                    'クリエイター';

    // すべてのタイプのデモ通知データ
    const demoNotifications = [
      {
        type: 'sale',
        title: '💰 作品が購入されました！',
        message: `「異世界転生物語」がJohn Smithさんに購入されました。¥1,200の収益が発生しました。`,
        actionUrl: '/pages/dashboard.html',
        metadata: { amount: 1200, buyer: 'John Smith', work_title: '異世界転生物語' }
      },
      {
        type: 'sale',
        title: '💰 新しい購入がありました',
        message: `「Tokyo Days」がMariaさんに購入されました。¥800の収益が発生しました。`,
        actionUrl: '/pages/dashboard.html',
        metadata: { amount: 800, buyer: 'Maria', work_title: 'Tokyo Days' }
      },
      {
        type: 'translation_complete',
        title: '🌐 翻訳が完了しました',
        message: `「異世界転生物語」の英語翻訳が完了しました。確認してください。`,
        actionUrl: '/pages/translation-status.html',
        metadata: { language: 'en', work_title: '異世界転生物語' }
      },
      {
        type: 'translation_request',
        title: '📤 新しい翻訳依頼',
        message: `「Summer Memories」の日本語→スペイン語翻訳依頼が届きました。`,
        actionUrl: '/pages/translators/requests.html',
        metadata: { source: 'ja', target: 'es', work_title: 'Summer Memories' }
      },
      {
        type: 'comment',
        title: '💬 新しいコメント',
        message: `田中さんが「異世界転生物語」にコメントしました: "素晴らしい作品です！続きが楽しみ..."`,
        actionUrl: '/pages/dashboard.html',
        metadata: { commenter: '田中', work_title: '異世界転生物語' }
      },
      {
        type: 'feedback',
        title: '⭐ 読者フィードバック',
        message: `「Tokyo Days」に⭐⭐⭐⭐⭐の評価がつきました: "感動しました！"`,
        actionUrl: '/pages/feedback/author.html',
        metadata: { rating: 5, work_title: 'Tokyo Days' }
      },
      {
        type: 'ticket_reply',
        title: '🎧 サポートから返信',
        message: `お問い合わせ「支払い方法について」にサポートチームから返信がありました。`,
        actionUrl: '/pages/support/tickets.html',
        metadata: { ticket_subject: '支払い方法について' }
      },
      {
        type: 'system',
        title: '🔔 メンテナンスのお知らせ',
        message: `12月15日(日) 午前2時〜4時にシステムメンテナンスを実施します。`,
        actionUrl: null,
        metadata: {}
      },
      {
        type: 'account',
        title: '👤 プロフィール更新',
        message: `本人確認が承認されました。すべての機能が利用可能になりました。`,
        actionUrl: '/pages/account-settings.html',
        metadata: { verification: 'approved' }
      }
    ];

    // 通知を一括作成
    const createdNotifications = [];
    for (const notif of demoNotifications) {
      const typeConfig = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.system;
      
      const result = await db.query(
        `INSERT INTO notifications 
          (user_id, notification_type, title, message, icon, icon_color, action_url, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING notification_id, notification_type, title`,
        [
          userId,
          notif.type,
          notif.title,
          notif.message,
          typeConfig.icon,
          typeConfig.color,
          notif.actionUrl,
          JSON.stringify(notif.metadata)
        ]
      );
      createdNotifications.push(result.rows[0]);
    }

    res.json({
      success: true,
      message: `${createdNotifications.length}件のデモ通知を生成しました`,
      count: createdNotifications.length,
      notifications: createdNotifications
    });

  } catch (error) {
    console.error('Generate demo notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/demo/generate
 * 指定タイプのデモ通知を生成
 */
router.post('/demo/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type = 'system', count = 1 } = req.body;

    // 最大10件まで
    const generateCount = Math.min(parseInt(count), 10);

    const typeConfig = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;

    // デモデータのバリエーション
    const variations = {
      sale: [
        { title: '💰 作品が購入されました！', work: '異世界転生物語', buyer: 'John', amount: 1200 },
        { title: '💰 新しい売上', work: 'Tokyo Days', buyer: 'Maria', amount: 800 },
        { title: '💰 購入通知', work: '夏の思い出', buyer: 'Alex', amount: 500 },
      ],
      translation_complete: [
        { title: '🌐 英語翻訳完了', work: '異世界転生物語', lang: 'English' },
        { title: '🌐 中国語翻訳完了', work: 'Tokyo Days', lang: 'Chinese' },
        { title: '🌐 スペイン語翻訳完了', work: '夏の思い出', lang: 'Spanish' },
      ],
      comment: [
        { title: '💬 新しいコメント', commenter: '田中', preview: '素晴らしい作品です！' },
        { title: '💬 コメントが届きました', commenter: 'Sarah', preview: 'Love this story!' },
        { title: '💬 読者からのコメント', commenter: '山田', preview: '続きが楽しみです' },
      ],
      feedback: [
        { title: '⭐ 5つ星の評価！', rating: 5, comment: '感動しました' },
        { title: '⭐ 高評価をいただきました', rating: 4, comment: '面白かった' },
        { title: '⭐ 読者フィードバック', rating: 5, comment: '最高です！' },
      ],
      system: [
        { title: '🔔 システム通知', message: 'メンテナンスのお知らせ' },
        { title: '🔔 お知らせ', message: '新機能が追加されました' },
        { title: '🔔 重要なお知らせ', message: '利用規約が更新されました' },
      ]
    };

    const typeVariations = variations[type] || variations.system;
    const createdNotifications = [];

    for (let i = 0; i < generateCount; i++) {
      const variation = typeVariations[i % typeVariations.length];
      
      let title, message, metadata;
      
      switch (type) {
        case 'sale':
          title = variation.title;
          message = `「${variation.work}」が${variation.buyer}さんに購入されました。¥${variation.amount}の収益が発生しました。`;
          metadata = { work_title: variation.work, buyer: variation.buyer, amount: variation.amount };
          break;
        case 'translation_complete':
          title = variation.title;
          message = `「${variation.work}」の${variation.lang}翻訳が完了しました。`;
          metadata = { work_title: variation.work, language: variation.lang };
          break;
        case 'comment':
          title = variation.title;
          message = `${variation.commenter}さんがコメントしました: "${variation.preview}"`;
          metadata = { commenter: variation.commenter };
          break;
        case 'feedback':
          title = variation.title;
          message = `${'⭐'.repeat(variation.rating)}の評価: "${variation.comment}"`;
          metadata = { rating: variation.rating };
          break;
        default:
          title = variation.title;
          message = variation.message;
          metadata = {};
      }

      const result = await db.query(
        `INSERT INTO notifications 
          (user_id, notification_type, title, message, icon, icon_color, action_url, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING notification_id, notification_type, title`,
        [
          userId,
          type,
          title,
          message,
          typeConfig.icon,
          typeConfig.color,
          null,
          JSON.stringify(metadata)
        ]
      );
      createdNotifications.push(result.rows[0]);
    }

    res.json({
      success: true,
      message: `${createdNotifications.length}件の${typeConfig.label}通知を生成しました`,
      count: createdNotifications.length,
      notifications: createdNotifications
    });

  } catch (error) {
    console.error('Generate demo notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// 既存のメール通知機能（Phase 5から継承）
// =============================================================

/**
 * POST /api/notifications/welcome
 * Send welcome email to new user
 */
router.post('/welcome', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user details
    const userResult = await db.query(
      'SELECT email, first_name, pen_name FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const userName = user.pen_name || user.first_name || 'Creator';

    // Create in-app notification
    await sendNotification({
      userId,
      notificationType: 'system',
      title: 'Publisherへようこそ！ 🎉',
      message: `${userName}さん、アカウントの作成が完了しました。作品をアップロードして世界中の読者に届けましょう！`,
      actionUrl: '/pages/upload-work.html'
    });

    // Send welcome email (if templates exist)
    if (templates && templates.welcome) {
      const template = templates.welcome(userName);
      await sendEmail(
        user.email,
        template.subject,
        template.text,
        template.html
      );
    }

    res.json({
      success: true,
      message: 'Welcome notification sent'
    });

  } catch (error) {
    console.error('Welcome notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/translation-complete
 * Send notification when translation is complete
 */
router.post('/translation-complete', authenticate, async (req, res) => {
  try {
    const { workId, language } = req.body;
    const userId = req.user.userId;

    // Get user and work details
    const result = await db.query(
      `SELECT u.email, u.first_name, u.pen_name, w.title
       FROM users u
       JOIN works w ON w.author_id = u.user_id
       WHERE u.user_id = $1 AND w.work_id = $2`,
      [userId, workId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User or work not found' });
    }

    const data = result.rows[0];

    // Language names
    const langNames = {
      'en': 'English 🇬🇧',
      'es': 'Spanish 🇪🇸',
      'de': 'German 🇩🇪',
      'fr': 'French 🇫🇷',
      'ja': 'Japanese 🇯🇵',
      'zh': 'Chinese 🇨🇳',
      'ko': 'Korean 🇰🇷',
      'ar': 'Arabic 🇸🇦'
    };

    const languageName = langNames[language] || language;

    // Create in-app notification
    await sendNotification({
      userId,
      notificationType: 'translation_complete',
      title: '翻訳が完了しました',
      message: `「${data.title}」の${languageName}翻訳が完了しました。`,
      actionUrl: '/pages/translation-status.html',
      metadata: {
        work_id: workId,
        work_title: data.title,
        language: language,
        language_name: languageName
      }
    });

    res.json({
      success: true,
      message: 'Translation complete notification sent'
    });

  } catch (error) {
    console.error('Translation notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/purchase
 * Send notification when a work is purchased
 */
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { workId, amount } = req.body;
    const buyerId = req.user.userId;

    // Get buyer details
    const buyerResult = await db.query(
      'SELECT first_name, pen_name FROM users WHERE user_id = $1',
      [buyerId]
    );

    const buyerName = buyerResult.rows[0]?.pen_name || 
                     buyerResult.rows[0]?.first_name || 
                     'A reader';

    // Get author and work details
    const workResult = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.pen_name, w.title
       FROM works w
       JOIN users u ON w.author_id = u.user_id
       WHERE w.work_id = $1`,
      [workId]
    );

    if (workResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work not found' });
    }

    const author = workResult.rows[0];

    // Create in-app notification for author
    await sendNotification({
      userId: author.user_id,
      notificationType: 'sale',
      title: '作品が購入されました！ 💰',
      message: `「${author.title}」が${buyerName}さんに購入されました。¥${amount}の収益が発生しました。`,
      actionUrl: '/pages/dashboard.html',
      metadata: {
        work_id: workId,
        work_title: author.title,
        buyer_name: buyerName,
        amount: amount
      }
    });

    res.json({
      success: true,
      message: 'Purchase notification sent to author'
    });

  } catch (error) {
    console.error('Purchase notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/test
 * Test notification (development only)
 */
router.post('/test', authenticate, async (req, res) => {
  try {
    const { type = 'system' } = req.body;
    const userId = req.user.userId;

    // Get user details
    const userResult = await db.query(
      'SELECT first_name, pen_name FROM users WHERE user_id = $1',
      [userId]
    );

    const userName = userResult.rows[0]?.pen_name || 
                    userResult.rows[0]?.first_name || 
                    'Creator';

    // Create test notification based on type
    const testData = {
      sale: {
        title: 'テスト: 作品が購入されました！ 💰',
        message: `「サンプル作品」がJohnさんに購入されました。¥980の収益が発生しました。`,
        actionUrl: '/pages/dashboard.html',
        metadata: { amount: 980, buyer: 'John', work_title: 'サンプル作品' }
      },
      translation_complete: {
        title: 'テスト: 翻訳が完了しました',
        message: `「サンプル作品」の英語翻訳が完了しました。`,
        actionUrl: '/pages/translation-status.html',
        metadata: { language: 'en', work_title: 'サンプル作品' }
      },
      comment: {
        title: 'テスト: 新しいコメント',
        message: `${userName}さんの作品「サンプル作品」に新しいコメントがあります。`,
        actionUrl: '/pages/dashboard.html',
        metadata: { work_title: 'サンプル作品' }
      },
      feedback: {
        title: 'テスト: 読者フィードバック ⭐',
        message: `「サンプル作品」に★5の評価がつきました！`,
        actionUrl: '/pages/feedback/author.html',
        metadata: { rating: 5, work_title: 'サンプル作品' }
      },
      system: {
        title: 'テスト: システム通知',
        message: `これはテスト通知です。正常に動作しています。`,
        actionUrl: null,
        metadata: {}
      },
      ticket_reply: {
        title: 'テスト: サポートから返信',
        message: `お問い合わせ #12345 にサポートチームから返信がありました。`,
        actionUrl: '/pages/support/tickets.html',
        metadata: { ticket_id: '12345' }
      },
      account: {
        title: 'テスト: アカウント更新',
        message: `プロフィール情報が更新されました。`,
        actionUrl: '/pages/account-settings.html',
        metadata: {}
      }
    };

    const notificationData = testData[type] || testData.system;

    await sendNotification({
      userId,
      notificationType: type,
      ...notificationData
    });

    res.json({
      success: true,
      message: `Test ${type} notification created`
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================
// GET /api/notifications/settings (レガシー互換)
// =============================================================

router.get('/settings', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT notification_type, in_app_enabled, email_enabled 
       FROM notification_preferences 
       WHERE user_id = $1`,
      [userId]
    );

    // 従来のフォーマットに変換
    const emailNotifications = {};
    result.rows.forEach(pref => {
      emailNotifications[pref.notification_type] = pref.email_enabled;
    });

    res.json({
      emailNotifications,
      preferences: result.rows
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
