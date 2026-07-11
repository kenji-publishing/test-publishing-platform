/**
 * Direct Messages & Collaboration API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { moderateUserContent } = require('../config/moderation');
const { authenticate } = require('../middleware/auth');

// All messaging endpoints require a logged-in user. Identity always comes
// from the verified JWT (req.user.userId) — never from query/body, otherwise
// anyone could read or send messages as someone else.
router.use(authenticate);

/**
 * GET /api/messages/unread-count
 * 未読DM数（ナビバーのバッジ用。通知の未読数と合算して表示する）
 */
router.get('/unread-count', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT COUNT(*) AS count
             FROM messages m
             JOIN conversations c ON m.conversation_id = c.conversation_id
             WHERE (c.participant_1 = $1 OR c.participant_2 = $1)
               AND m.sender_id != $1 AND m.is_read = FALSE`,
            [req.user.userId]
        );
        res.json({ success: true, count: parseInt(result.rows[0].count, 10) });
    } catch (error) {
        console.error('Unread messages count error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/messages/conversations
 * Get all conversations for the authenticated user
 */
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await db.query(
            `SELECT c.*,
                    CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END as other_user_id,
                    u.first_name, u.last_name, u.email,
                    COALESCE(u.pen_name, u.first_name || ' ' || u.last_name) AS display_name,
                    (SELECT content FROM messages WHERE conversation_id = c.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.conversation_id AND sender_id != $1 AND is_read = FALSE) as unread_count
             FROM conversations c
             JOIN users u ON u.user_id = CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END
             WHERE c.participant_1 = $1 OR c.participant_2 = $1
             ORDER BY c.last_message_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            conversations: result.rows
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/messages/conversation/:id
 * Get messages in a conversation
 */
router.get('/conversation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Only participants may read a conversation
        const memberCheck = await db.query(
            `SELECT 1 FROM conversations
             WHERE conversation_id = $1 AND (participant_1 = $2 OR participant_2 = $2)`,
            [id, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You are not a participant of this conversation' });
        }

        const result = await db.query(
            `SELECT m.*, u.first_name, u.last_name
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             WHERE m.conversation_id = $1
             ORDER BY m.created_at ASC`,
            [id]
        );

        // Mark messages as read
        await db.query(
            `UPDATE messages SET is_read = TRUE
             WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
            [id, userId]
        );

        res.json({
            success: true,
            messages: result.rows
        });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/messages/send
 * Send a direct message
 */
router.post('/send', async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { recipientId, content } = req.body;

        if (!recipientId || !content) {
            return res.status(400).json({ error: 'recipientId and content are required' });
        }

        // Check if sender is blocked
        const blockCheck = await db.query(
            `SELECT * FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2`,
            [recipientId, senderId]
        );

        if (blockCheck.rows.length > 0) {
            return res.status(403).json({ error: 'You cannot message this user' });
        }

        // Check recipient's message settings
        const settingsCheck = await db.query(
            `SELECT allow_messages FROM user_message_settings WHERE user_id = $1`,
            [recipientId]
        );

        if (settingsCheck.rows.length > 0) {
            const settings = settingsCheck.rows[0];
            if (settings.allow_messages === 'none') {
                return res.status(403).json({ error: 'This user is not accepting messages' });
            }
        }

        // Moderate content
        const modResult = await moderateUserContent(content);
        if (!modResult.approved) {
            return res.status(400).json({ 
                error: 'Message contains inappropriate content',
                flags: modResult.flags
            });
        }

        // Find or create conversation
        let conversationId;
        const existingConv = await db.query(
            `SELECT conversation_id FROM conversations 
             WHERE (participant_1 = $1 AND participant_2 = $2) 
                OR (participant_1 = $2 AND participant_2 = $1)`,
            [senderId, recipientId]
        );

        if (existingConv.rows.length > 0) {
            conversationId = existingConv.rows[0].conversation_id;
        } else {
            const newConv = await db.query(
                `INSERT INTO conversations (participant_1, participant_2)
                 VALUES ($1, $2) RETURNING conversation_id`,
                [senderId, recipientId]
            );
            conversationId = newConv.rows[0].conversation_id;
        }

        // Insert message
        const messageResult = await db.query(
            `INSERT INTO messages (conversation_id, sender_id, content)
             VALUES ($1, $2, $3) RETURNING *`,
            [conversationId, senderId, content]
        );

        // Update conversation last_message_at
        await db.query(
            `UPDATE conversations SET last_message_at = NOW() WHERE conversation_id = $1`,
            [conversationId]
        );

        res.status(201).json({
            success: true,
            message: messageResult.rows[0]
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/messages/proposal
 * Send a collaboration proposal
 */
router.post('/proposal', async (req, res) => {
    try {
        const fromUserId = req.user.userId;
        const { toUserId, workId, proposalType, targetLanguage, message, portfolioUrl } = req.body;

        if (!toUserId || !proposalType || !message) {
            return res.status(400).json({
                error: 'toUserId, proposalType, and message are required'
            });
        }

        // Validate proposal type
        const validTypes = ['translation', 'editing', 'other'];
        if (!validTypes.includes(proposalType)) {
            return res.status(400).json({ error: 'Invalid proposal type' });
        }

        // Check if recipient accepts proposals
        const settingsCheck = await db.query(
            `SELECT allow_proposals FROM user_message_settings WHERE user_id = $1`,
            [toUserId]
        );

        if (settingsCheck.rows.length > 0 && !settingsCheck.rows[0].allow_proposals) {
            return res.status(403).json({ error: 'This user is not accepting collaboration proposals' });
        }

        // Moderate message
        const modResult = await moderateUserContent(message);
        if (!modResult.approved) {
            return res.status(400).json({ 
                error: 'Message contains inappropriate content',
                flags: modResult.flags
            });
        }

        // Create proposal
        const result = await db.query(
            `INSERT INTO collaboration_proposals 
             (work_id, from_user_id, to_user_id, proposal_type, target_language, message, portfolio_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [workId || null, fromUserId, toUserId, proposalType, targetLanguage || null, message, portfolioUrl || null]
        );

        res.status(201).json({
            success: true,
            proposal: result.rows[0]
        });

    } catch (error) {
        console.error('Create proposal error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/messages/proposals
 * Get proposals for a user
 */
router.get('/proposals', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type } = req.query;

        let query;
        if (type === 'sent') {
            query = `SELECT p.*, u.first_name, u.last_name, u.email
                     FROM collaboration_proposals p
                     JOIN users u ON p.to_user_id = u.user_id
                     WHERE p.from_user_id = $1
                     ORDER BY p.created_at DESC`;
        } else {
            query = `SELECT p.*, u.first_name, u.last_name, u.email
                     FROM collaboration_proposals p
                     JOIN users u ON p.from_user_id = u.user_id
                     WHERE p.to_user_id = $1
                     ORDER BY p.created_at DESC`;
        }

        const result = await db.query(query, [userId]);

        res.json({
            success: true,
            proposals: result.rows
        });

    } catch (error) {
        console.error('Get proposals error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/messages/proposal/:id/respond
 * Respond to a collaboration proposal
 */
router.put('/proposal/:id/respond', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { response } = req.body;

        if (!response) {
            return res.status(400).json({ error: 'response is required' });
        }

        const validResponses = ['accepted', 'declined'];
        if (!validResponses.includes(response)) {
            return res.status(400).json({ error: 'Response must be accepted or declined' });
        }

        const result = await db.query(
            `UPDATE collaboration_proposals 
             SET status = $1, responded_at = NOW()
             WHERE proposal_id = $2 AND to_user_id = $3
             RETURNING *`,
            [response, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        res.json({
            success: true,
            proposal: result.rows[0]
        });

    } catch (error) {
        console.error('Respond to proposal error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/messages/block
 * Block a user
 */
router.post('/block', async (req, res) => {
    try {
        const blockerId = req.user.userId;
        const { blockedId } = req.body;

        if (!blockedId) {
            return res.status(400).json({ error: 'blockedId is required' });
        }

        await db.query(
            `INSERT INTO blocked_users (blocker_id, blocked_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [blockerId, blockedId]
        );

        res.json({
            success: true,
            message: 'User blocked successfully'
        });

    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/messages/settings
 * Update message settings
 */
router.put('/settings', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { allowMessages, allowProposals } = req.body;

        await db.query(
            `INSERT INTO user_message_settings (user_id, allow_messages, allow_proposals)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO UPDATE SET
             allow_messages = COALESCE($2, user_message_settings.allow_messages),
             allow_proposals = COALESCE($3, user_message_settings.allow_proposals),
             updated_at = NOW()`,
            [userId, allowMessages || 'all', allowProposals !== false]
        );

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;