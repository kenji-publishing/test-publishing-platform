const express = require('express');
const router = express.Router();

// Helper function to get database pool
function getPool(req) {
    return req.app.get('db');
}

// ===== ADMIN ENDPOINTS =====

// GET /api/moderation/admin/stats - Get moderation statistics
router.get('/admin/stats', async (req, res) => {
    try {
        const pool = getPool(req);
        
        const statsQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE status = 'draft') as draft,
                COUNT(*) FILTER (WHERE status = 'pending_review') as pending_review,
                COUNT(*) FILTER (WHERE status = 'published') as published,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
                COUNT(*) FILTER (WHERE status = 'archived') as archived,
                COUNT(*) as total
            FROM works
        `;
        
        const result = await pool.query(statsQuery);
        const stats = result.rows[0];
        
        res.json({
            draft: parseInt(stats.draft) || 0,
            pending_review: parseInt(stats.pending_review) || 0,
            published: parseInt(stats.published) || 0,
            rejected: parseInt(stats.rejected) || 0,
            archived: parseInt(stats.archived) || 0,
            total: parseInt(stats.total) || 0
        });
    } catch (error) {
        console.error('Error fetching moderation stats:', error);
        res.status(500).json({ error: 'Failed to fetch moderation statistics' });
    }
});

// GET /api/moderation/admin/works - Get works list for moderation
router.get('/admin/works', async (req, res) => {
    try {
        const pool = getPool(req);
        const { status, type, language, page = 1, limit = 20, search } = req.query;
        
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;
        
        if (status) {
            whereConditions.push(`w.status = $${paramIndex++}`);
            params.push(status);
        }
        
        if (type) {
            whereConditions.push(`w.work_type = $${paramIndex++}`);
            params.push(type);
        }
        
        if (language) {
            whereConditions.push(`w.original_language = $${paramIndex++}`);
            params.push(language);
        }
        
        if (search) {
            whereConditions.push(`(w.title ILIKE $${paramIndex} OR w.description ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';
        
        // Count total
        const countQuery = `SELECT COUNT(*) FROM works w ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        
        // Get works with author info
        const offset = (parseInt(page) - 1) * parseInt(limit);
        params.push(parseInt(limit));
        params.push(offset);
        
        const worksQuery = `
            SELECT 
                w.work_id,
                w.title,
                w.description,
                w.work_type,
                w.original_language,
                w.status,
                w.is_premium,
                w.content_warnings,
                w.created_at,
                w.updated_at,
                w.published_at,
                u.user_id as author_id,
                u.email as author_email,
                u.pen_name as author_pen_name,
                u.first_name as author_first_name,
                u.last_name as author_last_name
            FROM works w
            LEFT JOIN users u ON w.author_id = u.user_id
            ${whereClause}
            ORDER BY 
                CASE w.status 
                    WHEN 'pending_review' THEN 1 
                    WHEN 'draft' THEN 2
                    ELSE 3 
                END,
                w.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex}
        `;
        
        const worksResult = await pool.query(worksQuery, params);
        
        // Get chapter counts for each work
        const workIds = worksResult.rows.map(w => w.work_id);
        let chapterCounts = {};
        
        if (workIds.length > 0) {
            const chapterQuery = `
                SELECT work_id, COUNT(*) as chapter_count
                FROM chapters
                WHERE work_id = ANY($1)
                GROUP BY work_id
            `;
            const chapterResult = await pool.query(chapterQuery, [workIds]);
            chapterResult.rows.forEach(row => {
                chapterCounts[row.work_id] = parseInt(row.chapter_count);
            });
        }
        
        const works = worksResult.rows.map(work => ({
            ...work,
            chapter_count: chapterCounts[work.work_id] || 0
        }));
        
        res.json({
            works,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching works for moderation:', error);
        res.status(500).json({ error: 'Failed to fetch works' });
    }
});

// GET /api/moderation/admin/works/:workId - Get work details for moderation
router.get('/admin/works/:workId', async (req, res) => {
    try {
        const pool = getPool(req);
        const { workId } = req.params;
        
        // Get work details
        const workQuery = `
            SELECT 
                w.*,
                u.user_id as author_id,
                u.email as author_email,
                u.pen_name as author_pen_name,
                u.first_name as author_first_name,
                u.last_name as author_last_name,
                u.verified as author_verified
            FROM works w
            LEFT JOIN users u ON w.author_id = u.user_id
            WHERE w.work_id = $1
        `;
        
        const workResult = await pool.query(workQuery, [workId]);
        
        if (workResult.rows.length === 0) {
            return res.status(404).json({ error: 'Work not found' });
        }
        
        const work = workResult.rows[0];
        
        // Get chapters
        const chaptersQuery = `
            SELECT chapter_id, chapter_number, title, status, word_count, created_at
            FROM chapters
            WHERE work_id = $1
            ORDER BY chapter_number ASC
        `;
        const chaptersResult = await pool.query(chaptersQuery, [workId]);
        
        // Get moderation history (if table exists)
        let moderationHistory = [];
        try {
            const historyQuery = `
                SELECT mh.*, u.email as moderator_email, u.pen_name as moderator_name
                FROM moderation_history mh
                LEFT JOIN users u ON mh.moderator_id = u.user_id
                WHERE mh.work_id = $1
                ORDER BY mh.created_at DESC
            `;
            const historyResult = await pool.query(historyQuery, [workId]);
            moderationHistory = historyResult.rows;
        } catch (e) {
            // Table might not exist yet
            console.log('Moderation history table not found, skipping');
        }
        
        res.json({
            work,
            chapters: chaptersResult.rows,
            moderationHistory
        });
    } catch (error) {
        console.error('Error fetching work details:', error);
        res.status(500).json({ error: 'Failed to fetch work details' });
    }
});

// GET /api/moderation/admin/works/:workId/chapters/:chapterId - Get chapter content
router.get('/admin/works/:workId/chapters/:chapterId', async (req, res) => {
    try {
        const pool = getPool(req);
        const { workId, chapterId } = req.params;
        
        const query = `
            SELECT *
            FROM chapters
            WHERE work_id = $1 AND chapter_id = $2
        `;
        
        const result = await pool.query(query, [workId, chapterId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chapter not found' });
        }
        
        res.json({ chapter: result.rows[0] });
    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({ error: 'Failed to fetch chapter' });
    }
});

// PATCH /api/moderation/admin/works/:workId/approve - Approve a work
router.patch('/admin/works/:workId/approve', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { workId } = req.params;
        const { moderatorId, notes } = req.body;
        
        await client.query('BEGIN');
        
        // Update work status
        const updateQuery = `
            UPDATE works
            SET status = 'published',
                published_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE work_id = $1
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, [workId]);
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Work not found' });
        }
        
        // Try to log moderation action
        try {
            const historyQuery = `
                INSERT INTO moderation_history (work_id, moderator_id, action, notes, created_at)
                VALUES ($1, $2, 'approved', $3, CURRENT_TIMESTAMP)
            `;
            await client.query(historyQuery, [workId, moderatorId, notes || '']);
        } catch (e) {
            console.log('Could not log to moderation_history (table may not exist)');
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Work approved and published',
            work: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving work:', error);
        res.status(500).json({ error: 'Failed to approve work' });
    } finally {
        client.release();
    }
});

// PATCH /api/moderation/admin/works/:workId/reject - Reject a work
router.patch('/admin/works/:workId/reject', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { workId } = req.params;
        const { moderatorId, reason, notes } = req.body;
        
        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }
        
        await client.query('BEGIN');
        
        // Update work status
        const updateQuery = `
            UPDATE works
            SET status = 'rejected',
                updated_at = CURRENT_TIMESTAMP
            WHERE work_id = $1
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, [workId]);
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Work not found' });
        }
        
        // Try to log moderation action
        try {
            const historyQuery = `
                INSERT INTO moderation_history (work_id, moderator_id, action, reason, notes, created_at)
                VALUES ($1, $2, 'rejected', $3, $4, CURRENT_TIMESTAMP)
            `;
            await client.query(historyQuery, [workId, moderatorId, reason, notes || '']);
        } catch (e) {
            console.log('Could not log to moderation_history (table may not exist)');
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Work rejected',
            work: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error rejecting work:', error);
        res.status(500).json({ error: 'Failed to reject work' });
    } finally {
        client.release();
    }
});

// PATCH /api/moderation/admin/works/:workId/request-revision - Request revision
router.patch('/admin/works/:workId/request-revision', async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();
    
    try {
        const { workId } = req.params;
        const { moderatorId, feedback, notes } = req.body;
        
        if (!feedback) {
            return res.status(400).json({ error: 'Feedback is required' });
        }
        
        await client.query('BEGIN');
        
        // Update work status back to draft
        const updateQuery = `
            UPDATE works
            SET status = 'draft',
                updated_at = CURRENT_TIMESTAMP
            WHERE work_id = $1
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, [workId]);
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Work not found' });
        }
        
        // Try to log moderation action
        try {
            const historyQuery = `
                INSERT INTO moderation_history (work_id, moderator_id, action, reason, notes, created_at)
                VALUES ($1, $2, 'revision_requested', $3, $4, CURRENT_TIMESTAMP)
            `;
            await client.query(historyQuery, [workId, moderatorId, feedback, notes || '']);
        } catch (e) {
            console.log('Could not log to moderation_history (table may not exist)');
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Revision requested',
            work: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error requesting revision:', error);
        res.status(500).json({ error: 'Failed to request revision' });
    } finally {
        client.release();
    }
});

// GET /api/moderation/admin/recent - Get recent moderation activity
router.get('/admin/recent', async (req, res) => {
    try {
        const pool = getPool(req);
        const { limit = 10 } = req.query;
        
        // Get recently updated works
        const query = `
            SELECT 
                w.work_id,
                w.title,
                w.status,
                w.updated_at,
                u.pen_name as author_name,
                u.email as author_email
            FROM works w
            LEFT JOIN users u ON w.author_id = u.user_id
            WHERE w.status IN ('pending_review', 'published', 'rejected')
            ORDER BY w.updated_at DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [parseInt(limit)]);
        
        res.json({ recentActivity: result.rows });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

module.exports = router;
