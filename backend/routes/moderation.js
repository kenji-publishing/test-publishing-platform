/**
 * Content Moderation API Routes
 */

const express = require('express');
const router = express.Router();
const { moderateContent, moderateWork, moderateUserContent, SEVERITY } = require('../config/moderation');

/**
 * POST /api/moderation/check
 * Check a single piece of text
 */
router.post('/check', async (req, res) => {
    try {
        const { text, strictMode } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = await moderateContent(text, { strictMode: strictMode || false });

        res.json({
            success: true,
            result: result
        });

    } catch (error) {
        console.error('Moderation check error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/moderation/check-work
 * Check a complete work submission
 */
router.post('/check-work', async (req, res) => {
    try {
        const { title, description, content } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const result = await moderateWork({
            title: title || '',
            description: description || '',
            content: content || ''
        });

        res.json({
            success: true,
            result: result,
            message: result.approved 
                ? (result.requiresAdultTag ? 'Content approved with adult tag required' : 'Content approved')
                : 'Content blocked due to policy violation'
        });

    } catch (error) {
        console.error('Work moderation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/moderation/check-comment
 * Quick check for comments/reviews (strict mode)
 */
router.post('/check-comment', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = await moderateUserContent(text);

        res.json({
            success: true,
            approved: result.approved,
            flags: result.flags
        });

    } catch (error) {
        console.error('Comment moderation error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;