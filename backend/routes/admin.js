/**
 * Admin Routes
 * 
 * Handles all admin dashboard functionality:
 * - User management
 * - Platform statistics
 * - Content moderation
 * - Financial reports
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Note: In production, add admin authentication middleware
// const { authenticateAdmin } = require('../middleware/auth');
// router.use(authenticateAdmin);

// ========== DASHBOARD STATISTICS ==========

/**
 * GET /api/admin/stats
 * Get overall platform statistics for dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    // Get user count
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Get works count
    const worksResult = await db.query('SELECT COUNT(*) as count FROM works');
    
    // Get this month's revenue (placeholder - transactions table may not exist yet)
    let revenue = 0;
    try {
      const revenueResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
          AND status = 'completed'
      `);
      revenue = parseFloat(revenueResult.rows[0].total) || 0;
    } catch (e) {
      // transactions table doesn't exist yet, that's OK
      console.log('Note: transactions table not found, showing $0 revenue');
    }
    
    // Get pending tasks count
    const pendingVerifications = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE verified = false"
    );
    
    let pendingModeration = { rows: [{ count: 0 }] };
    try {
      pendingModeration = await db.query(
        "SELECT COUNT(*) as count FROM works WHERE status = 'pending_review'"
      );
    } catch (e) {
      // works table might not have status column or different values
    }
    
    const totalPendingTasks = 
      parseInt(pendingVerifications.rows[0].count) + 
      parseInt(pendingModeration.rows[0].count);
    
    res.json({
      users: parseInt(usersResult.rows[0].count),
      works: parseInt(worksResult.rows[0].count),
      revenue: revenue,
      pendingTasks: totalPendingTasks
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/activity
 * Get recent platform activity
 */
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent users
    let activities = [];
    
    try {
      const usersActivity = await db.query(`
        SELECT 
          'user_registered' as type,
          user_id as id,
          COALESCE(pen_name, first_name || ' ' || last_name, email) as title,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);
      activities = activities.concat(usersActivity.rows);
    } catch (e) {
      console.log('Could not fetch user activity');
    }
    
    // Get recent works
    try {
      const worksActivity = await db.query(`
        SELECT 
          'work_uploaded' as type,
          work_id as id,
          title,
          created_at
        FROM works
        ORDER BY created_at DESC
        LIMIT 5
      `);
      activities = activities.concat(worksActivity.rows);
    } catch (e) {
      console.log('Could not fetch works activity');
    }
    
    // Sort by created_at and limit
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    activities = activities.slice(0, limit);
    
    res.json({ activities });
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== USER MANAGEMENT ==========

/**
 * GET /api/admin/users
 * Get all users with filtering and pagination
 */
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = ''
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (search) {
      whereConditions.push(`(
        u.email ILIKE $${paramIndex} OR 
        u.first_name ILIKE $${paramIndex} OR 
        u.last_name ILIKE $${paramIndex} OR 
        u.pen_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status) {
      whereConditions.push(`u.account_status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(DISTINCT u.user_id) as total 
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id
       ${whereClause}`,
      params
    );
    
    // Get users with roles (using last_login_at instead of last_login)
    const usersResult = await db.query(
      `SELECT 
         u.user_id,
         u.email,
         u.first_name,
         u.last_name,
         u.pen_name,
         u.country_code,
         u.verified,
         u.account_status,
         u.created_at,
         u.last_login_at,
         array_agg(DISTINCT ur.role_type) FILTER (WHERE ur.role_type IS NOT NULL) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
       ${whereClause}
       GROUP BY u.user_id
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );
    
    // Filter by role if specified (after aggregation)
    let users = usersResult.rows;
    if (role) {
      users = users.filter(u => u.roles && u.roles.includes(role));
    }
    
    res.json({
      users,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get detailed user information
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user details (selecting specific columns to avoid issues)
    const userResult = await db.query(
      `SELECT 
         u.user_id,
         u.email,
         u.first_name,
         u.last_name,
         u.pen_name,
         u.country_code,
         u.bio,
         u.profile_image_url,
         u.verified,
         u.account_status,
         u.created_at,
         u.updated_at,
         u.last_login_at,
         array_agg(DISTINCT ur.role_type) FILTER (WHERE ur.role_type IS NOT NULL) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's works count
    const worksResult = await db.query(
      'SELECT COUNT(*) as count FROM works WHERE author_id = $1',
      [userId]
    );
    
    // Get user's earnings (placeholder - table may not exist)
    let totalEarnings = 0;
    try {
      const earningsResult = await db.query(
        `SELECT COALESCE(SUM(creator_amount), 0) as total
         FROM revenue_distributions
         WHERE user_id = $1 AND status = 'paid'`,
        [userId]
      );
      totalEarnings = parseFloat(earningsResult.rows[0].total) || 0;
    } catch (e) {
      // revenue_distributions table doesn't exist yet
    }
    
    const user = userResult.rows[0];
    
    res.json({
      user,
      stats: {
        worksCount: parseInt(worksResult.rows[0].count),
        totalEarnings: totalEarnings
      }
    });
  } catch (error) {
    console.error('User detail error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/users/:userId/status
 * Update user account status (active, suspended, banned)
 */
router.patch('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    
    const validStatuses = ['active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: active, suspended, or banned' 
      });
    }
    
    const result = await db.query(
      `UPDATE users 
       SET account_status = $1, 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING user_id, email, account_status`,
      [status, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Log the action (for audit trail)
    console.log(`Admin action: User ${userId} status changed to ${status}. Reason: ${reason || 'Not specified'}`);
    
    res.json({
      message: `User status updated to ${status}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/users/:userId/verify
 * Manually verify a user
 */
router.patch('/users/:userId/verify', async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified } = req.body;
    
    const result = await db.query(
      `UPDATE users 
       SET verified = $1, 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING user_id, email, verified`,
      [verified !== false, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: `User verification status updated`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:userId/roles
 * Add a role to user
 */
router.post('/users/:userId/roles', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    const validRoles = ['author', 'translator', 'editor', 'reader', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be: author, translator, editor, reader, or admin' 
      });
    }
    
    // Check if role already exists
    const existing = await db.query(
      'SELECT * FROM user_roles WHERE user_id = $1 AND role_type = $2',
      [userId, role]
    );
    
    if (existing.rows.length > 0) {
      // Reactivate if inactive
      await db.query(
        'UPDATE user_roles SET is_active = true WHERE user_id = $1 AND role_type = $2',
        [userId, role]
      );
    } else {
      // Create new role
      await db.query(
        'INSERT INTO user_roles (user_id, role_type, is_active) VALUES ($1, $2, true)',
        [userId, role]
      );
    }
    
    res.json({ message: `Role '${role}' added to user` });
  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:userId/roles/:role
 * Remove a role from user
 */
router.delete('/users/:userId/roles/:role', async (req, res) => {
  try {
    const { userId, role } = req.params;
    
    await db.query(
      'UPDATE user_roles SET is_active = false WHERE user_id = $1 AND role_type = $2',
      [userId, role]
    );
    
    res.json({ message: `Role '${role}' removed from user` });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
