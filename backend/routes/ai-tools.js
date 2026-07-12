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
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { editText } = require('../services/aiEditorService');
const { translateText } = require('../services/aiTranslationService');

// 30万字 = 長編小説1冊分をカバー（test4は約24万字）。チャンク処理なので長さ自体は問題なく、
// 上限はジョブ時間の暴走防止のため。それ以上は分割利用を案内する。
const MAX_CHARS = 300000;
const SUPPORTED_LANGS = ['en', 'ja', 'zh', 'es', 'fr', 'de', 'ko', 'ar', 'pt', 'it'];

// ===== Pricing (server-side source of truth) =====
// Must stay in sync with js/wizard-common.js (display) and the wizards' PRICING_JPY.
const PRICING_JPY = { haiku: 1, sonnet: 3, opus: 10 }; // per 1,000 chars
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

const TOOL_PAGES = { editor: 'ai-editor.html', translator: 'novel-translator.html' };
const TOOL_NAMES = { editor: 'AI Editing', translator: 'AI Translation' };

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
            onProgress: (pct) => { job.progress = pct; }
        };
        const runPromise = order.tool === 'translator'
            ? translateText({ ...params, sourceLang: order.source_lang, targetLang: order.target_lang })
            : editText({ ...params, language: order.source_lang });

        runPromise.then(async (resultText) => {
            job.status = 'completed';
            job.progress = 100;
            await db.query(
                `UPDATE ai_tool_orders SET status = 'completed', result_text = $2, updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
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
