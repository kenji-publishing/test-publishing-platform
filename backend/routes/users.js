/**
 * User Routes
 * 
 * Handles user profile management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

/**
 * GET /api/users/profile
 * Get user's own profile
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, u.pen_name,
              u.country_code, u.bio, u.profile_image_url, u.verified, u.created_at,
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
    const { firstName, lastName, penName, bio, country } = req.body;
    
    const result = await db.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           pen_name = COALESCE($3, pen_name),
           bio = COALESCE($4, bio),
           country_code = COALESCE($5, country_code),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING *`,
      [firstName, lastName, penName, bio, country, req.user.userId]
    );
    
    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
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