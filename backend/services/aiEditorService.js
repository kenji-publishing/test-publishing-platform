/**
 * AI Editor Service — Claude-powered proofreading / editorial review
 * for novels and long-form text (used by routes/ai-editor.js).
 *
 * The product exposes three quality tiers priced per 1,000 chars; each tier
 * maps to a Claude model and an editing depth:
 *   haiku  -> light proofreading (typos, grammar, punctuation only)
 *   sonnet -> proofreading + editorial review (clarity, redundancy, consistency)
 *   opus   -> full literary polish (rhythm, imagery — preserving the author's voice)
 */

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// Tier -> Claude model. Overridable via env without a deploy.
const MODEL_TIERS = {
    haiku: process.env.AI_EDITOR_MODEL_HAIKU || 'claude-haiku-4-5',
    sonnet: process.env.AI_EDITOR_MODEL_SONNET || 'claude-sonnet-5',
    opus: process.env.AI_EDITOR_MODEL_OPUS || 'claude-opus-4-8'
};

const LANG_NAMES = {
    en: 'English', ja: 'Japanese', zh: 'Chinese', es: 'Spanish', fr: 'French',
    de: 'German', ko: 'Korean', ar: 'Arabic', pt: 'Portuguese', it: 'Italian'
};

const TIER_INSTRUCTIONS = {
    haiku: 'Perform light proofreading ONLY: fix typos, misspellings, grammar mistakes, and punctuation errors. Do NOT rephrase sentences, change word choices, or alter the style in any way.',
    sonnet: 'Perform proofreading and editorial review: fix typos, grammar, and punctuation; additionally tighten redundant phrasing, resolve awkward or unclear sentences, and fix inconsistencies (names, tense, register). Keep the author\'s voice and sentence order; do not rewrite passages that are already sound.',
    opus: 'Perform a full literary edit: fix all mechanical errors, and polish the prose for rhythm, flow, imagery, and impact as a professional fiction editor would. You may restructure sentences where it clearly improves the reading experience, but you must preserve the author\'s voice, meaning, plot, and tone. Never add new story content.'
};

const MAX_CHUNK_CHARS = 6000;

/**
 * Split text into chunks at paragraph boundaries (hard-split giant paragraphs)
 * so each Claude call stays comfortably sized.
 */
function chunkText(text, limit = MAX_CHUNK_CHARS) {
    const paragraphs = String(text).split(/\n/);
    const chunks = [];
    let current = [];
    let currentLen = 0;

    const flush = () => {
        if (current.length) {
            chunks.push(current.join('\n'));
            current = [];
            currentLen = 0;
        }
    };

    for (let p of paragraphs) {
        while (p.length > limit) {
            flush();
            chunks.push(p.slice(0, limit));
            p = p.slice(limit);
        }
        if (currentLen > 0 && currentLen + p.length > limit) flush();
        current.push(p);
        currentLen += p.length + 1;
    }
    flush();
    return chunks.length ? chunks : [''];
}

function buildPrompt({ chunk, language, tier, glossary }) {
    const langName = LANG_NAMES[language] || language || 'the source language';
    let glossaryNote = '';
    if (Array.isArray(glossary) && glossary.length > 0) {
        const pairs = glossary
            .filter(g => g && g.src && g.tgt)
            .slice(0, 50)
            .map(g => `- "${g.src}" -> "${g.tgt}"`)
            .join('\n');
        if (pairs) {
            glossaryNote = `\n\nTerminology to enforce consistently (replace every occurrence of the left term with the right term):\n${pairs}`;
        }
    }

    return `You are a professional ${langName} manuscript editor working on a novel or long-form text.

${TIER_INSTRUCTIONS[tier]}${glossaryNote}

Rules:
- The text is one part of a longer manuscript; it may start or end mid-scene. Edit it as-is without adding introductions or conclusions.
- Keep the original paragraph breaks and blank lines.
- Respond with ONLY the edited text — no preamble, no explanations, no markdown fences.

Text to edit:
${chunk}`;
}

/**
 * Edit one chunk of text (streaming to avoid HTTP timeouts on long outputs).
 * onText(charCount) fires for each streamed text delta so callers can report
 * smooth real progress instead of jumping at chunk boundaries.
 */
async function editChunk({ chunk, language, tier, glossary }, requestOptions, onText) {
    if (!chunk.trim()) return chunk;
    const stream = anthropic.messages.stream({
        model: MODEL_TIERS[tier],
        max_tokens: 16000,
        messages: [{ role: 'user', content: buildPrompt({ chunk, language, tier, glossary }) }]
    }, requestOptions);
    if (onText) stream.on('text', (t) => onText(t.length));
    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
        throw new Error('The editing request was declined by the model safety system');
    }
    const text = message.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');
    if (!text.trim()) throw new Error('Empty editing result');
    return text;
}

/**
 * Edit a short excerpt with all three tiers in parallel (the wizard's
 * quality-comparison step). Excerpt should be small (<= ~600 chars).
 */
async function editSample({ text, language }) {
    const tiers = ['haiku', 'sonnet', 'opus'];
    // 25s per-model cap + single retry: one hung model must not push the
    // whole comparison response past the 60s nginx proxy timeout (504)
    const results = await Promise.allSettled(
        tiers.map(tier => editChunk({ chunk: text, language, tier }, { timeout: 25000, maxRetries: 1 }))
    );
    const out = {};
    tiers.forEach((tier, i) => {
        out[tier] = results[i].status === 'fulfilled'
            ? results[i].value
            : `[${tier} unavailable: ${results[i].reason && results[i].reason.message}]`;
    });
    return out;
}

// 再試行しても解決しないエラー（安全システム拒否・クレジット切れ）は即座に失敗させる
function isNonRetryable(error) {
    const msg = String((error && error.message) || '');
    return msg.includes('declined by the model safety system') || msg.includes('credit balance');
}

/** 一時的なAPIエラー（過負荷・レート制限等）は間隔を空けて自動リトライ */
async function withChunkRetry(fn, attempts = 3) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try { return await fn(); } catch (e) {
            lastErr = e;
            if (isNonRetryable(e)) throw e;
            if (i < attempts - 1) await new Promise(r => setTimeout(r, (i + 1) * 15000));
        }
    }
    throw lastErr;
}

/**
 * Edit a full manuscript with the chosen tier. Long texts are chunked at
 * paragraph boundaries and processed sequentially. onProgress(0-100) is
 * driven by the characters streamed back so far (edited output length is
 * roughly the input length), giving a smooth real progress signal.
 *
 * Resumable: completedChunks (edited texts for the first N chunks) are reused
 * instead of re-edited; onChunkDone(index, allChunksSoFar) fires after each
 * chunk so the caller can persist progress. (Same contract as translateText.)
 */
async function editText({ text, language, tier, glossary, onProgress, completedChunks = [], onChunkDone }) {
    const chunks = chunkText(text);
    const totalChars = chunks.reduce((sum, c) => sum + c.length, 0) || 1;
    let doneChars = 0;
    const edited = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunkLen = chunks[i].length;

        // 前回の実行で完了済みのチャンクは再編集しない（API費・時間の節約）
        if (i < completedChunks.length && typeof completedChunks[i] === 'string') {
            edited.push(completedChunks[i]);
            doneChars += chunkLen;
            if (onProgress) onProgress(Math.min(99, Math.round((doneChars / totalChars) * 100)));
            continue;
        }

        let streamedChars = 0;
        const report = () => {
            if (!onProgress) return;
            const current = doneChars + Math.min(streamedChars, chunkLen);
            onProgress(Math.min(99, Math.round((current / totalChars) * 100)));
        };
        edited.push(await withChunkRetry(() => {
            streamedChars = 0;
            return editChunk(
                { chunk: chunks[i], language, tier, glossary },
                undefined,
                (n) => { streamedChars += n; report(); }
            );
        }));
        doneChars += chunkLen;
        report();
        if (onChunkDone) await onChunkDone(i, edited.slice());
    }
    if (onProgress) onProgress(100);
    return edited.join('\n');
}

module.exports = { editSample, editText, MODEL_TIERS, TIER_INSTRUCTIONS };
