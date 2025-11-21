/**
 * Authentication Routes
 * 
 * Handles user registration, login, and token management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  // Validation
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['author', 'translator', 'editor']),
  
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { email, password, firstName, lastName, role, penName, country } = req.body;
      
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const result = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, pen_name, country_code)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING user_id, email, first_name, last_name, pen_name, created_at`,
        [email, passwordHash, firstName, lastName, penName || null, country || null]
      );
      
      const user = result.rows[0];
      
      // Create user role
      await db.query(
        'INSERT INTO user_roles (user_id, role_type) VALUES ($1, $2)',
        [user.user_id, role]
      );
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.user_id,
          email: user.email,
          role: role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          penName: user.pen_name,
          role: role
        },
        token
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { email, password } = req.body;
      
      // Find user
      const result = await db.query(
        `SELECT u.user_id, u.email, u.password_hash, u.first_name, u.last_name, 
                u.pen_name, u.account_status, ur.role_type
         FROM users u
         LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
         WHERE u.email = $1`,
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }
      
      const user = result.rows[0];
      
      // Check account status
      if (user.account_status !== 'active') {
        return res.status(403).json({
          error: 'Account inactive',
          message: 'Your account has been suspended or deleted'
        });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }
      
      // Update last login
      await db.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [user.user_id]
      );
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.user_id,
          email: user.email,
          role: user.role_type
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          penName: user.pen_name,
          role: user.role_type
        },
        token
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, u.pen_name,
              u.country_code, u.bio, u.profile_image_url, u.verified,
              array_agg(DISTINCT ur.role_type) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    const user = result.rows[0];
    
    res.json({
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        penName: user.pen_name,
        country: user.country_code,
        bio: user.bio,
        profileImage: user.profile_image_url,
        verified: user.verified,
        roles: user.roles.filter(r => r !== null)
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

module.exports = router;