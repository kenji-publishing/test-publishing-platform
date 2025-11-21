/**
 * Works Routes
 * 
 * Handles work creation, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

/**
 * GET /api/works
 * Get all published works (public)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, language } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT w.work_id, w.title, w.description, w.cover_image_url,
             w.genre, w.original_language, w.content_type, w.price,
             w.view_count, w.rating_average, w.rating_count, w.published_at,
             u.user_id as author_id, u.pen_name as author_name
      FROM works w
      JOIN users u ON w.author_id = u.user_id
      WHERE w.status = 'published'
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (genre) {
      query += ` AND w.genre = $${paramCount}`;
      params.push(genre);
      paramCount++;
    }
    
    if (language) {
      query += ` AND w.original_language = $${paramCount}`;
      params.push(language);
      paramCount++;
    }
    
    query += ` ORDER BY w.published_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
      works: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
      total: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/works/:workId
 * Get single work details
 */
router.get('/:workId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT w.*, u.pen_name as author_name, u.user_id as author_id
       FROM works w
       JOIN users u ON w.author_id = u.user_id
       WHERE w.work_id = $1 AND w.status = 'published'`,
      [req.params.workId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    // Increment view count
    await db.query(
      'UPDATE works SET view_count = view_count + 1 WHERE work_id = $1',
      [req.params.workId]
    );
    
    res.json({ work: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/works
 * Create new work (authenticated)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      originalLanguage,
      contentType,
      genre,
      tags,
      price,
      isFree
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO works (
        author_id, title, description, original_language,
        content_type, genre, tags, price, is_free, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
      RETURNING *`,
      [
        req.user.userId,
        title,
        description,
        originalLanguage,
        contentType,
        genre,
        tags || [],
        price || 0,
        isFree || false
      ]
    );
    
    res.status(201).json({
      message: 'Work created successfully',
      work: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/works/:workId
 * Update work (authenticated, author only)
 */
router.put('/:workId', authenticate, async (req, res) => {
  try {
    // Check if user is the author
    const checkResult = await db.query(
      'SELECT author_id FROM works WHERE work_id = $1',
      [req.params.workId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    if (checkResult.rows[0].author_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this work' });
    }
    
    const { title, description, genre, tags, price, status } = req.body;
    
    const result = await db.query(
      `UPDATE works
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           genre = COALESCE($3, genre),
           tags = COALESCE($4, tags),
           price = COALESCE($5, price),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE work_id = $7
       RETURNING *`,
      [title, description, genre, tags, price, status, req.params.workId]
    );
    
    res.json({
      message: 'Work updated successfully',
      work: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/works/my/all
 * Get current user's works
 */
router.get('/my/all', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM works
       WHERE author_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    
    res.json({ works: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;