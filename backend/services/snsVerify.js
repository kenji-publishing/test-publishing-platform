/**
 * Amazon SNS から来たメッセージが本物かを確かめる。
 *
 * このエンドポイントは認証なしで公開される。検証しなければ、誰でも
 * 「この読者のメールは不達だった」という嘘の通知を投げ込めてしまい、
 * 正常な利用者のアカウントに不達の印を付けられる。
 *
 * SNSは各メッセージに署名を付けており、公開鍵はAWSの証明書から取れる。
 * 手順は AWS の仕様どおり:
 *   1. 署名対象の文字列を、決められた順序で組み立てる
 *   2. SigningCertURL から証明書を取る（URLがAWSのものか必ず確認する）
 *   3. 署名を検証する
 */

const crypto = require('crypto');
const https = require('https');

// 証明書は毎回取りに行かない（同じ証明書が使い回される）
const certCache = new Map();

/** 署名の対象になるフィールドと、その順序。仕様で決まっている */
const SIGNABLE = {
  Notification: ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'],
  SubscriptionConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
  UnsubscribeConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type']
};

/**
 * 証明書のURLがAWSのものかを確かめる。
 * ここを緩めると、攻撃者が自分のサーバーの証明書を指定して、
 * 自分で署名した偽の通知を通せてしまう。
 */
function isAwsCertUrl(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== 'https:') return false;
  // sns.<region>.amazonaws.com / sns.<region>.amazonaws.com.cn
  if (!/^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/.test(u.hostname)) return false;
  if (!u.pathname.endsWith('.pem')) return false;
  return true;
}

function fetchCert(url) {
  if (certCache.has(url)) return Promise.resolve(certCache.get(url));
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 5000 }, res => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('cert fetch failed: HTTP ' + res.statusCode));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => { body += c; if (body.length > 64 * 1024) req.destroy(); });
      res.on('end', () => { certCache.set(url, body); resolve(body); });
    });
    req.on('timeout', () => req.destroy(new Error('cert fetch timeout')));
    req.on('error', reject);
  });
}

/** 署名対象の文字列を組み立てる。「キー\n値\n」を仕様の順序で並べる */
function buildStringToSign(msg) {
  const fields = SIGNABLE[msg.Type];
  if (!fields) throw new Error('unknown SNS message type: ' + msg.Type);
  let out = '';
  for (const f of fields) {
    if (msg[f] === undefined || msg[f] === null) continue;  // Subject は無いことがある
    out += f + '\n' + msg[f] + '\n';
  }
  return out;
}

/**
 * 本物かどうかを返す。判定できない理由も返す（ログに残すため）。
 * 検証に失敗したものは、絶対に処理してはいけない。
 */
async function verify(msg, { allowedTopicArn } = {}) {
  if (!msg || typeof msg !== 'object') return { ok: false, reason: 'not an object' };
  if (!SIGNABLE[msg.Type]) return { ok: false, reason: 'unknown type: ' + msg.Type };
  if (!msg.Signature || !msg.SigningCertURL) return { ok: false, reason: 'missing signature fields' };
  if (!isAwsCertUrl(msg.SigningCertURL)) return { ok: false, reason: 'cert URL is not AWS: ' + msg.SigningCertURL };

  // トピックを固定しておく。署名が正しくても、別のトピックからの通知は受け付けない
  if (allowedTopicArn && msg.TopicArn !== allowedTopicArn) {
    return { ok: false, reason: 'unexpected topic: ' + msg.TopicArn };
  }

  const algo = msg.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1';
  let pem;
  try {
    pem = await fetchCert(msg.SigningCertURL);
  } catch (e) {
    return { ok: false, reason: 'cert fetch: ' + e.message };
  }

  try {
    const verifier = crypto.createVerify(algo);
    verifier.update(buildStringToSign(msg), 'utf8');
    const ok = verifier.verify(pem, msg.Signature, 'base64');
    return ok ? { ok: true } : { ok: false, reason: 'signature mismatch' };
  } catch (e) {
    return { ok: false, reason: 'verify error: ' + e.message };
  }
}

module.exports = { verify, isAwsCertUrl, buildStringToSign };
