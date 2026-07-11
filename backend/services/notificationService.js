/**
 * Notification Service
 * 通知を自動生成するためのヘルパーモジュール
 * Phase 9C: Auto-generate notifications
 */

// NOTE: config/db は存在しない（正しくは config/database の pool）。
// このモジュールは長らく未使用で、works.js から読み込んだ際に
// MODULE_NOT_FOUND でサーバーが起動できなくなった事故あり（2026-07-11）
const { pool } = require('../config/database');

// 通知タイプの定義
const NotificationTypes = {
    SALE: 'sale',
    TRANSLATION_COMPLETE: 'translation_complete',
    TRANSLATION_REQUEST: 'translation_request',
    COMMENT: 'comment',
    FEEDBACK: 'feedback',
    SYSTEM: 'system',
    TICKET_REPLY: 'ticket_reply',
    ACCOUNT: 'account'
};

// 通知アイコンのマッピング
const NotificationIcons = {
    sale: '💰',
    translation_complete: '🌐',
    translation_request: '📤',
    comment: '💬',
    feedback: '⭐',
    system: '🔔',
    ticket_reply: '🎧',
    account: '👤'
};

/**
 * 通知を作成する
 * @param {Object} options - 通知オプション
 * @param {string} options.userId - 受信者のユーザーID
 * @param {string} options.type - 通知タイプ
 * @param {string} options.title - 通知タイトル
 * @param {string} options.message - 通知メッセージ
 * @param {string} [options.actionUrl] - アクションURL
 * @param {Object} [options.metadata] - 追加メタデータ
 * @returns {Promise<Object>} 作成された通知
 */
async function createNotification(options) {
    const { userId, type, title, message, actionUrl = null, metadata = {} } = options;
    
    try {
        // ユーザーの通知設定を確認（設定は「通知タイプごとの行」で保持される。
        // 行が無ければデフォルトで通知ON。in_app_enabled=false の時だけスキップ）
        const prefResult = await pool.query(
            `SELECT in_app_enabled FROM notification_preferences
             WHERE user_id = $1 AND notification_type = $2`,
            [userId, type]
        );
        if (prefResult.rows.length > 0 && prefResult.rows[0].in_app_enabled === false) {
            return null;
        }
        
        // 通知を作成（列名は notification_type — DBスキーマに合わせる）
        const result = await pool.query(`
            INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [userId, type, title, message, actionUrl, JSON.stringify(metadata)]);
        
        console.log(`[NotificationService] Created notification for user ${userId}: ${type}`);
        return result.rows[0];
    } catch (error) {
        console.error('[NotificationService] Error creating notification:', error);
        throw error;
    }
}

/**
 * 売上通知を作成
 * @param {string} authorId - 著者のユーザーID
 * @param {string} workTitle - 作品タイトル
 * @param {number} amount - 売上金額
 * @param {string} buyerName - 購入者名（オプション）
 * @param {string} workId - 作品ID
 */
async function notifySale(authorId, workTitle, amount, buyerName = '読者', workId = null) {
    return createNotification({
        userId: authorId,
        type: NotificationTypes.SALE,
        title: '作品が購入されました！',
        message: `「${workTitle}」が${buyerName}さんに購入されました。収益: ¥${amount.toLocaleString()}`,
        actionUrl: workId ? `/pages/work-detail.html?id=${workId}` : '/pages/dashboard.html',
        metadata: { workTitle, amount, buyerName, workId }
    });
}

/**
 * 翻訳完了通知を作成
 * @param {string} requesterId - 依頼者のユーザーID
 * @param {string} workTitle - 作品タイトル
 * @param {string} targetLanguage - 翻訳先言語
 * @param {string} translationId - 翻訳ID
 */
async function notifyTranslationComplete(requesterId, workTitle, targetLanguage, translationId = null) {
    const langNames = {
        en: '英語', ja: '日本語', zh: '中国語', es: 'スペイン語',
        fr: 'フランス語', de: 'ドイツ語', ko: '韓国語', ar: 'アラビア語'
    };
    const langName = langNames[targetLanguage] || targetLanguage;
    
    return createNotification({
        userId: requesterId,
        type: NotificationTypes.TRANSLATION_COMPLETE,
        title: '翻訳が完了しました',
        message: `「${workTitle}」の${langName}翻訳が完了しました。確認してください。`,
        actionUrl: translationId ? `/pages/translation-status.html?id=${translationId}` : '/pages/translation-status.html',
        metadata: { workTitle, targetLanguage, translationId }
    });
}

/**
 * 翻訳依頼通知を作成
 * @param {string} translatorId - 翻訳者のユーザーID
 * @param {string} workTitle - 作品タイトル
 * @param {string} sourceLanguage - 原文言語
 * @param {string} targetLanguage - 翻訳先言語
 * @param {string} requestId - 依頼ID
 */
async function notifyTranslationRequest(translatorId, workTitle, sourceLanguage, targetLanguage, requestId = null) {
    const langNames = {
        en: '英語', ja: '日本語', zh: '中国語', es: 'スペイン語',
        fr: 'フランス語', de: 'ドイツ語', ko: '韓国語', ar: 'アラビア語'
    };
    const sourceName = langNames[sourceLanguage] || sourceLanguage;
    const targetName = langNames[targetLanguage] || targetLanguage;
    
    return createNotification({
        userId: translatorId,
        type: NotificationTypes.TRANSLATION_REQUEST,
        title: '新しい翻訳依頼',
        message: `「${workTitle}」の${sourceName}→${targetName}翻訳依頼が届きました。`,
        actionUrl: requestId ? `/pages/translators/request-detail.html?id=${requestId}` : '/pages/translators/requests.html',
        metadata: { workTitle, sourceLanguage, targetLanguage, requestId }
    });
}

/**
 * コメント通知を作成
 * @param {string} authorId - 著者のユーザーID
 * @param {string} workTitle - 作品タイトル
 * @param {string} commenterName - コメント者名
 * @param {string} commentPreview - コメントのプレビュー
 * @param {string} workId - 作品ID
 */
async function notifyComment(authorId, workTitle, commenterName, commentPreview, workId = null) {
    const preview = commentPreview.length > 50 ? commentPreview.substring(0, 50) + '...' : commentPreview;
    
    return createNotification({
        userId: authorId,
        type: NotificationTypes.COMMENT,
        title: '新しいコメント',
        message: `${commenterName}さんが「${workTitle}」にコメントしました: "${preview}"`,
        actionUrl: workId ? `/pages/work-detail.html?id=${workId}#comments` : '/pages/dashboard.html',
        metadata: { workTitle, commenterName, commentPreview, workId }
    });
}

/**
 * フィードバック通知を作成
 * @param {string} authorId - 著者のユーザーID
 * @param {string} workTitle - 作品タイトル
 * @param {number} rating - 評価（1-5）
 * @param {string} feedbackPreview - フィードバックのプレビュー
 * @param {string} workId - 作品ID
 */
async function notifyFeedback(authorId, workTitle, rating, feedbackPreview = '', workId = null) {
    const stars = '⭐'.repeat(rating);
    const preview = feedbackPreview ? `: "${feedbackPreview.substring(0, 30)}..."` : '';
    
    return createNotification({
        userId: authorId,
        type: NotificationTypes.FEEDBACK,
        title: '新しい読者フィードバック',
        message: `「${workTitle}」に${stars}の評価が付きました${preview}`,
        actionUrl: workId ? `/pages/feedback/work-feedback.html?id=${workId}` : '/pages/feedback/my-feedback.html',
        metadata: { workTitle, rating, feedbackPreview, workId }
    });
}

/**
 * チケット返信通知を作成
 * @param {string} userId - ユーザーID
 * @param {string} ticketSubject - チケット件名
 * @param {string} ticketId - チケットID
 */
async function notifyTicketReply(userId, ticketSubject, ticketId) {
    return createNotification({
        userId: userId,
        type: NotificationTypes.TICKET_REPLY,
        title: 'サポートからの返信',
        message: `「${ticketSubject}」に返信がありました。`,
        actionUrl: `/pages/support/ticket-detail.html?id=${ticketId}`,
        metadata: { ticketSubject, ticketId }
    });
}

/**
 * システム通知を作成
 * @param {string} userId - ユーザーID
 * @param {string} title - タイトル
 * @param {string} message - メッセージ
 * @param {string} actionUrl - アクションURL
 */
async function notifySystem(userId, title, message, actionUrl = null) {
    return createNotification({
        userId: userId,
        type: NotificationTypes.SYSTEM,
        title: title,
        message: message,
        actionUrl: actionUrl,
        metadata: {}
    });
}

/**
 * アカウント通知を作成
 * @param {string} userId - ユーザーID
 * @param {string} title - タイトル
 * @param {string} message - メッセージ
 */
async function notifyAccount(userId, title, message) {
    return createNotification({
        userId: userId,
        type: NotificationTypes.ACCOUNT,
        title: title,
        message: message,
        actionUrl: '/pages/account-settings.html',
        metadata: {}
    });
}

/**
 * 複数ユーザーに一括通知を送信
 * @param {string[]} userIds - ユーザーIDの配列
 * @param {Object} notificationData - 通知データ
 */
async function notifyMultiple(userIds, notificationData) {
    const results = [];
    for (const userId of userIds) {
        try {
            const result = await createNotification({
                ...notificationData,
                userId
            });
            results.push(result);
        } catch (error) {
            console.error(`[NotificationService] Failed to notify user ${userId}:`, error);
        }
    }
    return results;
}

module.exports = {
    NotificationTypes,
    NotificationIcons,
    createNotification,
    notifySale,
    notifyTranslationComplete,
    notifyTranslationRequest,
    notifyComment,
    notifyFeedback,
    notifyTicketReply,
    notifySystem,
    notifyAccount,
    notifyMultiple
};
