/**
 * Publisher Platform - Translations Base
 * 共通翻訳機能（ベースファイル）
 * 
 * このファイルは翻訳システムの共通関数と言語設定を提供します。
 * 各言語ファイル（ja.js, en.js など）を先に読み込んでから使用してください。
 * 
 * 読み込み順序:
 * 1. 各言語ファイル (ja.js, en.js, zh.js, es.js, fr.js, de.js, ko.js, ar.js, pt.js)
 * 2. このファイル (translations-base.js)
 * 3. language-switcher.js
 */

// ============================================
// 言語設定（Language Configuration）
// ============================================
const availableLanguages = {
    en: { name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
    ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
    zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
    es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
    fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
    de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
    ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
    ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', rtl: false },
    it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false }
};

// ============================================
// 翻訳オブジェクト（Translation Object）
// 各言語ファイルから追加される
// ============================================
// 注意: translationsオブジェクトは各言語ファイル(ja.js, en.js等)で
// 事前に定義・追加されている必要があります
if (typeof window.translations === 'undefined') {
    window.translations = {};
}
const translations = window.translations;

// ============================================
// 共通関数（Common Functions）
// ============================================

/**
 * 翻訳キーから翻訳テキストを取得
 * @param {string} key - ドット区切りの翻訳キー (例: 'nav.home')
 * @param {string|null} lang - 言語コード（省略時は現在の言語）
 * @returns {string} 翻訳されたテキスト、見つからない場合はキーを返す
 */
function t(key, lang = null) {
    const currentLang = lang || getCurrentLanguage();
    const keys = key.split('.');
    let result = translations[currentLang];
    
    // 指定言語で探す
    for (const k of keys) {
        if (result && result[k]) {
            result = result[k];
        } else {
            // フォールバック: 英語で探す
            result = translations.en;
            for (const fallbackKey of keys) {
                if (result && result[fallbackKey]) {
                    result = result[fallbackKey];
                } else {
                    return key; // 見つからない場合はキーを返す
                }
            }
            break;
        }
    }
    return typeof result === 'string' ? result : key;
}

/**
 * 現在の言語コードを取得
 * @returns {string} 言語コード (例: 'ja', 'en')
 */
function getCurrentLanguage() {
    // 1. localStorageから取得
    const stored = localStorage.getItem('preferredLanguage');
    if (stored && availableLanguages[stored]) {
        return stored;
    }
    
    // 2. ブラウザの言語設定から取得
    const browserLang = navigator.language.split('-')[0];
    if (availableLanguages[browserLang]) {
        return browserLang;
    }
    
    // 3. デフォルトは英語
    return 'en';
}

/**
 * 言語を設定
 * @param {string} lang - 言語コード
 */
function setLanguage(lang) {
    if (availableLanguages[lang]) {
        // localStorageに保存
        localStorage.setItem('preferredLanguage', lang);
        
        // RTL対応
        document.documentElement.dir = availableLanguages[lang].rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        
        // カスタムイベントを発火（他のスクリプトが言語変更を検知できる）
        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { lang } 
        }));
    }
}

/**
 * 言語が利用可能かチェック
 * @param {string} lang - 言語コード
 * @returns {boolean} 利用可能な場合true
 */
function isLanguageAvailable(lang) {
    return !!availableLanguages[lang];
}

/**
 * 利用可能な全言語のリストを取得
 * @returns {Object} availableLanguagesオブジェクト
 */
function getAvailableLanguages() {
    return availableLanguages;
}

/**
 * 指定言語の情報を取得
 * @param {string} lang - 言語コード
 * @returns {Object|null} 言語情報オブジェクト
 */
function getLanguageInfo(lang) {
    return availableLanguages[lang] || null;
}

// ============================================
// グローバルへのエクスポート
// ============================================
window.translations = translations;
window.availableLanguages = availableLanguages;
window.t = t;
window.getCurrentLanguage = getCurrentLanguage;
window.setLanguage = setLanguage;
window.isLanguageAvailable = isLanguageAvailable;
window.getAvailableLanguages = getAvailableLanguages;
window.getLanguageInfo = getLanguageInfo;

// デバッグ用: 読み込み確認
console.log('[translations-base.js] Loaded successfully. Available languages:', Object.keys(availableLanguages).join(', '));
