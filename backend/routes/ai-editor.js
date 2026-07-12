/**
 * AI Editor Routes — real Claude-powered proofreading/editing
 * (frontend: pages/ai-editor.html wizard)
 *
 * Full edits run as in-memory async jobs: POST /edit returns a jobId
 * immediately and the client polls GET /job/:jobId. This keeps long
 * manuscripts clear of the 60s nginx proxy timeout and lets the wizard
 * show real progress.
 *
 * NOTE: payment for editing jobs is NOT wired up yet — the wizard shows a
 * quote but no charge is made. Connect to Stripe (like work purchases)
 * before launch or clearly mark the tool as free.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { editSample } = require('../services/aiEditorService');

const SAMPLE_MAX_CHARS = 600;

// The 3-model comparison is free for users but costs the platform real API
// money (~JPY 3-5 per run), so cap runs per user per day
const SAMPLE_DAILY_LIMIT = 30;
const sampleUsage = new Map(); // userId -> { day, count }

/**
 * POST /api/ai-editor/sample
 * Run the three quality tiers on a short excerpt (wizard comparison step).
 */
router.post('/sample', authenticate, async (req, res) => {
    try {
        const { text, language } = req.body;
        if (!text || !String(text).trim()) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Per-user daily cap on free comparison runs
        const today = new Date().toISOString().slice(0, 10);
        let usage = sampleUsage.get(req.user.userId);
        if (!usage || usage.day !== today) {
            usage = { day: today, count: 0 };
            sampleUsage.set(req.user.userId, usage);
        }
        if (usage.count >= SAMPLE_DAILY_LIMIT) {
            return res.status(429).json({
                error: 'Daily comparison limit reached. Please try again tomorrow.',
                code: 'SAMPLE_LIMIT'
            });
        }
        usage.count++;

        const excerpt = String(text).slice(0, SAMPLE_MAX_CHARS);
        const samples = await editSample({ text: excerpt, language });
        res.json({ success: true, samples });
    } catch (error) {
        console.error('AI editor sample error:', error);
        res.status(500).json({ error: error.message });
    }
});

// NOTE: 本編集の実行は決済必須になったため routes/ai-tools.js に移動した
// （POST /api/ai-tools/checkout -> 支払い -> /orders/:id/run）。
// ここに残るのは無料のお試し比較 (/sample) のみ。

module.exports = router;
