/**
 * Payment Routes
 * Handles Stripe and PayPal payment processing
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Stripe initialization
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Revenue distribution: derived per work from work_collaborators
// (platform 30% fixed, translator 20 / editor 10 when attached,
// author gets the remainder). See services/revenueSplitService.js.
const { createRevenueSplits } = require('../services/revenueSplitService');
const { createNotification } = require('../services/notificationService');

/**
 * 全額返金の反映（charge.refundedから呼ばれる）
 * - 作品購入: purchasesをrefundedに（読者アクセスは自動で失効）、返金トランザクション記録、
 *   収益分配を打ち消すマイナス行を挿入（収益集計が自動で正しくなる。履歴は残る=監査可能）
 * - AIツール注文: 未完了ならcanceledに（完了済みは成果物提供済みの好意返金なので記録のみ）
 * 冪等: 同じイベントの再送では二重処理しない
 */
async function applyStripeRefund(sessionId) {
  // --- 作品購入の返金 ---
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // completedのときだけrefundedへ（再送時はここが0件になり二重処理を防ぐ）
    const purchase = (await client.query(
      `UPDATE purchases SET payment_status = 'refunded'
       WHERE transaction_id = $1 AND payment_status = 'completed'
       RETURNING user_id, work_id, amount, currency`,
      [sessionId]
    )).rows[0];

    if (purchase) {
      await client.query(
        `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status)
         VALUES ($1, $2, 'refund', $3, $4, 'stripe', $5, 'completed')`,
        [purchase.user_id, purchase.work_id, purchase.amount, purchase.currency, sessionId]
      );
      // 元の分配を打ち消すマイナス行（SUMベースの収益表示・出金計算が自動で補正される）
      await client.query(
        `INSERT INTO revenue_splits (work_id, recipient_id, role, amount, currency, transaction_reference, status)
         SELECT work_id, recipient_id, role, -amount, currency, transaction_reference || ':refund', 'completed'
         FROM revenue_splits
         WHERE transaction_reference = $1 AND amount > 0`,
        [sessionId]
      );
      await client.query('COMMIT');
      console.log(`Refund applied: session=${sessionId}, work=${purchase.work_id}, buyer=${purchase.user_id}, amount=${purchase.amount} ${purchase.currency}`);

      // 購入者へ通知（非致死）
      try {
        await createNotification({
          userId: purchase.user_id,
          type: 'system',
          title: '返金が完了しました / Refund completed',
          message: `ご購入いただいた作品の返金（${purchase.amount} ${purchase.currency}）が完了しました。この作品はライブラリから読めなくなります。 / Your refund (${purchase.amount} ${purchase.currency}) has been processed. The work is no longer available in your library.`,
          actionUrl: '/pages/library.html'
        });
      } catch (e) { console.error('Refund notification failed:', e.message); }
      return { kind: 'purchase' };
    }
    await client.query('ROLLBACK');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // --- AIツール注文の返金 ---
  const order = (await db.query(
    `SELECT order_id, status FROM ai_tool_orders WHERE stripe_session_id = $1`,
    [sessionId]
  )).rows[0];
  if (order) {
    if (order.status !== 'completed' && order.status !== 'canceled') {
      await db.query(
        `UPDATE ai_tool_orders SET status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
        [order.order_id]
      );
      console.log(`Refund applied: AI tool order ${order.order_id} canceled (session=${sessionId})`);
    } else {
      console.log(`Refund noted: AI tool order ${order.order_id} already ${order.status} (session=${sessionId})`);
    }
    return { kind: 'ai_tool' };
  }

  console.warn(`Refund received but no matching purchase/order for session=${sessionId}`);
  return { kind: 'none' };
}

/**
 * POST /api/payments/create-checkout-session
 * Create a Stripe checkout session for purchasing a work
 */
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    const { workId } = req.body;
    
    const workResult = await db.query(
      `SELECT w.*, u.pen_name as author_name
       FROM works w
       JOIN users u ON w.author_id = u.user_id
       WHERE w.work_id = $1 AND w.status = 'published'`,
      [workId]
    );
    
    if (workResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    const work = workResult.rows[0];
    
    if (work.is_free) {
      return res.status(400).json({ error: 'This work is free' });
    }
    
    // Zero-decimal currencies (JPY, KRW) use the base unit directly in Stripe
    const ZERO_DECIMAL = ['jpy', 'krw'];
    const currency = (work.currency || 'USD').toLowerCase();
    const unitAmount = ZERO_DECIMAL.includes(currency)
      ? Math.round(work.price)
      : Math.round(work.price * 100);

    // payment_method_typesは指定しない: Stripeダッシュボードで有効化した決済手段
    // （カード/Apple Pay/Google Pay/PayPal等）が通貨に応じて自動表示される
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: work.title,
              description: work.description || 'Digital content from AuctLect',
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pages/payment-success.html?session_id={CHECKOUT_SESSION_ID}&work_id=${workId}&title=${encodeURIComponent(work.title)}&amount=${work.price}&currency=${work.currency || 'USD'}`,
      cancel_url: `${process.env.FRONTEND_URL}/pages/payment-cancel.html`,
      metadata: {
        work_id: workId,
        buyer_id: req.user.userId,
        author_id: work.author_id
      }
    });
    
    res.json({ sessionId: session.id, url: session.url });
    
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments/earnings
 * Get creator's earnings
 */
router.get('/earnings', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_earnings
       FROM revenue_splits
       WHERE recipient_id = $1 AND role != 'platform'`,
      [req.user.userId]
    );
    
    res.json({ earnings: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events (payment confirmation, etc.)
 * NOTE: This route must receive the raw body for signature verification.
 *       In server.js, apply express.raw() middleware for this route.
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // 返金（Stripeダッシュボード等から返金した時に飛んでくる）
  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    try {
      // v1は全額返金のみ反映（部分返金は記録だけ残して手動対応）
      if (!charge.refunded) {
        console.warn(`Partial refund received (charge=${charge.id}, refunded=${charge.amount_refunded}/${charge.amount}) — not auto-processed`);
        return res.json({ received: true });
      }
      // chargeにはセッションIDが無いため、payment_intentから該当のCheckoutセッションを引く
      let sessionId = charge.metadata && charge.metadata.session_id; // テスト用の直接指定も許容
      if (!sessionId && charge.payment_intent) {
        const sessions = await stripe.checkout.sessions.list({ payment_intent: charge.payment_intent, limit: 1 });
        if (sessions.data.length > 0) sessionId = sessions.data[0].id;
      }
      if (!sessionId) {
        console.warn(`charge.refunded: no checkout session found for charge=${charge.id}`);
        return res.json({ received: true });
      }
      await applyStripeRefund(sessionId);
    } catch (error) {
      console.error('Error processing refund webhook:', error);
    }
    return res.json({ received: true });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // AIツール注文（AIエディタ/AI翻訳）: 注文をpaidにするだけ（分配なし・全額プラットフォーム収入）
    if (session.metadata && session.metadata.type === 'ai_tool') {
      try {
        await db.query(
          `UPDATE ai_tool_orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $1 AND status = 'pending'`,
          [session.metadata.order_id]
        );
        console.log(`AI tool order paid: ${session.metadata.order_id} (${session.amount_total} ${session.currency})`);
      } catch (error) {
        console.error('Error marking AI tool order paid:', error);
      }
      return res.json({ received: true });
    }

    const { work_id, buyer_id, author_id } = session.metadata;
    // Zero-decimal currencies (JPY, KRW): amount_total is already the base unit
    const ZERO_DECIMAL = ['jpy', 'krw'];
    const amount = ZERO_DECIMAL.includes(session.currency)
      ? session.amount_total
      : session.amount_total / 100;
    const currency = session.currency.toUpperCase();

    // BEGIN/COMMIT must run on a single dedicated connection. db.query()
    // draws a different pooled connection per call, which silently breaks
    // the transaction (partial writes under failure).
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Record the purchase (schema: payment_status / transaction_id — see phase8d)
      await client.query(
        `INSERT INTO purchases (user_id, work_id, amount, currency, payment_method, payment_status, transaction_id)
         VALUES ($1, $2, $3, $4, 'stripe', 'completed', $5)
         ON CONFLICT (user_id, work_id) DO NOTHING`,
        [buyer_id, work_id, amount, currency, session.id]
      );

      // Record the transaction
      await client.query(
        `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status)
         VALUES ($1, $2, 'purchase', $3, $4, 'stripe', $5, 'completed')`,
        [buyer_id, work_id, amount, currency, session.id]
      );

      // Create revenue splits (author / collaborators / platform)
      const splits = await createRevenueSplits(client, {
        workId: work_id,
        authorId: author_id,
        amount,
        currency,
        reference: session.id
      });

      await client.query('COMMIT');
      console.log(`Payment completed: work=${work_id}, buyer=${buyer_id}, amount=${amount} ${currency}, splits=${splits.map(s => `${s.role}:${s.amount}`).join(' ')}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing webhook:', error);
    } finally {
      client.release();
    }
  }

  res.json({ received: true });
});

/**
 * PayPal API helpers.
 * The client-supplied orderId must NEVER be trusted on its own — without
 * server-side verification anyone could "capture" a fabricated order and
 * obtain paid works for free.
 */
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    // Fail closed: PayPal is not configured, so no capture can be verified.
    throw new Error('PayPal is not configured on the server');
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!resp.ok) {
    throw new Error(`PayPal auth failed: ${resp.status}`);
  }
  const data = await resp.json();
  return data.access_token;
}

async function getPayPalOrder(orderId, accessToken) {
  const resp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!resp.ok) {
    return null;
  }
  return resp.json();
}

/**
 * POST /api/payments/capture-paypal-order
 * Record a PayPal payment AFTER verifying it with PayPal's API
 */
router.post('/capture-paypal-order', authenticate, async (req, res) => {
  try {
    const { orderId, workId } = req.body;

    if (!orderId || !workId) {
      return res.status(400).json({ error: 'orderId and workId are required' });
    }

    const workResult = await db.query(
      `SELECT * FROM works WHERE work_id = $1`,
      [workId]
    );

    if (workResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work not found' });
    }

    const work = workResult.rows[0];

    // ===== Verify the order with PayPal before recording anything =====
    const accessToken = await getPayPalAccessToken();
    const order = await getPayPalOrder(orderId, accessToken);

    if (!order) {
      return res.status(400).json({ error: 'PayPal order not found' });
    }
    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ error: `PayPal order is not completed (status: ${order.status})` });
    }

    const unit = order.purchase_units && order.purchase_units[0];
    const paidAmount = unit && unit.amount ? parseFloat(unit.amount.value) : NaN;
    const paidCurrency = unit && unit.amount ? unit.amount.currency_code : null;
    const expectedAmount = Math.round(parseFloat(work.price) * 100) / 100;

    if (paidCurrency !== 'USD' || isNaN(paidAmount) || Math.round(paidAmount * 100) !== Math.round(expectedAmount * 100)) {
      console.error(`PayPal amount mismatch: paid=${paidAmount} ${paidCurrency}, expected=${expectedAmount} USD, order=${orderId}`);
      return res.status(400).json({ error: 'Payment amount does not match the work price' });
    }

    // ===== Record purchase + transaction + revenue split atomically =====
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status)
         VALUES ($1, $2, 'purchase', $3, 'USD', 'paypal', $4, 'completed')`,
        [req.user.userId, workId, paidAmount, orderId]
      );

      await client.query(
        `INSERT INTO purchases (user_id, work_id, amount, currency, payment_method, payment_status, transaction_id)
         VALUES ($1, $2, $3, 'USD', 'paypal', 'completed', $4)
         ON CONFLICT (user_id, work_id) DO NOTHING`,
        [req.user.userId, workId, paidAmount, orderId]
      );

      // Revenue splits (same logic as the Stripe webhook)
      await createRevenueSplits(client, {
        workId,
        authorId: work.author_id,
        amount: paidAmount,
        currency: 'USD',
        reference: orderId
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json({ success: true });

  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ error: 'Failed to process PayPal payment' });
  }
});

module.exports = router;