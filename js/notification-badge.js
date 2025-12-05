/**
 * Notification Badge Component
 * ヘッダーの通知バッジを動的に更新する共通コンポーネント
 * 
 * 使い方：
 * 1. HTMLにこのスクリプトを読み込む
 *    <script src="/js/notification-badge.js"></script>
 * 
 * 2. ヘッダーに通知バッジを配置
 *    <a href="notifications.html" class="btn btn-soft-custom position-relative">
 *        <i class="fas fa-bell"></i>
 *        <span id="notificationBadge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 0.6rem; display: none;">
 *            0
 *        </span>
 *    </a>
 */

(function() {
    'use strict';

    const BADGE_ID = 'notificationBadge';
    const API_URL = '/api/notifications/unread-count';
    const REFRESH_INTERVAL = 60000; // 1分ごとに更新

    let refreshTimer = null;

    /**
     * 未読数を取得してバッジを更新
     */
    async function updateNotificationBadge() {
        const badge = document.getElementById(BADGE_ID);
        if (!badge) return;

        const token = localStorage.getItem('token');
        if (!token) {
            badge.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch unread count');
            }

            const data = await response.json();
            const count = data.count || 0;

            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }

        } catch (error) {
            console.error('Notification badge update error:', error);
            // エラー時はバッジを非表示
            badge.style.display = 'none';
        }
    }

    /**
     * 定期更新を開始
     */
    function startAutoRefresh() {
        stopAutoRefresh();
        refreshTimer = setInterval(updateNotificationBadge, REFRESH_INTERVAL);
    }

    /**
     * 定期更新を停止
     */
    function stopAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    }

    /**
     * 手動で更新をトリガー（外部から呼び出し可能）
     */
    window.refreshNotificationBadge = updateNotificationBadge;

    /**
     * 初期化
     */
    function init() {
        // DOMContentLoaded後に実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                updateNotificationBadge();
                startAutoRefresh();
            });
        } else {
            updateNotificationBadge();
            startAutoRefresh();
        }

        // ページが非表示になったら更新を停止
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoRefresh();
            } else {
                updateNotificationBadge();
                startAutoRefresh();
            }
        });

        // ページ離脱時にクリーンアップ
        window.addEventListener('beforeunload', stopAutoRefresh);
    }

    // 初期化実行
    init();

})();
