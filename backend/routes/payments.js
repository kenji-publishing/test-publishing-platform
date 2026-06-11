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

    try {
      await db.query('BEGIN');

      // Record the purchase
      await db.query(
        `INSERT INTO purchases (user_id, work_id, amount, currency, payment_method, payment_gateway_id, status)
         VALUES ($1, $2, $3, $4, 'stripe', $5, 'completed')
         ON CONFLICT DO NOTHING`,
        [buyer_id, work_id, amount, currency, session.id]
      );

      // Record the transaction
      await db.query(
        `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status)
         VALUES ($1, $2, 'purchase', $3, $4, 'stripe', $5, 'completed')`,
        [buyer_id, work_id, amount, currency, session.id]
      );

      // Create revenue splits
      const authorAmount = amount * (REVENUE_SPLIT.author / 100);
      const platformAmount = amount * (REVENUE_SPLIT.platform / 100);

      await db.query(
        `INSERT INTO revenue_splits (work_id, recipient_id, role, amount, currency, transaction_reference)
         VALUES ($1, $2, 'author', $3, $4, $5)`,
        [work_id, author_id, authorAmount, currency, session.id]
      );

      await db.query(
        `INSERT INTO revenue_splits (work_id, recipient_id, role, amount, currency, transaction_reference)
         VALUES ($1, NULL, 'platform', $2, $3, $4)`,
        [work_id, platformAmount, currency, session.id]
      );

      await db.query('COMMIT');
      console.log(`Payment completed: work=${work_id}, buyer=${buyer_id}, amount=${amount} ${currency}`);
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error processing webhook:', error);
    }
  }

  res.json({ received: true });
});

/**
 * POST /api/payments/capture-paypal-order
 * Capture PayPal payment
 */
router.post('/capture-paypal-order', authenticate, async (req, res) => {
  try {
    const { orderId, workId } = req.body;

    const workResult = await db.query(
      `SELECT * FROM works WHERE work_id = $1`,
      [workId]
    );

    if (workResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work not found' });
    }

    const work = workResult.rows[0];

    await db.query('BEGIN');

    // Record the transaction
    await db.query(
      `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status)
       VALUES ($1, $2, 'purchase', $3, 'USD', 'paypal', $4, 'completed')`,
      [req.user.userId, workId, work.price, orderId]
    );

    // Record the purchase
    await db.query(
      `INSERT INTO purchases (user_id, work_id, amount, currency, payment_method, payment_gateway_id, status)
       VALUES ($1, $2, $3, 'USD', 'paypal', $4, 'completed')
       ON CONFLICT DO NOTHING`,
      [req.user.userId, workId, work.price, orderId]
    );

    await db.query('COMMIT');

    res.json({ success: true });

  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;