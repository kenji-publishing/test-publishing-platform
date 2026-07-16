/**
 * AI Tools payment + execution — paid orders for the AI editor and
 * AI translator wizards (pages/ai-editor.html, pages/novel-translator.html).
 *
 * Flow:
 *   1. POST /checkout            — store the manuscript + create a Stripe Checkout
 *                                  session (price computed SERVER-side; the client
 *                                  quote is display-only and never trusted)
 *   2. (user pays on Stripe)     — webhook marks the order 'paid'; the wizard also
 *                                  calls POST /orders/:id/confirm on return as a
 *                                  fallback so a delayed webhook can't block the job
 *   3. POST /orders/:id/run      — starts the Claude job for a paid order
 *   4. GET  /orders/:id/job      — poll progress; the finished text is ALSO saved to
 *                                  the order row, so a pm2 restart can't lose a paid result
 *
 * Samples (3-model comparison) stay free in routes/ai-editor.js & ai-translation.js.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { editText } = require('../services/aiEditorService');
const { translateText } = require('../services/aiTranslationService');
const { translateManga, sampleManga } = require('../services/aiMangaService');

// 30万字 = 長編小説1冊分をカバー（test4は約24万字）。チャンク処理なので長さ自体は問題なく、
// 上限はジョブ時間の暴走防止のため。それ以上は分割利用を案内する。
const MAX_CHARS = 300000;
const SUPPORTED_LANGS = ['en', 'ja', 'zh', 'es', 'fr', 'de', 'ko', 'ar', 'pt', 'it'];

// 不正なUUIDのパスは即404にする（DBの22P02エラー→500を防ぐ）
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('orderId', (req, res, next, value) => {
    if (!UUID_RE.test(value)) return res.status(404).json({ error: 'Order not found' });
    next();
});

// ===== Pricing (server-side source of truth) =====
// Must stay in sync with js/wizard-common.js (display) and the wizards' PRICING_JPY.
const PRICING_JPY = { haiku: 1, sonnet: 3, opus: 10 }; // per 1,000 chars
const MANGA_PRICING_JPY = { haiku: 3, sonnet: 8, opus: 20 }; // per page（manga-translator.htmlと同期）
const MANGA_MAX_PAGES = 200;
const CURRENCIES = {
    JPY: { rate: 1, decimals: 0 },
    USD: { rate: 0.0067, decimals: 2 },
    EUR: { rate: 0.0061, decimals: 2 },
    GBP: { rate: 0.0053, decimals: 2 },
    AUD: { rate: 0.0103, decimals: 2 },
    CAD: { rate: 0.0093, decimals: 2 },
    KRW: { rate: 9.17, decimals: 0 },
    BRL: { rate: 0.038, decimals: 2 }
};
const STRIPE_MINIMUMS = { JPY: 100, USD: 1.00, EUR: 1.00, GBP: 0.80, AUD: 1.50, CAD: 1.50, KRW: 1000, BRL: 5.00 };
const ZERO_DECIMAL = ['jpy', 'krw'];

function computeAmount({ chars, model, currency }) {
    const cur = CURRENCIES[currency];
    const rawJpy = Math.ceil(chars / 1000 * PRICING_JPY[model]);
    const converted = Number((rawJpy * cur.rate).toFixed(cur.decimals));
    return Math.max(converted, STRIPE_MINIMUMS[currency]);
}

// In-memory progress per order (the durable result lives in ai_tool_orders.result_text)
const jobs = new Map(); // orderId -> { status, progress }

const TOOL_PAGES = { editor: 'ai-editor.html', translator: 'novel-translator.html', manga: 'manga-translator.html' };
const TOOL_NAMES = { editor: 'AI Editing', translator: 'AI Translation', manga: 'Manga Translation' };

// ===== マンガページ画像のアップロード =====
// 15MBのリクエスト上限に収まるよう1枚ずつステージングし、checkout時に注文へ移動する
const MANGA_STAGING_DIR = path.join(__dirname, '..', 'uploads', 'manga-staging');
const MANGA_ORDERS_DIR = path.join(__dirname, '..', 'uploads', 'manga-orders');
fs.mkdirSync(MANGA_STAGING_DIR, { recursive: true });
fs.mkdirSync(MANGA_ORDERS_DIR, { recursive: true });

const mangaUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, MANGA_STAGING_DIR),
        filename: (req, file, cb) => {
            const ext = (path.extname(file.originalname).toLowerCase() || '.jpg').replace(/[^.a-z0-9]/g, '');
            cb(null, `${req.user.userId}_${crypto.randomBytes(8).toString('hex')}${ext}`);
        }
    }),
    limits: { fileSize: 12 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
    }
});

/** 古いステージングファイルの掃除（24時間超）— checkout時についでに実行 */
function cleanupStaging() {
    try {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        for (const f of fs.readdirSync(MANGA_STAGING_DIR)) {
            const p = path.join(MANGA_STAGING_DIR, f);
            try { if (fs.statSync(p).mtimeMs < cutoff) fs.unlinkSync(p); } catch (e) {}
        }
    } catch (e) {}
}

/** ステージングIDの検証: 自分がアップロードしたファイルのみ参照可能（パス注入防止） */
function resolveStagedFile(userId, stagedId) {
    if (typeof stagedId !== 'string' || !/^[\w.-]+$/.test(stagedId)) return null;
    if (!stagedId.startsWith(userId + '_')) return null;
    const p = path.join(MANGA_STAGING_DIR, stagedId);
    if (!p.startsWith(MANGA_STAGING_DIR)) return null;
    return fs.existsSync(p) ? p : null;
}

/**
 * POST /api/ai-tools/manga/stage
 * ページ画像を1枚ステージング（クライアントは縮小済みJPEGを順次送る）
 */
router.post('/manga/stage', authenticate, mangaUpload.single('page'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image file is required (jpeg/png/webp)' });
    res.json({ success: true, stagedId: req.file.filename, size: req.file.size });
});

/**
 * POST /api/ai-tools/manga/sample
 * 1ページ目を3品質で抽出+翻訳して比較（お試し・無料。運営API費がかかるため1日上限あり）
 */
const MANGA_SAMPLE_DAILY_LIMIT = 10;
const mangaSampleUsage = new Map(); // userId -> { day, count }
router.post('/manga/sample', authenticate, async (req, res) => {
    try {
        const { stagedId, sourceLang, targetLang } = req.body;
        if (!SUPPORTED_LANGS.includes(targetLang)) return res.status(400).json({ error: 'Unsupported target language' });
        const imagePath = resolveStagedFile(req.user.userId, stagedId);
        if (!imagePath) return res.status(400).json({ error: 'Staged page not found. Please upload pages first.' });

        const today = new Date().toISOString().slice(0, 10);
        let usage = mangaSampleUsage.get(req.user.userId);
        if (!usage || usage.day !== today) { usage = { day: today, count: 0 }; mangaSampleUsage.set(req.user.userId, usage); }
        if (usage.count >= MANGA_SAMPLE_DAILY_LIMIT) {
            return res.status(429).json({ error: 'Daily comparison limit reached. Please try again tomorrow.', code: 'SAMPLE_LIMIT' });
        }
        usage.count++;

        const samples = await sampleManga({ imagePath, sourceLang, targetLang });
        res.json({ success: true, samples });
    } catch (error) {
        console.error('Manga sample error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai-tools/manga/checkout
 * ステージング済みページで注文を作成し、Stripe Checkoutへ（金額はサーバー計算=ページ数×単価）
 */
router.post('/manga/checkout', authenticate, async (req, res) => {
    try {
        const { stagedIds, model, sourceLang, targetLang, glossary, currency } = req.body;
        if (!MANGA_PRICING_JPY[model]) return res.status(400).json({ error: 'Invalid model' });
        if (!CURRENCIES[currency]) return res.status(400).json({ error: 'Unsupported currency' });
        if (!SUPPORTED_LANGS.includes(targetLang)) return res.status(400).json({ error: 'Unsupported target language' });
        if (!Array.isArray(stagedIds) || stagedIds.length === 0) return res.status(400).json({ error: 'No pages uploaded' });
        if (stagedIds.length > MANGA_MAX_PAGES) {
            return res.status(400).json({ error: `Too many pages (max ${MANGA_MAX_PAGES} per order)` });
        }

        // 全ステージングファイルの存在＋所有を検証してから注文を作る
        const stagedPaths = [];
        for (const id of stagedIds) {
            const p = resolveStagedFile(req.user.userId, id);
            if (!p) return res.status(400).json({ error: `Staged page missing: upload again`, stagedId: String(id).slice(0, 40) });
            stagedPaths.push(p);
        }

        const pages = stagedPaths.length;
        const cur = CURRENCIES[currency];
        const rawJpy = pages * MANGA_PRICING_JPY[model];
        const amount = Math.max(Number((rawJpy * cur.rate).toFixed(cur.decimals)), STRIPE_MINIMUMS[currency]);

        const orderResult = await db.query(
            `INSERT INTO ai_tool_orders (user_id, tool, model, source_lang, target_lang, glossary, text_content, char_count, currency, amount, pages)
             VALUES ($1, 'manga', $2, $3, $4, $5, NULL, $6, $7, $8, $9)
             RETURNING order_id`,
            [req.user.userId, model, sourceLang || null, targetLang,
             JSON.stringify(Array.isArray(glossary) ? glossary.slice(0, 50) : []),
             pages, currency, amount, JSON.stringify([])]
        );
        const orderId = orderResult.rows[0].order_id;

        // ステージング→注文ディレクトリへ移動（ページ順を保持）
        const orderDir = path.join(MANGA_ORDERS_DIR, orderId);
        fs.mkdirSync(orderDir, { recursive: true });
        const pageFiles = [];
        stagedPaths.forEach((src, i) => {
            const ext = path.extname(src) || '.jpg';
            const dst = path.join(orderDir, `page_${String(i + 1).padStart(3, '0')}${ext}`);
            fs.renameSync(src, dst);
            pageFiles.push(path.basename(dst));
        });
        await db.query(`UPDATE ai_tool_orders SET pages = $2 WHERE order_id = $1`, [orderId, JSON.stringify(pageFiles)]);
        cleanupStaging();

        const modelLabel = model.charAt(0).toUpperCase() + model.slice(1);
        const unitAmount = ZERO_DECIMAL.includes(currency.toLowerCase()) ? Math.round(amount) : Math.round(amount * 100);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: `Manga Translation (${modelLabel})`,
                        description: `${pages} pages ${sourceLang || '?'}->${targetLang} — AuctLect AI tools`
                    },
                    unit_amount: unitAmount
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/pages/manga-translator.html?order=${orderId}&paid=1`,
            cancel_url: `${process.env.FRONTEND_URL}/pages/manga-translator.html?order=${orderId}&canceled=1`,
            metadata: { type: 'ai_tool', order_id: orderId, user_id: req.user.userId }
        });
        await db.query(
            `UPDATE ai_tool_orders SET stripe_session_id = $2, updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
            [orderId, session.id]
        );

        res.json({ success: true, orderId, url: session.url, amount, currency, pages });
    } catch (error) {
        console.error('Manga checkout error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai-tools/checkout
 * 原稿を保存し、サーバー計算の金額でStripe Checkoutセッションを作成
 */
router.post('/checkout', authenticate, async (req, res) => {
    try {
        const { tool, model, text, sourceLang, targetLang, glossary, currency } = req.body;
        if (!TOOL_PAGES[tool]) return res.status(400).json({ error: 'Invalid tool' });
        if (!PRICING_JPY[model]) return res.status(400).json({ error: 'Invalid model' });
        if (!text || !String(text).trim()) return res.status(400).json({ error: 'Text is required' });
        if (String(text).length > MAX_CHARS) {
            return res.status(400).json({ error: `Text is too long (max ${MAX_CHARS.toLocaleString()} characters)` });
        }
        if (!CURRENCIES[currency]) return res.status(400).json({ error: 'Unsupported currency' });
        if (tool === 'translator' && !SUPPORTED_LANGS.includes(targetLang)) {
            return res.status(400).json({ error: 'Unsupported target language' });
        }

        const chars = String(text).length;
        const amount = computeAmount({ chars, model, currency });

        const orderResult = await db.query(
            `INSERT INTO ai_tool_orders (user_id, tool, model, source_lang, target_lang, glossary, text_content, char_count, currency, amount)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING order_id`,
            [req.user.userId, tool, model, sourceLang || null, tool === 'translator' ? targetLang : null,
             JSON.stringify(Array.isArray(glossary) ? glossary.slice(0, 50) : []), String(text), chars, currency, amount]
        );
        const orderId = orderResult.rows[0].order_id;

        const modelLabel = model.charAt(0).toUpperCase() + model.slice(1);
        const langNote = tool === 'translator' ? ` ${sourceLang || '?'}->${targetLang}` : '';
        const unitAmount = ZERO_DECIMAL.includes(currency.toLowerCase())
            ? Math.round(amount)
            : Math.round(amount * 100);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: `${TOOL_NAMES[tool]} (${modelLabel})`,
                        description: `${chars.toLocaleString()} characters${langNote} — AuctLect AI tools`
                    },
                    unit_amount: unitAmount
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/pages/${TOOL_PAGES[tool]}?order=${orderId}&paid=1`,
            cancel_url: `${process.env.FRONTEND_URL}/pages/${TOOL_PAGES[tool]}?order=${orderId}&canceled=1`,
            metadata: { type: 'ai_tool', order_id: orderId, user_id: req.user.userId }
        });

        await db.query(
            `UPDATE ai_tool_orders SET stripe_session_id = $2, updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
            [orderId, session.id]
        );

        res.json({ success: true, orderId, url: session.url, amount, currency });
    } catch (error) {
        console.error('AI tool checkout error:', error);
        res.status(500).json({ error: error.message });
    }
});

/** 注文を取得（本人のみ）。所有チェック込みの共通ヘルパー */
async function getOwnOrder(req, res) {
    const result = await db.query(`SELECT * FROM ai_tool_orders WHERE order_id = $1`, [req.params.orderId]);
    const order = result.rows[0];
    if (!order || order.user_id !== req.user.userId) {
        res.status(404).json({ error: 'Order not found' });
        return null;
    }
    return order;
}

/**
 * GET /api/ai-tools/orders/:orderId
 * ウィザードが決済から戻った時の状態復元用
 */
router.get('/orders/:orderId', authenticate, async (req, res) => {
    try {
        const order = await getOwnOrder(req, res);
        if (!order) return;
        res.json({
            success: true,
            order: {
                orderId: order.order_id,
                tool: order.tool,
                model: order.model,
                sourceLang: order.source_lang,
                targetLang: order.target_lang,
                glossary: order.glossary || [],
                text: order.text_content,
                charCount: order.char_count,
                pageCount: Array.isArray(order.pages) ? order.pages.length : 0,
                currency: order.currency,
                amount: parseFloat(order.amount),
                status: order.status,
                result: order.status === 'completed' ? order.result_text : null
            }
        });
    } catch (error) {
        console.error('Get AI tool order error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai-tools/orders/:orderId/page/:pageNo
 * マンガ注文のページ画像を返す（本人のみ。決済後のレビュー画面用）
 */
router.get('/orders/:orderId/page/:pageNo', authenticate, async (req, res) => {
    try {
        const order = await getOwnOrder(req, res);
        if (!order) return;
        if (order.tool !== 'manga' || !Array.isArray(order.pages)) {
            return res.status(404).json({ error: 'Not a manga order' });
        }
        const idx = parseInt(req.params.pageNo, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= order.pages.length) {
            return res.status(404).json({ error: 'Page not found' });
        }
        const p = path.join(MANGA_ORDERS_DIR, order.order_id, order.pages[idx]);
        if (!fs.existsSync(p)) return res.status(404).json({ error: 'Page file missing' });
        res.sendFile(p);
    } catch (error) {
        console.error('Serve manga page error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai-tools/orders/:orderId/confirm
 * Stripeに支払い状態を直接確認して'paid'にする（Webhook遅延・不達のフォールバック）
 */
router.post('/orders/:orderId/confirm', authenticate, async (req, res) => {
    try {
        const order = await getOwnOrder(req, res);
        if (!order) return;
        if (order.status !== 'pending') return res.json({ success: true, status: order.status });
        if (!order.stripe_session_id) return res.status(400).json({ error: 'No payment session for this order' });

        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        if (session.payment_status === 'paid') {
            await db.query(
                `UPDATE ai_tool_orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP
                 WHERE order_id = $1 AND status = 'pending'`,
                [order.order_id]
            );
            return res.json({ success: true, status: 'paid' });
        }
        res.json({ success: true, status: 'pending' });
    } catch (error) {
        console.error('Confirm AI tool order error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai-tools/orders/:orderId/repay
 * 未払い注文のStripeセッションを作り直す（決済キャンセル後の再開。
 * マンガはページ画像がサーバー保存済みなので再アップロード不要）
 */
router.post('/orders/:orderId/repay', authenticate, async (req, res) => {
    try {
        const order = await getOwnOrder(req, res);
        if (!order) return;
        if (order.status !== 'pending') {
            return res.status(400).json({ error: `Order is already ${order.status}` });
        }
        const modelLabel = order.model.charAt(0).toUpperCase() + order.model.slice(1);
        const unitAmount = ZERO_DECIMAL.includes(order.currency.toLowerCase())
            ? Math.round(parseFloat(order.amount))
            : Math.round(parseFloat(order.amount) * 100);
        const desc = order.tool === 'manga'
            ? `${Array.isArray(order.pages) ? order.pages.length : order.char_count} pages ${order.source_lang || '?'}->${order.target_lang} — AuctLect AI tools`
            : `${Number(order.char_count).toLocaleString()} characters — AuctLect AI tools`;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: order.currency.toLowerCase(),
                    product_data: { name: `${TOOL_NAMES[order.tool]} (${modelLabel})`, description: desc },
                    unit_amount: unitAmount
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/pages/${TOOL_PAGES[order.tool]}?order=${order.order_id}&paid=1`,
            cancel_url: `${process.env.FRONTEND_URL}/pages/${TOOL_PAGES[order.tool]}?order=${order.order_id}&canceled=1`,
            metadata: { type: 'ai_tool', order_id: order.order_id, user_id: req.user.userId }
        });
        await db.query(
            `UPDATE ai_tool_orders SET stripe_session_id = $2, updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
            [order.order_id, session.id]
        );
        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error('Repay error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai-tools/orders/:orderId/run
 * 支払い済み注文のClaudeジョブを開始。完了時は結果をDBにも保存（再起動対策）
 */
router.post('/orders/:orderId/run', authenticate, async (req, res) => {
    try {
        const order = await getOwnOrder(req, res);
        if (!order) return;
        if (order.status === 'completed') return res.json({ success: true, status: 'completed' });
        if (order.status === 'pending' || order.status === 'canceled') {
            return res.status(402).json({ error: 'Payment has not been completed for this order', code: 'NOT_PAID' });
        }
        const existing = jobs.get(order.order_id);
        if (order.status === 'processing' && existing && existing.status === 'processing') {
            return res.json({ success: true, status: 'processing' }); // 二重起動防止
        }

        await db.query(
            `UPDATE ai_tool_orders SET status = 'processing', error = NULL, updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
            [order.order_id]
        );
        const job = { status: 'processing', progress: 0 };
        jobs.set(order.order_id, job);

        const params = {
            text: order.text_content,
            tier: order.model,
            glossary: order.glossary || [],
            onProgress: (pct) => { job.progress = pct; },
            // 前回失敗時の完了済みチャンクから再開（API費の二重払い・再待機を防ぐ）
            completedChunks: Array.isArray(order.partial_chunks) ? order.partial_chunks : [],
            // チャンク完了ごとに途中経過をDBへ保存（失敗・再起動しても続きから再開できる）
            onChunkDone: async (idx, chunksSoFar) => {
                await db.query(
                    `UPDATE ai_tool_orders SET partial_chunks = $2, updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
                    [order.order_id, JSON.stringify(chunksSoFar)]
                ).catch((e) => console.error(`Partial save failed for ${order.order_id}:`, e.message));
            }
        };
        let runPromise;
        if (order.tool === 'manga') {
            const orderDir = path.join(MANGA_ORDERS_DIR, order.order_id);
            const pagePaths = (Array.isArray(order.pages) ? order.pages : []).map(f => path.join(orderDir, f));
            // 進捗の詳細（ページ番号・混雑リトライ中）をポーリング応答に載せる
            params.onStatus = (s) => {
                job.detail = s.retrying
                    ? `ページ ${s.page}/${s.total} — ${s.overloaded ? 'AIが混雑中のため待機しています' : 'エラーのため再試行中'}（${s.attempt}/${s.attempts}回目） / Page ${s.page}/${s.total} — retrying`
                    : `ページ ${s.page}/${s.total} を翻訳中 / Translating page ${s.page}/${s.total}`;
            };
            runPromise = translateManga({ ...params, pagePaths, sourceLang: order.source_lang, targetLang: order.target_lang });
        } else if (order.tool === 'translator') {
            runPromise = translateText({ ...params, sourceLang: order.source_lang, targetLang: order.target_lang });
        } else {
            runPromise = editText({ ...params, language: order.source_lang });
        }

        runPromise.then(async (resultText) => {
            job.status = 'completed';
            job.progress = 100;
            await db.query(
                `UPDATE ai_tool_orders SET status = 'completed', result_text = $2, partial_chunks = NULL, updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
                [order.order_id, resultText]
            );
        }).catch(async (error) => {
            console.error(`AI tool order ${order.order_id} failed:`, error);
            job.status = 'failed';
            job.error = error.message;
            // 支払い済みなので'paid'に戻して再実行できるようにする
            await db.query(
                `UPDATE ai_tool_orders SET status = 'paid', error = $2, updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
                [order.order_id, error.message]
            ).catch(() => {});
        });

        res.json({ success: true, status: 'processing' });
    } catch (error) {
        console.error('Run AI tool order error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai-tools/orders/:orderId/job
 * 進捗ポーリング。メモリのジョブが無ければDBの状態から復元
 */
router.get('/orders/:orderId/job', authenticate, async (req, res) => {
    try {
        const order = await getOwnOrder(req, res);
        if (!order) return;

        if (order.status === 'completed') {
            return res.json({ success: true, status: 'completed', progress: 100, result: order.result_text });
        }
        const job = jobs.get(order.order_id);
        if (job) {
            return res.json({
                success: true,
                status: job.status,
                progress: job.progress,
                detail: job.detail || null,
                result: null,
                error: job.error || order.error || null
            });
        }
        // メモリにジョブが無い: 再起動でジョブが失われた等 → クライアントは/runを再実行
        if (order.status === 'processing') {
            await db.query(
                `UPDATE ai_tool_orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
                [order.order_id]
            );
        }
        res.json({ success: true, status: 'idle', progress: 0, result: null, error: order.error || null });
    } catch (error) {
        console.error('AI tool job poll error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
