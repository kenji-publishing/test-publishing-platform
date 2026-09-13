/**
 * 来訪元（UTM・参照元）の整形
 *
 * フロント（navbar.js）が送ってくる値は利用者が自由に書き換えられるので、
 * 長さと文字種をここで揃えてから保存する。表示側でも必ずエスケープすること。
 */

const KEYS = ['source', 'medium', 'campaign', 'content'];

function cleanToken(v, max) {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase().slice(0, max || 100);
  // 英数・記号少々のみ。制御文字や空白は落とす
  const t = s.replace(/[^a-z0-9._\-:/]/g, '');
  return t || null;
}

function cleanUrl(v, max) {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, max || 500);
  if (!/^https?:\/\//i.test(s) && !s.startsWith('/')) return null;
  return s;
}

/** referrer から表示用のドメインを取り出す（自サイトなら null） */
function referrerHost(referrer, ownHosts) {
  if (!referrer) return null;
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
    if ((ownHosts || []).includes(h)) return null;
    return h || null;
  } catch (e) {
    return null;
  }
}

/**
 * フロントから来た acquisition オブジェクトを、users に入れる形に直す。
 * 何も無ければ null（列は空のまま）。
 */
function normalizeAcquisition(a) {
  if (!a || typeof a !== 'object') return null;
  const out = {
    source: cleanToken(a.source),
    medium: cleanToken(a.medium),
    campaign: cleanToken(a.campaign),
    content: cleanToken(a.content),
    referrer: cleanUrl(a.referrer),
    landing: cleanUrl(a.landing),
    at: null
  };
  if (a.at) {
    const d = new Date(a.at);
    if (!isNaN(d.getTime())) out.at = d;
  }
  if (!KEYS.some(k => out[k]) && !out.referrer && !out.landing) return null;
  return out;
}

/** 登録直後に users へ書き込む。失敗しても登録自体は止めない */
async function saveAcquisition(db, userId, raw) {
  const a = normalizeAcquisition(raw);
  if (!a) return;
  try {
    await db.query(
      `UPDATE users SET
         acquisition_source = $2, acquisition_medium = $3, acquisition_campaign = $4,
         acquisition_content = $5, acquisition_referrer = $6, acquisition_landing = $7,
         acquisition_at = COALESCE($8, NOW())
       WHERE user_id = $1 AND acquisition_source IS NULL AND acquisition_referrer IS NULL`,
      [userId, a.source, a.medium, a.campaign, a.content, a.referrer, a.landing, a.at]
    );
  } catch (e) {
    console.error('saveAcquisition failed:', e.message);
  }
}

module.exports = { cleanToken, cleanUrl, referrerHost, normalizeAcquisition, saveAcquisition };
