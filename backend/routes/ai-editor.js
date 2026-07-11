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
const { editSample, editText, MODEL_TIERS } = require('../services/aiEditorService');

const SAMPLE_MAX_CHARS = 600;
const EDIT_MAX_CHARS = 100000;
const JOB_TTL_MS = 30 * 60 * 1000; // jobs are kept for 30 minutes

// In-memory job store (single pm2 process; jobs are lost on restart, which
// is acceptable for v1 — the client shows an error and the user retries).
const jobs = new Map();

function cleanupJobs() {
    const now = Date.now();
    for (const [id, job] of jobs) {
        if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
    }
}

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
        const excerpt = String(text).slice(0, SAMPLE_MAX_CHARS);
        const samples = await editSample({ text: excerpt, language });
        res.json({ success: true, samples });
    } catch (error) {
        console.error('AI editor sample error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai-editor/edit
 * Start a full editing job. Returns { jobId }; poll GET /job/:jobId.
 */
router.post('/edit', authenticate, async (req, res) => {
    try {
        const { text, language, model, glossary } = req.body;
        if (!text || !String(text).trim()) {
            return res.status(400).json({ error: 'Text is required' });
        }
        if (String(text).length > EDIT_MAX_CHARS) {
            return res.status(400).json({
                error: `Text is too long (max ${EDIT_MAX_CHARS.toLocaleString()} characters per job)`
            });
        }
        const tier = MODEL_TIERS[model] ? model : 'sonnet';

        cleanupJobs();
        const jobId = `edit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const job = {
            userId: req.user.userId,
            status: 'processing',
            progress: 0,
            editedText: null,
            error: null,
            createdAt: Date.now()
        };
        jobs.set(jobId, job);

        // Process in the background; the client polls for progress
        editText({
            text: String(text),
            language,
            tier,
            glossary,
            onProgress: (pct) => { job.progress = pct; }
        }).then((editedText) => {
            job.status = 'completed';
            job.progress = 100;
            job.editedText = editedText;
        }).catch((error) => {
            console.error(`AI editor job ${jobId} failed:`, error);
            job.status = 'failed';
            job.error = error.message;
        });

        res.json({ success: true, jobId });
    } catch (error) {
        console.error('AI editor edit error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai-editor/job/:jobId
 * Poll an editing job (owner only).
 */
router.get('/job/:jobId', authenticate, (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job || job.userId !== req.user.userId) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json({
        success: true,
        status: job.status,
        progress: job.progress,
        editedText: job.status === 'completed' ? job.editedText : null,
        error: job.error
    });
});

module.exports = router;
