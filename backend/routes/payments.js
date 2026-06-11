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

// Revenue distribution percentages
const REVENUE_SPLIT = {
  author: 40,
  translator: 20,
  editor: 10,
  platform: 30
};

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
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: work.title,
              description: work.description || 'Digital content from AuctLect',
            },
            unit_amount: Math.round(work.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pages/payment-success.html?session_id={CHECKOUT_SESSION_ID}&work_id=${workId}&title=${encodeURIComponent(work.title)}&amount=${work.price}`,
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { work_id, buyer_id, author_id } = session.metadata;
    const amount = session.amount_total / 100;
    const currency = session.currency.toUpperCase();

    // BEGIN/COMMIT must run on a single dedicated connection. db.query()
    // draws a different pooled connection per call, which silently breaks
    // the transaction (partial writes under failure).
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Record the purchase
      await client.query(
        `INSERT INTO purchases (user_id, work_id, amount, currency, payment_method, payment_gateway_id, status)
         VALUES ($1, $2, $3, $4, 'stripe', $5, 'completed')
         ON CONFLICT DO NOTHING`,
        [buyer_id, work_id, amount, currency, session.id]
      );

      // Record the transaction
      await client.query(
        `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status)
         VALUES ($1, $2, 'purchase', $3, $4, 'stripe', $5, 'completed')`,
        [buyer_id, work_id, amount, currency, session.id]
      );

      // Create revenue splits (rounded to cents to avoid float drift)
      const authorAmount = Math.round(amount * REVENUE_SPLIT.author) / 100;
      const platformAmount = Math.round(amount * REVENUE_SPLIT.platform) / 100;

      await client.query(
        `INSERT INTO revenue_splits (work_id, recipient_id, role, amount, currency, transaction_reference)
         VALUES ($1, $2, 'author', $3, $4, $5)`,
        [work_id, author_id, authorAmount, currency, session.id]
      );

      await client.query(
        `INSERT INTO revenue_splits (work_id, recipient_id, role, amount, currency, transaction_reference)
         VALUES ($1, NULL, 'platform', $2, $3, $4)`,
        [work_id, platformAmount, currency, session.id]
      );

      await client.query('COMMIT');
      console.log(`Payment completed: work=${work_id}, buyer=${buyer_id}, amount=${amount} ${currency}`);
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
        `INSERT INTO purchases (user_id, work_id, amount, currency, payment_method, payment_gateway_id, status)
         VALUES ($1, $2, $3, 'USD', 'paypal', $4, 'completed')
         ON CONFLICT DO NOTHING`,
        [req.user.userId, workId, paidAmount, orderId]
      );

      // Revenue splits (same split as the Stripe webhook, rounded to cents)
      const authorAmount = Math.round(paidAmount * REVENUE_SPLIT.author) / 100;
      const platformAmount = Math.round(paidAmount * REVENUE_SPLIT.platform) / 100;

      await client.query(
        `INSERT INTO revenue_splits (work_id, recipient_id, role, amount, currency, transaction_reference)
         VALUES ($1, $2, 'author', $3, 'USD', $4)`,
        [workId, work.author_id, authorAmount, orderId]
      );

      await client.query(
        `INSERT INTO revenue_splits (work_id, recipient_id, role, amount, currency, transaction_reference)
         VALUES ($1, NULL, 'platform', $2, 'USD', $3)`,
        [workId, platformAmount, orderId]
      );

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