/**
 * SES の不達・迷惑メール報告を受け取る。
 *
 * 経路: SES → SNS トピック → ここ（HTTPS POST）
 *
 * ■ なぜ要るか
 * sendEmail() は SES に渡した時点で success を返すため、実際に届いたかは分からない。
 * さらに一度不達になると SES が抑制リストに入れ、以後の送信を黙って止める。
 * こちらから気づく手段が他に無い。
 *
 * ■ 認証について
 * このエンドポイントは公開される。SNSの署名を必ず検証する（services/snsVerify.js）。
 * 検証を通らないものは記録も処理もしない。でないと、誰でも他人のアカウントに
 * 「不達」の印を付けられてしまう。
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verify } = require('../services/snsVerify');
const { createNotification } = require('../services/notificationService');

// 受け付けるトピックを固定できるようにする（設定後に .env へ入れる）
const ALLOWED_TOPIC = process.env.SES_SNS_TOPIC_ARN || null;

/**
 * 購読確認。SNSはトピックに登録した直後、確認用のURLを送ってくる。
 * これを開かないと通知が流れてこない。署名を検証したうえで自動的に開く。
 */
function confirmSubscription(subscribeUrl) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const u = new URL(subscribeUrl);
    // 念のため、開く先がAWSであることを確認する
    if (!/^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/.test(u.hostname)) {
      return reject(new Error('SubscribeURL is not AWS: ' + u.hostname));
    }
    https.get(subscribeUrl, { timeout: 8000 }, res => {
      res.resume();
      res.statusCode === 200 ? resolve() : reject(new Error('HTTP ' + res.statusCode));
    }).on('error', reject);
  });
}

/** 恒久的な不達と迷惑メール報告だけ「届かない」印を立てる */
function isPermanent(type, subtype) {
  if (type === 'Complaint') return true;
  return type === 'Bounce' && subtype === 'Permanent';
}

async function recordIssue({ email, type, subtype, diagnostic, sesMessageId }) {
  const user = (await db.query(
    `SELECT user_id, first_name FROM users WHERE lower(email) = lower($1)`, [email]
  )).rows[0];

  // 同じ通知が再送されても二重に記録しない（ses_message_id + email で一意）
  const ins = await db.query(
    `INSERT INTO email_delivery_issues (email, user_id, issue_type, issue_subtype, diagnostic, ses_message_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING
     RETURNING issue_id`,
    [email, user ? user.user_id : null, type, subtype || null,
     diagnostic ? String(diagnostic).slice(0, 2000) : null, sesMessageId || null]
  );
  if (ins.rowCount === 0) return { duplicate: true };

  if (user && isPermanent(type, subtype)) {
    await db.query(
      `UPDATE users SET email_undeliverable_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [user.user_id]
    );
  }
  return { duplicate: false, user };
}

/** 管理者に知らせる。届かないことに誰も気づかない、が一番まずい */
async function alertAdmins({ email, type, subtype, diagnostic, user }) {
  const permanent = isPermanent(type, subtype);
  const label = type === 'Complaint' ? '迷惑メール報告' : (permanent ? '恒久的な不達' : '一時的な不達');

  try {
    const admins = (await db.query(`SELECT user_id FROM users WHERE role = 'admin'`)).rows;
    for (const a of admins) {
      await createNotification({
        userId: a.user_id,
        type: 'system',
        title: `メールが届きませんでした（${label}）`,
        message:
          `${email} 宛のメールが届きませんでした。\n理由: ${(diagnostic || '不明').slice(0, 300)}\n\n` +
          (permanent
            ? 'このアドレスは AWS SES の抑制リストに入っている可能性が高く、放置すると以後のメールも届きません。'
              + 'SESコンソールの Suppression list を確認してください。'
            : '受信箱が満杯などの一時的な不達です。繰り返すようなら確認してください。'),
        actionUrl: '/pages/admin/index.html',
        email: permanent ? {
          subject: `【AuctLect】メール不達: ${email}`,
          lines: [
            `${email} 宛のメールが届きませんでした（${label}）。`,
            `理由: ${(diagnostic || '不明').slice(0, 300)}`,
            user ? `対象の利用者: ${user.first_name || ''}（アカウントあり）` : '登録アカウントとの紐付けはありません。',
            'AWS SES の Suppression list を確認し、原因が解消していれば削除してください。',
            'https://eu-west-2.console.aws.amazon.com/ses/home?region=eu-west-2#/suppression-list'
          ],
          actionLabel: '管理画面を開く'
        } : undefined
      });
    }
  } catch (e) {
    console.error('Bounce alert failed (continuing):', e.message);
  }
}

// SNSは Content-Type: text/plain で送ってくることがあるため、生のまま受ける
router.post('/notifications', express.text({ type: '*/*', limit: '1mb' }), async (req, res) => {
  let msg;
  try {
    msg = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    console.warn('SES webhook: body is not JSON');
    return res.status(400).send('bad request');
  }

  const result = await verify(msg, { allowedTopicArn: ALLOWED_TOPIC });
  if (!result.ok) {
    // 偽物か設定違い。処理しない。200を返さないことで、SNS側にも失敗が見える
    console.warn('SES webhook: signature verification failed —', result.reason);
    return res.status(403).send('forbidden');
  }

  try {
    if (msg.Type === 'SubscriptionConfirmation') {
      await confirmSubscription(msg.SubscribeURL);
      console.log('SES webhook: subscription confirmed for', msg.TopicArn);
      return res.json({ received: true, confirmed: true });
    }

    if (msg.Type === 'UnsubscribeConfirmation') {
      console.warn('SES webhook: UNSUBSCRIBED from', msg.TopicArn, '— bounce detection has stopped');
      return res.json({ received: true });
    }

    const body = JSON.parse(msg.Message);
    const sesMessageId = body.mail && body.mail.messageId;

    if (body.notificationType === 'Bounce' && body.bounce) {
      for (const r of body.bounce.bouncedRecipients || []) {
        const { duplicate, user } = await recordIssue({
          email: r.emailAddress,
          type: 'Bounce',
          subtype: body.bounce.bounceType,
          diagnostic: r.diagnosticCode || body.bounce.bounceSubType,
          sesMessageId
        });
        console.warn(`SES bounce: ${r.emailAddress} (${body.bounce.bounceType}/${body.bounce.bounceSubType})`);
        if (!duplicate) {
          await alertAdmins({
            email: r.emailAddress, type: 'Bounce', subtype: body.bounce.bounceType,
            diagnostic: r.diagnosticCode || body.bounce.bounceSubType, user
          });
        }
      }
    } else if (body.notificationType === 'Complaint' && body.complaint) {
      for (const r of body.complaint.complainedRecipients || []) {
        const { duplicate, user } = await recordIssue({
          email: r.emailAddress,
          type: 'Complaint',
          subtype: body.complaint.complaintFeedbackType || 'unknown',
          diagnostic: 'Marked as spam by the recipient',
          sesMessageId
        });
        console.warn(`SES complaint: ${r.emailAddress}`);
        if (!duplicate) {
          await alertAdmins({
            email: r.emailAddress, type: 'Complaint',
            subtype: body.complaint.complaintFeedbackType,
            diagnostic: 'Marked as spam by the recipient', user
          });
        }
      }
    } else {
      console.log('SES webhook: ignoring notificationType', body.notificationType);
    }

    res.json({ received: true });
  } catch (e) {
    // 200以外を返すとSNSが再送してくれる。取りこぼすより再送のほうがよい
    console.error('SES webhook error:', e.message);
    res.status(500).send('error');
  }
});

module.exports = router;
