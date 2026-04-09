/**
 * Verification Routes
 * 
 * Handles user identity verification:
 * - Submit verification request
 * - Admin review queue
 * - Approve/reject requests
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/verification');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
        }
    }
});

// ========== USER ENDPOINTS ==========

/**
 * POST /api/verification/submit
 * Submit a verification request (for users)
 */
router.post('/submit', authenticate, upload.single('document'), async (req, res) => {
    try {
        const {
            userId,
            requestedRole,
            documentType,
            fullLegalName,
            dateOfBirth,
            nationality,
            additionalNotes
        } = req.body;

        if (!userId || !requestedRole || !documentType) {
            return res.status(400).json({
                error: 'userId, requestedRole, and documentType are required'
            });
        }

        // Check if user already has a pending request for this role
        const existing = await db.query(
            `SELECT request_id FROM verification_requests 
             WHERE user_id = $1 AND requested_role = $2 AND status = 'pending'`,
            [userId, requestedRole]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                error: 'You already have a pending verification request for this role'
            });
        }

        // Insert verification request
        const result = await db.query(
            `INSERT INTO verification_requests 
             (user_id, requested_role, document_type, document_url, document_filename,
              full_legal_name, date_of_birth, nationality, additional_notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
             RETURNING *`,
            [
                userId,
                requestedRole,
                documentType,
                req.file ? `/uploads/verification/${req.file.filename}` : null,
                req.file ? req.file.originalname : null,
                fullLegalName,
                dateOfBirth || null,
                nationality,
                additionalNotes
            ]
        );

        res.status(201).json({
            message: 'Verification request submitted successfully',
            request: result.rows[0]
        });
    } catch (error) {
        console.error('Submit verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/verification/my-requests/:userId
 * Get user's own verification requests
 */
router.get('/my-requests/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await db.query(
            `SELECT request_id, requested_role, document_type, status,
                    rejection_reason, created_at, reviewed_at
             FROM verification_requests
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({ requests: result.rows });
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ADMIN ENDPOINTS ==========

/**
 * GET /api/verification/admin/stats
 * Get verification statistics for dashboard
 */
router.get('/admin/stats', authenticate, authorize('admin'), async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'approved') as approved,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
                COUNT(*) FILTER (WHERE status = 'more_info_needed') as more_info_needed,
                COUNT(*) as total
            FROM verification_requests
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Verification stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/verification/admin/requests
 * Get all verification requests (with filtering)
 */
router.get('/admin/requests', authenticate, authorize('admin'), async (req, res) => {
    try {
        const {
            status = '',
            role = '',
            page = 1,
            limit = 20
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build WHERE clause
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (status) {
            whereConditions.push(`vr.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (role) {
            whereConditions.push(`vr.requested_role = $${paramIndex}`);
            params.push(role);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Get total count
        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM verification_requests vr ${whereClause}`,
            params
        );

        // Get requests with user info
        const result = await db.query(
            `SELECT 
                vr.request_id,
                vr.user_id,
                vr.requested_role,
                vr.document_type,
                vr.document_url,
                vr.document_filename,
                vr.full_legal_name,
                vr.date_of_birth,
                vr.nationality,
                vr.additional_notes,
                vr.status,
                vr.review_notes,
                vr.rejection_reason,
                vr.created_at,
                vr.reviewed_at,
                u.email,
                u.first_name,
                u.last_name,
                u.pen_name
             FROM verification_requests vr
             JOIN users u ON vr.user_id = u.user_id
             ${whereClause}
             ORDER BY 
                CASE vr.status 
                    WHEN 'pending' THEN 0 
                    WHEN 'more_info_needed' THEN 1 
                    ELSE 2 
                END,
                vr.created_at ASC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            requests: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get verification requests error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/verification/admin/requests/:requestId
 * Get single verification request details
 */
router.get('/admin/requests/:requestId', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { requestId } = req.params;

        const result = await db.query(
            `SELECT 
                vr.*,
                u.email,
                u.first_name,
                u.last_name,
                u.pen_name,
                u.country_code,
                u.created_at as user_created_at,
                reviewer.email as reviewer_email,
                reviewer.first_name as reviewer_first_name,
                reviewer.last_name as reviewer_last_name
             FROM verification_requests vr
             JOIN users u ON vr.user_id = u.user_id
             LEFT JOIN users reviewer ON vr.reviewed_by = reviewer.user_id
             WHERE vr.request_id = $1`,
            [requestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Verification request not found' });
        }

        res.json({ request: result.rows[0] });
    } catch (error) {
        console.error('Get verification detail error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/verification/admin/requests/:requestId/approve
 * Approve a verification request
 */
router.patch('/admin/requests/:requestId/approve', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reviewerId, reviewNotes } = req.body;

        // Get the request details
        const requestResult = await db.query(
            'SELECT user_id, requested_role FROM verification_requests WHERE request_id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Verification request not found' });
        }

        const { user_id, requested_role } = requestResult.rows[0];

        // Start transaction
        await db.query('BEGIN');

        // Update verification request
        await db.query(
            `UPDATE verification_requests
             SET status = 'approved',
                 reviewed_by = $1,
                 reviewed_at = CURRENT_TIMESTAMP,
                 review_notes = $2
             WHERE request_id = $3`,
            [reviewerId, reviewNotes, requestId]
        );

        // Add role to user if not exists
        const existingRole = await db.query(
            'SELECT * FROM user_roles WHERE user_id = $1 AND role_type = $2',
            [user_id, requested_role]
        );

        if (existingRole.rows.length > 0) {
            // Reactivate if exists
            await db.query(
                'UPDATE user_roles SET is_active = true WHERE user_id = $1 AND role_type = $2',
                [user_id, requested_role]
            );
        } else {
            // Create new role
            await db.query(
                'INSERT INTO user_roles (user_id, role_type, is_active) VALUES ($1, $2, true)',
                [user_id, requested_role]
            );
        }

        // Update user verified status
        await db.query(
            'UPDATE users SET verified = true WHERE user_id = $1',
            [user_id]
        );

        await db.query('COMMIT');

        res.json({
            message: 'Verification request approved',
            userId: user_id,
            role: requested_role
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Approve verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/verification/admin/requests/:requestId/reject
 * Reject a verification request
 */
router.patch('/admin/requests/:requestId/reject', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reviewerId, reviewNotes, rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const result = await db.query(
            `UPDATE verification_requests
             SET status = 'rejected',
                 reviewed_by = $1,
                 reviewed_at = CURRENT_TIMESTAMP,
                 review_notes = $2,
                 rejection_reason = $3
             WHERE request_id = $4
             RETURNING *`,
            [reviewerId, reviewNotes, rejectionReason, requestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Verification request not found' });
        }

        res.json({
            message: 'Verification request rejected',
            request: result.rows[0]
        });
    } catch (error) {
        console.error('Reject verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/verification/admin/requests/:requestId/request-info
 * Request more information from user
 */
router.patch('/admin/requests/:requestId/request-info', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reviewerId, reviewNotes, infoNeeded } = req.body;

        const result = await db.query(
            `UPDATE verification_requests
             SET status = 'more_info_needed',
                 reviewed_by = $1,
                 reviewed_at = CURRENT_TIMESTAMP,
                 review_notes = $2,
                 rejection_reason = $3
             WHERE request_id = $4
             RETURNING *`,
            [reviewerId, reviewNotes, infoNeeded, requestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Verification request not found' });
        }

        res.json({
            message: 'More information requested',
            request: result.rows[0]
        });
    } catch (error) {
        console.error('Request info error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
