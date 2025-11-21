/**
 * Translation Routes
 * 
 * Handles translation requests and management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

/**
 * GET /api/translations/work/:workId
 * Get all translations for a work
 */
router.get('/work/:workId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, u.pen_name as translator_name
       FROM translations t
       LEFT JOIN users u ON t.translator_id = u.user_id
       WHERE t.work_id = $1 AND t.status = 'completed'`,
      [req.params.workId]
    );
    
    res.json({ translations: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/translations
 * Request or create a translation
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { workId, targetLanguage, translationType } = req.body;
    
    // Check if translation already exists
    const existing = await db.query(
      'SELECT translation_id FROM translations WHERE work_id = $1 AND target_language = $2',
      [workId, targetLanguage]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'Translation already exists for this language'
      });
    }
    
    const result = await db.query(
      `INSERT INTO translations (work_id, translator_id, target_language, translation_type, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [workId, req.user.userId, targetLanguage, translationType]
    );
    
    res.status(201).json({
      message: 'Translation request created',
      translation: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;