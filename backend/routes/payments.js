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
              description: work.description || 'Digital content from Publisher',
            },
            unit_amount: Math.round(work.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pages/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
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
    
    await db.query(
      `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status)
       VALUES ($1, $2, 'purchase', $3, 'USD', 'paypal', $4, 'completed')`,
      [req.user.userId, workId, work.price, orderId]
    );
    
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;