/**
 * AuctLect Platform - Translations Loader
 * 翻訳システムローダー
 * 
 * このファイルは全ての言語ファイルを順番に読み込みます。
 * HTMLではこのファイル1つを読み込むだけでOKです。
 * 
 * 使用方法:
 * <script src="js/translations-loader.js"></script>
 * <script src="js/language-switcher.js"></script>
 */

(function() {
    'use strict';
    
    // 言語ファイルのリスト（読み込む順序）
    const languageFiles = [
        'js/lang/ja.js',
        'js/lang/en.js',
        'js/lang/zh.js',
        'js/lang/es.js',
        'js/lang/fr.js',
        'js/lang/de.js',
        'js/lang/ko.js',
        'js/lang/ar.js',
        'js/lang/pt.js',
        'js/lang/translations-base.js'
    ];
    
    // ベースパスを検出（HTMLファイルの場所に応じて調整）
    function getBasePath() {
        // 現在のスクリプトのパスから判断
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src.includes('translations-loader.js')) {
                // このスクリプトのパスからベースパスを計算
                const path = src.replace('translations-loader.js', '');
                // jsフォルダにいる場合は親に戻る
                if (path.endsWith('/js/') || path.endsWith('\\js\\')) {
                    return path.replace(/js[\/\\]$/, '');
                }
                return path;
            }
        }
        // フォールバック: 相対パスで試す
        return '';
    }
    
    // スクリプトを同期的に読み込む（document.write使用）
    const basePath = getBasePath();
    
    languageFiles.forEach(function(file) {
        const fullPath = basePath + file;
        document.write('<script src="' + fullPath + '"><\/script>');
    });
    
    console.log('[translations-loader.js] Loading ' + languageFiles.length + ' translation files...');
})();
