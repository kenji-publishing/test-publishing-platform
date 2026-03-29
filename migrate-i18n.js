/**
 * Phase C 完全移行スクリプト
 * 1. language-switcher.js の参照を削除
 * 2. translations-base.js の参照を削除
 * 3. header-notification.js の参照を削除（残り）
 * 4. 古い changeLanguage 関連コードを削除
 * 5. 古い syncLanguageSelectors を削除
 * 6. setTimeout(updateUIText, ...) を削除
 * 7. LanguageSwitcher.changeLanguage 呼び出しを削除
 */
const fs = require('fs');
const path = require('path');
const BASE = __dirname;

function getFiles(dir, ext) {
    let results = [];
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const full = path.join(dir, item.name);
            if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'backend') {
                results = results.concat(getFiles(full, ext));
            } else if (item.isFile() && item.name.endsWith(ext)) {
                results.push(full);
            }
        }
    } catch(e) {}
    return results;
}

const files = getFiles(BASE, '.html');
let updated = 0;

files.forEach(fp => {
    let html = fs.readFileSync(fp, 'utf8');
    const orig = html;

    // 1. Remove language-switcher.js script tags
    html = html.replace(/\s*<script src="[^"]*language-switcher\.js"><\/script>/g, '');

    // 2. Remove translations-base.js script tags
    html = html.replace(/\s*<script src="[^"]*translations-base\.js"><\/script>/g, '');

    // 3. Remove header-notification.js script tags (any remaining)
    html = html.replace(/\s*<script src="[^"]*header-notification\.js"><\/script>/g, '');

    // 4. Remove duplicate navbar.js loads (keep only the first one)
    let navbarCount = 0;
    html = html.replace(/<script src="[^"]*navbar\.js"><\/script>/g, (match) => {
        navbarCount++;
        if (navbarCount > 1) return ''; // remove duplicates
        return match;
    });

    // 5. Remove setTimeout(updateUIText, ...) lines
    html = html.replace(/\s*setTimeout\(updateUIText,\s*\d+\);?\s*/g, '\n');

    // 6. Remove setTimeout(updateAllText, ...) lines
    html = html.replace(/\s*setTimeout\(updateAllText,\s*\d+\);?\s*/g, '\n');

    // 7. Remove LanguageSwitcher.changeLanguage calls
    html = html.replace(/\s*(?:if\s*\(typeof\s*)?LanguageSwitcher[\s\S]*?changeLanguage\([^)]*\);?\s*/g, '\n');

    if (html !== orig) {
        fs.writeFileSync(fp, html, 'utf8');
        const rel = path.relative(BASE, fp);
        console.log('UPDATED:', rel);
        updated++;
    }
});

console.log('\nTotal updated:', updated);
