/**
 * Publisher Platform - Language Switcher
 * Phase 12-1: 9言語対応
 * 
 * 対応言語:
 * en, ja, zh, es, fr, de, ko, ar, pt
 * 
 * 使用方法:
 * 1. translations.js を先に読み込む
 * 2. HTMLに data-i18n 属性を追加
 *    例: <span data-i18n="nav.dashboard">Dashboard</span>
 * 3. 言語セレクターに .lang-option クラスと data-lang 属性を追加
 *    例: <a class="lang-option" data-lang="ja">日本語</a>
 */

(function() {
    'use strict';

    const LanguageSwitcher = {
        // 現在の言語
        currentLanguage: 'en',

        /**
         * 初期化
         */
        init: function() {
            // 保存された言語を取得、なければブラウザ設定から
            this.currentLanguage = localStorage.getItem('preferredLanguage') || 
                                   this.detectBrowserLanguage() || 
                                   'en';

            // 言語が利用可能かチェック
            if (typeof availableLanguages !== 'undefined' && !availableLanguages[this.currentLanguage]) {
                this.currentLanguage = 'en';
            }

            // 言語を適用
            this.loadLanguage(this.currentLanguage);
            this.updateLanguageDisplay();
            this.bindEvents();

            console.log('Language Switcher initialized:', this.currentLanguage);
        },

        /**
         * ブラウザの言語設定を検出
         */
        detectBrowserLanguage: function() {
            const browserLang = navigator.language || navigator.userLanguage;
            const langCode = browserLang.split('-')[0].toLowerCase();
            
            // 利用可能な言語かチェック
            if (typeof availableLanguages !== 'undefined' && availableLanguages[langCode]) {
                return langCode;
            }
            return null;
        },

        /**
         * イベントをバインド
         */
        bindEvents: function() {
            const self = this;

            // 言語オプションのクリックイベント
            document.querySelectorAll('.lang-option').forEach(option => {
                option.addEventListener('click', function(e) {
                    e.preventDefault();
                    const lang = this.getAttribute('data-lang');
                    if (lang) {
                        self.changeLanguage(lang);
                    }
                });
            });

            // 言語セレクター（select要素）の変更イベント
            document.querySelectorAll('.language-selector, #languageSelect').forEach(select => {
                select.addEventListener('change', function(e) {
                    self.changeLanguage(this.value);
                });
            });
        },

        /**
         * 言語を変更
         * @param {string} lang - 言語コード
         */
        changeLanguage: function(lang) {
            if (typeof availableLanguages !== 'undefined' && !availableLanguages[lang]) {
                console.warn('Language not available:', lang);
                return;
            }

            this.currentLanguage = lang;
            localStorage.setItem('preferredLanguage', lang);
            
            this.loadLanguage(lang);
            this.updateLanguageDisplay();

            // グローバル関数があれば呼び出す（translations.jsの関数）
            if (typeof setLanguage === 'function') {
                setLanguage(lang);
            }

            // カスタムイベントを発火
            document.dispatchEvent(new CustomEvent('languageChanged', { 
                detail: { language: lang } 
            }));
        },

        /**
         * 言語を読み込んでUIを更新
         * @param {string} lang - 言語コード
         */
        loadLanguage: function(lang) {
            if (typeof translations === 'undefined') {
                console.error('Translations not loaded. Include translations.js before language-switcher.js');
                return;
            }

            const langData = translations[lang] || translations['en'];
            if (!langData) {
                console.error('Translation data not found for:', lang);
                return;
            }

            // data-i18n属性を持つ要素を更新
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                const value = this.getNestedValue(langData, key);

                if (value) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        if (element.placeholder) {
                            element.placeholder = value;
                        }
                    } else {
                        element.textContent = value;
                    }
                }
            });

            // data-i18n-placeholder属性を持つ要素を更新
            document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                const value = this.getNestedValue(langData, key);
                if (value) {
                    element.placeholder = value;
                }
            });

            // data-i18n-title属性を持つ要素を更新
            document.querySelectorAll('[data-i18n-title]').forEach(element => {
                const key = element.getAttribute('data-i18n-title');
                const value = this.getNestedValue(langData, key);
                if (value) {
                    element.title = value;
                }
            });

            // ドキュメントの言語属性を更新
            document.documentElement.lang = lang;

            // RTL言語（アラビア語）の対応
            if (typeof availableLanguages !== 'undefined' && availableLanguages[lang]) {
                document.documentElement.dir = availableLanguages[lang].rtl ? 'rtl' : 'ltr';
            }
        },

        /**
         * ネストされたオブジェクトから値を取得
         * @param {Object} obj - オブジェクト
         * @param {string} key - ドット区切りのキー
         * @returns {*} 値
         */
        getNestedValue: function(obj, key) {
            const keys = key.split('.');
            let value = obj;

            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return null;
                }
            }

            return typeof value === 'string' ? value : null;
        },

        /**
         * 言語表示を更新
         */
        updateLanguageDisplay: function() {
            // 現在の言語コードを表示
            const langDisplay = document.getElementById('currentLang');
            if (langDisplay) {
                langDisplay.textContent = this.currentLanguage.toUpperCase();
            }

            // 現在の言語名を表示
            const langNameDisplay = document.getElementById('currentLangName');
            if (langNameDisplay && typeof availableLanguages !== 'undefined') {
                const langInfo = availableLanguages[this.currentLanguage];
                if (langInfo) {
                    langNameDisplay.textContent = langInfo.nativeName;
                }
            }

            // 現在の言語フラグを表示
            const langFlagDisplay = document.getElementById('currentLangFlag');
            if (langFlagDisplay && typeof availableLanguages !== 'undefined') {
                const langInfo = availableLanguages[this.currentLanguage];
                if (langInfo) {
                    langFlagDisplay.textContent = langInfo.flag;
                }
            }

            // select要素の値を更新
            document.querySelectorAll('.language-selector, #languageSelect').forEach(select => {
                select.value = this.currentLanguage;
            });

            // アクティブな言語オプションをハイライト
            document.querySelectorAll('.lang-option').forEach(option => {
                const isActive = option.getAttribute('data-lang') === this.currentLanguage;
                option.classList.toggle('active', isActive);
            });
        },

        /**
         * 現在の言語を取得
         * @returns {string} 言語コード
         */
        getCurrentLanguage: function() {
            return this.currentLanguage;
        },

        /**
         * 言語セレクターのHTMLを生成
         * @param {string} type - 'select' または 'dropdown'
         * @returns {string} HTML文字列
         */
        generateSelectorHTML: function(type = 'select') {
            if (typeof availableLanguages === 'undefined') {
                return '';
            }

            if (type === 'select') {
                let html = '<select class="language-selector form-select">';
                for (const [code, info] of Object.entries(availableLanguages)) {
                    const selected = code === this.currentLanguage ? 'selected' : '';
                    html += `<option value="${code}" ${selected}>${info.flag} ${info.nativeName}</option>`;
                }
                html += '</select>';
                return html;
            }

            if (type === 'dropdown') {
                let html = '<div class="dropdown">';
                const currentInfo = availableLanguages[this.currentLanguage];
                html += `<button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <span id="currentLangFlag">${currentInfo.flag}</span>
                    <span id="currentLangName">${currentInfo.nativeName}</span>
                </button>`;
                html += '<ul class="dropdown-menu">';
                for (const [code, info] of Object.entries(availableLanguages)) {
                    const active = code === this.currentLanguage ? 'active' : '';
                    html += `<li><a class="dropdown-item lang-option ${active}" href="#" data-lang="${code}">${info.flag} ${info.nativeName}</a></li>`;
                }
                html += '</ul></div>';
                return html;
            }

            return '';
        }
    };

    // =====================================================
    // ナビバーヘルパー（メニュー外クリックで閉じる）
    // =====================================================
    const NavbarHelper = {
        /**
         * 初期化
         */
        init: function() {
            this.bindOutsideClick();
            this.addOverlay();
            console.log('NavbarHelper initialized');
        },

        /**
         * オーバーレイを追加（モバイル用）
         */
        addOverlay: function() {
            // 既にオーバーレイがあれば追加しない
            if (document.querySelector('.navbar-overlay')) return;

            const overlay = document.createElement('div');
            overlay.className = 'navbar-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.3);
                z-index: 1000;
                display: none;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            document.body.appendChild(overlay);

            // オーバーレイクリックでメニューを閉じる
            overlay.addEventListener('click', () => {
                this.closeNavbar();
            });

            // Bootstrapのcollapseイベントを監視
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse) {
                // メニューが開いたとき
                navbarCollapse.addEventListener('show.bs.collapse', () => {
                    overlay.style.display = 'block';
                    // 少し遅らせてopacityを変更（トランジション用）
                    setTimeout(() => {
                        overlay.style.opacity = '1';
                    }, 10);
                });

                // メニューが閉じたとき
                navbarCollapse.addEventListener('hide.bs.collapse', () => {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.style.display = 'none';
                    }, 200);
                });
            }
        },

        /**
         * メニュー外クリックでナビバーを閉じる
         */
        bindOutsideClick: function() {
            const self = this;

            document.addEventListener('click', function(event) {
                const navbarCollapse = document.querySelector('.navbar-collapse');
                const navbarToggler = document.querySelector('.navbar-toggler');
                const navbar = document.querySelector('.navbar');

                // ナビバーがない、または開いていない場合は何もしない
                if (!navbarCollapse || !navbarCollapse.classList.contains('show')) {
                    return;
                }

                // クリックがナビバー内かトグラー内かチェック
                const isInsideNavbar = navbar && navbar.contains(event.target);
                const isToggler = navbarToggler && navbarToggler.contains(event.target);

                // ナビバー外をクリックした場合、メニューを閉じる
                if (!isInsideNavbar && !isToggler) {
                    self.closeNavbar();
                }
            });
        },

        /**
         * ナビバーを閉じる
         */
        closeNavbar: function() {
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                // Bootstrap 5のCollapseインスタンスを取得して閉じる
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                } else {
                    // インスタンスがない場合は新しく作成して閉じる
                    new bootstrap.Collapse(navbarCollapse, { toggle: false }).hide();
                }
            }
        }
    };

    // =====================================================
    // 自動初期化
    // =====================================================
    function autoInit() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                LanguageSwitcher.init();
                NavbarHelper.init();
            });
        } else {
            LanguageSwitcher.init();
            NavbarHelper.init();
        }
    }

    autoInit();

    // グローバルに公開
    window.LanguageSwitcher = LanguageSwitcher;

    // 互換性のためのグローバル関数
    window.changeLanguage = function(lang) {
        LanguageSwitcher.changeLanguage(lang);
    };

    window.loadLanguage = function(lang) {
        LanguageSwitcher.loadLanguage(lang);
    };

    /**
     * 翻訳ヘルパー関数
     * 翻訳キーから翻訳テキストを取得
     * @param {string} key - ドット区切りの翻訳キー (例: 'accountSettings.purchases.receipt')
     * @returns {string} 翻訳テキスト、見つからない場合はキーをそのまま返す
     */
    window.t = function(key) {
        if (typeof translations === 'undefined') {
            console.warn('Translations not loaded');
            return key;
        }
        const lang = LanguageSwitcher.getCurrentLanguage() || 'en';
        const langData = translations[lang] || translations['en'];
        if (!langData) {
            return key;
        }
        return LanguageSwitcher.getNestedValue(langData, key) || key;
    };

})();
