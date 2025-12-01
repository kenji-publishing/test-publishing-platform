/**
 * Publisher Platform - DMCA Management Routes
 * Phase 6: Copyright Infringement Management
 * 
 * Handles DMCA takedown requests, counter-notices, and related actions.
 */

const express = require('express');
const router = express.Router();

// Helper function to get database pool
function getPool(req) {
    return req.app.get('db');
}

// ===== PUBLIC ENDPOINTS =====

// POST /api/dmca/submit - Submit a DMCA takedown request (public)
router.post('/submit', async (req, res) => {
    try {
        const pool = getPool(req);
        const {
            reporterName,
            reporterEmail,
            reporterCompany,
            reporterAddress,
            reporterPhone,
            workId,
            workTitle,
            infringingUrl,
            originalWorkTitle,
            originalWorkUrl,
            originalWorkDescription,
            ownershipProof,
            reportType,
            description,
            goodFaithBelief,
            accuracyStatement,
            authorizationStatement,
            signature
        } = req.body;
        
        // Validation
        if (!reporterName || !reporterEmail || !originalWorkTitle || !description || !signature) {
            return res.status(400).json({ 
                error: 'Required fields: reporterName, reporterEmail, originalWorkTitle, description, signature' 
            });
        }
        
        if (!goodFaithBelief || !accuracyStatement || !authorizationStatement) {
            return res.status(400).json({ 
                error: 'All legal declarations must be confirmed' 
            });
        }
        
        const query = `
            INSERT INTO dmca_reports (
                reporter_name, reporter_email, reporter_company, reporter_address, reporter_phone,
                work_id, work_title, infringing_url,
                original_work_title, original_work_url, original_work_description, ownership_proof,
                report_type, description,
                good_faith_belief, accuracy_statement, authorization_statement, signature,
                status, priority
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14,
                $15, $16, $17, $18,
                'new', 'normal'
            )
            RETURNING report_id, created_at
        `;
        
        const result = await pool.query(query, [
            reporterName, reporterEmail, reporterCompany || null, reporterAddress || null, reporterPhone || null,
            workId || null, workTitle || null, infringingUrl || null,
            originalWorkTitle, originalWorkUrl || null, originalWorkDescription || null, ownershipProof || null,
            reportType || 'copyright', description,
            goodFaithBelief, accuracyStatement, authorizationStatement, signature
        ]);
        
        res.status(201).json({
            success: true,
            message: 'DMCA report submitted successfully',
            reportId: result.rows[0].report_id,
            createdAt: result.rows[0].created_at
        });
    } catch (error) {
        console.error('Error submitting DMCA report:', error);
        res.status(500).json({ error: 'Failed to submit DMCA report' });
    }
});

// POST /api/dmca/counter-notice - Submit a counter-notice (public)
router.post('/counter-notice', async (req, res) => {
    try {
        const pool = getPool(req);
        const {
            reportId,
            submitterName,
            submitterEmail,
            submitterAddress,
            submitterPhone,
            statement,
            goodFaithBelief,
            consentToJurisdiction,
            signature
        } = req.body;
        
        // Validation
        if (!reportId || !submitterName || !submitterEmail || !statement || !signature) {
            return res.status(400).json({ 
                error: 'Required fields: reportId, submitterName, submitterEmail, statement, signature' 
            });
        }
        
        if (!goodFaithBelief || !consentToJurisdiction) {
            return res.status(400).json({ 
                error: 'All legal declarations must be confirmed' 
            });
        }
        
        // Check if report exists
        const reportCheck = await pool.query(
            'SELECT report_id, status FROM dmca_reports WHERE report_id = $1::uuid',
            [reportId]
        );
        
        if (reportCheck.rows.length === 0) {
            return res.status(404).json({ error: 'DMCA report not found' });
        }
        
        const query = `
            INSERT INTO dmca_counter_notices (
                report_id, submitter_name, submitter_email, submitter_address, submitter_phone,
                statement, good_faith_belief, consent_to_jurisdiction, signature
            ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING counter_id, created_at
        `;
        
        const result = await pool.query(query, [
            reportId, submitterName, submitterEmail, submitterAddress || null, submitterPhone || null,
            statement, goodFaithBelief, consentToJurisdiction, signature
        ]);
        
        // Update report status to counter_notice
        await pool.query(
            `UPDATE dmca_reports SET status = 'counter_notice', updated_at = CURRENT_TIMESTAMP WHERE report_id = $1::uuid`,
            [reportId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Counter-notice submitted successfully',
            counterId: result.rows[0].counter_id
        });
    } catch (error) {
        console.error('Error submitting counter-notice:', error);
        res.status(500).json({ error: 'Failed to submit counter-notice' });
    }
});

// ===== ADMIN ENDPOINTS =====

// GET /api/dmca/admin/stats - Get DMCA statistics
router.get('/admin/stats', async (req, res) => {
    try {
        const pool = getPool(req);
        
        let stats = {
            total: 0,
            new: 0,
            reviewing: 0,
            action_taken: 0,
            rejected: 0,
            counter_notice: 0,
            thisWeek: 0,
            thisMonth: 0
        };
        
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'new') as new,
                    COUNT(*) FILTER (WHERE status = 'reviewing') as reviewing,
                    COUNT(*) FILTER (WHERE status = 'action_taken') as action_taken,
                    COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
                    COUNT(*) FILTER (WHERE status = 'counter_notice') as counter_notice,
                    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as this_week,
                    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as this_month
                FROM dmca_reports
            `;
            const result = await pool.query(query);
            
            if (result.rows.length > 0) {
                stats = {
                    total: parseInt(result.rows[0].total) || 0,
                    new: parseInt(result.rows[0].new) || 0,
                    reviewing: parseInt(result.rows[0].reviewing) || 0,
                    action_taken: parseInt(result.rows[0].action_taken) || 0,
                    rejected: parseInt(result.rows[0].rejected) || 0,
                    counter_notice: parseInt(result.rows[0].counter_notice) || 0,
                    thisWeek: parseInt(result.rows[0].this_week) || 0,
                    thisMonth: parseInt(result.rows[0].this_month) || 0
                };
            }
        } catch (e) {
            console.log('DMCA reports table may not exist');
        }
        
        res.json({ stats });
    } catch (error) {
        console.error('Error fetching DMCA stats:', error);
        res.status(500).json({ error: 'Failed to fetch DMCA statistics' });
    }
});

// GET /api/dmca/admin/reports - Get DMCA reports list
router.get('/admin/reports', async (req, res) => {
    try {
        const pool = getPool(req);
        const { page = 1, limit = 20, status, priority, search } = req.query;
        
        let reports = [];
        let total = 0;
        
        try {
            let whereConditions = [];
            let params = [];
            let paramIndex = 1;
            
            if (status) {
                whereConditions.push(`status = $${paramIndex++}::varchar`);
                params.push(status);
            }
            
            if (priority) {
                whereConditions.push(`priority = $${paramIndex++}::varchar`);
                params.push(priority);
            }
            
            if (search) {
                whereConditions.push(`(
                    reporter_name ILIKE $${paramIndex}::varchar OR 
                    reporter_email ILIKE $${paramIndex}::varchar OR 
                    work_title ILIKE $${paramIndex}::varchar OR
                    original_work_title ILIKE $${paramIndex}::varchar
                )`);
                params.push(`%${search}%`);
                paramIndex++;
            }
            
            const whereClause = whereConditions.length > 0 
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';
            
            // Count total
            const countQuery = `SELECT COUNT(*) FROM dmca_reports ${whereClause}`;
            const countResult = await pool.query(countQuery, params);
            total = parseInt(countResult.rows[0].count) || 0;
            
            // Get reports
            const offset = (parseInt(page) - 1) * parseInt(limit);
            params.push(parseInt(limit));
            params.push(offset);
            
            const query = `
                SELECT 
                    r.*,
                    w.title as linked_work_title,
                    w.status as work_status,
                    u.pen_name as assigned_to_name
                FROM dmca_reports r
                LEFT JOIN works w ON r.work_id = w.work_id
                LEFT JOIN users u ON r.assigned_to = u.user_id
                ${whereClause}
                ORDER BY 
                    CASE r.priority 
                        WHEN 'urgent' THEN 1 
                        WHEN 'high' THEN 2 
                        WHEN 'normal' THEN 3 
                        ELSE 4 
                    END,
                    r.created_at DESC
                LIMIT $${paramIndex++}::int OFFSET $${paramIndex}::int
            `;
            
            const result = await pool.query(query, params);
            reports = result.rows;
        } catch (e) {
            console.log('DMCA reports table may not exist:', e.message);
        }
        
        res.json({
            reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching DMCA reports:', error);
        res.status(500).json({ error: 'Failed to fetch DMCA reports' });
    }
});

// GET /api/dmca/admin/reports/:reportId - Get single report details
router.get('/admin/reports/:reportId', async (req, res) => {
    try {
        const pool = getPool(req);
        const { reportId } = req.params;
        
        // Get report details
        const reportQuery = `
            SELECT 
                r.*,
                w.title as linked_work_title,
                w.status as work_status,
                w.author_id,
                u.pen_name as assigned_to_name,
                author.email as author_email,
                author.pen_name as author_name
            FROM dmca_reports r
            LEFT JOIN works w ON r.work_id = w.work_id
            LEFT JOIN users u ON r.assigned_to = u.user_id
            LEFT JOIN users author ON w.author_id = author.user_id
            WHERE r.report_id = $1::uuid
        `;
        
        const reportResult = await pool.query(reportQuery, [reportId]);
        
        if (reportResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        const report = reportResult.rows[0];
        
        // Get action history
        let actions = [];
        try {
            const actionsQuery = `
                SELECT * FROM dmca_actions 
                WHERE report_id = $1::uuid 
                ORDER BY created_at DESC
            `;
            const actionsResult = await pool.query(actionsQuery, [reportId]);
            actions = actionsResult.rows;
        } catch (e) {
            console.log('Could not fetch actions');
        }
        
        // Get counter-notices
        let counterNotices = [];
        try {
            const counterQuery = `
                SELECT * FROM dmca_counter_notices 
                WHERE report_id = $1::uuid 
                ORDER BY created_at DESC
            `;
            const counterResult = await pool.query(counterQuery, [reportId]);
            counterNotices = counterResult.rows;
        } catch (e) {
            console.log('Could not fetch counter-notices');
        }
        
        res.json({ report, actions, counterNotices });
    } catch (error) {
        console.error('Error fetching DMCA report:', error);
        res.status(500).json({ error: 'Failed to fetch DMCA report' });
    }
});

// PATCH /api/dmca/admin/reports/:reportId/status - Update report status
router.patch('/admin/reports/:reportId/status', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { reportId } = req.params;
        const { status, notes, performedBy, performedByName } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        await client.query('BEGIN');
        
        // Get current status
        const currentResult = await client.query(
            'SELECT status FROM dmca_reports WHERE report_id = $1::uuid',
            [reportId]
        );
        
        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Report not found' });
        }
        
        const previousStatus = currentResult.rows[0].status;
        
        // Update status - using separate queries to avoid type inference issues
        let updateQuery;
        if (status === 'action_taken' || status === 'rejected') {
            updateQuery = `
                UPDATE dmca_reports 
                SET status = $1::varchar, 
                    updated_at = CURRENT_TIMESTAMP,
                    resolved_at = CURRENT_TIMESTAMP
                WHERE report_id = $2::uuid
                RETURNING *
            `;
        } else {
            updateQuery = `
                UPDATE dmca_reports 
                SET status = $1::varchar, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE report_id = $2::uuid
                RETURNING *
            `;
        }
        
        const updateResult = await client.query(updateQuery, [status, reportId]);
        
        // Record action
        const actionQuery = `
            INSERT INTO dmca_actions (
                report_id, action_type, action_description, 
                previous_status, new_status, 
                performed_by, performed_by_name
            ) VALUES ($1::uuid, 'status_change', $2::varchar, $3::varchar, $4::varchar, $5::uuid, $6::varchar)
        `;
        
        await client.query(actionQuery, [
            reportId,
            notes || `Status changed from ${previousStatus} to ${status}`,
            previousStatus,
            status,
            performedBy || null,
            performedByName || 'Admin'
        ]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Status updated',
            report: updateResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating DMCA status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    } finally {
        client.release();
    }
});

// PATCH /api/dmca/admin/reports/:reportId/priority - Update report priority
router.patch('/admin/reports/:reportId/priority', async (req, res) => {
    try {
        const pool = getPool(req);
        const { reportId } = req.params;
        const { priority } = req.body;
        
        if (!priority || !['low', 'normal', 'high', 'urgent'].includes(priority)) {
            return res.status(400).json({ error: 'Valid priority required: low, normal, high, urgent' });
        }
        
        const result = await pool.query(
            `UPDATE dmca_reports SET priority = $1::varchar, updated_at = CURRENT_TIMESTAMP WHERE report_id = $2::uuid RETURNING *`,
            [priority, reportId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        res.json({
            success: true,
            message: 'Priority updated',
            report: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating priority:', error);
        res.status(500).json({ error: 'Failed to update priority' });
    }
});

// POST /api/dmca/admin/reports/:reportId/action - Add action note
router.post('/admin/reports/:reportId/action', async (req, res) => {
    try {
        const pool = getPool(req);
        const { reportId } = req.params;
        const { actionType, description, performedBy, performedByName } = req.body;
        
        if (!actionType || !description) {
            return res.status(400).json({ error: 'Action type and description are required' });
        }
        
        const query = `
            INSERT INTO dmca_actions (
                report_id, action_type, action_description,
                performed_by, performed_by_name
            ) VALUES ($1::uuid, $2::varchar, $3::varchar, $4::uuid, $5::varchar)
            RETURNING *
        `;
        
        const result = await pool.query(query, [
            reportId, actionType, description,
            performedBy || null, performedByName || 'Admin'
        ]);
        
        // Update report updated_at
        await pool.query(
            'UPDATE dmca_reports SET updated_at = CURRENT_TIMESTAMP WHERE report_id = $1::uuid',
            [reportId]
        );
        
        res.json({
            success: true,
            message: 'Action recorded',
            action: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding action:', error);
        res.status(500).json({ error: 'Failed to add action' });
    }
});

// POST /api/dmca/admin/reports/:reportId/takedown - Execute takedown (suspend work)
router.post('/admin/reports/:reportId/takedown', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { reportId } = req.params;
        const { notes, performedBy, performedByName } = req.body;
        
        await client.query('BEGIN');
        
        // Get report
        const reportResult = await client.query(
            'SELECT * FROM dmca_reports WHERE report_id = $1::uuid',
            [reportId]
        );
        
        if (reportResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Report not found' });
        }
        
        const report = reportResult.rows[0];
        
        // Suspend the work if linked
        if (report.work_id) {
            await client.query(
                `UPDATE works SET status = 'suspended', updated_at = CURRENT_TIMESTAMP WHERE work_id = $1::uuid`,
                [report.work_id]
            );
        }
        
        // Update report status
        await client.query(
            `UPDATE dmca_reports SET status = 'action_taken', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE report_id = $1::uuid`,
            [reportId]
        );
        
        // Record action
        await client.query(`
            INSERT INTO dmca_actions (
                report_id, action_type, action_description,
                previous_status, new_status,
                performed_by, performed_by_name
            ) VALUES ($1::uuid, 'content_removed', $2::varchar, $3::varchar, 'action_taken', $4::uuid, $5::varchar)
        `, [
            reportId,
            notes || 'Content has been removed/suspended due to DMCA takedown request',
            report.status,
            performedBy || null,
            performedByName || 'Admin'
        ]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Takedown executed successfully',
            workSuspended: !!report.work_id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error executing takedown:', error);
        res.status(500).json({ error: 'Failed to execute takedown' });
    } finally {
        client.release();
    }
});

// PATCH /api/dmca/admin/reports/:reportId/reject - Reject DMCA report
router.patch('/admin/reports/:reportId/reject', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { reportId } = req.params;
        const { reason, performedBy, performedByName } = req.body;
        
        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }
        
        await client.query('BEGIN');
        
        // Get current status
        const currentResult = await client.query(
            'SELECT status FROM dmca_reports WHERE report_id = $1::uuid',
            [reportId]
        );
        
        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Report not found' });
        }
        
        // Update status to rejected
        await client.query(
            `UPDATE dmca_reports SET status = 'rejected', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE report_id = $1::uuid`,
            [reportId]
        );
        
        // Record action
        await client.query(`
            INSERT INTO dmca_actions (
                report_id, action_type, action_description,
                previous_status, new_status,
                performed_by, performed_by_name
            ) VALUES ($1::uuid, 'rejected', $2::varchar, $3::varchar, 'rejected', $4::uuid, $5::varchar)
        `, [
            reportId,
            `Report rejected: ${reason}`,
            currentResult.rows[0].status,
            performedBy || null,
            performedByName || 'Admin'
        ]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Report rejected'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error rejecting report:', error);
        res.status(500).json({ error: 'Failed to reject report' });
    } finally {
        client.release();
    }
});

module.exports = router;
