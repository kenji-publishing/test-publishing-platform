/**
 * lang-content パターンのページから古いナビバーコードを削除し、
 * showLanguageContent + languageChanged リスナーを追加するスクリプト
 */
const fs = require('fs');
const path = require('path');

const pages = [
    'pages/confirm-delete.html',
    'pages/content-guidelines.html',
    'pages/copyright-policy.html',
    'pages/revenue-sharing.html',
];

const newScript = `    <script>
        // ========== Page-specific: Language Content Switcher ==========
        function showLanguageContent(lang) {
            document.querySelectorAll('.lang-content').forEach(function(el) { el.classList.remove('active'); });
            var target = document.querySelector('.lang-content[data-lang="' + lang + '"]');
            if (target) { target.classList.add('active'); }
            else { var en = document.querySelector('.lang-content[data-lang="en"]'); if (en) en.classList.add('active'); }
            if (lang === 'ar') { document.body.setAttribute('dir', 'rtl'); } else { document.body.removeAttribute('dir'); }
        }
        document.addEventListener('DOMContentLoaded', function() {
            var lang = localStorage.getItem('preferredLanguage') || 'en';
            showLanguageContent(lang);
        });
        document.addEventListener('languageChanged', function(e) {
            var lang = (e.detail && e.detail.language) ? e.detail.language : (localStorage.getItem('preferredLanguage') || 'en');
            showLanguageContent(lang);
        });
    </script>`;

pages.forEach(f => {
    const fp = path.join(__dirname, f);
    if (!fs.existsSync(fp)) { console.log('SKIP (not found):', f); return; }
    let html = fs.readFileSync(fp, 'utf8');
    const orig = html;

    // Strategy: Find navbar.js script tag, then replace everything from
    // the NEXT <script> tag to </body> with our clean script + </body></html>

    const navbarJsIdx = html.indexOf('<script src="../js/navbar.js"></script>');
    if (navbarJsIdx < 0) { console.log('SKIP (no navbar.js):', f); return; }

    const afterNavbarJs = navbarJsIdx + '<script src="../js/navbar.js"></script>'.length;
    const bodyEndIdx = html.lastIndexOf('</body>');

    if (bodyEndIdx < 0) { console.log('SKIP (no </body>):', f); return; }

    // Check if showLanguageContent already exists (already migrated)
    const existingBlock = html.substring(afterNavbarJs, bodyEndIdx);

    // Keep everything before the old scripts, add new clean script
    html = html.substring(0, afterNavbarJs) + '\n' + newScript + '\n</body>\n</html>';

    if (html !== orig) {
        fs.writeFileSync(fp, html, 'utf8');
        console.log('UPDATED:', f, '(removed', orig.length - html.length, 'chars)');
    } else {
        console.log('NO CHANGE:', f);
    }
});
