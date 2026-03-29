/**
 * uiText パターンのページから古いナビバー翻訳コードを削除
 *
 * 削除対象:
 * 1. uiText内のナビバー関連キー (translationTools, mangaTranslator, etc.)
 * 2. updateUIText/updateAllText内のナビバー要素更新コード
 * 3. 言語セレクター同期コード (desktopSelector/mobileSelector change handlers)
 * 4. loadUserInfo() 呼び出し
 * 5. updateUIText/updateAllText呼び出し (languageChanged内)
 * 6. navbarOverlay/navbarCollapse イベント
 * 7. user dropdown close handler
 *
 * 残す対象:
 * - ページ固有のuiTextキー
 * - ページ固有のupdateUIText/updateAllText内のロジック
 * - ページ固有のDOMContentLoadedロジック
 */
const fs = require('fs');
const path = require('path');

const pages = [
    'pages/agreements.html',
    'pages/browse.html',
    'pages/dashboard.html',
    'pages/editors/index.html',
    'pages/feedback/index.html',
    'pages/feedback/report.html',
    'pages/library.html',
    'pages/login.html',
    'pages/manga-translator.html',
    'pages/messages.html',
    'pages/my-works.html',
    'pages/novel-translator.html',
    'pages/reader.html',
    'pages/register-author.html',
    'pages/register-editor.html',
    'pages/register.html',
    'pages/support/contact.html',
    'pages/support/faq.html',
    'pages/support/tickets.html',
    'pages/support/troubleshoot.html',
    'pages/translators/index.html',
    'pages/translators/register.html',
    'pages/upload.html',
    'pages/work-detail.html',
];

// Navbar-only uiText keys that should be removed
const navbarKeys = [
    'translationTools', 'mangaTranslator', 'novelTranslator', 'translationStatus',
    'findTranslators', 'findEditors', 'contact', 'library', 'dashboard',
    'accountSettings', 'logout', 'logOutConfirm', 'myWorks', 'menuMyWorks',
    'navHome', 'navBrowse', 'navGenres', 'navUpload', 'navSupport',
    'supportFaq', 'supportTroubleshoot', 'supportTickets', 'supportContact',
    'navLogin', 'navGetStarted', 'navMessages', 'navTools', 'navFindEditors',
    'navLibrary', 'navDashboard', 'menuUploadWork', 'menuMangaTranslator',
    'menuNovelTranslator', 'menuTranslationStatus', 'menuFindTranslators',
    'menuFindEditors', 'menuFAQ', 'menuTroubleshooting', 'menuMessages',
    'messages', 'uploadWork',
];

// Code blocks to remove (navbar-specific event handlers)
const blocksToRemove = [
    // loadUserInfo calls
    /\n?\s*loadUserInfo\(\);?\s*\n/g,
    // Close user dropdown on outside click - full block
    /\s*\/\/\s*Close user dropdown.*?\n[\s\S]*?if \(dropdownMenu\).*?\.remove\('show'\);\s*\n\s*\}\s*\n\s*\}\);/g,
    // Mobile menu overlay - full block
    /\s*\/\/\s*Mobile menu overlay.*?\n[\s\S]*?navbarOverlay.*?addEventListener\('click'[\s\S]*?bsCollapse\.hide\(\);\s*\n\s*\}\);\s*\n\s*\}\s*\n/g,
    // Navbar collapse events
    /\s*const navbarCollapse = document\.getElementById\('navbarNav'\);\s*\n\s*const navbarOverlay = document\.getElementById\('navbarOverlay'\);[\s\S]*?navbarOverlay.*?classList\.remove\('show'\);\s*\n\s*\}\);\s*\n\s*\}/g,
];

let totalUpdated = 0;

pages.forEach(f => {
    const fp = path.join(__dirname, f);
    if (!fs.existsSync(fp)) { console.log('SKIP:', f); return; }
    let html = fs.readFileSync(fp, 'utf8');
    const orig = html;

    // 1. Remove navbar-only keys from uiText objects
    navbarKeys.forEach(key => {
        // Match: key: { en: '...', ja: '...', ... },
        // Handle both single-line and multi-line formats
        const singleLine = new RegExp('\\s*' + key + ':\\s*\\{[^}]+\\},?\\s*\\n', 'g');
        html = html.replace(singleLine, '\n');

        // Multi-line format (key spans multiple lines)
        const multiLine = new RegExp('\\s*' + key + ':\\s*\\{\\s*\\n[^}]+\\},?\\s*\\n', 'g');
        html = html.replace(multiLine, '\n');
    });

    // 2. Remove data-i18n mapping blocks in updateUIText
    html = html.replace(/\s*\/\/\s*data-i18n mapping.*?\n[\s\S]*?Object\.keys\(i18nMap\)[\s\S]*?\}\);/g, '');

    // 3. Remove nav element updates in updateUIText (navToolsPC, navMessagesMobile, etc.)
    const navIds = ['navToolsPC', 'navToolsMobile', 'navMessagesPC', 'navMessagesMobile',
        'navLibraryPC', 'navLibraryMobile', 'navBrowsePC', 'navBrowseMobile',
        'navDashboardPC', 'navDashboardMobile', 'navUploadPC', 'navUploadMobile',
        'navTranslationToolsPC', 'navTranslationToolsMobile', 'navMangaTranslatorPC',
        'navMangaTranslatorMobile', 'navNovelTranslatorPC', 'navNovelTranslatorMobile',
        'navTranslationStatusPC', 'navTranslationStatusMobile', 'navFindTranslatorsPC',
        'navFindTranslatorsMobile', 'navFindEditorsPC', 'navFindEditorsMobile',
        'navFaqPC', 'navFaqMobile', 'navSupportPC', 'navSupportMobile',
        'navUploadPC', 'navUploadMobile', 'navFindEditorsMobile',
        'menuMyWorks'];
    navIds.forEach(id => {
        html = html.replace(new RegExp('\\s*' + id + ':\\s*(?:navText|uiText)\\.[^,}]+[,]?\\s*\\n?', 'g'), '\n');
    });

    // 4. Remove language selector sync code blocks
    blocksToRemove.forEach(pattern => {
        html = html.replace(pattern, '\n');
    });

    // 5. Clean up empty updateUIText functions
    // If updateUIText body is essentially empty (only whitespace/comments), remove it
    html = html.replace(/function updateUIText\(\)\s*\{\s*\n\s*(\/\/[^\n]*)?\s*\n?\s*const els = \{\s*\n\s*\};\s*\n\s*Object\.keys\(els\)\.forEach[\s\S]*?\}\);\s*\n\s*\}/g,
        '// updateUIText removed - handled by i18n.js');

    if (html !== orig) {
        fs.writeFileSync(fp, html, 'utf8');
        const removed = orig.length - html.length;
        console.log('UPDATED:', f, '(', removed > 0 ? '-' + removed : '+' + Math.abs(removed), 'chars)');
        totalUpdated++;
    } else {
        console.log('NO CHANGE:', f);
    }
});

console.log('\nTotal updated:', totalUpdated);
