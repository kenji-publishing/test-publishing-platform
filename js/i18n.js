/**
 * Publisher Platform - i18n Engine (翻訳エンジン)
 *
 * 全ページ共通の多言語対応を提供。
 * 言語別JSONファイルから翻訳を読み込み、data-i18n属性で自動適用。
 *
 * 使い方:
 *   <script src="js/i18n.js"></script>
 *   <span data-i18n="browse.pageTitle">Browse Works</span>
 *
 * JSから使う場合:
 *   i18n.t('browse.pageTitle')  // => "作品を探す" (日本語の場合)
 *   i18n.setLanguage('ja')
 *   i18n.getCurrentLanguage()
 *
 * 新言語追加:
 *   1. js/lang/xx.json を作成
 *   2. i18n.SUPPORTED_LANGUAGES に追加
 *   → 全ページに自動反映
 */

(function() {
    'use strict';

    // ========== 設定 ==========

    var SUPPORTED_LANGUAGES = {
        en: { name: 'English', flag: '🇬🇧', rtl: false },
        ja: { name: '日本語', flag: '🇯🇵', rtl: false },
        zh: { name: '中文', flag: '🇨🇳', rtl: false },
        es: { name: 'Español', flag: '🇪🇸', rtl: false },
        fr: { name: 'Français', flag: '🇫🇷', rtl: false },
        de: { name: 'Deutsch', flag: '🇩🇪', rtl: false },
        ko: { name: '한국어', flag: '🇰🇷', rtl: false },
        ar: { name: 'عربي', flag: '🇸🇦', rtl: true },
        pt: { name: 'Português', flag: '🇧🇷', rtl: false },
        it: { name: 'Italiano', flag: '🇮🇹', rtl: false }
    };

    var DEFAULT_LANGUAGE = 'en';
    var STORAGE_KEY = 'preferredLanguage';

    // ========== 内部状態 ==========

    var _translations = {};  // { 'en': { browse: { pageTitle: 'Browse Works' } }, 'ja': {...} }
    var _currentLang = DEFAULT_LANGUAGE;
    var _loaded = {};  // loaded language codes
    var _listeners = [];  // language change callbacks
    var _basePath = '';  // path to js/lang/ directory

    // ========== パス検出 ==========

    function _detectBasePath() {
        // Detect path from current page to project root
        var scripts = document.querySelectorAll('script[src*="i18n.js"]');
        if (scripts.length > 0) {
            var src = scripts[scripts.length - 1].getAttribute('src');
            // src might be "js/i18n.js", "../js/i18n.js", "../../js/i18n.js"
            return src.replace('js/i18n.js', 'js/lang/');
        }
        // Fallback: detect from URL path
        var path = window.location.pathname;
        if (path.includes('/pages/support/') || path.includes('/pages/feedback/') ||
            path.includes('/pages/translators/') || path.includes('/pages/editors/') ||
            path.includes('/pages/admin/') || path.includes('/pages/dev/')) {
            return '../../js/lang/';
        } else if (path.includes('/pages/')) {
            return '../js/lang/';
        }
        return 'js/lang/';
    }

    // ========== 翻訳データ読み込み ==========

    function _loadLanguage(lang, callback) {
        if (_loaded[lang]) {
            if (callback) callback();
            return;
        }

        // Step 1: Load from window.translations (js/lang/*.js script tags - always available)
        if (window.translations && window.translations[lang]) {
            _translations[lang] = _deepMerge(_translations[lang] || {}, window.translations[lang]);
        }

        // Step 2: Try loading JSON for additional keys (works on HTTP servers)
        try {
            var url = _basePath + lang + '.json';
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            var jsonData = JSON.parse(xhr.responseText);
                            // Merge JSON data with existing (JSON keys take priority)
                            _translations[lang] = _deepMerge(_translations[lang] || {}, jsonData);
                        } catch (e) {
                            // JSON parse failed - use window.translations only
                        }
                    }
                    _loaded[lang] = true;
                    if (callback) callback();
                }
            };
            xhr.send();
        } catch (e) {
            // XHR failed (e.g. file:// protocol) - use window.translations only
            _loaded[lang] = true;
            if (callback) callback();
        }
    }

    // 同期的に翻訳データを設定（ビルド時やインラインデータ用）
    function _setTranslations(lang, data) {
        _translations[lang] = _deepMerge(_translations[lang] || {}, data);
        _loaded[lang] = true;
    }

    // Deep merge two objects (source overwrites target for leaf values)
    function _deepMerge(target, source) {
        var result = {};
        var key;
        // Copy target
        for (key in target) {
            if (target.hasOwnProperty(key)) result[key] = target[key];
        }
        // Merge source
        for (key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])
                    && typeof result[key] === 'object' && result[key] !== null) {
                    result[key] = _deepMerge(result[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }

    // ========== 翻訳取得 ==========

    /**
     * ドット区切りキーで翻訳テキストを取得
     * @param {string} key - e.g. 'browse.pageTitle'
     * @param {object} [params] - 置換パラメータ e.g. { count: 5 }
     * @param {string} [lang] - 言語コード（省略時は現在の言語）
     * @returns {string}
     */
    function t(key, params, lang) {
        lang = lang || _currentLang;
        var value = _resolve(key, lang);

        // Fallback to English
        if (value === undefined && lang !== DEFAULT_LANGUAGE) {
            value = _resolve(key, DEFAULT_LANGUAGE);
        }

        // Final fallback: return key itself
        if (value === undefined) {
            return key;
        }

        // Parameter substitution: {name} -> params.name
        if (params && typeof value === 'string') {
            Object.keys(params).forEach(function(k) {
                value = value.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
            });
        }

        return value;
    }

    function _resolve(key, lang) {
        var data = _translations[lang];
        if (!data) return undefined;

        var parts = key.split('.');
        var current = data;
        for (var i = 0; i < parts.length; i++) {
            if (current == null || typeof current !== 'object') return undefined;
            current = current[parts[i]];
        }
        return typeof current === 'string' ? current : undefined;
    }

    // ========== DOM適用 ==========

    /**
     * data-i18n 属性を持つ全要素のテキストを更新
     * @param {Element} [root] - 検索ルート（省略時はdocument）
     */
    function applyToDOM(root) {
        root = root || document;

        // data-i18n: textContent
        var elements = root.querySelectorAll('[data-i18n]');
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var key = el.getAttribute('data-i18n');
            if (key) {
                var text = t(key);
                if (text !== key) {
                    el.textContent = text;
                }
            }
        }

        // data-i18n-placeholder: input placeholder
        var placeholders = root.querySelectorAll('[data-i18n-placeholder]');
        for (var j = 0; j < placeholders.length; j++) {
            var ph = placeholders[j];
            var pKey = ph.getAttribute('data-i18n-placeholder');
            if (pKey) {
                var pText = t(pKey);
                if (pText !== pKey) {
                    ph.placeholder = pText;
                }
            }
        }

        // data-i18n-title: title attribute
        var titles = root.querySelectorAll('[data-i18n-title]');
        for (var k = 0; k < titles.length; k++) {
            var ti = titles[k];
            var tKey = ti.getAttribute('data-i18n-title');
            if (tKey) {
                var tText = t(tKey);
                if (tText !== tKey) {
                    ti.title = tText;
                }
            }
        }

        // data-i18n-html: innerHTML (for content with HTML tags)
        var htmlEls = root.querySelectorAll('[data-i18n-html]');
        for (var h = 0; h < htmlEls.length; h++) {
            var he = htmlEls[h];
            var hKey = he.getAttribute('data-i18n-html');
            if (hKey) {
                var hText = t(hKey);
                if (hText !== hKey) {
                    he.innerHTML = hText;
                }
            }
        }
    }

    // ========== 言語切替 ==========

    function getCurrentLanguage() {
        return _currentLang;
    }

    function setLanguage(lang, callback) {
        if (!SUPPORTED_LANGUAGES[lang]) {
            console.warn('i18n: Unsupported language: ' + lang);
            return;
        }

        _currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);

        // RTL
        var langInfo = SUPPORTED_LANGUAGES[lang];
        document.documentElement.dir = langInfo.rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        // Load translation data if needed, then apply
        _loadLanguage(lang, function() {
            applyToDOM();

            // Notify listeners
            for (var i = 0; i < _listeners.length; i++) {
                try { _listeners[i](lang); } catch (e) { console.error(e); }
            }

            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

            if (callback) callback();
        });
    }

    /**
     * 言語変更時のコールバックを登録
     */
    function onLanguageChange(callback) {
        _listeners.push(callback);
    }

    // ========== 後方互換 ==========

    /**
     * getL(obj) - 多言語オブジェクトから現在言語の値を取得
     * Pattern C の既存ページとの後方互換性のため
     */
    function getL(obj) {
        if (!obj) return '';
        return obj[_currentLang] || obj[DEFAULT_LANGUAGE] || '';
    }

    // ========== 初期化 ==========

    function _init() {
        _basePath = _detectBasePath();

        // Detect saved language
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED_LANGUAGES[saved]) {
            _currentLang = saved;
        } else {
            // Detect from browser
            var browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
            if (SUPPORTED_LANGUAGES[browserLang]) {
                _currentLang = browserLang;
            }
        }

        // Set RTL/lang attribute
        var langInfo = SUPPORTED_LANGUAGES[_currentLang];
        if (langInfo) {
            document.documentElement.dir = langInfo.rtl ? 'rtl' : 'ltr';
            document.documentElement.lang = _currentLang;
        }

        // Load English (always, as fallback) + current language
        _loadLanguage(DEFAULT_LANGUAGE, function() {
            if (_currentLang !== DEFAULT_LANGUAGE) {
                _loadLanguage(_currentLang, function() {
                    applyToDOM();
                });
            } else {
                applyToDOM();
            }
        });
    }

    // ========== Public API ==========

    window.i18n = {
        t: t,
        getL: getL,
        setLanguage: setLanguage,
        getCurrentLanguage: getCurrentLanguage,
        onLanguageChange: onLanguageChange,
        applyToDOM: applyToDOM,
        setTranslations: _setTranslations,
        SUPPORTED_LANGUAGES: SUPPORTED_LANGUAGES,
        DEFAULT_LANGUAGE: DEFAULT_LANGUAGE
    };

    // Also expose as global functions for backward compatibility
    window.getCurrentLanguage = getCurrentLanguage;
    window.getCurrentLang = getCurrentLanguage;
    window.getL = getL;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }

})();
