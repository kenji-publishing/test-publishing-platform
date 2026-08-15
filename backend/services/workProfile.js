/**
 * 作品の性格（ジャンル・文体/トーン）をAIへの指示文に落とす共通処理。
 *
 * AI校正・小説翻訳・マンガ翻訳の3つが同じ表を使う。ここに1つだけ置くのは、
 * 同じ一覧を各所に書き写すと片方だけ更新され続けるため（言語一覧で実際に起きた）。
 *
 * 値はフロントの選択肢と1対1の白名簿。利用者から届いた文字列をそのまま
 * 指示文へ入れることはしない（指示の乗っ取りを防ぐ）。
 */

const STYLES = {
    formal: 'formal and restrained',
    casual: 'casual and conversational',
    literary: 'literary',
    lightnovel: 'light-novel style',
    dramatic: 'dramatic',
    humorous: 'humorous',
    warm: 'warm and gentle',
    plain: 'plain and direct'
};

const GENRES = {
    fantasy: 'fantasy',
    romance: 'romance',
    scifi: 'science fiction',
    mystery: 'mystery',
    horror: 'horror',
    historical: 'historical fiction',
    isekai: 'isekai fantasy',
    slice: 'slice-of-life'
};

/**
 * 指示文に足す一文を返す。どちらも未指定なら空文字（従来どおりの指示文になる）。
 *
 * 「作者が書いた以上に寄せるな」と釘を刺しているのは、指定が装飾過多を
 * 招かないようにするため。校正は作者の文体を保つのが前提。
 */
function styleNote({ style, genre } = {}) {
    const parts = [];
    if (GENRES[genre]) parts.push(`the genre is ${GENRES[genre]}`);
    if (STYLES[style]) parts.push(`the intended register is ${STYLES[style]}`);
    if (!parts.length) return '';
    return `\n\nContext: ${parts.join(' and ')}. Let that guide word choice and rhythm where you are already making a change. Do not push the text further in that direction than the author has, and do not add flourishes the author did not write.`;
}

/** 保存前の検証。表にない値はnullにして落とす */
function normalizeStyle(v) { return STYLES[v] ? v : null; }
function normalizeGenre(v) { return GENRES[v] ? v : null; }

module.exports = { STYLES, GENRES, styleNote, normalizeStyle, normalizeGenre };
