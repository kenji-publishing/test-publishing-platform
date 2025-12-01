const express = require('express');
const router = express.Router();

// Helper function to get database pool
function getPool(req) {
    return req.app.get('db');
}

// ===== REVENUE REPORTS =====

// GET /api/finance/admin/stats - Get financial overview
router.get('/admin/stats', async (req, res) => {
    try {
        const pool = getPool(req);
        
        // Get overall statistics
        const statsQuery = `
            SELECT 
                COALESCE(SUM(amount), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as month_revenue,
                COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN amount ELSE 0 END), 0) as week_revenue,
                COUNT(*) as total_transactions
            FROM transactions
            WHERE status = 'completed'
        `;
        
        let stats = {
            total_revenue: 0,
            month_revenue: 0,
            week_revenue: 0,
            total_transactions: 0
        };
        
        try {
            const result = await pool.query(statsQuery);
            if (result.rows.length > 0) {
                stats = {
                    total_revenue: parseFloat(result.rows[0].total_revenue) || 0,
                    month_revenue: parseFloat(result.rows[0].month_revenue) || 0,
                    week_revenue: parseFloat(result.rows[0].week_revenue) || 0,
                    total_transactions: parseInt(result.rows[0].total_transactions) || 0
                };
            }
        } catch (e) {
            console.log('Transactions table may not exist, using defaults');
        }
        
        // Get pending payouts
        let pendingPayouts = { count: 0, amount: 0 };
        try {
            const payoutQuery = `
                SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
                FROM payouts
                WHERE status = 'pending'
            `;
            const payoutResult = await pool.query(payoutQuery);
            if (payoutResult.rows.length > 0) {
                pendingPayouts = {
                    count: parseInt(payoutResult.rows[0].count) || 0,
                    amount: parseFloat(payoutResult.rows[0].amount) || 0
                };
            }
        } catch (e) {
            console.log('Payouts table may not exist');
        }
        
        // Get works with sales
        let topWorks = [];
        try {
            const worksQuery = `
                SELECT w.work_id, w.title, u.pen_name as author_name,
                       COALESCE(SUM(t.amount), 0) as total_sales,
                       COUNT(t.transaction_id) as sale_count
                FROM works w
                LEFT JOIN users u ON w.author_id = u.user_id
                LEFT JOIN transactions t ON t.work_id = w.work_id AND t.status = 'completed'
                GROUP BY w.work_id, w.title, u.pen_name
                ORDER BY total_sales DESC
                LIMIT 5
            `;
            const worksResult = await pool.query(worksQuery);
            topWorks = worksResult.rows;
        } catch (e) {
            console.log('Could not fetch top works');
        }
        
        res.json({
            stats,
            pendingPayouts,
            topWorks
        });
    } catch (error) {
        console.error('Error fetching financial stats:', error);
        res.status(500).json({ error: 'Failed to fetch financial statistics' });
    }
});

// GET /api/finance/admin/revenue/monthly - Get monthly revenue breakdown
router.get('/admin/revenue/monthly', async (req, res) => {
    try {
        const pool = getPool(req);
        const { months = 12 } = req.query;
        
        let monthlyData = [];
        
        try {
            const query = `
                SELECT 
                    DATE_TRUNC('month', created_at) as month,
                    COALESCE(SUM(amount), 0) as revenue,
                    COUNT(*) as transactions
                FROM transactions
                WHERE status = 'completed'
                  AND created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${parseInt(months)} months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month DESC
            `;
            const result = await pool.query(query);
            monthlyData = result.rows.map(row => ({
                month: row.month,
                revenue: parseFloat(row.revenue) || 0,
                transactions: parseInt(row.transactions) || 0
            }));
        } catch (e) {
            console.log('Transactions table may not exist');
        }
        
        res.json({ monthlyData });
    } catch (error) {
        console.error('Error fetching monthly revenue:', error);
        res.status(500).json({ error: 'Failed to fetch monthly revenue' });
    }
});

// GET /api/finance/admin/transactions - Get transaction list
router.get('/admin/transactions', async (req, res) => {
    try {
        const pool = getPool(req);
        const { page = 1, limit = 20, type, status } = req.query;
        
        let transactions = [];
        let total = 0;
        
        try {
            let whereConditions = [];
            let params = [];
            let paramIndex = 1;
            
            if (type) {
                whereConditions.push(`t.transaction_type = $${paramIndex++}`);
                params.push(type);
            }
            
            if (status) {
                whereConditions.push(`t.status = $${paramIndex++}`);
                params.push(status);
            }
            
            const whereClause = whereConditions.length > 0 
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';
            
            // Count total
            const countQuery = `SELECT COUNT(*) FROM transactions t ${whereClause}`;
            const countResult = await pool.query(countQuery, params);
            total = parseInt(countResult.rows[0].count) || 0;
            
            // Get transactions
            const offset = (parseInt(page) - 1) * parseInt(limit);
            params.push(parseInt(limit));
            params.push(offset);
            
            const query = `
                SELECT 
                    t.*,
                    u.email as user_email,
                    u.pen_name as user_name,
                    w.title as work_title
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.user_id
                LEFT JOIN works w ON t.work_id = w.work_id
                ${whereClause}
                ORDER BY t.created_at DESC
                LIMIT $${paramIndex++} OFFSET $${paramIndex}
            `;
            
            const result = await pool.query(query, params);
            transactions = result.rows;
        } catch (e) {
            console.log('Transactions table may not exist:', e.message);
        }
        
        res.json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// ===== PAYOUTS =====

// GET /api/finance/admin/payouts - Get payout list
router.get('/admin/payouts', async (req, res) => {
    try {
        const pool = getPool(req);
        const { page = 1, limit = 20, status } = req.query;
        
        let payouts = [];
        let total = 0;
        
        try {
            let whereConditions = [];
            let params = [];
            let paramIndex = 1;
            
            if (status) {
                whereConditions.push(`p.status = $${paramIndex++}`);
                params.push(status);
            }
            
            const whereClause = whereConditions.length > 0 
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';
            
            // Count total
            const countQuery = `SELECT COUNT(*) FROM payouts p ${whereClause}`;
            const countResult = await pool.query(countQuery, params);
            total = parseInt(countResult.rows[0].count) || 0;
            
            // Get payouts
            const offset = (parseInt(page) - 1) * parseInt(limit);
            params.push(parseInt(limit));
            params.push(offset);
            
            const query = `
                SELECT 
                    p.*,
                    u.email as user_email,
                    u.pen_name as user_name
                FROM payouts p
                LEFT JOIN users u ON p.user_id = u.user_id
                ${whereClause}
                ORDER BY p.created_at DESC
                LIMIT $${paramIndex++} OFFSET $${paramIndex}
            `;
            
            const result = await pool.query(query, params);
            payouts = result.rows;
        } catch (e) {
            console.log('Payouts table may not exist:', e.message);
        }
        
        res.json({
            payouts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching payouts:', error);
        res.status(500).json({ error: 'Failed to fetch payouts' });
    }
});

// GET /api/finance/admin/payouts/pending - Get users with pending earnings
router.get('/admin/payouts/pending', async (req, res) => {
    try {
        const pool = getPool(req);
        
        let pendingEarnings = [];
        
        try {
            // Get users with unpaid earnings
            const query = `
                SELECT 
                    u.user_id,
                    u.email,
                    u.pen_name,
                    u.payout_method,
                    u.payout_details,
                    COALESCE(SUM(e.amount), 0) as pending_amount,
                    COUNT(e.earning_id) as earning_count,
                    MIN(e.created_at) as oldest_earning
                FROM users u
                INNER JOIN earnings e ON u.user_id = e.user_id
                WHERE e.status = 'pending' OR e.status = 'unpaid'
                GROUP BY u.user_id, u.email, u.pen_name, u.payout_method, u.payout_details
                HAVING SUM(e.amount) > 0
                ORDER BY pending_amount DESC
            `;
            const result = await pool.query(query);
            pendingEarnings = result.rows.map(row => ({
                ...row,
                pending_amount: parseFloat(row.pending_amount) || 0
            }));
        } catch (e) {
            console.log('Earnings table may not exist:', e.message);
        }
        
        res.json({ pendingEarnings });
    } catch (error) {
        console.error('Error fetching pending earnings:', error);
        res.status(500).json({ error: 'Failed to fetch pending earnings' });
    }
});

// POST /api/finance/admin/payouts - Create a new payout
router.post('/admin/payouts', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { userId, amount, method, notes } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({ error: 'User ID and amount are required' });
        }
        
        await client.query('BEGIN');
        
        // Create payout record
        const payoutQuery = `
            INSERT INTO payouts (payout_id, user_id, amount, method, status, notes, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, 'pending', $4, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        
        const result = await client.query(payoutQuery, [userId, amount, method || 'bank_transfer', notes || '']);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Payout created',
            payout: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating payout:', error);
        res.status(500).json({ error: 'Failed to create payout' });
    } finally {
        client.release();
    }
});

// PATCH /api/finance/admin/payouts/:payoutId/process - Process a payout
router.patch('/admin/payouts/:payoutId/process', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { payoutId } = req.params;
        const { transactionReference, notes } = req.body;
        
        await client.query('BEGIN');
        
        // Update payout status
        const updateQuery = `
            UPDATE payouts
            SET status = 'completed',
                transaction_reference = $2,
                notes = COALESCE(notes || ' ', '') || $3,
                processed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE payout_id = $1
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, [payoutId, transactionReference || '', notes || '']);
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Payout not found' });
        }
        
        // Mark related earnings as paid
        try {
            await client.query(`
                UPDATE earnings
                SET status = 'paid', payout_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $2 AND (status = 'pending' OR status = 'unpaid')
            `, [payoutId, result.rows[0].user_id]);
        } catch (e) {
            console.log('Could not update earnings');
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Payout processed',
            payout: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing payout:', error);
        res.status(500).json({ error: 'Failed to process payout' });
    } finally {
        client.release();
    }
});

// PATCH /api/finance/admin/payouts/:payoutId/cancel - Cancel a payout
router.patch('/admin/payouts/:payoutId/cancel', async (req, res) => {
    const pool = getPool(req);
    
    try {
        const { payoutId } = req.params;
        const { reason } = req.body;
        
        const updateQuery = `
            UPDATE payouts
            SET status = 'cancelled',
                notes = COALESCE(notes || ' ', '') || $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE payout_id = $1 AND status = 'pending'
            RETURNING *
        `;
        
        const result = await pool.query(updateQuery, [payoutId, reason || 'Cancelled by admin']);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payout not found or already processed' });
        }
        
        res.json({
            success: true,
            message: 'Payout cancelled',
            payout: result.rows[0]
        });
    } catch (error) {
        console.error('Error cancelling payout:', error);
        res.status(500).json({ error: 'Failed to cancel payout' });
    }
});

// ===== USER EARNINGS =====

// GET /api/finance/admin/users/:userId/earnings - Get user earnings breakdown
router.get('/admin/users/:userId/earnings', async (req, res) => {
    try {
        const pool = getPool(req);
        const { userId } = req.params;
        
        let userInfo = null;
        let earnings = [];
        let summary = { total: 0, pending: 0, paid: 0 };
        
        // Get user info
        try {
            const userQuery = `SELECT user_id, email, pen_name, payout_method FROM users WHERE user_id = $1`;
            const userResult = await pool.query(userQuery, [userId]);
            if (userResult.rows.length > 0) {
                userInfo = userResult.rows[0];
            }
        } catch (e) {
            console.log('Could not fetch user');
        }
        
        // Get earnings
        try {
            const earningsQuery = `
                SELECT 
                    e.*,
                    w.title as work_title
                FROM earnings e
                LEFT JOIN works w ON e.work_id = w.work_id
                WHERE e.user_id = $1
                ORDER BY e.created_at DESC
                LIMIT 50
            `;
            const earningsResult = await pool.query(earningsQuery, [userId]);
            earnings = earningsResult.rows;
            
            // Calculate summary
            const summaryQuery = `
                SELECT 
                    COALESCE(SUM(amount), 0) as total,
                    COALESCE(SUM(CASE WHEN status IN ('pending', 'unpaid') THEN amount ELSE 0 END), 0) as pending,
                    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid
                FROM earnings
                WHERE user_id = $1
            `;
            const summaryResult = await pool.query(summaryQuery, [userId]);
            if (summaryResult.rows.length > 0) {
                summary = {
                    total: parseFloat(summaryResult.rows[0].total) || 0,
                    pending: parseFloat(summaryResult.rows[0].pending) || 0,
                    paid: parseFloat(summaryResult.rows[0].paid) || 0
                };
            }
        } catch (e) {
            console.log('Earnings table may not exist:', e.message);
        }
        
        res.json({ userInfo, earnings, summary });
    } catch (error) {
        console.error('Error fetching user earnings:', error);
        res.status(500).json({ error: 'Failed to fetch user earnings' });
    }
});

// ===== REVENUE SHARING =====

// GET /api/finance/admin/revenue-sharing - Get revenue sharing configuration
router.get('/admin/revenue-sharing', async (req, res) => {
    try {
        // Return default revenue sharing model
        // This could be stored in database in future
        const revenueSharing = {
            author: { min: 40, max: 70, default: 60 },
            translator: { default: 20 },
            editor: { default: 10 },
            platform: { default: 30 },
            description: 'Authors receive 40-70% based on performance, translators 20%, editors 10%, platform 30%'
        };
        
        res.json({ revenueSharing });
    } catch (error) {
        console.error('Error fetching revenue sharing:', error);
        res.status(500).json({ error: 'Failed to fetch revenue sharing configuration' });
    }
});

module.exports = router;
