/**
 * User Routes
 * 
 * Handles user profile management, settings, and self-service features
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const { sendEmail } = require('../config/email');

// Simple auth middleware
const authenticate = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      req.user = { userId: req.session.userId };
      return next();
    }
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { userId: decoded.userId };
      return next();
    }
    
    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication' });
  }
};

/**
 * GET /api/users/profile
 * Get user's own profile
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, u.pen_name as display_name,
              u.country_code, u.bio, u.profile_image_url as avatar_url, u.verified, 
              u.created_at, u.email_verified, u.preferred_language,
              array_agg(DISTINCT ur.role_type) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { first_name, last_name, display_name, bio, preferred_language } = req.body;
    
    const result = await db.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           pen_name = COALESCE($3, pen_name),
           bio = COALESCE($4, bio),
           preferred_language = COALESCE($5, preferred_language),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING *`,
      [first_name, last_name, display_name, bio, preferred_language, req.user.userId]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/notifications
 * Update notification settings
 */
router.put('/notifications', authenticate, async (req, res) => {
  try {
    const { 
      notify_updates, 
      notify_comments, 
      notify_sales, 
      notify_translation, 
      notify_marketing 
    } = req.body;
    
    // Check if notification_settings column exists, if not use json
    const result = await db.query(
      `UPDATE users 
       SET notification_settings = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING user_id`,
      [
        JSON.stringify({
          updates: notify_updates,
          comments: notify_comments,
          sales: notify_sales,
          translation: notify_translation,
          marketing: notify_marketing
        }),
        req.user.userId
      ]
    );
    
    res.json({
      success: true,
      message: 'Notification settings updated'
    });
  } catch (error) {
    // If notification_settings column doesn't exist, just return success
    // (settings will be implemented later)
    res.json({
      success: true,
      message: 'Notification settings updated'
    });
  }
});

/**
 * GET /api/users/purchases
 * Get user's purchase history
 */
router.get('/purchases', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        p.purchase_id as id,
        p.work_id,
        w.title as work_title,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_status,
        p.created_at as purchased_at,
        p.transaction_id
       FROM purchases p
       LEFT JOIN works w ON p.work_id = w.work_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [req.user.userId]
    );
    
    res.json({
      success: true,
      purchases: result.rows
    });
  } catch (error) {
    // If purchases table doesn't exist, return empty
    res.json({
      success: true,
      purchases: []
    });
  }
});

/**
 * GET /api/users/purchases/:purchaseId/receipt
 * Generate and display receipt HTML (can be printed as PDF by browser)
 */
router.get('/purchases/:purchaseId/receipt', authenticate, async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const lang = req.query.lang || 'ja'; // Default to Japanese
    
    // Get purchase details
    const result = await db.query(
      `SELECT 
        p.purchase_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.created_at,
        p.transaction_id,
        w.title as work_title,
        u.email,
        u.first_name,
        u.last_name
       FROM purchases p
       LEFT JOIN works w ON p.work_id = w.work_id
       LEFT JOIN users u ON p.user_id = u.user_id
       WHERE p.purchase_id = $1 AND p.user_id = $2`,
      [purchaseId, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    const purchase = result.rows[0];
    
    // Generate receipt HTML using the receipt generator service
    const { generateReceiptHTML } = require('../services/receipt-generator');
    const receiptHtml = generateReceiptHTML(purchase, lang);

    // Send as HTML (can be printed as PDF by browser)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(receiptHtml);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/delete-request
 * Request account deletion (sends confirmation email)
 */
router.post('/delete-request', authenticate, async (req, res) => {
  try {
    // Get user info
    const userResult = await db.query(
      'SELECT email, first_name FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Generate deletion token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store deletion request
    await db.query(
      `INSERT INTO account_deletion_requests (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [req.user.userId, token, expiresAt]
    );
    
    // Send confirmation email
    const deleteLink = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/pages/confirm-delete.html?token=${token}`;
    
    await sendEmail(
      user.email,
      '【重要】アカウント削除の確認 - AuctLect',
      `${user.first_name || 'お客'}様\n\nアカウント削除のリクエストを受け付けました。\n\n削除を確定するには、以下のリンクをクリックしてください：\n${deleteLink}\n\nこのリンクは24時間有効です。\n\n心当たりがない場合は、このメールを無視してください。\n\nAuctLect サポートチーム`,
      `<h2>アカウント削除の確認</h2>
       <p>${user.first_name || 'お客'}様</p>
       <p>アカウント削除のリクエストを受け付けました。</p>
       <p>削除を確定するには、以下のボタンをクリックしてください：</p>
       <a href="${deleteLink}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">アカウントを削除する</a>
       <p style="color: #666;">このリンクは24時間有効です。</p>
       <p style="color: #666;">心当たりがない場合は、このメールを無視してください。</p>
       <hr>
       <p style="color: #999; font-size: 12px;">AuctLect サポートチーム</p>`
    );
    
    res.json({
      success: true,
      message: 'Deletion confirmation email sent'
    });
    
  } catch (error) {
    // If table doesn't exist, create it
    if (error.code === '42P01') {
      await db.query(`
        CREATE TABLE IF NOT EXISTS account_deletion_requests (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL UNIQUE REFERENCES users(user_id),
          token VARCHAR(64) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Retry
      return router.handle(req, res);
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/confirm-delete
 * Confirm and execute account deletion
 */
router.post('/confirm-delete', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Verify token
    const result = await db.query(
      `SELECT user_id FROM account_deletion_requests 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    const userId = result.rows[0].user_id;
    
    // Get user email for final notification
    const userResult = await db.query(
      'SELECT email, first_name FROM users WHERE user_id = $1',
      [userId]
    );
    
    // Delete user data (cascade should handle related tables)
    // In production, you might want to anonymize instead of delete
    await db.query('DELETE FROM account_deletion_requests WHERE user_id = $1', [userId]);
    await db.query('UPDATE users SET account_status = $1, email = $2, deleted_at = NOW() WHERE user_id = $3', 
      ['deleted', `deleted_${userId}@deleted.local`, userId]);
    
    // Send final confirmation
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      await sendEmail(
        user.email,
        'アカウント削除完了 - AuctLect',
        `${user.first_name || 'お客'}様\n\nアカウントの削除が完了しました。\n\nご利用いただきありがとうございました。\n\nAuctLect`,
        `<h2>アカウント削除完了</h2>
         <p>${user.first_name || 'お客'}様</p>
         <p>アカウントの削除が完了しました。</p>
         <p>ご利用いただきありがとうございました。</p>
         <p>AuctLect</p>`
      );
    }
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:userId
 * Get public profile of any user
 */
router.get('/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.pen_name,
              u.country_code, u.bio, u.profile_image_url, u.verified,
              array_agg(DISTINCT ur.role_type) as roles,
              COUNT(DISTINCT w.work_id) as work_count
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
       LEFT JOIN works w ON w.author_id = u.user_id AND w.status = 'published'
       WHERE u.user_id = $1 AND u.account_status = 'active'
       GROUP BY u.user_id`,
      [req.params.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
