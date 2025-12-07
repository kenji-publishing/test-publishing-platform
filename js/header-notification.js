/**
 * ヘッダー通知コンポーネント
 * このスクリプトを読み込むと、ナビバーに通知ベルが自動的に追加されます
 * 
 * 使用方法: 
 * <script src="../js/header-notification.js"></script>
 * を </body> の直前に追加
 */

(function() {
    'use strict';

    // API Base URL
    const API_BASE = 'http://localhost:3000/api';

    // ページ読み込み完了時に実行
    document.addEventListener('DOMContentLoaded', function() {
        insertNotificationBell();
        initNotificationBadge();
    });

    /**
     * ナビバーに通知ベルを挿入
     */
    function insertNotificationBell() {
        // 既に通知ベルが存在する場合はスキップ
        if (document.getElementById('notificationBadge')) {
            return;
        }

        // ナビバー内の適切な位置を探す
        const navbar = document.querySelector('.navbar-collapse');
        if (!navbar) return;

        // authNav または既存のユーザーメニューを探す
        const authNav = document.getElementById('authNav');
        const userDropdown = navbar.querySelector('.dropdown');
        const insertTarget = authNav || userDropdown;

        if (!insertTarget) return;

        // 通知ベルのHTML
        const bellHTML = `
            <div class="d-flex align-items-center me-2" id="notificationBellContainer">
                <a href="notifications.html" class="btn btn-outline-secondary position-relative" title="通知">
                    <i class="fas fa-bell"></i>
                    <span id="notificationBadge" 
                          class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                          style="font-size: 0.6rem; display: none;">
                        0
                    </span>
                </a>
            </div>
        `;

        // 通知ベルを挿入
        insertTarget.insertAdjacentHTML('beforebegin', bellHTML);
    }

    /**
     * 通知バッジの初期化と自動更新
     */
    function initNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        let refreshInterval = null;

        // 未読数を取得して更新
        async function loadUnreadCount() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    badge.style.display = 'none';
                    return;
                }

                const response = await fetch(`${API_BASE}/notifications/unread-count`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    updateBadge(data.count || 0);
                } else {
                    badge.style.display = 'none';
                }
            } catch (error) {
                console.log('Notification badge: API not available');
                badge.style.display = 'none';
            }
        }

        // バッジ表示を更新
        function updateBadge(count) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }

        // 初回読み込み
        loadUnreadCount();

        // 60秒ごとに更新（ページが表示されている場合のみ）
        function startAutoRefresh() {
            if (refreshInterval) return;
            refreshInterval = setInterval(() => {
                if (!document.hidden) {
                    loadUnreadCount();
                }
            }, 60000);
        }

        function stopAutoRefresh() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
        }

        // ページ表示状態に応じて自動更新を制御
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stopAutoRefresh();
            } else {
                loadUnreadCount();
                startAutoRefresh();
            }
        });

        startAutoRefresh();

        // グローバルに更新関数を公開
        window.refreshNotificationBadge = loadUnreadCount;
    }

})();
