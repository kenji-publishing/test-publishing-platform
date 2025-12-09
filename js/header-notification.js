/**
 * ヘッダー通知コンポーネント（Phase 9E拡張版）
 * このスクリプトを読み込むと、ナビバーに通知ベルが自動的に追加されます
 * 
 * 対応するナビバー構造:
 * 1. Bootstrap標準 (.navbar-collapse + #authNav)
 * 2. エディタ独自構造 (.navbar-content)
 * 3. リーダー独自構造 (.reader-toolbar .toolbar-right)
 * 
 * 使用方法: 
 * <script src="../js/header-notification.js"></script>
 * を </body> の直前に追加
 */

(function() {
    'use strict';

    // API Base URL
    const API_BASE = 'http://localhost:3000/api';

    // 通知ページへのパスを自動判定
    function getNotificationsPath() {
        const path = window.location.pathname;
        // サブディレクトリにいる場合は ../notifications.html
        if (path.includes('/support/') || 
            path.includes('/admin/') || 
            path.includes('/translators/') || 
            path.includes('/feedback/') ||
            path.includes('/dev/')) {
            return '../notifications.html';
        }
        // pages/ 直下の場合は notifications.html
        return 'notifications.html';
    }

    // ページ読み込み完了時に実行
    document.addEventListener('DOMContentLoaded', function() {
        insertNotificationBell();
        initNotificationBadge();
    });

    /**
     * ナビバーに通知ベルを挿入
     * 複数のナビバー構造に対応
     */
    function insertNotificationBell() {
        // 既に通知ベルが存在する場合はスキップ
        if (document.getElementById('notificationBadge') || 
            document.getElementById('notificationBellContainer')) {
            return;
        }

        const notificationsPath = getNotificationsPath();

        // 挿入方法1: Bootstrap標準ナビバー (.navbar-collapse + #authNav)
        const navbarCollapse = document.querySelector('.navbar-collapse');
        if (navbarCollapse) {
            const authNav = document.getElementById('authNav');
            const userDropdown = navbarCollapse.querySelector('.dropdown');
            const insertTarget = authNav || userDropdown;

            if (insertTarget) {
                const bellHTML = createBellHTML(notificationsPath, 'bootstrap');
                insertTarget.insertAdjacentHTML('beforebegin', bellHTML);
                return;
            }
        }

        // 挿入方法2: エディタ独自構造 (.navbar-content)
        const navbarContent = document.querySelector('.navbar-content');
        if (navbarContent) {
            // 右側の要素を探す（export, publish ボタンがある領域）
            const rightSection = navbarContent.querySelector('[style*="display: flex"][style*="gap"]');
            if (rightSection && rightSection.querySelector('.export-dropdown, [onclick*="publish"]')) {
                const bellHTML = createBellHTML(notificationsPath, 'editor');
                // export-dropdown の前に挿入
                const exportDropdown = rightSection.querySelector('.export-dropdown');
                if (exportDropdown) {
                    exportDropdown.insertAdjacentHTML('beforebegin', bellHTML);
                    return;
                }
            }
        }

        // 挿入方法3: リーダー独自構造 (.reader-toolbar .toolbar-right)
        const readerToolbar = document.querySelector('.reader-toolbar');
        if (readerToolbar) {
            const toolbarRight = readerToolbar.querySelector('.toolbar-right');
            if (toolbarRight) {
                const bellHTML = createBellHTML(notificationsPath, 'reader');
                // 最初のボタンの前に挿入
                const firstBtn = toolbarRight.querySelector('.btn-toolbar');
                if (firstBtn) {
                    firstBtn.insertAdjacentHTML('beforebegin', bellHTML);
                    return;
                }
            }
        }

        // 挿入方法4: 一般的なナビバー（フォールバック）
        const generalNavbar = document.querySelector('.navbar');
        if (generalNavbar) {
            const container = generalNavbar.querySelector('.container');
            if (container) {
                const bellHTML = createBellHTML(notificationsPath, 'general');
                // コンテナの最後に追加
                container.insertAdjacentHTML('beforeend', bellHTML);
            }
        }
    }

    /**
     * ナビバー構造に応じた通知ベルHTMLを生成
     */
    function createBellHTML(notificationsPath, type) {
        switch(type) {
            case 'bootstrap':
                return `
                    <div class="d-flex align-items-center me-2" id="notificationBellContainer">
                        <a href="${notificationsPath}" class="btn btn-outline-secondary position-relative" title="通知">
                            <i class="fas fa-bell"></i>
                            <span id="notificationBadge" 
                                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                                  style="font-size: 0.6rem; display: none;">
                                0
                            </span>
                        </a>
                    </div>
                `;
            
            case 'editor':
                return `
                    <a href="${notificationsPath}" class="toolbar-btn position-relative" title="通知" id="notificationBellContainer" style="margin-right: 0.5rem;">
                        <i class="fas fa-bell"></i>
                        <span id="notificationBadge" 
                              class="position-absolute badge rounded-pill bg-danger" 
                              style="font-size: 0.55rem; display: none; top: -2px; right: -6px; padding: 2px 5px;">
                            0
                        </span>
                    </a>
                `;
            
            case 'reader':
                return `
                    <a href="${notificationsPath}" class="btn-toolbar position-relative" title="通知" id="notificationBellContainer">
                        <i class="fas fa-bell"></i>
                        <span id="notificationBadge" 
                              class="position-absolute badge rounded-pill bg-danger" 
                              style="font-size: 0.55rem; display: none; top: -2px; right: -6px; padding: 2px 5px;">
                            0
                        </span>
                    </a>
                `;

            case 'general':
            default:
                return `
                    <div class="ms-auto" id="notificationBellContainer">
                        <a href="${notificationsPath}" class="btn btn-outline-light position-relative" title="通知">
                            <i class="bi bi-bell"></i>
                            <span id="notificationBadge" 
                                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                                  style="font-size: 0.6rem; display: none;">
                                0
                            </span>
                        </a>
                    </div>
                `;
        }
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
