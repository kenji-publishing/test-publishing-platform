/**
 * Likes & Comments API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { moderateUserContent } = require('../config/moderation');

// ============================================
// LIKES
// ============================================

/**
 * POST /api/interactions/like
 * Like a work
 */
router.post('/like', async (req, res) => {
    try {
        const { workId, userId } = req.body;

        if (!workId || !userId) {
            return res.status(400).json({ error: 'workId and userId are required' });
        }

        // Add like
        await db.query(
            `INSERT INTO likes (work_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [workId, userId]
        );

        // Update like count on work
        await db.query(
            `UPDATE works SET like_count = (SELECT COUNT(*) FROM likes WHERE work_id = $1) WHERE work_id = $1`,
            [workId]
        );

        // Get updated count
        const countResult = await db.query(
            `SELECT like_count FROM works WHERE work_id = $1`,
            [workId]
        );

        res.json({
            success: true,
            liked: true,
            likeCount: countResult.rows[0]?.like_count || 0
        });

    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/interactions/like
 * Unlike a work
 */
router.delete('/like', async (req, res) => {
    try {
        const { workId, userId } = req.body;

        if (!workId || !userId) {
            return res.status(400).json({ error: 'workId and userId are required' });
        }

        // Remove like
        await db.query(
            `DELETE FROM likes WHERE work_id = $1 AND user_id = $2`,
            [workId, userId]
        );

        // Update like count on work
        await db.query(
            `UPDATE works SET like_count = (SELECT COUNT(*) FROM likes WHERE work_id = $1) WHERE work_id = $1`,
            [workId]
        );

        // Get updated count
        const countResult = await db.query(
            `SELECT like_count FROM works WHERE work_id = $1`,
            [workId]
        );

        res.json({
            success: true,
            liked: false,
            likeCount: countResult.rows[0]?.like_count || 0
        });

    } catch (error) {
        console.error('Unlike error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/interactions/like/check
 * Check if user liked a work
 */
router.get('/like/check', async (req, res) => {
    try {
        const { workId, userId } = req.query;

        if (!workId || !userId) {
            return res.status(400).json({ error: 'workId and userId are required' });
        }

        const result = await db.query(
            `SELECT * FROM likes WHERE work_id = $1 AND user_id = $2`,
            [workId, userId]
        );

        res.json({
            success: true,
            liked: result.rows.length > 0
        });

    } catch (error) {
        console.error('Check like error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// COMMENTS
// ============================================

/**
 * GET /api/interactions/comments/:workId
 * Get comments for a work
 */
router.get('/comments/:workId', async (req, res) => {
    try {
        const { workId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT c.*, u.first_name, u.last_name
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.work_id = $1 AND c.is_hidden = FALSE AND c.parent_comment_id IS NULL
             ORDER BY c.created_at DESC
             LIMIT $2 OFFSET $3`,
            [workId, limit, offset]
        );

        // Get replies for each comment
        const comments = await Promise.all(result.rows.map(async (comment) => {
            const replies = await db.query(
                `SELECT c.*, u.first_name, u.last_name
                 FROM comments c
                 JOIN users u ON c.user_id = u.user_id
                 WHERE c.parent_comment_id = $1 AND c.is_hidden = FALSE
                 ORDER BY c.created_at ASC`,
                [comment.comment_id]
            );
            return { ...comment, replies: replies.rows };
        }));

        // Get total count
        const countResult = await db.query(
            `SELECT COUNT(*) FROM comments WHERE work_id = $1 AND is_hidden = FALSE`,
            [workId]
        );

        res.json({
            success: true,
            comments,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/interactions/comment
 * Add a comment
 */
router.post('/comment', async (req, res) => {
    try {
        const { workId, userId, content, parentCommentId } = req.body;

        if (!workId || !userId || !content) {
            return res.status(400).json({ error: 'workId, userId, and content are required' });
        }

        // Moderate content
        const modResult = await moderateUserContent(content);
        if (!modResult.approved) {
            return res.status(400).json({ 
                error: 'Comment contains inappropriate content. Please revise and try again.',
                flags: modResult.flags,
                severity: modResult.severity
            });
        }

        // Check if flagged for review (warning but not blocked)
        const isFlagged = modResult.requiresReview || modResult.flags.length > 0;

        // Insert comment
        const result = await db.query(
            `INSERT INTO comments (work_id, user_id, content, parent_comment_id, is_flagged)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [workId, userId, content, parentCommentId || null, isFlagged]
        );

        // Update comment count on work
        await db.query(
            `UPDATE works SET comment_count = (SELECT COUNT(*) FROM comments WHERE work_id = $1 AND is_hidden = FALSE) WHERE work_id = $1`,
            [workId]
        );

        // Get user info
        const userResult = await db.query(
            `SELECT first_name, last_name FROM users WHERE user_id = $1`,
            [userId]
        );

        res.status(201).json({
            success: true,
            comment: {
                ...result.rows[0],
                first_name: userResult.rows[0]?.first_name,
                last_name: userResult.rows[0]?.last_name
            },
            warning: isFlagged ? 'Your comment has been flagged for review' : null
        });

    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/interactions/comment/:id
 * Delete a comment (by owner or author)
 */
router.delete('/comment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, isAuthor } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Check ownership or author permission
        const commentCheck = await db.query(
            `SELECT c.*, w.author_id FROM comments c
             JOIN works w ON c.work_id = w.work_id
             WHERE c.comment_id = $1`,
            [id]
        );

        if (commentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const comment = commentCheck.rows[0];
        const canDelete = comment.user_id === userId || comment.author_id === userId;

        if (!canDelete) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        // Soft delete (hide)
        await db.query(
            `UPDATE comments SET is_hidden = TRUE, hidden_reason = 'deleted_by_user' WHERE comment_id = $1`,
            [id]
        );

        // Update comment count
        await db.query(
            `UPDATE works SET comment_count = (SELECT COUNT(*) FROM comments WHERE work_id = $1 AND is_hidden = FALSE) WHERE work_id = $1`,
            [comment.work_id]
        );

        res.json({
            success: true,
            message: 'Comment deleted'
        });

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/interactions/comment/:id/report
 * Report a comment
 */
router.post('/comment/:id/report', async (req, res) => {
    try {
        const { id } = req.params;
        const { reporterId, reason, details } = req.body;

        if (!reporterId || !reason) {
            return res.status(400).json({ error: 'reporterId and reason are required' });
        }

        const validReasons = ['spam', 'harassment', 'hate_speech', 'inappropriate', 'other'];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({ error: 'Invalid reason' });
        }

        // Create report
        await db.query(
            `INSERT INTO comment_reports (comment_id, reporter_id, reason, details)
             VALUES ($1, $2, $3, $4) ON CONFLICT (comment_id, reporter_id) DO NOTHING`,
            [id, reporterId, reason, details || null]
        );

        // Update flag count
        await db.query(
            `UPDATE comments SET flag_count = flag_count + 1, is_flagged = TRUE WHERE comment_id = $1`,
            [id]
        );

        // Auto-hide if too many reports
        const flagResult = await db.query(
            `SELECT flag_count FROM comments WHERE comment_id = $1`,
            [id]
        );

        if (flagResult.rows[0]?.flag_count >= 3) {
            await db.query(
                `UPDATE comments SET is_hidden = TRUE, hidden_reason = 'auto_hidden_reports' WHERE comment_id = $1`,
                [id]
            );
        }

        res.json({
            success: true,
            message: 'Report submitted. Thank you for helping keep our community safe.'
        });

    } catch (error) {
        console.error('Report comment error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/interactions/comment/:id/hide
 * Hide a comment (by work author)
 */
router.put('/comment/:id/hide', async (req, res) => {
    try {
        const { id } = req.params;
        const { authorId, reason } = req.body;

        if (!authorId) {
            return res.status(400).json({ error: 'authorId is required' });
        }

        // Verify author
        const check = await db.query(
            `SELECT c.work_id, w.author_id FROM comments c
             JOIN works w ON c.work_id = w.work_id
             WHERE c.comment_id = $1`,
            [id]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (check.rows[0].author_id !== authorId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await db.query(
            `UPDATE comments SET is_hidden = TRUE, hidden_reason = $1 WHERE comment_id = $2`,
            [reason || 'hidden_by_author', id]
        );

        res.json({
            success: true,
            message: 'Comment hidden'
        });

    } catch (error) {
        console.error('Hide comment error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;