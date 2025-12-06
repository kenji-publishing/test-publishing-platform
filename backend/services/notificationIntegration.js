/**
 * Notification Integration Examples
 * Phase 9C: Auto-generate notifications
 * 
 * このファイルは既存のルートに通知サービスを統合する方法を示します。
 * 実際の統合は各ルートファイルで行います。
 */

const notificationService = require('./notificationService');

// =============================================
// 使用例 1: 売上通知
// (works.js または payments.js で使用)
// =============================================

/**
 * 購入完了時に著者へ通知を送信
 * 
 * 使用箇所: POST /api/works/:id/purchase または決済完了コールバック
 */
async function onPurchaseComplete(authorId, workTitle, amount, buyerName, workId) {
    try {
        await notificationService.notifySale(
            authorId,
            workTitle,
            amount,
            buyerName,
            workId
        );
        console.log(`[NotificationIntegration] Sale notification sent to author ${authorId}`);
    } catch (error) {
        // 通知の失敗は購入処理を停止させない
        console.error('[NotificationIntegration] Failed to send sale notification:', error);
    }
}

// =============================================
// 使用例 2: 翻訳完了通知
// (ai-translation.js で使用)
// =============================================

/**
 * 翻訳完了時に依頼者へ通知を送信
 * 
 * 使用箇所: 翻訳キューのポーリング処理完了時
 */
async function onTranslationComplete(requesterId, workTitle, targetLanguage, translationId) {
    try {
        await notificationService.notifyTranslationComplete(
            requesterId,
            workTitle,
            targetLanguage,
            translationId
        );
        console.log(`[NotificationIntegration] Translation complete notification sent to ${requesterId}`);
    } catch (error) {
        console.error('[NotificationIntegration] Failed to send translation notification:', error);
    }
}

// =============================================
// 使用例 3: チケット返信通知
// (support.js で使用)
// =============================================

/**
 * 管理者がチケットに返信した時にユーザーへ通知を送信
 * 
 * 使用箇所: POST /api/support/tickets/:id/messages (管理者返信時)
 */
async function onTicketReply(userId, ticketSubject, ticketId) {
    if (!userId) return; // ゲストユーザーには通知しない
    
    try {
        await notificationService.notifyTicketReply(
            userId,
            ticketSubject,
            ticketId
        );
        console.log(`[NotificationIntegration] Ticket reply notification sent to ${userId}`);
    } catch (error) {
        console.error('[NotificationIntegration] Failed to send ticket notification:', error);
    }
}

// =============================================
// 使用例 4: フィードバック通知
// (reader-feedback.js で使用)
// =============================================

/**
 * 読者がフィードバックを投稿した時に著者へ通知を送信
 * 
 * 使用箇所: POST /api/feedback
 */
async function onFeedbackReceived(authorId, workTitle, rating, feedbackPreview, workId) {
    try {
        await notificationService.notifyFeedback(
            authorId,
            workTitle,
            rating,
            feedbackPreview,
            workId
        );
        console.log(`[NotificationIntegration] Feedback notification sent to ${authorId}`);
    } catch (error) {
        console.error('[NotificationIntegration] Failed to send feedback notification:', error);
    }
}

// =============================================
// 使用例 5: コメント通知
// (comments.js で使用)
// =============================================

/**
 * コメント投稿時に著者へ通知を送信
 * 
 * 使用箇所: POST /api/works/:id/comments
 */
async function onCommentPosted(authorId, workTitle, commenterName, commentPreview, workId) {
    try {
        await notificationService.notifyComment(
            authorId,
            workTitle,
            commenterName,
            commentPreview,
            workId
        );
        console.log(`[NotificationIntegration] Comment notification sent to ${authorId}`);
    } catch (error) {
        console.error('[NotificationIntegration] Failed to send comment notification:', error);
    }
}

// =============================================
// 使用例 6: システム通知（管理者用）
// =============================================

/**
 * 全ユーザーまたは特定ユーザーにシステム通知を送信
 * 
 * 使用箇所: 管理画面から手動で送信
 */
async function sendSystemNotification(userIds, title, message, actionUrl = null) {
    try {
        const results = await notificationService.notifyMultiple(
            userIds,
            {
                type: notificationService.NotificationTypes.SYSTEM,
                title,
                message,
                actionUrl
            }
        );
        console.log(`[NotificationIntegration] System notifications sent to ${results.length} users`);
        return results;
    } catch (error) {
        console.error('[NotificationIntegration] Failed to send system notifications:', error);
        throw error;
    }
}

// =============================================
// エクスポート
// =============================================

module.exports = {
    onPurchaseComplete,
    onTranslationComplete,
    onTicketReply,
    onFeedbackReceived,
    onCommentPosted,
    sendSystemNotification,
    
    // 直接サービスも公開（柔軟な使用のため）
    notificationService
};
