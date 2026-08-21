/**
 * AI Manga Translation Service — Claude visionでマンガページ画像から
 * 吹き出し・ナレーション・効果音のテキストを抽出し翻訳する。
 * （案A: 画像への自動埋め込みはしない。翻訳文リストを返し、配置は
 *  マンガエディターで人間が行う）
 *
 * aiTranslationService/aiEditorServiceと同じ契約:
 * 3品質ティア、ページ=チャンクの逐次処理、onProgress、
 * completedChunks/onChunkDoneによる途中再開。
 */

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const MODEL_TIERS = {
    haiku: process.env.AI_MANGA_MODEL_HAIKU || process.env.AI_TRANSLATOR_MODEL_HAIKU || 'claude-haiku-4-5',
    sonnet: process.env.AI_MANGA_MODEL_SONNET || process.env.AI_TRANSLATOR_MODEL_SONNET || 'claude-sonnet-5',
    opus: process.env.AI_MANGA_MODEL_OPUS || process.env.AI_TRANSLATOR_MODEL_OPUS || 'claude-opus-4-8'
};

const LANG_NAMES = {
    en: 'English', ja: 'Japanese', zh: 'Chinese', es: 'Spanish', fr: 'French',
    de: 'German', ko: 'Korean', ar: 'Arabic', pt: 'Portuguese', it: 'Italian', 'zh-TW': 'Traditional Chinese (Taiwan)'
};

const TIER_INSTRUCTIONS = {
    haiku: 'Translate accurately and directly. Prioritize precision of meaning.',
    sonnet: 'Translate naturally, as if the dialogue was originally written in the target language. Keep each line short enough to fit a speech bubble.',
    opus: 'Translate at professional publishing quality: preserve each character\'s voice, tone, and humor; adapt idioms and wordplay so they land naturally; keep lines punchy and bubble-sized.'
};

const MEDIA_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };

function isNonRetryable(error) {
    const msg = String((error && error.message) || '');
    return msg.includes('declined by the model safety system') || msg.includes('credit balance');
}

function isOverloaded(error) {
    const msg = String((error && error.message) || '');
    return msg.includes('overloaded') || msg.includes('529') || msg.includes('rate_limit');
}

// 混雑(529)は時間をおけば通ることが多いので、より粘り強く待つ（10/20/40/80秒）
async function withRetry(fn, attempts = 5, onWait) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try { return await fn(); } catch (e) {
            lastErr = e;
            if (isNonRetryable(e)) throw e;
            if (i < attempts - 1) {
                const waitMs = (isOverloaded(e) ? 10000 : 15000) * Math.pow(2, Math.min(i, 3));
                if (onWait) onWait(i + 1, attempts, isOverloaded(e));
                await new Promise(r => setTimeout(r, waitMs));
            }
        }
    }
    throw lastErr;
}

function buildPrompt({ sourceLang, targetLang, tier, glossary }) {
    const srcName = LANG_NAMES[sourceLang] || sourceLang || 'the source language';
    const tgtName = LANG_NAMES[targetLang] || targetLang || 'the target language';
    let glossaryNote = '';
    if (Array.isArray(glossary) && glossary.length > 0) {
        const pairs = glossary
            .filter(g => g && g.src && g.tgt)
            .slice(0, 50)
            .map(g => `- "${g.src}" -> "${g.tgt}"`)
            .join('\n');
        if (pairs) glossaryNote = `\n\nTerminology to enforce (always translate the left term as the right term):\n${pairs}`;
    }

    return `You are a professional manga translator working on this manga page image (${srcName} original).

Extract EVERY piece of text on the page and translate it into ${tgtName}:
- speech bubbles, thought bubbles, narration boxes, signs/labels, and sound effects (SFX)
- List them in the page's natural reading order${sourceLang === 'ja' ? ' (Japanese manga: right-to-left, top-to-bottom)' : ''}
- For SFX, give the ${tgtName} meaning (e.g. "*crash*"); for signs, translate what they say
- For each item, also give "bbox": the approximate bounding box of that text on the image, as percentages of the full image size ({"x":left,"y":top,"w":width,"h":height}, each 0-100). A rough estimate is fine — it is only used to pre-place the translated text near the right spot for a human to adjust.

${TIER_INSTRUCTIONS[tier]}${glossaryNote}

Respond with ONLY this JSON (no markdown fences, no commentary):
{"bubbles":[{"type":"speech|thought|narration|sfx|sign","location":"short position hint in English (e.g. top-right panel)","bbox":{"x":0,"y":0,"w":0,"h":0},"original":"text as written","translation":"${tgtName} translation"}]}
If the page has no text at all, respond {"bubbles":[]}.`;
}

// bboxの検証（%座標）。数値でない・サイズ0以下は捨てて「bbox無し」扱い（手動配置にフォールバック）
function normalizeBbox(bb) {
    if (!bb || typeof bb !== 'object') return null;
    const x = Number(bb.x), y = Number(bb.y), w = Number(bb.w), h = Number(bb.h);
    if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return null;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    return {
        x: clamp(x, 0, 99), y: clamp(y, 0, 99),
        w: clamp(w, 1, 100), h: clamp(h, 1, 100)
    };
}

/** 1ページを翻訳（画像ファイル→吹き出しリスト） */
async function translatePage({ imagePath, sourceLang, targetLang, tier, glossary }, requestOptions) {
    const ext = path.extname(imagePath).toLowerCase();
    const mediaType = MEDIA_TYPES[ext] || 'image/jpeg';
    const data = fs.readFileSync(imagePath).toString('base64');

    const message = await anthropic.messages.create({
        model: MODEL_TIERS[tier],
        max_tokens: 5000, // bbox追加分の余裕（セリフが多いページの切り詰め防止）
        messages: [{
            role: 'user',
            content: [
                { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
                { type: 'text', text: buildPrompt({ sourceLang, targetLang, tier, glossary }) }
            ]
        }]
    }, requestOptions);

    if (message.stop_reason === 'refusal') {
        throw new Error('The translation request was declined by the model safety system');
    }
    const raw = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const jsonText = raw.replace(/^```(json)?/m, '').replace(/```\s*$/m, '').trim();
    const parsed = JSON.parse(jsonText);
    if (!parsed || !Array.isArray(parsed.bubbles)) throw new Error('Unexpected extraction result shape');
    return parsed.bubbles
        .filter(b => b && typeof b.original === 'string')
        .map(b => {
            const out = {
                type: String(b.type || 'speech'),
                location: String(b.location || ''),
                original: b.original,
                translation: String(b.translation || '')
            };
            const bbox = normalizeBbox(b.bbox);
            if (bbox) out.bbox = bbox; // 無効なら省略（エディター側は存在チェックで手動配置に戻る）
            return out;
        });
}

/**
 * 全ページを翻訳。ページ=チャンクで逐次処理・途中再開対応。
 * 戻り値: JSON文字列 {pages:[{page:1, bubbles:[...]}]}（result_textにそのまま保存できる形）
 */
async function translateManga({ pagePaths, sourceLang, targetLang, tier, glossary, onProgress, onStatus, completedChunks = [], onChunkDone }) {
    const results = [];
    for (let i = 0; i < pagePaths.length; i++) {
        // 前回完了済みページは再翻訳しない
        if (i < completedChunks.length && completedChunks[i]) {
            results.push(completedChunks[i]);
            if (onProgress) onProgress(Math.min(99, Math.round(((i + 1) / pagePaths.length) * 100)));
            continue;
        }
        if (onStatus) onStatus({ page: i + 1, total: pagePaths.length, retrying: false });
        const bubbles = await withRetry(
            () => translatePage({ imagePath: pagePaths[i], sourceLang, targetLang, tier, glossary }),
            5,
            (attempt, attempts, overloaded) => {
                if (onStatus) onStatus({ page: i + 1, total: pagePaths.length, retrying: true, attempt, attempts, overloaded });
            }
        );
        const pageResult = { page: i + 1, bubbles };
        results.push(pageResult);
        if (onProgress) onProgress(Math.min(99, Math.round(((i + 1) / pagePaths.length) * 100)));
        if (onChunkDone) await onChunkDone(i, results.slice());
    }
    if (onProgress) onProgress(100);
    return JSON.stringify({ pages: results });
}

/** お試し比較: 1ページを3品質で並列翻訳（各30s上限。混雑時は1回だけ短い間隔で再試行） */
async function sampleManga({ imagePath, sourceLang, targetLang }) {
    const tiers = ['haiku', 'sonnet', 'opus'];
    const runTier = async (tier) => {
        // セリフが多い・レイアウトが特殊なページは1回の読み取りに1分近くかかることがある。
        // 75s×1回（+混雑時のみ即時再試行1回）で、全体を必ずCloudflareの約100s上限内に収める
        // （旧設定の30s×SDK再試行×手動再試行は最悪124sでnginx/CFに切られていた）
        const started = Date.now();
        try {
            return await translatePage({ imagePath, sourceLang, targetLang, tier, glossary: [] }, { timeout: 75000, maxRetries: 0 });
        } catch (e) {
            if (isNonRetryable(e) || !isOverloaded(e)) throw e;
            await new Promise(r => setTimeout(r, 4000)); // 混雑は少し待つと通ることが多い
            // 再試行は全体90s以内に収まる残り時間だけ使う（混雑エラーは通常数秒で返るため実際はほぼ75s）
            const remaining = Math.max(90000 - (Date.now() - started), 15000);
            return await translatePage({ imagePath, sourceLang, targetLang, tier, glossary: [] }, { timeout: Math.min(remaining, 75000), maxRetries: 0 });
        }
    };
    const results = await Promise.allSettled(tiers.map(runTier));
    const out = {};
    tiers.forEach((tier, i) => {
        out[tier] = results[i].status === 'fulfilled'
            ? results[i].value
            : { error: (results[i].reason && results[i].reason.message) || 'failed', overloaded: isOverloaded(results[i].reason) };
    });
    return out;
}

module.exports = { translateManga, sampleManga, MODEL_TIERS };
