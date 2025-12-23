/**
 * Publisher Platform - Common Utilities
 * Phase 11C-3: JavaScript最適化
 * 
 * 共通で使用するユーティリティ関数を集約
 * 他のJSファイルから利用可能
 */

(function() {
    'use strict';

    const PublisherUtils = {
        // =====================================================
        // Configuration
        // =====================================================
        config: {
            apiBase: 'http://localhost:3000/api',
            tokenKey: 'token',
            refreshInterval: 60000 // 1分
        },

        // =====================================================
        // Authentication Helpers
        // =====================================================
        auth: {
            /**
             * 認証トークンを取得
             * @returns {string|null} JWT token or null
             */
            getToken: function() {
                return localStorage.getItem(PublisherUtils.config.tokenKey);
            },

            /**
             * 認証済みかどうかをチェック
             * @returns {boolean}
             */
            isAuthenticated: function() {
                return !!this.getToken();
            },

            /**
             * 認証ヘッダーを取得
             * @returns {Object} Headers object for fetch
             */
            getAuthHeaders: function() {
                const token = this.getToken();
                return token ? { 'Authorization': `Bearer ${token}` } : {};
            }
        },

        // =====================================================
        // API Helpers
        // =====================================================
        api: {
            /**
             * 認証付きGETリクエスト
             * @param {string} endpoint - APIエンドポイント（/api/以降）
             * @returns {Promise<Object>} Response data
             */
            get: async function(endpoint) {
                const response = await fetch(
                    `${PublisherUtils.config.apiBase}${endpoint}`,
                    { headers: PublisherUtils.auth.getAuthHeaders() }
                );
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                return response.json();
            },

            /**
             * 認証付きPOSTリクエスト
             * @param {string} endpoint - APIエンドポイント
             * @param {Object} data - 送信データ
             * @returns {Promise<Object>} Response data
             */
            post: async function(endpoint, data) {
                const response = await fetch(
                    `${PublisherUtils.config.apiBase}${endpoint}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...PublisherUtils.auth.getAuthHeaders()
                        },
                        body: JSON.stringify(data)
                    }
                );
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                return response.json();
            }
        },

        // =====================================================
        // DOM Helpers
        // =====================================================
        dom: {
            /**
             * 要素が存在するまで待機
             * @param {string} selector - CSSセレクタ
             * @param {number} timeout - タイムアウト（ms）
             * @returns {Promise<Element>}
             */
            waitForElement: function(selector, timeout = 5000) {
                return new Promise((resolve, reject) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        resolve(element);
                        return;
                    }

                    const observer = new MutationObserver((mutations, obs) => {
                        const el = document.querySelector(selector);
                        if (el) {
                            obs.disconnect();
                            resolve(el);
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });

                    setTimeout(() => {
                        observer.disconnect();
                        reject(new Error(`Element ${selector} not found`));
                    }, timeout);
                });
            },

            /**
             * DOMContentLoaded後に実行
             * @param {Function} callback
             */
            ready: function(callback) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', callback);
                } else {
                    callback();
                }
            }
        },

        // =====================================================
        // Formatting Helpers
        // =====================================================
        format: {
            /**
             * 数値を短縮形式に変換（例: 1000 → 1K）
             * @param {number} num
             * @returns {string}
             */
            shortNumber: function(num) {
                if (num >= 1000000) {
                    return (num / 1000000).toFixed(1) + 'M';
                }
                if (num >= 1000) {
                    return (num / 1000).toFixed(1) + 'K';
                }
                return num.toString();
            },

            /**
             * 通貨フォーマット
             * @param {number} amount
             * @param {string} currency - 'JPY', 'USD' etc.
             * @returns {string}
             */
            currency: function(amount, currency = 'JPY') {
                return new Intl.NumberFormat('ja-JP', {
                    style: 'currency',
                    currency: currency
                }).format(amount);
            },

            /**
             * 相対時間（例: 3分前、2時間前）
             * @param {Date|string} date
             * @returns {string}
             */
            relativeTime: function(date) {
                const now = new Date();
                const target = new Date(date);
                const diff = now - target;
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                if (days > 0) return `${days}日前`;
                if (hours > 0) return `${hours}時間前`;
                if (minutes > 0) return `${minutes}分前`;
                return 'たった今';
            }
        },

        // =====================================================
        // Storage Helpers
        // =====================================================
        storage: {
            /**
             * JSONをlocalStorageに保存
             * @param {string} key
             * @param {*} value
             */
            set: function(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                } catch (e) {
                    console.error('Storage error:', e);
                }
            },

            /**
             * localStorageからJSONを取得
             * @param {string} key
             * @param {*} defaultValue
             * @returns {*}
             */
            get: function(key, defaultValue = null) {
                try {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : defaultValue;
                } catch (e) {
                    return defaultValue;
                }
            },

            /**
             * localStorageから削除
             * @param {string} key
             */
            remove: function(key) {
                localStorage.removeItem(key);
            }
        },

        // =====================================================
        // Debounce & Throttle
        // =====================================================
        /**
         * デバウンス（連続呼び出しを抑制）
         * @param {Function} func
         * @param {number} wait - 待機時間（ms）
         * @returns {Function}
         */
        debounce: function(func, wait = 250) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        /**
         * スロットル（一定間隔で実行を許可）
         * @param {Function} func
         * @param {number} limit - 間隔（ms）
         * @returns {Function}
         */
        throttle: function(func, limit = 250) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // =====================================================
        // Event Helpers
        // =====================================================
        events: {
            /**
             * カスタムイベントを発火
             * @param {string} eventName
             * @param {*} detail
             * @param {Element} target
             */
            emit: function(eventName, detail = {}, target = document) {
                target.dispatchEvent(new CustomEvent(eventName, { detail }));
            },

            /**
             * イベントリスナーを追加（一度だけ実行）
             * @param {Element} element
             * @param {string} eventName
             * @param {Function} handler
             */
            once: function(element, eventName, handler) {
                element.addEventListener(eventName, handler, { once: true });
            }
        },

        // =====================================================
        // Visibility API Helper
        // =====================================================
        visibility: {
            /**
             * ページが表示状態になったときに実行
             * @param {Function} callback
             */
            onVisible: function(callback) {
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) callback();
                });
            },

            /**
             * ページが非表示になったときに実行
             * @param {Function} callback
             */
            onHidden: function(callback) {
                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) callback();
                });
            }
        }
    };

    // グローバルに公開
    window.PublisherUtils = PublisherUtils;

})();
