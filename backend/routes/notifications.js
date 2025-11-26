/**
 * Notification Routes
 * Handles email notifications for various events
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const { sendEmail, templates } = require('../config/email');

/**
 * POST /api/notifications/welcome
 * Send welcome email to new user
 */
router.post('/welcome', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user details
    const userResult = await db.query(
      'SELECT email, first_name, pen_name FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const userName = user.pen_name || user.first_name || 'Creator';

    // Send welcome email
    const template = templates.welcome(userName);
    const result = await sendEmail(
      user.email,
      template.subject,
      template.text,
      template.html
    );

    res.json({
      success: true,
      message: 'Welcome email sent',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/translation-complete
 * Send notification when translation is complete
 */
router.post('/translation-complete', authenticate, async (req, res) => {
  try {
    const { workId, language } = req.body;
    const userId = req.user.userId;

    // Get user and work details
    const result = await db.query(
      `SELECT u.email, u.first_name, u.pen_name, w.title
       FROM users u
       JOIN works w ON w.author_id = u.user_id
       WHERE u.user_id = $1 AND w.work_id = $2`,
      [userId, workId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User or work not found' });
    }

    const data = result.rows[0];
    const userName = data.pen_name || data.first_name || 'Creator';

    // Language names
    const langNames = {
      'en': 'English 🇬🇧',
      'es': 'Spanish 🇪🇸',
      'de': 'German 🇩🇪',
      'fr': 'French 🇫🇷',
      'ja': 'Japanese 🇯🇵',
      'zh': 'Chinese 🇨🇳',
      'ko': 'Korean 🇰🇷',
      'ar': 'Arabic 🇸🇦'
    };

    const languageName = langNames[language] || language;

    // Send email
    const template = templates.translationComplete(userName, data.title, languageName);
    const emailResult = await sendEmail(
      data.email,
      template.subject,
      template.text,
      template.html
    );

    res.json({
      success: true,
      message: 'Translation complete notification sent',
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error('Translation notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/purchase
 * Send notification when a work is purchased
 */
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { workId, amount } = req.body;
    const buyerId = req.user.userId;

    // Get buyer details
    const buyerResult = await db.query(
      'SELECT first_name, pen_name FROM users WHERE user_id = $1',
      [buyerId]
    );

    const buyerName = buyerResult.rows[0]?.pen_name || 
                     buyerResult.rows[0]?.first_name || 
                     'A reader';

    // Get author and work details
    const workResult = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.pen_name, w.title
       FROM works w
       JOIN users u ON w.author_id = u.user_id
       WHERE w.work_id = $1`,
      [workId]
    );

    if (workResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work not found' });
    }

    const author = workResult.rows[0];
    const authorName = author.pen_name || author.first_name || 'Creator';

    // Send email to author
    const template = templates.purchaseNotification(
      authorName,
      author.title,
      buyerName,
      amount
    );

    const emailResult = await sendEmail(
      author.email,
      template.subject,
      template.text,
      template.html
    );

    res.json({
      success: true,
      message: 'Purchase notification sent to author',
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error('Purchase notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/test
 * Test email notification (development only)
 */
router.post('/test', authenticate, async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user.userId;

    // Get user details
    const userResult = await db.query(
      'SELECT email, first_name, pen_name FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const userName = user.pen_name || user.first_name || 'Creator';

    let template;

    switch (type) {
      case 'welcome':
        template = templates.welcome(userName);
        break;
      case 'translation':
        template = templates.translationComplete(userName, 'Sample Work Title', 'English 🇬🇧');
        break;
      case 'purchase':
        template = templates.purchaseNotification(userName, 'Sample Work', 'John Doe', '9.99');
        break;
      case 'report':
        template = templates.monthlyReport(userName, '150.00', '15', 'My Best Work');
        break;
      default:
        return res.status(400).json({ error: 'Invalid notification type' });
    }

    const result = await sendEmail(
      user.email,
      template.subject,
      template.text,
      template.html
    );

    res.json({
      success: true,
      message: `Test ${type} email sent`,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notifications/settings
 * Get user's notification settings
 */
router.get('/settings', authenticate, async (req, res) => {
  try {
    // For now, return default settings
    // In production, these would be stored in database
    res.json({
      emailNotifications: {
        translationComplete: true,
        newPurchase: true,
        monthlyReport: true,
        marketingEmails: false
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;