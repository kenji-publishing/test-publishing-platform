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
const { styleNote, contextNoteBlock } = require('./workProfile');

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
    de: 'German', ko: 'Korean', ar: 'Arabic', pt: 'Portuguese', it: 'Italian', 'zh-TW': 'Traditional Chinese (Taiwan)'
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

/**
 * 用語集の固有名詞に付いた冠詞を落とす。
 *
 * 指示文を強めても、英語の文法が強く冠詞を求める位置（"Poet is a Liar" の
 * ような述語）では取りこぼしが残る。どのモデルがどこで滑るかは実行ごとに
 * 変わるので、最後に機械的にそろえる。
 *
 * 触るのは「訳語が大文字で始まっていて、その語がそのまま現れている」時だけ。
 * 小文字の一般名詞（a shadow）は作者が普通名詞として使った箇所なので残す。
 * 英語向けの訳文にだけ適用する。スペイン語などの a は前置詞で、消すと壊れる。
 */
function stripArticlesBeforeNames(text, glossary, targetLang) {
    if (targetLang !== 'en') return text;   // 冠詞の規則は英語だけのもの
    if (!Array.isArray(glossary) || glossary.length === 0) return text;
    let out = String(text);
    glossary
        .map(g => g && typeof g.tgt === 'string' ? g.tgt.trim() : '')
        .filter(t => /^[A-Z]/.test(t))
        .forEach(term => {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // 冠詞だけ大文字小文字を問わない。用語そのものは大文字始まりに限定する
            out = out.replace(new RegExp('\\b(?:[Tt]he|[Aa]n?)\\s+(' + escaped + ')\\b', 'g'), '$1');
        });
    return out;
}

// 文字体系。訳し終えていない出力を見つけるのに使う
const SCRIPTS = {
    cjk: ["ja", "zh", "zh-TW", "ko"],
    arabic: ["ar"],
    latin: ["en", "es", "fr", "de", "pt", "it"]
};
const SCRIPT_RE = {
    cjk: /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g,
    arabic: /[\u0600-\u06ff]/g,
    latin: /[A-Za-z]/g
};
function scriptOf(lang) {
    for (const name of Object.keys(SCRIPTS)) if (SCRIPTS[name].indexOf(lang) !== -1) return name;
    return null;
}

/**
 * 訳されずに返ってきた出力を見つける。
 *
 * haiku が原稿をそのまま（用語集の語だけ置き換えて）返したことが実際にあり、
 * 気づいたのは出来上がった .docx を開いた人間だった。システムは何も言わなかった。
 * 原稿が長いほどチャンク数が増え、一度も起きない確率は下がっていく。
 * 「たまたま起きない」ではなく「起きたら必ず分かる」形にしておく。
 *
 * 判定は文字体系で行う。日本語→英語の訳文に日本語の文字が大量に混じっていれば、
 * それは訳し終えていない。閾値は25%と高めにして、固有名詞をそのまま残した
 * 正しい訳文を誤って弾かないようにしている。
 */
function looksUntranslated(translated, sourceLang, targetLang) {
    if (!sourceLang || !targetLang || sourceLang === targetLang) return false;
    const src = scriptOf(sourceLang), tgt = scriptOf(targetLang);
    if (!src || !tgt || src === tgt) return false;   // 同じ文字体系では判定しない
    const out = String(translated);
    if (out.trim().length < 40) return false;        // 短すぎて判定できない
    const hits = (out.match(SCRIPT_RE[src]) || []).length;
    return hits / out.length > 0.25;
}

/**
 * 原稿の各行に番号を振る。
 *
 * 「N行で返せ」と言葉で頼むだけでは、haiku は段落を割ったりまとめたりして
 * 数が合わなくなった（52行が101行に、47行が45行に）。番号を振って同じ番号で
 * 返させると、対応が言葉ではなく形で決まるので崩れない。実測で4件とも一致した。
 */
function numberLines(chunk) {
    return String(chunk).split('\n').map((l, i) => (i + 1) + '|' + l).join('\n');
}

/**
 * 番号つきの訳文を番号どおりに組み直す。1つでも欠けていたら null を返す。
 * 欠番を空行で埋めると本文が黙って消えるので、その時は組み直さない。
 */
function rebuildNumbered(translated, expectedCount, targetLang) {
    const got = new Map();
    for (const line of String(translated).split('\n')) {
        const m = /^\s*(\d+)\s*\|(.*)$/.exec(line);
        if (m) {
            const k = Number(m[1]);
            // 行頭の全角スペースは日本語の字下げ。英語などの訳文に付くと1字ずれる
            const lead = scriptOf(targetLang) === 'cjk' ? /^[ \t]+/ : /^[ \t\u3000]+/;
            if (!got.has(k)) got.set(k, m[2].replace(lead, ''));
        }
    }
    const out = [];
    for (let i = 1; i <= expectedCount; i++) {
        if (!got.has(i)) return null;
        out.push(got.get(i));
    }
    return out.join('\n');
}

/** 番号で組み直せなかった時に、行頭の番号だけ落として素の訳文に戻す */
function stripLineNumbers(text) {
    return String(text).split('\n').map(l => l.replace(/^\s*\d+\s*\|/, '')).join('\n');
}

/**
 * 訳文の行構造を原稿に合わせ直す。
 *
 * 「行を増やすな」と指示しても、モデルは段落の間に空行を入れることがある。
 * どのモデルが入れるかは実行ごとに変わる（同じ原稿で opus が入れた回と
 * sonnet が入れた回がある）ため、指示だけに頼らずここで直す。
 *
 * 触るのは「空行が増えただけ」と確認できた時だけ。中身のある行の数が原稿と
 * 一致しない場合は、段落を分けた・まとめた等の別の変化なので、そのまま返す。
 */
function matchLineStructure(source, translated) {
    const src = String(source).split('\n');
    const out = String(translated).split('\n');
    if (out.length === src.length) return translated;

    const outContent = out.filter(l => l.trim() !== '');
    const srcContentCount = src.filter(l => l.trim() !== '').length;
    if (outContent.length !== srcContentCount) return translated;

    // 原稿の空行の位置をそのまま再現する
    let i = 0;
    return src.map(s => (s.trim() === '' ? '' : outContent[i++])).join('\n');
}

function buildPrompt({ chunk, sourceLang, targetLang, tier, glossary, style, genre, contextNote }) {
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
            // 対応表を渡すだけでは足りない。英語の文法が冠詞を呼ぶので、
            // 「駅長 -> Chief」と書いても the Chief / a Liar になってしまう。
            // 効かなかったのは、上の品質指示（自然な英語にせよ・文学的に訳せ）と
            // 真正面からぶつかるため。どちらが優先かを書かないと、賢いモデルほど
            // 「自然さ」を選ぶ。実測でも opus だけが the Chief を出し続けた。
            // そこで (1) どちらが勝つかを明記し (2) 用語集自身の語で実例を示し
            // (3) 本文の直前（最後に読む位置）に置く、の3つで守らせる。
            const sample = glossary
                .map(g => g && g.tgt)
                .find(t => typeof t === 'string' && /^[A-Z]/.test(t.trim()));
            const example = sample
                ? ` For example write "${sample} said" and "he is ${sample}", never "the ${sample} said" or "he is a ${sample}".`
                : '';
            glossaryNote = [
                'Terminology — fixed renderings, not suggestions:',
                pairs,
                'Every right-hand term above that begins with a capital letter is a PROPER NAME in this work, even when it looks like a common noun or a job title.'
                    + ' Write it bare and exactly as given: no article (a/an/the) in front of it, no plural or other inflection, never lowercased, and never swapped for a descriptive phrase.'
                    + example
                    + ' This outranks natural phrasing: where a sentence would read more smoothly with an article, leave the article out anyway.',
                '', ''
            ].join('\n');
        }
    }

    const system = `You are a professional literary translator translating a novel or long-form text from ${srcName} to ${tgtName}.

${TIER_INSTRUCTIONS[tier]}${styleNote({ style, genre })}

When these pull in different directions, follow them in this order, highest first:
1. The output rules below — line count, markup markers, no preamble.
2. The terminology list below.
3. The author's background note, when one is supplied with the text.
4. The genre and register guidance above.
5. Natural, literary phrasing.

Rules:
- The text is one part of a longer manuscript; it may start or end mid-scene. Translate it as-is without adding introductions or conclusions.
- Keep the original paragraph breaks. The input is numbered line by line; answer with the same numbers, one line each, so the paragraphs stay where the author put them.
- Keep proper nouns consistent throughout.
- Lines that are markup markers — like [[img src="..." w="..." align="..."]], [[table]] or [[/table]] — must be copied to the output EXACTLY as-is, unchanged and in the same position. Inside a [[table]] block, translate the cell text but keep the " | " separators and the line structure.
- Respond with ONLY the ${tgtName} translation — no preamble, no explanations, no markdown fences.

${glossaryNote}`;

    // 原稿だけを user 側に置く。指示と本文が同じ発話に混ざっていると、
    // 本文の文体（自然な英語）に引きずられて規則の方が薄まる
    const lineCount = String(chunk).split('\n').length;
    return {
        system,
        // 最初に来る文が「その発話の用件」として読まれる。行数の話を先に置いたら
        // haiku が「N行出すこと」を仕事だと解釈し、原稿をそのまま返した
        // （用語集の語だけ置き換えた日本語が52行）。まず訳せと言い、最後にもう一度念を押す。
        user: contextNoteBlock(contextNote)
            + `Translate the ${srcName} text below into ${tgtName}. Write out the translation in full — every sentence, not a summary and not the original text.

Each line is numbered. Return exactly ${lineCount} lines, each beginning with the same number and a vertical bar, in the same order. Never merge, split, drop or add a line; a line that is empty stays empty.

${numberLines(chunk)}

(Remember: output lines 1| to ${lineCount}| in ${tgtName}, nothing else.)`
    };
}

/**
 * Translate one chunk (streaming to avoid HTTP timeouts on long outputs).
 * onText(charCount) fires per streamed delta for smooth real progress.
 */
async function translateChunk({ chunk, sourceLang, targetLang, tier, glossary, style, genre, contextNote }, requestOptions, onText) {
    if (!chunk.trim()) return chunk;
    const prompt = buildPrompt({ chunk, sourceLang, targetLang, tier, glossary, style, genre, contextNote });
    const stream = anthropic.messages.stream({
        model: MODEL_TIERS[tier],
        max_tokens: 16000,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }]
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
    // 番号で組み直せれば段落の対応は確実。組み直せなかった時だけ従来の直しに落とす
    const expected = String(chunk).split('\n').length;
    const rebuilt = rebuildNumbered(text, expected, targetLang);
    const body = rebuilt !== null ? rebuilt : matchLineStructure(chunk, stripLineNumbers(text));
    const result = stripArticlesBeforeNames(body, glossary, targetLang);
    if (looksUntranslated(result, sourceLang, targetLang)) {
        throw new Error(UNTRANSLATED_MESSAGE);
    }
    return result;
}

/**
 * Translate a short excerpt with all three tiers in parallel
 * (the wizard's quality-comparison step). Excerpt <= ~600 chars.
 */
async function translateSample({ text, sourceLang, targetLang, glossary, style, genre, contextNote }) {
    const tiers = ['haiku', 'sonnet', 'opus'];
    // 25s per-model cap + single retry: one hung model must not push the
    // whole comparison response past the 60s nginx proxy timeout (504)
    const results = await Promise.allSettled(
        tiers.map(tier => translateChunk({ chunk: text, sourceLang, targetLang, tier, glossary, style, genre, contextNote }, { timeout: 25000, maxRetries: 1 }))
    );
    const out = {};
    tiers.forEach((tier, i) => {
        out[tier] = results[i].status === 'fulfilled'
            ? results[i].value
            : `[${tier} unavailable: ${results[i].reason && results[i].reason.message}]`;
    });
    return out;
}

// 訳し終えていない出力。混雑とは違い待っても意味がないので、すぐ引き直す
const UNTRANSLATED_MESSAGE = 'The model returned the source text instead of a translation';
function isUntranslated(error) {
    return String((error && error.message) || '').includes(UNTRANSLATED_MESSAGE);
}

// 再試行しても解決しないエラー（安全システム拒否・クレジット切れ）は即座に失敗させる
function isNonRetryable(error) {
    const msg = String((error && error.message) || '');
    return msg.includes('declined by the model safety system') || msg.includes('credit balance');
}

/** 一時的なAPIエラー（過負荷・レート制限等）は間隔を空けて自動リトライ（混雑時は最大5回・指数バックオフ） */
async function withChunkRetry(fn, attempts = 5) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try { return await fn(); } catch (e) {
            lastErr = e;
            if (isNonRetryable(e)) throw e;
            if (i < attempts - 1) {
                const wait = isUntranslated(e) ? 1000 : 10000 * Math.pow(2, Math.min(i, 3));
                await new Promise(r => setTimeout(r, wait));
            }
        }
    }
    throw lastErr;
}

/**
 * Translate a full manuscript with the chosen tier. Chunked at paragraph
 * boundaries, processed sequentially. onProgress(0-100) is driven by the
 * characters streamed back so far (translated length ~ input length).
 *
 * Resumable: completedChunks (translated texts for the first N chunks, e.g.
 * loaded from the DB after a failure) are reused instead of re-translated;
 * onChunkDone(index, allChunksSoFar) fires after each chunk so the caller
 * can persist progress.
 */
async function translateText({ text, sourceLang, targetLang, tier, glossary, style, genre, contextNote, onProgress, completedChunks = [], onChunkDone }) {
    const chunks = chunkText(text);
    const totalChars = chunks.reduce((sum, c) => sum + c.length, 0) || 1;
    let doneChars = 0;
    const translated = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunkLen = chunks[i].length;

        // 前回の実行で完了済みのチャンクは再翻訳しない（API費・時間の節約）
        if (i < completedChunks.length && typeof completedChunks[i] === 'string') {
            translated.push(completedChunks[i]);
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
        translated.push(await withChunkRetry(() => {
            streamedChars = 0;
            return translateChunk(
                { chunk: chunks[i], sourceLang, targetLang, tier, glossary, style, genre, contextNote },
                undefined,
                (n) => { streamedChars += n; report(); }
            );
        }));
        doneChars += chunkLen;
        report();
        if (onChunkDone) await onChunkDone(i, translated.slice());
    }
    if (onProgress) onProgress(100);
    return translated.join('\n');
}

module.exports = { translateSample, translateText, MODEL_TIERS, TIER_INSTRUCTIONS };
