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

/** Edit one chunk of text (streaming to avoid HTTP timeouts on long outputs). */
async function editChunk({ chunk, language, tier, glossary }) {
    if (!chunk.trim()) return chunk;
    const message = await anthropic.messages
        .stream({
            model: MODEL_TIERS[tier],
            max_tokens: 16000,
            messages: [{ role: 'user', content: buildPrompt({ chunk, language, tier, glossary }) }]
        })
        .finalMessage();

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
    const results = await Promise.allSettled(
        tiers.map(tier => editChunk({ chunk: text, language, tier }))
    );
    const out = {};
    tiers.forEach((tier, i) => {
        out[tier] = results[i].status === 'fulfilled'
            ? results[i].value
            : `[${tier} unavailable: ${results[i].reason && results[i].reason.message}]`;
    });
    return out;
}

/**
 * Edit a full manuscript with the chosen tier. Long texts are chunked at
 * paragraph boundaries and processed sequentially; onProgress(0-100) is
 * called after each chunk so the caller can report job progress.
 */
async function editText({ text, language, tier, glossary, onProgress }) {
    const chunks = chunkText(text);
    const edited = [];
    for (let i = 0; i < chunks.length; i++) {
        edited.push(await editChunk({ chunk: chunks[i], language, tier, glossary }));
        if (onProgress) onProgress(Math.round(((i + 1) / chunks.length) * 100));
    }
    return edited.join('\n');
}

module.exports = { editSample, editText, MODEL_TIERS, TIER_INSTRUCTIONS };
