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

    // Minimum charge per currency (platform minimum, covering payment fees).
    // 決済は全てStripe Checkout経由（PayPal等もStripeが提供）なので単一の表
    var PAY_MINIMUMS = {
        stripe: { JPY: 100, USD: 1.00, EUR: 1.00, GBP: 0.80, AUD: 1.50, CAD: 1.50, KRW: 1000, BRL: 5.00 }
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
        var table = PAY_MINIMUMS[payMethod] || PAY_MINIMUMS.stripe;
        return table[currencyCode] || table['USD'];
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

    // Word (.docx) → リッチ抽出: 本文テキスト + 挿絵画像 + 表
    // 戻り値: { parts: string[], images: [{blob, name}] }
    //   parts の中身は 1行 = 1ブロック。挿絵の位置には '[[img:PENDING:<n>]]'、
    //   表は '[[table]]' 〜 セル行(' | '区切り) 〜 '[[/table]]' のマーカーで表す。
    //   （リーダー側 pages/reader.html の parseBlocks がこのマーカーを解釈する）
    function docxToRich(file) {
        return loadScriptOnce(
            'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js',
            function () { return !!global.mammoth; }
        ).then(function () {
            return file.arrayBuffer();
        }).then(function (buf) {
            // convertToHtml は画像をdata URIとして本文中の位置に埋め込む
            return global.mammoth.convertToHtml({ arrayBuffer: buf });
        }).then(function (result) {
            var doc = new DOMParser().parseFromString('<div id="r">' + (result.value || '') + '</div>', 'text/html');
            var root = doc.getElementById('r');
            var parts = [];
            var images = [];

            function dataUriToBlob(src) {
                var m = /^data:([^;,]+);base64,(.*)$/.exec(src);
                if (!m) return null;
                var bin = atob(m[2]);
                var bytes = new Uint8Array(bin.length);
                for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return new Blob([bytes], { type: m[1] });
            }

            function extToName(type, idx) {
                var ext = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' })[type] || '.png';
                return 'illustration_' + (idx + 1) + ext;
            }

            function registerImgs(el) {
                // 要素内の画像をすべて挿絵として登録し、マーカーを返す
                var markers = [];
                el.querySelectorAll('img').forEach(function (img) {
                    var blob = dataUriToBlob(img.getAttribute('src') || '');
                    if (!blob) return;
                    images.push({ blob: blob, name: extToName(blob.type, images.length) });
                    markers.push('[[img:PENDING:' + (images.length - 1) + ']]');
                });
                return markers;
            }

            Array.prototype.forEach.call(root.children, function (el) {
                var tag = el.tagName;
                if (tag === 'TABLE') {
                    var rows = [];
                    el.querySelectorAll('tr').forEach(function (tr) {
                        var cells = [];
                        tr.querySelectorAll('th,td').forEach(function (td) {
                            cells.push((td.textContent || '').trim().replace(/\s*\n\s*/g, ' '));
                        });
                        if (cells.length) rows.push(cells.join(' | '));
                    });
                    if (rows.length) {
                        parts.push('[[table]]');
                        rows.forEach(function (r) { parts.push(r); });
                        parts.push('[[/table]]');
                    }
                    return;
                }
                if (tag === 'UL' || tag === 'OL') {
                    el.querySelectorAll('li').forEach(function (li) {
                        var t = (li.textContent || '').trim();
                        if (t) parts.push('・' + t);
                    });
                    registerImgs(el).forEach(function (mk) { parts.push(mk); });
                    return;
                }
                // 段落・見出しなど: テキスト → その後に段落内の挿絵
                var markers = registerImgs(el);
                var text = (el.textContent || '').trim();
                if (text) parts.push(text);
                markers.forEach(function (mk) { parts.push(mk); });
            });

            return { parts: parts, images: images };
        });
    }

    // ===== プレーンテキスト → Word (.docx) =====
    // 1行=1段落として最小構成の.docx（中身はZIP）をブラウザ内で組み立てる。
    // 外部の変換サービスには一切送らない。JSZipは必要になった時だけ読み込む。
    function escapeXml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var DOCX_CONTENT_TYPES =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>';

    var DOCX_RELS =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>';

    function textToDocxBlob(text) {
        return loadScriptOnce(
            'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
            function () { return !!global.JSZip; }
        ).then(function () {
            // XMLに入れられない制御文字が1つでも混ざるとWordが「開けません」になるので落とす
            var clean = String(text == null ? '' : text).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
            var body = clean.split(/\r\n|\r|\n/).map(function (line) {
                if (!line) return '<w:p/>';   // 空行はそのまま空の段落に
                return '<w:p><w:r><w:t xml:space="preserve">' + escapeXml(line) + '</w:t></w:r></w:p>';
            }).join('');

            var documentXml =
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
                '<w:body>' + body +
                '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +   // A4縦
                '<w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418"/></w:sectPr>' +
                '</w:body></w:document>';

            var zip = new global.JSZip();
            zip.file('[Content_Types].xml', DOCX_CONTENT_TYPES);
            zip.folder('_rels').file('.rels', DOCX_RELS);
            zip.folder('word').file('document.xml', documentXml);
            return zip.generateAsync({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                compression: 'DEFLATE'
            });
        });
    }

    // ===== 残り時間の表示 =====
    // 「残り3000秒」では長さが掴めないので、時間・分・秒に直す。
    // 30秒未満は数字が細かく動いても意味がないので「まもなく完了」にまとめる。
    function formatRemaining(totalSeconds, lang) {
        var ja = lang === 'ja';
        var s = Math.max(0, Math.round(totalSeconds));
        if (s < 30) return ja ? 'まもなく完了します' : 'almost done';

        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var sec = s % 60;

        // 0の単位は出さない（「1時間0分」ではなく「1時間」）。
        // 1時間以上あるときの秒数は誤差の範囲なので省く
        var parts = [];
        if (h > 0) {
            parts.push(ja ? h + '時間' : h + 'h');
            if (m > 0) parts.push(ja ? m + '分' : m + 'm');
        } else if (m > 0) {
            parts.push(ja ? m + '分' : m + 'm');
            if (sec > 0) parts.push(ja ? sec + '秒' : sec + 's');
        } else {
            parts.push(ja ? sec + '秒' : sec + 's');
        }

        return ja ? '残り約' + parts.join('') : '~' + parts.join(' ') + ' remaining';
    }

    // Blobを名前付きでダウンロードさせる（ウィザード共通）
    function saveBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Safariはclick直後にrevokeするとダウンロードが始まらないことがある
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    global.WizardCommon = {
        CURRENCIES: CURRENCIES,
        PAY_MINIMUMS: PAY_MINIMUMS,
        toSelectedCurrency: toSelectedCurrency,
        formatPrice: formatPrice,
        getMinimum: getMinimum,
        docxToText: docxToText,
        docxToRich: docxToRich,
        pdfToImageFiles: pdfToImageFiles,
        textToDocxBlob: textToDocxBlob,
        saveBlob: saveBlob,
        formatRemaining: formatRemaining
    };
})(window);
