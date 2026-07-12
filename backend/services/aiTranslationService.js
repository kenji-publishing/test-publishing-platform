/**
 * AI Translation Service — Claude-powered novel/long-form translation
 * (used by routes/ai-translation.js; frontend: pages/novel-translator.html)
 *
 * Mirrors aiEditorService.js: three quality tiers, paragraph-boundary
 * chunking, streaming progress. Tiers map to translation depth:
 *   haiku  -> accurate, direct translation
 *   sonnet -> natural, fluent translation (reads as if written in the target language)
 *   opus   -> literary translation (preserves voice, rhythm, imagery, cultural nuance)
 */

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// Tier -> Claude model. Overridable via env without a deploy
// (falls back to the AI editor overrides so one env var can move both tools).
const MODEL_TIERS = {
    haiku: process.env.AI_TRANSLATOR_MODEL_HAIKU || process.env.AI_EDITOR_MODEL_HAIKU || 'claude-haiku-4-5',
    sonnet: process.env.AI_TRANSLATOR_MODEL_SONNET || process.env.AI_EDITOR_MODEL_SONNET || 'claude-sonnet-5',
    opus: process.env.AI_TRANSLATOR_MODEL_OPUS || process.env.AI_EDITOR_MODEL_OPUS || 'claude-opus-4-8'
};

const LANG_NAMES = {
    en: 'English', ja: 'Japanese', zh: 'Chinese', es: 'Spanish', fr: 'French',
    de: 'German', ko: 'Korean', ar: 'Arabic', pt: 'Portuguese', it: 'Italian'
};

const TIER_INSTRUCTIONS = {
    haiku: 'Produce an accurate, faithful translation. Stay close to the original sentence structure where the target language allows; prioritize precision of meaning over stylistic polish.',
    sonnet: 'Produce a natural, fluent translation that reads as if originally written in the target language. Adapt sentence structure and idioms where needed, while preserving the meaning, tone, and register of the original.',
    opus: 'Produce a literary translation of professional publishing quality. Preserve the author\'s voice, rhythm, imagery, and emotional impact; adapt idioms, wordplay, and cultural references so they land naturally for target-language readers. Never add or omit story content.'
};

const MAX_CHUNK_CHARS = 6000;

/** Split text into chunks at paragraph boundaries (same policy as the AI editor). */
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

function buildPrompt({ chunk, sourceLang, targetLang, tier, glossary }) {
    const srcName = LANG_NAMES[sourceLang] || sourceLang || 'the source language';
    const tgtName = LANG_NAMES[targetLang] || targetLang || 'the target language';
    let glossaryNote = '';
    if (Array.isArray(glossary) && glossary.length > 0) {
        const pairs = glossary
            .filter(g => g && g.src && g.tgt)
            .slice(0, 50)
            .map(g => `- "${g.src}" -> "${g.tgt}"`)
            .join('\n');
        if (pairs) {
            glossaryNote = `\n\nTerminology to enforce consistently (always translate the left term as the right term):\n${pairs}`;
        }
    }

    return `You are a professional literary translator translating a novel or long-form text from ${srcName} to ${tgtName}.

${TIER_INSTRUCTIONS[tier]}${glossaryNote}

Rules:
- The text is one part of a longer manuscript; it may start or end mid-scene. Translate it as-is without adding introductions or conclusions.
- Keep the original paragraph breaks and blank lines.
- Keep proper nouns consistent throughout.
- Respond with ONLY the ${tgtName} translation — no preamble, no explanations, no markdown fences.

Text to translate:
${chunk}`;
}

/**
 * Translate one chunk (streaming to avoid HTTP timeouts on long outputs).
 * onText(charCount) fires per streamed delta for smooth real progress.
 */
async function translateChunk({ chunk, sourceLang, targetLang, tier, glossary }, requestOptions, onText) {
    if (!chunk.trim()) return chunk;
    const stream = anthropic.messages.stream({
        model: MODEL_TIERS[tier],
        max_tokens: 16000,
        messages: [{ role: 'user', content: buildPrompt({ chunk, sourceLang, targetLang, tier, glossary }) }]
    }, requestOptions);
    if (onText) stream.on('text', (t) => onText(t.length));
    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
        throw new Error('The translation request was declined by the model safety system');
    }
    const text = message.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');
    if (!text.trim()) throw new Error('Empty translation result');
    return text;
}

/**
 * Translate a short excerpt with all three tiers in parallel
 * (the wizard's quality-comparison step). Excerpt <= ~600 chars.
 */
async function translateSample({ text, sourceLang, targetLang }) {
    const tiers = ['haiku', 'sonnet', 'opus'];
    // 25s per-model cap + single retry: one hung model must not push the
    // whole comparison response past the 60s nginx proxy timeout (504)
    const results = await Promise.allSettled(
        tiers.map(tier => translateChunk({ chunk: text, sourceLang, targetLang, tier }, { timeout: 25000, maxRetries: 1 }))
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
 * Translate a full manuscript with the chosen tier. Chunked at paragraph
 * boundaries, processed sequentially. onProgress(0-100) is driven by the
 * characters streamed back so far (translated length ~ input length).
 */
async function translateText({ text, sourceLang, targetLang, tier, glossary, onProgress }) {
    const chunks = chunkText(text);
    const totalChars = chunks.reduce((sum, c) => sum + c.length, 0) || 1;
    let doneChars = 0;
    const translated = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunkLen = chunks[i].length;
        let streamedChars = 0;
        const report = () => {
            if (!onProgress) return;
            const current = doneChars + Math.min(streamedChars, chunkLen);
            onProgress(Math.min(99, Math.round((current / totalChars) * 100)));
        };
        translated.push(await translateChunk(
            { chunk: chunks[i], sourceLang, targetLang, tier, glossary },
            undefined,
            (n) => { streamedChars += n; report(); }
        ));
        doneChars += chunkLen;
        report();
    }
    if (onProgress) onProgress(100);
    return translated.join('\n');
}

module.exports = { translateSample, translateText, MODEL_TIERS, TIER_INSTRUCTIONS };
