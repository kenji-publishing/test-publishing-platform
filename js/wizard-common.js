/**
 * AuctLect Platform - Shared wizard pricing helpers
 *
 * Single source of truth for the demo currency table, the platform payment
 * minimums, and the currency conversion / formatting / minimum-charge logic
 * shared by the manga-translator, novel-translator and ai-editor wizards.
 *
 * The three wizards previously each carried byte-identical copies of this
 * code. They now keep thin local wrappers (same names/signatures) that pass
 * the page's selectedCurrency / selectedPayMethod into these functions, so no
 * call sites changed.
 *
 * NOTE: per-model pricing (PRICING_JPY) is intentionally NOT centralized here
 * — it differs per wizard (manga = per page, novel/ai-editor = per 1k chars).
 */
(function (global) {
    // symbol, approximate rate from JPY, decimal places
    var CURRENCIES = {
        JPY: { symbol: '¥', rate: 1,      decimals: 0, name: 'JPY' },
        USD: { symbol: '$',      rate: 0.0067, decimals: 2, name: 'USD' },
        EUR: { symbol: '€', rate: 0.0061, decimals: 2, name: 'EUR' },
        GBP: { symbol: '£', rate: 0.0053, decimals: 2, name: 'GBP' },
        AUD: { symbol: 'A$',     rate: 0.0103, decimals: 2, name: 'AUD' },
        CAD: { symbol: 'C$',     rate: 0.0093, decimals: 2, name: 'CAD' },
        KRW: { symbol: '₩', rate: 9.17,   decimals: 0, name: 'KRW' },
        BRL: { symbol: 'R$',     rate: 0.038,  decimals: 2, name: 'BRL' }
    };

    // Minimum charge per payment method per currency (platform minimums, covering fees)
    var PAY_MINIMUMS = {
        stripe: { JPY: 100, USD: 1.00, EUR: 1.00, GBP: 0.80, AUD: 1.50, CAD: 1.50, KRW: 1000, BRL: 5.00 },
        paypal: { JPY: 150, USD: 1.50, EUR: 1.50, GBP: 1.20, AUD: 2.00, CAD: 2.00, KRW: 1500, BRL: 7.00 }
    };

    function toSelectedCurrency(jpyAmount, currencyCode) {
        var cur = CURRENCIES[currencyCode];
        return Number((jpyAmount * cur.rate).toFixed(cur.decimals));
    }

    function formatPrice(amount, currencyCode) {
        var cur = CURRENCIES[currencyCode];
        var formatted = cur.decimals === 0 ? Math.round(amount).toLocaleString() : amount.toFixed(cur.decimals);
        return cur.symbol + formatted;
    }

    function getMinimum(currencyCode, payMethod) {
        return PAY_MINIMUMS[payMethod][currencyCode] || PAY_MINIMUMS[payMethod]['USD'];
    }

    // ===== ファイル変換ヘルパー（Word/PDF対応。upload.htmlとウィザードで共用） =====
    // 変換ライブラリはCDNから必要になった時だけ読み込む（普段のページ表示を重くしない）
    var scriptPromises = {};
    function loadScriptOnce(src, isReady) {
        if (isReady()) return Promise.resolve();
        if (scriptPromises[src]) return scriptPromises[src];
        scriptPromises[src] = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = function () {
                if (isReady()) resolve();
                else reject(new Error('Library loaded but unavailable: ' + src));
            };
            s.onerror = function () {
                delete scriptPromises[src];
                reject(new Error('Failed to load library (check your connection): ' + src));
            };
            document.head.appendChild(s);
        });
        return scriptPromises[src];
    }

    // Word (.docx) → プレーンテキスト（段落は空行区切り）。旧.doc形式は非対応
    function docxToText(file) {
        return loadScriptOnce(
            'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js',
            function () { return !!global.mammoth; }
        ).then(function () {
            return file.arrayBuffer();
        }).then(function (buf) {
            return global.mammoth.extractRawText({ arrayBuffer: buf });
        }).then(function (result) {
            return ((result && result.value) || '').trim();
        });
    }

    // PDF → 各ページをJPEG画像のFileに変換（幅ターゲット1600px、拡大は3倍まで）
    // onProgress(done, total) で進捗を通知。戻り値は File[]（<basename>_p001.jpg 形式）
    var PDFJS_VER = '3.11.174';
    function pdfToImageFiles(file, onProgress) {
        return loadScriptOnce(
            'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VER + '/build/pdf.min.js',
            function () { return !!global.pdfjsLib; }
        ).then(function () {
            global.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VER + '/build/pdf.worker.min.js';
            return file.arrayBuffer();
        }).then(function (buf) {
            // cMap=日本語等のCID フォント用 / standardFontData=Helvetica等の標準フォント用。
            // これらが無いとフォントを使うPDFのレンダリングが失敗・停止することがある
            return global.pdfjsLib.getDocument({
                data: buf,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VER + '/cmaps/',
                cMapPacked: true,
                standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VER + '/standard_fonts/'
            }).promise;
        }).then(function (doc) {
            var base = file.name.replace(/\.pdf$/i, '');
            var files = [];
            var chain = Promise.resolve();
            for (var p = 1; p <= doc.numPages; p++) {
                (function (pageNo) {
                    chain = chain.then(function () {
                        return doc.getPage(pageNo);
                    }).then(function (page) {
                        var vp1 = page.getViewport({ scale: 1 });
                        var scale = Math.min(1600 / vp1.width, 3);
                        var vp = page.getViewport({ scale: scale });
                        var canvas = document.createElement('canvas');
                        canvas.width = Math.round(vp.width);
                        canvas.height = Math.round(vp.height);
                        var ctx = canvas.getContext('2d');
                        // intent:'print' はrequestAnimationFrameを使わない描画モード。
                        // バックグラウンドタブ（rAFが止まる）でも変換が停止しない
                        return page.render({ canvasContext: ctx, viewport: vp, intent: 'print' }).promise.then(function () {
                            return new Promise(function (res, rej) {
                                canvas.toBlob(function (b) {
                                    if (!b) return rej(new Error('PDF page render failed'));
                                    var pad = String(pageNo);
                                    while (pad.length < 3) pad = '0' + pad;
                                    files.push(new File([b], base + '_p' + pad + '.jpg', { type: 'image/jpeg' }));
                                    if (onProgress) onProgress(pageNo, doc.numPages);
                                    res();
                                }, 'image/jpeg', 0.85);
                            });
                        });
                    });
                })(p);
            }
            return chain.then(function () { return files; });
        });
    }

    global.WizardCommon = {
        CURRENCIES: CURRENCIES,
        PAY_MINIMUMS: PAY_MINIMUMS,
        toSelectedCurrency: toSelectedCurrency,
        formatPrice: formatPrice,
        getMinimum: getMinimum,
        docxToText: docxToText,
        pdfToImageFiles: pdfToImageFiles
    };
})(window);
