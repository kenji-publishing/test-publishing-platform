/**
 * Reader Feedback Routes
 * Handles translation feedback from readers
 */

const express = require('express');
const router = express.Router();

// Language names for display
const LANG_NAMES = {
    'ja': '日本語', 'en': 'English', 'zh': '中文',
    'es': 'Español', 'fr': 'Français', 'de': 'Deutsch',
    'ko': '한국어', 'ar': 'العربية'
};

// Category names
const CATEGORY_NAMES = {
    'mistranslation': '誤訳',
    'unnatural': '不自然な表現',
    'unclear': '意味不明',
    'typo': '誤字・脱字',
    'cultural': '文化的な問題',
    'other': 'その他'
};

// Middleware to get user ID from header (simplified auth)
const getUserId = (req) => {
    return req.headers['x-user-id'] || req.user?.userId;
};

/**
 * POST /api/feedback
 * Submit translation feedback
 */
router.post('/', async (req, res) => {
    try {
        const db = req.app.get('db');
        const userId = getUserId(req);
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const {
            workId,
            chapterId,
            translationId,
            sourceLanguage,
            targetLanguage,
            originalText,
            translatedText,
            textPositionStart,
            textPositionEnd,
            category,
            description,
            suggestedCorrection
        } = req.body;
        
        // Validation
        if (!workId || !translatedText || !category) {
            return res.status(400).json({ 
                error: 'workId, translatedText, and category are required' 
            });
        }
        
        // Check if work exists
        const workCheck = await db.query(
            'SELECT work_id, title FROM works WHERE work_id = $1::uuid',
            [workId]
        );
        
        if (workCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Work not found' });
        }
        
        // Check for duplicate feedback from same user for same text
        const duplicateCheck = await db.query(
            `SELECT feedback_id FROM translation_feedback
             WHERE work_id = $1::uuid
             AND reporter_id = $2::uuid
             AND translated_text = $3
             AND status != 'rejected'`,
            [workId, userId, translatedText]
        );
        
        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({ 
                error: 'You have already reported this issue',
                existingFeedbackId: duplicateCheck.rows[0].feedback_id
            });
        }
        
        // Insert feedback
        const result = await db.query(
            `INSERT INTO translation_feedback (
                work_id, chapter_id, translation_id, reporter_id,
                source_language, target_language,
                original_text, translated_text,
                text_position_start, text_position_end,
                category, description, suggested_correction
            ) VALUES (
                $1::uuid, $2::uuid, $3::uuid, $4::uuid,
                $5::varchar, $6::varchar,
                $7, $8,
                $9::int, $10::int,
                $11::varchar, $12, $13
            ) RETURNING *`,
            [
                workId,
                chapterId || null,
                translationId || null,
                userId,
                sourceLanguage || 'unknown',
                targetLanguage || 'unknown',
                originalText || null,
                translatedText,
                textPositionStart || null,
                textPositionEnd || null,
                category,
                description || null,
                suggestedCorrection || null
            ]
        );
        
        const feedback = result.rows[0];
        
        // Auto-agree by reporter (count as first agreement)
        await db.query(
            `INSERT INTO translation_feedback_agreements (feedback_id, user_id)
             VALUES ($1::uuid, $2::uuid)
             ON CONFLICT DO NOTHING`,
            [feedback.feedback_id, userId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: {
                feedbackId: feedback.feedback_id,
                category: feedback.category,
                categoryName: CATEGORY_NAMES[feedback.category] || feedback.category,
                agreeCount: 1,
                status: feedback.status
            }
        });
        
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/feedback/work/:workId
 * Get all feedback for a work
 */
router.get('/work/:workId', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { workId } = req.params;
        const userId = getUserId(req);
        const { status, category, sort, page = 1, limit = 20 } = req.query;
        
        let query = `
            SELECT 
                tf.feedback_id,
                tf.chapter_id,
                tf.source_language,
                tf.target_language,
                tf.original_text,
                tf.translated_text,
                tf.category,
                tf.description,
                tf.suggested_correction,
                tf.status,
                tf.agree_count,
                tf.created_at,
                tf.updated_at,
                u.pen_name as reporter_name,
                c.title as chapter_title
            FROM translation_feedback tf
            JOIN users u ON tf.reporter_id = u.user_id
            LEFT JOIN chapters c ON tf.chapter_id = c.chapter_id
            WHERE tf.work_id = $1::uuid
        `;
        
        const params = [workId];
        let paramIndex = 2;
        
        // Filters
        if (status) {
            query += ` AND tf.status = $${paramIndex}::varchar`;
            params.push(status);
            paramIndex++;
        }
        
        if (category) {
            query += ` AND tf.category = $${paramIndex}::varchar`;
            params.push(category);
            paramIndex++;
        }
        
        // Sorting
        switch (sort) {
            case 'oldest':
                query += ' ORDER BY tf.created_at ASC';
                break;
            case 'agrees':
                query += ' ORDER BY tf.agree_count DESC, tf.created_at DESC';
                break;
            default:
                query += ' ORDER BY tf.created_at DESC';
        }
        
        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT $${paramIndex}::int OFFSET $${paramIndex + 1}::int`;
        params.push(parseInt(limit), offset);
        
        const result = await db.query(query, params);
        
        // Get total count
        let countQuery = `
            SELECT COUNT(*) FROM translation_feedback 
            WHERE work_id = $1::uuid
        `;
        const countParams = [workId];
        let countParamIndex = 2;
        
        if (status) {
            countQuery += ` AND status = $${countParamIndex}::varchar`;
            countParams.push(status);
            countParamIndex++;
        }
        if (category) {
            countQuery += ` AND category = $${countParamIndex}::varchar`;
            countParams.push(category);
        }
        
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);
        
        // Check if current user has agreed to each feedback
        let userAgreements = [];
        if (userId) {
            const agreementResult = await db.query(
                `SELECT feedback_id FROM translation_feedback_agreements
                 WHERE user_id = $1::uuid
                 AND feedback_id = ANY($2::uuid[])`,
                [userId, result.rows.map(r => r.feedback_id)]
            );
            userAgreements = agreementResult.rows.map(r => r.feedback_id);
        }
        
        // Format response
        const feedbackList = result.rows.map(row => ({
            ...row,
            categoryName: CATEGORY_NAMES[row.category] || row.category,
            sourceLangName: LANG_NAMES[row.source_language] || row.source_language,
            targetLangName: LANG_NAMES[row.target_language] || row.target_language,
            hasUserAgreed: userAgreements.includes(row.feedback_id)
        }));
        
        res.json({
            feedback: feedbackList,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('Get work feedback error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/feedback/:feedbackId
 * Get single feedback detail
 */
router.get('/:feedbackId', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { feedbackId } = req.params;
        const userId = getUserId(req);
        
        const result = await db.query(
            `SELECT 
                tf.*,
                w.title as work_title,
                c.title as chapter_title,
                u.pen_name as reporter_name,
                ru.pen_name as resolver_name
             FROM translation_feedback tf
             JOIN works w ON tf.work_id = w.work_id
             LEFT JOIN chapters c ON tf.chapter_id = c.chapter_id
             JOIN users u ON tf.reporter_id = u.user_id
             LEFT JOIN users ru ON tf.resolved_by = ru.user_id
             WHERE tf.feedback_id = $1::uuid`,
            [feedbackId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        
        const feedback = result.rows[0];
        
        // Check if user has agreed
        let hasUserAgreed = false;
        if (userId) {
            const agreementCheck = await db.query(
                `SELECT 1 FROM translation_feedback_agreements
                 WHERE feedback_id = $1::uuid AND user_id = $2::uuid`,
                [feedbackId, userId]
            );
            hasUserAgreed = agreementCheck.rows.length > 0;
        }
        
        // Get list of agreers
        const agreersResult = await db.query(
            `SELECT u.pen_name, tfa.created_at
             FROM translation_feedback_agreements tfa
             JOIN users u ON tfa.user_id = u.user_id
             WHERE tfa.feedback_id = $1::uuid
             ORDER BY tfa.created_at ASC
             LIMIT 10`,
            [feedbackId]
        );
        
        res.json({
            feedback: {
                ...feedback,
                categoryName: CATEGORY_NAMES[feedback.category] || feedback.category,
                sourceLangName: LANG_NAMES[feedback.source_language] || feedback.source_language,
                targetLangName: LANG_NAMES[feedback.target_language] || feedback.target_language,
                hasUserAgreed,
                agreers: agreersResult.rows
            }
        });
        
    } catch (error) {
        console.error('Get feedback detail error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/feedback/:feedbackId/agree
 * Agree with a feedback report
 */
router.post('/:feedbackId/agree', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { feedbackId } = req.params;
        const userId = getUserId(req);
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Check if feedback exists
        const feedbackCheck = await db.query(
            'SELECT feedback_id, status FROM translation_feedback WHERE feedback_id = $1::uuid',
            [feedbackId]
        );
        
        if (feedbackCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        
        if (feedbackCheck.rows[0].status === 'rejected') {
            return res.status(400).json({ error: 'Cannot agree with rejected feedback' });
        }
        
        // Add agreement
        const result = await db.query(
            `INSERT INTO translation_feedback_agreements (feedback_id, user_id)
             VALUES ($1::uuid, $2::uuid)
             ON CONFLICT (feedback_id, user_id) DO NOTHING
             RETURNING *`,
            [feedbackId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'You have already agreed with this feedback' });
        }
        
        // Get updated agree count
        const countResult = await db.query(
            'SELECT agree_count FROM translation_feedback WHERE feedback_id = $1::uuid',
            [feedbackId]
        );
        
        res.json({
            success: true,
            message: 'Agreement added',
            agreeCount: countResult.rows[0].agree_count
        });
        
    } catch (error) {
        console.error('Agree feedback error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/feedback/:feedbackId/agree
 * Remove agreement from a feedback report
 */
router.delete('/:feedbackId/agree', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { feedbackId } = req.params;
        const userId = getUserId(req);
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const result = await db.query(
            `DELETE FROM translation_feedback_agreements
             WHERE feedback_id = $1::uuid AND user_id = $2::uuid
             RETURNING *`,
            [feedbackId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agreement not found' });
        }
        
        // Get updated agree count
        const countResult = await db.query(
            'SELECT agree_count FROM translation_feedback WHERE feedback_id = $1::uuid',
            [feedbackId]
        );
        
        res.json({
            success: true,
            message: 'Agreement removed',
            agreeCount: countResult.rows[0].agree_count
        });
        
    } catch (error) {
        console.error('Remove agreement error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/feedback/notifications/my
 * Get feedback notifications for current user (author/translator)
 */
router.get('/notifications/my', async (req, res) => {
    try {
        const db = req.app.get('db');
        const userId = getUserId(req);
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const result = await db.query(
            `SELECT 
                tfn.notification_id,
                tfn.recipient_role,
                tfn.is_read,
                tfn.created_at,
                tf.feedback_id,
                tf.category,
                tf.translated_text,
                tf.agree_count,
                tf.status,
                w.title as work_title,
                w.work_id
             FROM translation_feedback_notifications tfn
             JOIN translation_feedback tf ON tfn.feedback_id = tf.feedback_id
             JOIN works w ON tf.work_id = w.work_id
             WHERE tfn.recipient_id = $1::uuid
             ORDER BY tfn.created_at DESC
             LIMIT 50`,
            [userId]
        );
        
        const notifications = result.rows.map(row => ({
            ...row,
            categoryName: CATEGORY_NAMES[row.category] || row.category
        }));
        
        // Count unread
        const unreadCount = notifications.filter(n => !n.is_read).length;
        
        res.json({
            notifications,
            unreadCount
        });
        
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/feedback/notifications/:notificationId/read
 * Mark notification as read
 */
router.patch('/notifications/:notificationId/read', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { notificationId } = req.params;
        const userId = getUserId(req);
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const result = await db.query(
            `UPDATE translation_feedback_notifications
             SET is_read = true
             WHERE notification_id = $1::uuid AND recipient_id = $2::uuid
             RETURNING *`,
            [notificationId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json({ success: true, message: 'Marked as read' });
        
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/feedback/:feedbackId/resolve
 * Resolve feedback (for author/translator)
 */
router.patch('/:feedbackId/resolve', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { feedbackId } = req.params;
        const userId = getUserId(req);
        const { status, resolutionNote } = req.body;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Validate status
        const validStatuses = ['reviewing', 'accepted', 'rejected', 'fixed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
            });
        }
        
        // Check if user is author or translator of the work
        const authCheck = await db.query(
            `SELECT tf.feedback_id, w.author_id, t.translator_id
             FROM translation_feedback tf
             JOIN works w ON tf.work_id = w.work_id
             LEFT JOIN translations t ON tf.translation_id = t.translation_id
             WHERE tf.feedback_id = $1::uuid`,
            [feedbackId]
        );
        
        if (authCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        
        const { author_id, translator_id } = authCheck.rows[0];
        
        if (userId !== author_id && userId !== translator_id) {
            return res.status(403).json({ 
                error: 'Only the author or translator can resolve this feedback' 
            });
        }
        
        // Update feedback
        const result = await db.query(
            `UPDATE translation_feedback
             SET status = $1::varchar,
                 resolved_by = $2::uuid,
                 resolution_note = $3,
                 resolved_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE feedback_id = $4::uuid
             RETURNING *`,
            [status, userId, resolutionNote || null, feedbackId]
        );
        
        res.json({
            success: true,
            message: 'Feedback resolved',
            feedback: result.rows[0]
        });
        
    } catch (error) {
        console.error('Resolve feedback error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/feedback/stats/work/:workId
 * Get feedback statistics for a work
 */
router.get('/stats/work/:workId', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { workId } = req.params;
        
        // Get counts by status
        const statusResult = await db.query(
            `SELECT status, COUNT(*) as count
             FROM translation_feedback
             WHERE work_id = $1::uuid
             GROUP BY status`,
            [workId]
        );
        
        // Get counts by category
        const categoryResult = await db.query(
            `SELECT category, COUNT(*) as count
             FROM translation_feedback
             WHERE work_id = $1::uuid
             GROUP BY category`,
            [workId]
        );
        
        // Get total and high-priority (3+ agrees, pending)
        const totalResult = await db.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE agree_count >= 3 AND status = 'pending') as high_priority
             FROM translation_feedback
             WHERE work_id = $1::uuid`,
            [workId]
        );
        
        const statusCounts = {};
        statusResult.rows.forEach(row => {
            statusCounts[row.status] = parseInt(row.count);
        });
        
        const categoryCounts = {};
        categoryResult.rows.forEach(row => {
            categoryCounts[row.category] = {
                count: parseInt(row.count),
                name: CATEGORY_NAMES[row.category] || row.category
            };
        });
        
        res.json({
            total: parseInt(totalResult.rows[0].total),
            highPriority: parseInt(totalResult.rows[0].high_priority),
            byStatus: statusCounts,
            byCategory: categoryCounts
        });
        
    } catch (error) {
        console.error('Get feedback stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/feedback/my/reports
 * Get feedback reports submitted by current user
 */
router.get('/my/reports', async (req, res) => {
    try {
        const db = req.app.get('db');
        const userId = getUserId(req);
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const result = await db.query(
            `SELECT 
                tf.feedback_id,
                tf.category,
                tf.translated_text,
                tf.status,
                tf.agree_count,
                tf.created_at,
                w.title as work_title,
                w.work_id
             FROM translation_feedback tf
             JOIN works w ON tf.work_id = w.work_id
             WHERE tf.reporter_id = $1::uuid
             ORDER BY tf.created_at DESC
             LIMIT 50`,
            [userId]
        );
        
        const reports = result.rows.map(row => ({
            ...row,
            categoryName: CATEGORY_NAMES[row.category] || row.category
        }));
        
        res.json({ reports });
        
    } catch (error) {
        console.error('Get my reports error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
