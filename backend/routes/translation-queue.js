/**
 * AuctLect Platform - Translation Queue Management Routes
 * Phase 7: Translation Queue for Admin Dashboard
 * 
 * Handles translation request management, assignments, and progress tracking.
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Helper function to get database pool
function getPool(req) {
    return req.app.get('db');
}

// Every route in this file is an admin operation — admin JWT required.
router.use('/admin', authenticate, authorize('admin'));

// ===== ADMIN ENDPOINTS =====

// GET /api/translation-queue/admin/stats - Get translation queue statistics
router.get('/admin/stats', async (req, res) => {
    try {
        const pool = getPool(req);
        
        let stats = {
            total: 0,
            pending: 0,
            assigned: 0,
            in_progress: 0,
            review: 0,
            completed: 0,
            cancelled: 0,
            thisWeek: 0,
            thisMonth: 0,
            avgQualityScore: 0
        };
        
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
                    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                    COUNT(*) FILTER (WHERE status = 'review') as review,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed,
                    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
                    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as this_week,
                    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as this_month,
                    COALESCE(AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL), 0) as avg_quality
                FROM translation_requests
            `;
            const result = await pool.query(query);
            
            if (result.rows.length > 0) {
                stats = {
                    total: parseInt(result.rows[0].total) || 0,
                    pending: parseInt(result.rows[0].pending) || 0,
                    assigned: parseInt(result.rows[0].assigned) || 0,
                    in_progress: parseInt(result.rows[0].in_progress) || 0,
                    review: parseInt(result.rows[0].review) || 0,
                    completed: parseInt(result.rows[0].completed) || 0,
                    cancelled: parseInt(result.rows[0].cancelled) || 0,
                    thisWeek: parseInt(result.rows[0].this_week) || 0,
                    thisMonth: parseInt(result.rows[0].this_month) || 0,
                    avgQualityScore: Math.round(parseFloat(result.rows[0].avg_quality) || 0)
                };
            }
        } catch (e) {
            console.log('Translation requests table may not exist:', e.message);
        }
        
        // Get available translators count
        let translatorsCount = 0;
        try {
            const translatorsQuery = `
                SELECT COUNT(*) FROM users 
                WHERE 'translator' = ANY(roles) OR roles @> ARRAY['translator']::varchar[]
            `;
            const translatorsResult = await pool.query(translatorsQuery);
            translatorsCount = parseInt(translatorsResult.rows[0].count) || 0;
        } catch (e) {
            // Fallback: count all users as potential translators
            try {
                const fallbackQuery = `SELECT COUNT(*) FROM users`;
                const fallbackResult = await pool.query(fallbackQuery);
                translatorsCount = parseInt(fallbackResult.rows[0].count) || 0;
            } catch (e2) {
                console.log('Could not count translators');
            }
        }
        
        res.json({ stats, translatorsCount });
    } catch (error) {
        console.error('Error fetching translation queue stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// GET /api/translation-queue/admin/requests - Get translation requests list
router.get('/admin/requests', async (req, res) => {
    try {
        const pool = getPool(req);
        const { page = 1, limit = 20, status, priority, language, search } = req.query;
        
        let requests = [];
        let total = 0;
        
        try {
            let whereConditions = [];
            let params = [];
            let paramIndex = 1;
            
            if (status) {
                whereConditions.push(`tr.status = $${paramIndex++}::varchar`);
                params.push(status);
            }
            
            if (priority) {
                whereConditions.push(`tr.priority = $${paramIndex++}::varchar`);
                params.push(priority);
            }
            
            if (language) {
                whereConditions.push(`(tr.source_language = $${paramIndex}::varchar OR tr.target_language = $${paramIndex}::varchar)`);
                params.push(language);
                paramIndex++;
            }
            
            if (search) {
                whereConditions.push(`(
                    w.title ILIKE $${paramIndex}::varchar OR 
                    requester.pen_name ILIKE $${paramIndex}::varchar OR
                    translator.pen_name ILIKE $${paramIndex}::varchar
                )`);
                params.push(`%${search}%`);
                paramIndex++;
            }
            
            const whereClause = whereConditions.length > 0 
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';
            
            // Count total
            const countQuery = `
                SELECT COUNT(*) FROM translation_requests tr
                LEFT JOIN works w ON tr.work_id = w.work_id
                LEFT JOIN users requester ON tr.requested_by = requester.user_id
                LEFT JOIN users translator ON tr.assigned_to = translator.user_id
                ${whereClause}
            `;
            const countResult = await pool.query(countQuery, params);
            total = parseInt(countResult.rows[0].count) || 0;
            
            // Get requests
            const offset = (parseInt(page) - 1) * parseInt(limit);
            params.push(parseInt(limit));
            params.push(offset);
            
            const query = `
                SELECT 
                    tr.*,
                    w.title as work_title,
                    w.content_type,
                    requester.pen_name as requester_name,
                    requester.email as requester_email,
                    translator.pen_name as translator_name,
                    translator.email as translator_email,
                    (SELECT progress_percent FROM translation_progress 
                     WHERE request_id = tr.request_id 
                     ORDER BY updated_at DESC LIMIT 1) as current_progress
                FROM translation_requests tr
                LEFT JOIN works w ON tr.work_id = w.work_id
                LEFT JOIN users requester ON tr.requested_by = requester.user_id
                LEFT JOIN users translator ON tr.assigned_to = translator.user_id
                ${whereClause}
                ORDER BY 
                    CASE tr.priority 
                        WHEN 'urgent' THEN 1 
                        WHEN 'high' THEN 2 
                        WHEN 'normal' THEN 3 
                        ELSE 4 
                    END,
                    tr.created_at DESC
                LIMIT $${paramIndex++}::int OFFSET $${paramIndex}::int
            `;
            
            const result = await pool.query(query, params);
            requests = result.rows;
        } catch (e) {
            console.log('Translation requests table may not exist:', e.message);
        }
        
        res.json({
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching translation requests:', error);
        res.status(500).json({ error: 'Failed to fetch translation requests' });
    }
});

// GET /api/translation-queue/admin/requests/:requestId - Get single request details
router.get('/admin/requests/:requestId', async (req, res) => {
    try {
        const pool = getPool(req);
        const { requestId } = req.params;
        
        // Get request details
        const requestQuery = `
            SELECT 
                tr.*,
                w.title as work_title,
                w.description as work_description,
                w.content_type,
                requester.pen_name as requester_name,
                requester.email as requester_email,
                translator.pen_name as translator_name,
                translator.email as translator_email,
                reviewer.pen_name as reviewer_name
            FROM translation_requests tr
            LEFT JOIN works w ON tr.work_id = w.work_id
            LEFT JOIN users requester ON tr.requested_by = requester.user_id
            LEFT JOIN users translator ON tr.assigned_to = translator.user_id
            LEFT JOIN users reviewer ON tr.reviewed_by = reviewer.user_id
            WHERE tr.request_id = $1::uuid
        `;
        
        const requestResult = await pool.query(requestQuery, [requestId]);
        
        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        const request = requestResult.rows[0];
        
        // Get progress history
        let progress = [];
        try {
            const progressQuery = `
                SELECT * FROM translation_progress 
                WHERE request_id = $1::uuid 
                ORDER BY updated_at DESC
            `;
            const progressResult = await pool.query(progressQuery, [requestId]);
            progress = progressResult.rows;
        } catch (e) {
            console.log('Could not fetch progress');
        }
        
        // Get activity history
        let activities = [];
        try {
            const activityQuery = `
                SELECT * FROM translation_activity 
                WHERE request_id = $1::uuid 
                ORDER BY created_at DESC
            `;
            const activityResult = await pool.query(activityQuery, [requestId]);
            activities = activityResult.rows;
        } catch (e) {
            console.log('Could not fetch activities');
        }
        
        res.json({ request, progress, activities });
    } catch (error) {
        console.error('Error fetching translation request:', error);
        res.status(500).json({ error: 'Failed to fetch translation request' });
    }
});

// GET /api/translation-queue/admin/translators - Get available translators
router.get('/admin/translators', async (req, res) => {
    try {
        const pool = getPool(req);
        const { language } = req.query;
        
        let translators = [];
        
        try {
            // Get users who can be translators
            const query = `
                SELECT 
                    u.user_id,
                    u.pen_name,
                    u.email,
                    u.languages,
                    (SELECT COUNT(*) FROM translation_requests 
                     WHERE assigned_to = u.user_id AND status IN ('assigned', 'in_progress')) as active_assignments,
                    (SELECT COUNT(*) FROM translation_requests 
                     WHERE assigned_to = u.user_id AND status = 'completed') as completed_count,
                    (SELECT AVG(quality_score) FROM translation_requests 
                     WHERE assigned_to = u.user_id AND quality_score IS NOT NULL) as avg_quality
                FROM users u
                ORDER BY u.pen_name
            `;
            
            const result = await pool.query(query);
            translators = result.rows.map(t => ({
                ...t,
                active_assignments: parseInt(t.active_assignments) || 0,
                completed_count: parseInt(t.completed_count) || 0,
                avg_quality: Math.round(parseFloat(t.avg_quality) || 0)
            }));
        } catch (e) {
            console.log('Could not fetch translators:', e.message);
        }
        
        res.json({ translators });
    } catch (error) {
        console.error('Error fetching translators:', error);
        res.status(500).json({ error: 'Failed to fetch translators' });
    }
});

// POST /api/translation-queue/admin/requests - Create new translation request
router.post('/admin/requests', async (req, res) => {
    try {
        const pool = getPool(req);
        const { 
            workId, sourceLanguage, targetLanguage, requestType, 
            priority, wordCount, deadline, paymentAmount 
        } = req.body;
        
        if (!workId || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({ 
                error: 'Work ID, source language, and target language are required' 
            });
        }
        
        const query = `
            INSERT INTO translation_requests (
                work_id, source_language, target_language, request_type,
                priority, word_count, deadline, payment_amount, status
            ) VALUES ($1::uuid, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::int, $7::timestamp, $8::decimal, 'pending')
            RETURNING *
        `;
        
        const result = await pool.query(query, [
            workId,
            sourceLanguage,
            targetLanguage,
            requestType || 'human',
            priority || 'normal',
            wordCount || 0,
            deadline || null,
            paymentAmount || 0
        ]);
        
        // Record activity
        await pool.query(`
            INSERT INTO translation_activity (
                request_id, activity_type, activity_description, new_status, performed_by_name
            ) VALUES ($1::uuid, 'created', 'Translation request created', 'pending', 'Admin')
        `, [result.rows[0].request_id]);
        
        res.status(201).json({
            success: true,
            message: 'Translation request created',
            request: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating translation request:', error);
        res.status(500).json({ error: 'Failed to create translation request' });
    }
});

// PATCH /api/translation-queue/admin/requests/:requestId/assign - Assign translator
router.patch('/admin/requests/:requestId/assign', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { requestId } = req.params;
        const { translatorId, deadline, paymentAmount } = req.body;
        
        if (!translatorId) {
            return res.status(400).json({ error: 'Translator ID is required' });
        }
        
        await client.query('BEGIN');
        
        // Get current request
        const currentResult = await client.query(
            'SELECT status FROM translation_requests WHERE request_id = $1::uuid',
            [requestId]
        );
        
        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }
        
        const previousStatus = currentResult.rows[0].status;
        
        // Update request
        const updateQuery = `
            UPDATE translation_requests 
            SET assigned_to = $1::uuid,
                assigned_at = CURRENT_TIMESTAMP,
                status = 'assigned',
                deadline = COALESCE($2::timestamp, deadline),
                payment_amount = COALESCE($3::decimal, payment_amount),
                updated_at = CURRENT_TIMESTAMP
            WHERE request_id = $4::uuid
            RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
            translatorId, deadline || null, paymentAmount || null, requestId
        ]);
        
        // Get translator name
        const translatorResult = await client.query(
            'SELECT pen_name, email FROM users WHERE user_id = $1::uuid',
            [translatorId]
        );
        const translatorName = translatorResult.rows[0]?.pen_name || translatorResult.rows[0]?.email || 'Unknown';
        
        // Record activity
        await client.query(`
            INSERT INTO translation_activity (
                request_id, activity_type, activity_description, 
                previous_status, new_status, performed_by_name
            ) VALUES ($1::uuid, 'assigned', $2::varchar, $3::varchar, 'assigned', 'Admin')
        `, [requestId, `Assigned to ${translatorName}`, previousStatus]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Translator assigned',
            request: updateResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error assigning translator:', error);
        res.status(500).json({ error: 'Failed to assign translator' });
    } finally {
        client.release();
    }
});

// PATCH /api/translation-queue/admin/requests/:requestId/status - Update status
router.patch('/admin/requests/:requestId/status', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { requestId } = req.params;
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const validStatuses = ['pending', 'assigned', 'in_progress', 'review', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        await client.query('BEGIN');
        
        // Get current status
        const currentResult = await client.query(
            'SELECT status FROM translation_requests WHERE request_id = $1::uuid',
            [requestId]
        );
        
        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }
        
        const previousStatus = currentResult.rows[0].status;
        
        // Update status
        let updateQuery;
        if (status === 'completed') {
            updateQuery = `
                UPDATE translation_requests 
                SET status = $1::varchar, 
                    completed_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE request_id = $2::uuid
                RETURNING *
            `;
        } else {
            updateQuery = `
                UPDATE translation_requests 
                SET status = $1::varchar, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE request_id = $2::uuid
                RETURNING *
            `;
        }
        
        const updateResult = await client.query(updateQuery, [status, requestId]);
        
        // Record activity
        await client.query(`
            INSERT INTO translation_activity (
                request_id, activity_type, activity_description, 
                previous_status, new_status, performed_by_name
            ) VALUES ($1::uuid, 'status_change', $2::varchar, $3::varchar, $4::varchar, 'Admin')
        `, [requestId, notes || `Status changed to ${status}`, previousStatus, status]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Status updated',
            request: updateResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    } finally {
        client.release();
    }
});

// PATCH /api/translation-queue/admin/requests/:requestId/priority - Update priority
router.patch('/admin/requests/:requestId/priority', async (req, res) => {
    try {
        const pool = getPool(req);
        const { requestId } = req.params;
        const { priority } = req.body;
        
        if (!priority || !['low', 'normal', 'high', 'urgent'].includes(priority)) {
            return res.status(400).json({ error: 'Valid priority required' });
        }
        
        const result = await pool.query(
            `UPDATE translation_requests 
             SET priority = $1::varchar, updated_at = CURRENT_TIMESTAMP 
             WHERE request_id = $2::uuid 
             RETURNING *`,
            [priority, requestId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json({
            success: true,
            message: 'Priority updated',
            request: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating priority:', error);
        res.status(500).json({ error: 'Failed to update priority' });
    }
});

// POST /api/translation-queue/admin/requests/:requestId/review - Submit review
router.post('/admin/requests/:requestId/review', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { requestId } = req.params;
        const { qualityScore, reviewNotes, approved } = req.body;
        
        if (qualityScore === undefined || qualityScore < 0 || qualityScore > 100) {
            return res.status(400).json({ error: 'Quality score (0-100) is required' });
        }
        
        await client.query('BEGIN');
        
        const newStatus = approved ? 'completed' : 'in_progress';
        
        const updateQuery = `
            UPDATE translation_requests 
            SET quality_score = $1::int,
                review_notes = $2::varchar,
                status = $3::varchar,
                completed_at = CASE WHEN $4::boolean THEN CURRENT_TIMESTAMP ELSE completed_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE request_id = $5::uuid
            RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
            qualityScore, reviewNotes || null, newStatus, approved, requestId
        ]);
        
        if (updateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }
        
        // Record activity
        await client.query(`
            INSERT INTO translation_activity (
                request_id, activity_type, activity_description, new_status, performed_by_name
            ) VALUES ($1::uuid, 'reviewed', $2::varchar, $3::varchar, 'Admin')
        `, [
            requestId, 
            `Review submitted: Score ${qualityScore}/100. ${approved ? 'Approved' : 'Needs revision'}`,
            newStatus
        ]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: approved ? 'Translation approved' : 'Revision requested',
            request: updateResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    } finally {
        client.release();
    }
});

// POST /api/translation-queue/admin/requests/:requestId/progress - Update progress
router.post('/admin/requests/:requestId/progress', async (req, res) => {
    try {
        const pool = getPool(req);
        const { requestId } = req.params;
        const { progressPercent, wordsTranslated, notes } = req.body;
        
        // Insert progress record
        const progressQuery = `
            INSERT INTO translation_progress (
                request_id, progress_percent, words_translated, translator_notes
            ) VALUES ($1::uuid, $2::int, $3::int, $4::varchar)
            RETURNING *
        `;
        
        const progressResult = await pool.query(progressQuery, [
            requestId, progressPercent || 0, wordsTranslated || 0, notes || null
        ]);
        
        // Update request status if needed
        if (progressPercent > 0) {
            await pool.query(
                `UPDATE translation_requests 
                 SET status = CASE WHEN status = 'assigned' THEN 'in_progress' ELSE status END,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE request_id = $1::uuid`,
                [requestId]
            );
        }
        
        res.json({
            success: true,
            message: 'Progress updated',
            progress: progressResult.rows[0]
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

module.exports = router;
