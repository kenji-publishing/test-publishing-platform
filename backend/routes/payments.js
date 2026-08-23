/**
 * Payment Routes
 * Handles Stripe payment processing (PayPal etc. are offered by Stripe
 * Checkout itself, based on the payment methods enabled in the dashboard)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Stripe initialization
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Revenue distribution: derived per work from work_collaborators
// (platform 30% fixed, translator 20 / editor 10 when attached,
// author gets the remainder). See services/revenueSplitService.js.
const { createRevenueSplits } = require('../services/revenueSplitService');
const { createNotification } = require('../services/notificationService');
// 分配の前に、購入者の国のVATを総額から抜く。config/vatRates.js を参照
const { getVatRate, splitTaxFromGross, VAT_REGISTERED, EU27 } = require('../config/vatRates');

// 不正なUUIDをそのままSQLに渡すと 22P02 で500になるため、入口で弾く
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 購入者の国（ISO 3166-1 alpha-2）を取る。
 *
 * EU圏の読者への販売が始まった時点で気づけるようにするために記録する。
 * 将来VATの登録が必要になった場合、EUは顧客の所在地の証拠の保存を求めるが、
 * それは取引の時点でしか取れない。後から遡って作ることはできない。
 *
 * 請求先の国が取れればそれを使う。Stripeは決済手段によっては住所を集めないので、
 * 取れなければカード発行国で代用する（どちらもVAT上の所在地証拠として使われる種類のもの）。
 * どうしても取れなければ null。取れないこと自体で決済を止めはしない。
 */
async function resolveBuyerCountry(session) {
  try {
    const billing = session.customer_details && session.customer_details.address
      && session.customer_details.address.country;
    if (billing) return billing;

    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['payment_intent.latest_charge']
    });
    const card = full.payment_intent && full.payment_intent.latest_charge
      && full.payment_intent.latest_charge.payment_method_details
      && full.payment_intent.latest_charge.payment_method_details.card;
    return (card && card.country) || null;
  } catch (error) {
    console.error('Buyer country lookup failed (continuing):', error.message);
    return null;
  }
}

/**
 * EU圏の読者への販売を、税率表が揃うまで受け付けないための門番。
 *
 * EUはデジタル役務について、非EU事業者に免税枠を認めていない（アイルランド歳入庁に
 * 確認済み 2026-08-07）。1件でも売れば、その国の税率で徴収する義務が生じる。
 * 税率が空のまま売ると0%で徴収してしまい、不足分は当社が自腹で納めることになる。
 *
 * 国の判定には Cloudflare が付ける cf-ipcountry を使う。判定できない場合は通す。
 * ここで一律に止めると、ヘッダーが来ないだけで全世界の販売が死ぬ。
 * 取りこぼしは、決済後のもう一段の警告（notifyEuSaleWhileUnregistered）で拾う。
 */
function checkEuSaleAllowed(req) {
  if (VAT_REGISTERED) return { allowed: true, country: null };

  const country = (req.headers['cf-ipcountry'] || '').toUpperCase();
  if (!country || country === 'XX' || country === 'T1') {
    // Cloudflare の国判定が無効か、Tor 経由。止めずに通し、決済後の網に任せる
    return { allowed: true, country: country || null };
  }
  if (EU27.includes(country)) {
    return { allowed: false, country };
  }
  return { allowed: true, country };
}

/**
 * 門番をすり抜けてEU圏の購入が成立してしまった場合に知らせる。
 *
 * VPN経由などで国の判定が外れることはある。そのときに黙って進むと、
 * 「その月の翌月10日まで」の届け出期限を逃す。期限を過ぎると、EU27か国すべてに
 * 個別登録して申告する義務が生じるので、その日のうちに気づける状態にしておく。
 */
async function notifyEuSaleWhileUnregistered({ country, amount, currency, sessionId }) {
  if (VAT_REGISTERED || !country || !EU27.includes(country.toUpperCase())) return;

  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 1, 10);
  const by = deadline.toISOString().slice(0, 10);

  console.error(
    `EU SALE WHILE NOT VAT REGISTERED: country=${country}, amount=${amount} ${currency}, ` +
    `session=${sessionId}. Notify Irish Revenue (ossnsd@revenue.ie) by ${by}.`
  );

  try {
    const { sendEmail } = require('../config/email');
    const text =
      `EU圏（${country}）の読者への販売が成立しました。\n\n` +
      `金額: ${amount} ${currency}\n決済ID: ${sessionId}\n\n` +
      `当社はまだVAT登録が有効になっていません。EUはデジタル役務に免税枠を認めていないため、` +
      `この販売にはVATの申告義務があります。\n\n` +
      `【${by} までに】アイルランド歳入庁（ossnsd@revenue.ie）へ、供給を開始した旨を届け出てください。\n` +
      `この期限を過ぎると、EU加盟国すべてに個別に登録して申告する義務が生じます。\n\n` +
      `次にClaudeを開いたときに、このメールを見せてください。`;
    await sendEmail('info@auctlect.com', '【至急】EU圏への販売が発生しました（VAT未登録）', text,
      text.replace(/\n/g, '<br>'));
  } catch (e) {
    console.error('EU sale alert email failed:', e.message);
  }
}

/**
 * 作品が成人向けかどうかを取る。
 *
 * ルクセンブルク・ドイツ・ラトビア・ポルトガル・エストニアでは、成人向けは
 * 軽減税率の対象外になる（3%が17%になる等）。国だけでは税率が決まらない。
 *
 * 引けなかったときは「成人向けとみなす」＝高い方の税率を使う。
 * 低い方に倒すと徴収不足になり、その差額は当社が国に納めることになる。
 * 高い方に倒した場合は当社の取り分から出るだけで、後から社内で是正できる。
 */
async function resolveWorkIsAdult(workId) {
  if (!workId) return false;
  try {
    const r = await db.query('SELECT is_adult FROM works WHERE work_id = $1', [workId]);
    if (r.rows.length === 0) {
      console.error(`is_adult lookup: work ${workId} not found — treating as adult (higher rate)`);
      return true;
    }
    return !!r.rows[0].is_adult;
  } catch (e) {
    console.error(`is_adult lookup failed for work ${workId} — treating as adult (higher rate):`, e.message);
    return true;
  }
}

/**
 * 総額から税額と税抜き額を出す。
 *
 * 税率は「購入者の国」と「成人向けかどうか」の組み合わせで決まる。
 * VAT未登録の間は config/vatRates.js が常に 0 を返すので、税額0・税抜き=総額 になる。
 *
 * 税率表に無い国が来た場合は、決済は通したうえで警告を出す。
 * ここで例外を投げると購入自体が失敗し、記録も残らない。徴収漏れは後から
 * 是正できるが、失った決済は取り戻せない。
 */
function resolveTax(grossAmount, buyerCountry, isAdult, kind) {
  const { rate, registered, unknownCountry, adultRateApplied } =
    getVatRate(buyerCountry, { isAdult, kind });
  if (registered && unknownCountry) {
    console.error(
      `VAT rate missing for buyer country "${buyerCountry || '(unknown)'}" — charged as 0%. ` +
      `Add it to config/vatRates.js and correct the return for this period.`
    );
  }
  if (adultRateApplied) {
    console.log(`VAT: adult rate ${rate}% applied for ${buyerCountry}`);
  }
  const { vatAmount, netAmount } = splitTaxFromGross(grossAmount, rate);
  return { rate, vatAmount, netAmount };
}

/**
 * 全額返金の反映（charge.refundedから呼ばれる）
 * - 作品購入: purchasesをrefundedに（読者アクセスは自動で失効）、返金トランザクション記録、
 *   収益分配を打ち消すマイナス行を挿入（収益集計が自動で正しくなる。履歴は残る=監査可能）
 * - AIツール注文: 未完了ならcanceledに（完了済みは成果物提供済みの好意返金なので記録のみ）
 * 冪等: 同じイベントの再送では二重処理しない
 */
async function applyStripeRefund(sessionId) {
  // --- 作品購入の返金 ---
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // completedのときだけrefundedへ（再送時はここが0件になり二重処理を防ぐ）
    const purchase = (await client.query(
      `UPDATE purchases SET payment_status = 'refunded'
       WHERE transaction_id = $1 AND payment_status = 'completed'
       RETURNING user_id, work_id, amount, currency`,
      [sessionId]
    )).rows[0];

    if (purchase) {
      // プレゼントなら支払ったのは贈った人。返金の記録も贈った人名義にして
      // 購入(+)と返金(-)が同じ人の下で相殺されるようにする
      const gift = (await client.query(
        `SELECT gift_id, sender_id, recipient_id FROM gifts WHERE stripe_session_id = $1`,
        [sessionId]
      )).rows[0];
      const payerId = gift ? gift.sender_id : purchase.user_id;

      // 返金は購入の打ち消しなので、国・税率・税額も元の購入からそのまま引き継ぐ。
      // 空にすると「EU圏の売上」や納付済みVATを数えたときに購入だけが残り、相殺されない。
      // 税率は購入時点のものを使う（申告のやり直しは、その期の税率で行うため）
      await client.query(
        `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status, buyer_country, vat_rate, vat_amount, net_amount)
         SELECT $1, $2, 'refund', $3, $4, 'stripe', $5, 'completed',
                t.buyer_country, t.vat_rate, t.vat_amount, t.net_amount
           FROM transactions t
          WHERE t.payment_gateway_id = $5 AND t.transaction_type = 'purchase'
          LIMIT 1`,
        [payerId, purchase.work_id, purchase.amount, purchase.currency, sessionId]
      );
      if (gift) {
        await client.query(`UPDATE gifts SET status = 'refunded' WHERE gift_id = $1`, [gift.gift_id]);
      }
      // 元の分配を打ち消すマイナス行（SUMベースの収益表示・出金計算が自動で補正される）
      await client.query(
        `INSERT INTO revenue_splits (work_id, recipient_id, role, amount, currency, transaction_reference, status)
         SELECT work_id, recipient_id, role, -amount, currency, transaction_reference || ':refund', 'completed'
         FROM revenue_splits
         WHERE transaction_reference = $1 AND amount > 0`,
        [sessionId]
      );
      await client.query('COMMIT');
      console.log(`Refund applied: session=${sessionId}, work=${purchase.work_id}, buyer=${purchase.user_id}, amount=${purchase.amount} ${purchase.currency}`);

      // 通知（非致死）。プレゼントは「返金を受けた人」と「読めなくなる人」が別
      try {
        if (gift) {
          await createNotification({
            userId: gift.sender_id,
            type: 'gift',
            title: '返金が完了しました / Refund completed',
            message: `プレゼントの返金（${purchase.amount} ${purchase.currency}）が完了しました。贈った作品は相手のライブラリから読めなくなります。 / Your gift refund (${purchase.amount} ${purchase.currency}) has been processed.`,
            actionUrl: '/pages/library.html',
            icon: 'fa-gift'
          });
          await createNotification({
            userId: gift.recipient_id,
            type: 'system',
            title: 'プレゼントが取り消されました / Gift cancelled',
            message: `贈られていた作品の支払いが返金されたため、この作品はライブラリから読めなくなります。 / The gifted work has been refunded and is no longer available in your library.`,
            actionUrl: '/pages/library.html'
          });
        } else {
          await createNotification({
            userId: purchase.user_id,
            type: 'system',
            title: '返金が完了しました / Refund completed',
            message: `ご購入いただいた作品の返金（${purchase.amount} ${purchase.currency}）が完了しました。この作品はライブラリから読めなくなります。 / Your refund (${purchase.amount} ${purchase.currency}) has been processed. The work is no longer available in your library.`,
            actionUrl: '/pages/library.html'
          });
        }
      } catch (e) { console.error('Refund notification failed:', e.message); }
      return { kind: 'purchase' };
    }
    await client.query('ROLLBACK');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // --- AIツール注文の返金 ---
  const order = (await db.query(
    `SELECT order_id, status FROM ai_tool_orders WHERE stripe_session_id = $1`,
    [sessionId]
  )).rows[0];
  if (order) {
    if (order.status !== 'completed' && order.status !== 'canceled') {
      await db.query(
        `UPDATE ai_tool_orders SET status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
        [order.order_id]
      );
      console.log(`Refund applied: AI tool order ${order.order_id} canceled (session=${sessionId})`);
    } else {
      console.log(`Refund noted: AI tool order ${order.order_id} already ${order.status} (session=${sessionId})`);
    }
    return { kind: 'ai_tool' };
  }

  console.warn(`Refund received but no matching purchase/order for session=${sessionId}`);
  return { kind: 'none' };
}

/**
 * プレゼントの支払い完了処理（checkout.session.completed から呼ばれる）
 *
 * 通常購入との違いは「所有権は受取人・支払い記録は贈った人」という点だけで、
 * 収益分配は通常購入とまったく同じ。
 * 冪等: giftsのstatusで二重処理を防ぐ（Webhookは再送されうる）
 */
async function applyGiftPayment(session) {
  const giftId = session.metadata.gift_id;
  const ZERO_DECIMAL = ['jpy', 'krw'];
  const amount = ZERO_DECIMAL.includes(session.currency)
    ? session.amount_total
    : session.amount_total / 100;
  const currency = session.currency.toUpperCase();
  // トランザクションを開く前に取る。StripeへのAPI呼び出しなので、
  // BEGIN...COMMIT の中で待つとその間ずっと接続を握ってしまう
  const buyerCountry = await resolveBuyerCountry(session);
  const isAdult = await resolveWorkIsAdult(session.metadata.work_id);
  const tax = resolveTax(amount, buyerCountry, isAdult);

  const client = await db.pool.connect();
  let outcome = null;
  try {
    await client.query('BEGIN');

    const gift = (await client.query(
      `SELECT g.gift_id, g.work_id, g.sender_id, g.recipient_id, g.message, g.status,
              w.title AS work_title, w.author_id,
              COALESCE(NULLIF(s.pen_name, ''), TRIM(s.first_name || ' ' || s.last_name)) AS sender_name,
              COALESCE(NULLIF(r.pen_name, ''), TRIM(r.first_name || ' ' || r.last_name)) AS recipient_name
       FROM gifts g
       JOIN works w ON w.work_id = g.work_id
       JOIN users s ON s.user_id = g.sender_id
       JOIN users r ON r.user_id = g.recipient_id
       WHERE g.gift_id = $1
       FOR UPDATE OF g`,
      [giftId]
    )).rows[0];

    if (!gift) {
      await client.query('ROLLBACK');
      console.warn(`Gift payment: no gift row for gift_id=${giftId} (session=${session.id})`);
      return;
    }
    if (gift.status !== 'pending') {
      await client.query('ROLLBACK');
      console.log(`Gift payment: gift ${giftId} already ${gift.status} — skipped (webhook resend)`);
      return;
    }

    // 受取人に所有権を作る。過去に返金された行が残っていれば復活させる。
    // 「すでに所有」なら0件になり、その場合は課金だけが残るので返金対応に回す
    const deliveredRow = await client.query(
      `INSERT INTO purchases (user_id, work_id, amount, currency, payment_method, payment_status, transaction_id)
       VALUES ($1, $2, $3, $4, 'stripe', 'completed', $5)
       ON CONFLICT (user_id, work_id) DO UPDATE
         SET amount = EXCLUDED.amount,
             currency = EXCLUDED.currency,
             payment_method = EXCLUDED.payment_method,
             payment_status = 'completed',
             transaction_id = EXCLUDED.transaction_id,
             created_at = CURRENT_TIMESTAMP
         WHERE purchases.payment_status <> 'completed'
       RETURNING purchase_id`,
      [gift.recipient_id, gift.work_id, amount, currency, session.id]
    );

    if (deliveredRow.rowCount === 0) {
      // 事前チェックをすり抜けた場合（決済中に受取人本人が購入した等）。
      // 取引も分配も作らない＝Stripe側で返金するだけで帳尻が合う状態にしておく
      await client.query(
        `UPDATE gifts SET status = 'undeliverable', amount = $2, currency = $3 WHERE gift_id = $1`,
        [giftId, amount, currency]
      );
      await client.query('COMMIT');
      console.warn(`Gift undeliverable (recipient already owns): gift=${giftId}, session=${session.id} — REFUND REQUIRED`);
      outcome = { delivered: false, gift };
    } else {
      // 支払ったのは贈った人なので、取引履歴は贈った人名義で残す。
      // 国も支払った人のもの（課税地の判定は支払う側で見るため）
      await client.query(
        `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status, buyer_country, vat_rate, vat_amount, net_amount)
         VALUES ($1, $2, 'purchase', $3, $4, 'stripe', $5, 'completed', $6, $7, $8, $9)`,
        [gift.sender_id, gift.work_id, amount, currency, session.id, buyerCountry, tax.rate, tax.vatAmount, tax.netAmount]
      );

      // 通常の購入と同じく、分配は税抜き額に対して行う
      const splits = await createRevenueSplits(client, {
        workId: gift.work_id,
        authorId: gift.author_id,
        amount: tax.netAmount,
        currency,
        reference: session.id
      });

      await client.query(
        `UPDATE gifts SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP, amount = $2, currency = $3
         WHERE gift_id = $1`,
        [giftId, amount, currency]
      );
      await client.query('COMMIT');
      console.log(`Gift delivered: work=${gift.work_id}, from=${gift.sender_id}, to=${gift.recipient_id}, amount=${amount} ${currency}, splits=${splits.map(s => `${s.role}:${s.amount}`).join(' ')}`);
      outcome = { delivered: true, gift };
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // 門番をすり抜けてEU圏の購入が成立していないか、決済後にもう一度見る
  await notifyEuSaleWhileUnregistered({
    country: buyerCountry, amount, currency, sessionId: session.id
  });

  // 通知はトランザクションの外で（失敗しても決済処理は巻き戻さない）
  const { gift, delivered } = outcome;
  try {
    if (delivered) {
      const note = gift.message ? `\n「${gift.message}」` : '';
      await createNotification({
        userId: gift.recipient_id,
        type: 'gift',
        title: 'プレゼントが届きました / You received a gift',
        message: `${gift.sender_name}さんから「${gift.work_title}」が贈られました。ライブラリからお読みいただけます。${note}`,
        actionUrl: `/pages/work-detail.html?id=${gift.work_id}`,
        // 受け取った人はアプリを開いていない可能性が高いのでメールでも知らせる
        email: {
          subject: `プレゼントが届きました / You received a gift on AuctLect`,
          lines: [
            `${gift.recipient_name} 様`,
            `${gift.sender_name}さんから「${gift.work_title}」が贈られました。`,
            ...(gift.message ? [`${gift.sender_name}さんからのメッセージ:\n「${gift.message}」`] : []),
            'ライブラリからいつでもお読みいただけます。'
          ],
          actionLabel: '作品を開く'
        },
        icon: 'fa-gift',
        iconColor: 'success',
        metadata: { giftId: gift.gift_id, workId: gift.work_id, senderName: gift.sender_name }
      });
      await createNotification({
        userId: gift.sender_id,
        type: 'gift',
        title: 'プレゼントを贈りました / Gift sent',
        message: `「${gift.work_title}」を${gift.recipient_name}さんへ贈りました。相手のライブラリに追加されています。`,
        actionUrl: `/pages/work-detail.html?id=${gift.work_id}`,
        icon: 'fa-gift',
        iconColor: 'success',
        metadata: { giftId: gift.gift_id, workId: gift.work_id }
      });
    } else {
      await createNotification({
        userId: gift.sender_id,
        type: 'gift',
        title: 'プレゼントをお届けできませんでした / Gift could not be delivered',
        message: `${gift.recipient_name}さんはすでに「${gift.work_title}」をお持ちでした。お支払いいただいた金額は返金いたします。`,
        actionUrl: '/pages/support/contact.html',
        icon: 'fa-gift',
        iconColor: 'warning',
        metadata: { giftId: gift.gift_id, workId: gift.work_id }
      });
      // 管理者に返金対応を促す（自動返金はしない＝金銭操作は人の目を通す）
      const admins = (await db.query(`SELECT user_id FROM users WHERE role = 'admin'`)).rows;
      for (const a of admins) {
        await createNotification({
          userId: a.user_id,
          type: 'system',
          title: '要対応: プレゼントの返金',
          message: `受取人が既に所有していたためプレゼントを配達できませんでした。Stripeで返金してください。session=${session.id}`,
          actionUrl: '/pages/admin/index.html#finance',
          icon: 'fa-triangle-exclamation',
          iconColor: 'warning'
        });
      }
    }
  } catch (e) {
    console.error('Gift notification failed:', e.message);
  }
}

/**
 * POST /api/payments/create-checkout-session
 * Create a Stripe checkout session for purchasing a work
 */
/**
 * POST /api/payments/free/:workId
 * 無料作品を自分のライブラリに入れる。
 *
 * これまで無料作品の取得はブラウザのlocalStorageに書くだけで、サーバーには
 * 何も残らなかった。そのため
 *   ・ログインしていなくても「ライブラリに追加されました」と出る（実際は何も起きない）
 *   ・別の端末やブラウザでは消えている
 *   ・購入記録が無いため、ライブラリの掃除処理が翌日に消してしまう
 * という状態だった。有料と同じく purchases に記録する（金額0）。
 */
router.post('/free/:workId', authenticate, async (req, res) => {
  try {
    const { workId } = req.params;
    const result = await db.query(
      `SELECT work_id, author_id, is_free, price, currency, status FROM works WHERE work_id = $1`,
      [workId]
    );
    const work = result.rows[0];
    if (!work || work.status !== 'published') {
      return res.status(404).json({ error: 'Work not found' });
    }
    // 無料かどうかはサーバーが判断する（画面の表示は信用しない）
    const isFree = work.is_free || Number(work.price) === 0;
    if (!isFree) {
      return res.status(400).json({ error: 'This work is not free', code: 'NOT_FREE' });
    }
    if (String(work.author_id) === String(req.user.userId)) {
      return res.json({ success: true, alreadyOwned: true, message: 'This is your own work' });
    }

    // 二重に押しても増えない。返金済みの行が残っていれば復活させる
    await db.query(
      `INSERT INTO purchases (user_id, work_id, amount, currency, payment_method, payment_status, transaction_id)
       VALUES ($1, $2, 0, $3, 'free', 'completed', $4)
       ON CONFLICT (user_id, work_id) DO UPDATE
         SET payment_status = 'completed',
             payment_method = 'free',
             amount = 0
         WHERE purchases.payment_status <> 'completed'`,
      [req.user.userId, workId, work.currency || 'USD', 'free_' + workId + '_' + req.user.userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Free acquisition error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    // EU圏の消費者への販売は、1件目からVATの申告義務が生じる（免税枠なし）。
    // 税率表が揃うまでは受け付けない。売ってしまってから気づくと、その月の
    // 翌月10日までに届け出ないと、消費国すべてに個別登録する義務が生じる。
    const euBlock = checkEuSaleAllowed(req);
    if (!euBlock.allowed) {
      console.warn(`EU sale blocked (VAT not registered): country=${euBlock.country}, user=${req.user.userId}`);
      return res.status(451).json({
        error: 'Purchases from EU countries are temporarily unavailable while we complete our EU VAT registration.',
        code: 'EU_VAT_PENDING',
        country: euBlock.country
      });
    }

    const { workId, giftTo, giftMessage } = req.body;

    const workResult = await db.query(
      // works.author_name（作品ごとの著者表示名）が w.* に含まれるため、
      // 同名の別列を足すと後勝ちで上書きされる。ここでは使っていないので外す
      `SELECT w.*
       FROM works w
       JOIN users u ON w.author_id = u.user_id
       WHERE w.work_id = $1 AND w.status = 'published'`,
      [workId]
    );

    if (workResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work not found' });
    }

    const work = workResult.rows[0];

    if (work.is_free) {
      return res.status(400).json({ error: 'This work is free' });
    }

    // --- 通常購入の事前チェック（二重課金防止）---
    // 所有判定をフロントのlocalStorageに任せると、別ブラウザ・別端末から
    // 「購入する」が再び押せてしまう。サーバー側で必ず止める。
    // 返金済み(refunded)は再購入を許す（買い直しは正当な操作）
    const isGift = !!giftTo;
    if (!isGift) {
      if (String(work.author_id) === String(req.user.userId)) {
        return res.status(400).json({ error: 'You already have access to your own work', code: 'ALREADY_OWNED' });
      }
      const owned = await db.query(
        `SELECT 1 FROM purchases
         WHERE user_id = $1 AND work_id = $2 AND payment_status = 'completed'`,
        [req.user.userId, workId]
      );
      if (owned.rows.length > 0) {
        return res.status(400).json({ error: 'You already own this work', code: 'ALREADY_OWNED' });
      }
    }

    // --- プレゼントの場合の事前チェック ---
    // 「すでに所有している人には贈れない」をここで止めるのが肝心。
    // 支払い後に発覚すると手動返金が必要になるため（Webhook側は最後の砦）
    let recipient = null;
    let message = null;
    if (isGift) {
      if (!UUID_RE.test(String(giftTo))) {
        return res.status(400).json({ error: 'Invalid recipient' });
      }
      if (String(giftTo) === String(req.user.userId)) {
        return res.status(400).json({ error: 'You cannot gift a work to yourself', code: 'GIFT_SELF' });
      }
      recipient = (await db.query(
        `SELECT user_id, COALESCE(NULLIF(pen_name, ''), TRIM(first_name || ' ' || last_name)) AS display_name
         FROM users WHERE user_id = $1 AND account_status = 'active'`,
        [giftTo]
      )).rows[0];
      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found', code: 'GIFT_RECIPIENT_NOT_FOUND' });
      }
      if (String(work.author_id) === String(giftTo)) {
        return res.status(400).json({ error: 'The author already has access to this work', code: 'GIFT_ALREADY_OWNED' });
      }
      const owned = await db.query(
        `SELECT 1 FROM purchases
         WHERE user_id = $1 AND work_id = $2 AND payment_status = 'completed'`,
        [giftTo, workId]
      );
      if (owned.rows.length > 0) {
        return res.status(400).json({ error: 'The recipient already owns this work', code: 'GIFT_ALREADY_OWNED' });
      }
      message = (giftMessage || '').trim().slice(0, 500) || null;
    }

    // Zero-decimal currencies (JPY, KRW) use the base unit directly in Stripe
    const ZERO_DECIMAL = ['jpy', 'krw'];
    const currency = (work.currency || 'USD').toLowerCase();
    const unitAmount = ZERO_DECIMAL.includes(currency)
      ? Math.round(work.price)
      : Math.round(work.price * 100);

    // プレゼントは先に台帳（gifts）を作り、そのIDだけをStripeに渡す。
    // メッセージ本文はStripeに送らない（個人的な文章を外部に預けない）
    let giftId = null;
    if (isGift) {
      giftId = (await db.query(
        `INSERT INTO gifts (work_id, sender_id, recipient_id, message, amount, currency)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING gift_id`,
        [workId, req.user.userId, giftTo, message, work.price, (work.currency || 'USD').toUpperCase()]
      )).rows[0].gift_id;
    }

    const successUrl = `${process.env.FRONTEND_URL}/pages/payment-success.html?session_id={CHECKOUT_SESSION_ID}&work_id=${workId}&title=${encodeURIComponent(work.title)}&amount=${work.price}&currency=${work.currency || 'USD'}`
      + (isGift ? `&gift=1&to=${encodeURIComponent(recipient.display_name || '')}` : '');

    // payment_method_typesは指定しない: Stripeダッシュボードで有効化した決済手段
    // （カード/Apple Pay/Google Pay/PayPal等）が通貨に応じて自動表示される
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: isGift ? `${work.title}（プレゼント / Gift）` : work.title,
              description: work.description || 'Digital content from AuctLect',
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: `${process.env.FRONTEND_URL}/pages/payment-cancel.html`,
      metadata: isGift ? {
        type: 'gift',
        gift_id: giftId,
        work_id: workId,
        buyer_id: req.user.userId,
        author_id: work.author_id,
        recipient_id: giftTo
      } : {
        work_id: workId,
        buyer_id: req.user.userId,
        author_id: work.author_id
      }
    });

    if (isGift) {
      await db.query(`UPDATE gifts SET stripe_session_id = $1 WHERE gift_id = $2`, [session.id, giftId]);
    }

    res.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments/earnings
 * Get creator's earnings
 */
router.get('/earnings', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_earnings
       FROM revenue_splits
       WHERE recipient_id = $1 AND role != 'platform'`,
      [req.user.userId]
    );
    
    res.json({ earnings: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events (payment confirmation, etc.)
 * NOTE: This route must receive the raw body for signature verification.
 *       In server.js, apply express.raw() middleware for this route.
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // 返金（Stripeダッシュボード等から返金した時に飛んでくる）
  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    try {
      // v1は全額返金のみ反映（部分返金は記録だけ残して手動対応）
      if (!charge.refunded) {
        console.warn(`Partial refund received (charge=${charge.id}, refunded=${charge.amount_refunded}/${charge.amount}) — not auto-processed`);
        return res.json({ received: true });
      }
      // chargeにはセッションIDが無いため、payment_intentから該当のCheckoutセッションを引く
      let sessionId = charge.metadata && charge.metadata.session_id; // テスト用の直接指定も許容
      if (!sessionId && charge.payment_intent) {
        const sessions = await stripe.checkout.sessions.list({ payment_intent: charge.payment_intent, limit: 1 });
        if (sessions.data.length > 0) sessionId = sessions.data[0].id;
      }
      if (!sessionId) {
        console.warn(`charge.refunded: no checkout session found for charge=${charge.id}`);
        return res.json({ received: true });
      }
      await applyStripeRefund(sessionId);
    } catch (error) {
      console.error('Error processing refund webhook:', error);
    }
    return res.json({ received: true });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // AIツール注文（AIエディタ/AI翻訳）: 注文をpaidにするだけ（分配なし・全額プラットフォーム収入）
    if (session.metadata && session.metadata.type === 'ai_tool') {
      try {
        await db.query(
          `UPDATE ai_tool_orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $1 AND status = 'pending'`,
          [session.metadata.order_id]
        );
        console.log(`AI tool order paid: ${session.metadata.order_id} (${session.amount_total} ${session.currency})`);

        // AIツールの売上もVATの対象。**標準税率**を使う（役務であって出版物ではないため）。
        // ここで transactions に残さないと、OSSの四半期申告から丸ごと抜け落ちる。
        // 冪等: 同じセッションの行が既にあれば作らない（Webhookは再送されうる）
        const seen = await db.query(
          `SELECT 1 FROM transactions WHERE payment_gateway_id = $1 AND transaction_type = 'ai_tool'`,
          [session.id]
        );
        if (seen.rows.length === 0) {
          const ZD = ['jpy', 'krw'];
          const amount = ZD.includes(session.currency) ? session.amount_total : session.amount_total / 100;
          const buyerCountry = await resolveBuyerCountry(session);
          const tax = resolveTax(amount, buyerCountry, false, 'service');
          await db.query(
            `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency,
                                       payment_method, payment_gateway_id, status,
                                       buyer_country, vat_rate, vat_amount, net_amount)
             VALUES ($1, NULL, 'ai_tool', $2, $3, 'stripe', $4, 'completed', $5, $6, $7, $8)`,
            [session.metadata.user_id, amount, session.currency.toUpperCase(), session.id,
             buyerCountry, tax.rate, tax.vatAmount, tax.netAmount]
          );
        }
      } catch (error) {
        console.error('Error marking AI tool order paid:', error);
      }
      return res.json({ received: true });
    }

    // プレゼント: 所有権は受取人、支払い記録は贈った人
    if (session.metadata && session.metadata.type === 'gift') {
      try {
        await applyGiftPayment(session);
      } catch (error) {
        console.error('Error processing gift payment:', error);
      }
      return res.json({ received: true });
    }

    const { work_id, buyer_id, author_id } = session.metadata;
    // Zero-decimal currencies (JPY, KRW): amount_total is already the base unit
    const ZERO_DECIMAL = ['jpy', 'krw'];
    const amount = ZERO_DECIMAL.includes(session.currency)
      ? session.amount_total
      : session.amount_total / 100;
    const currency = session.currency.toUpperCase();
    // トランザクションを開く前に取る（Stripeへの往復を BEGIN...COMMIT の中で待たない）
    const buyerCountry = await resolveBuyerCountry(session);
    const isAdult = await resolveWorkIsAdult(work_id);
    const tax = resolveTax(amount, buyerCountry, isAdult);

    // BEGIN/COMMIT must run on a single dedicated connection. db.query()
    // draws a different pooled connection per call, which silently breaks
    // the transaction (partial writes under failure).
    const client = await db.pool.connect();
    let undeliverable = null;
    try {
      await client.query('BEGIN');

      // 冪等性: Webhookは再送されうる。同じセッションの取引が既に記録済みなら
      // 何もしない（従来はここが無く、再送で取引・分配が二重記録された）
      const seen = await client.query(
        `SELECT 1 FROM transactions
         WHERE payment_gateway_id = $1 AND transaction_type = 'purchase'`,
        [session.id]
      );
      if (seen.rows.length > 0) {
        await client.query('ROLLBACK');
        console.log(`Payment webhook resend ignored: session=${session.id}`);
        return res.json({ received: true });
      }

      // 所有権の記録。返金済み(refunded)の行は買い直しとして復活させる。
      // completed の行が既にある（＝決済ページを開いたまま別画面で購入済みの
      // レース）場合は0件になる → 取引も分配も作らず、返金対応に回す
      const deliveredRow = await client.query(
        `INSERT INTO purchases (user_id, work_id, amount, currency, payment_method, payment_status, transaction_id)
         VALUES ($1, $2, $3, $4, 'stripe', 'completed', $5)
         ON CONFLICT (user_id, work_id) DO UPDATE
           SET amount = EXCLUDED.amount,
               currency = EXCLUDED.currency,
               payment_method = EXCLUDED.payment_method,
               payment_status = 'completed',
               transaction_id = EXCLUDED.transaction_id,
               created_at = CURRENT_TIMESTAMP
           WHERE purchases.payment_status <> 'completed'
         RETURNING purchase_id`,
        [buyer_id, work_id, amount, currency, session.id]
      );

      if (deliveredRow.rowCount === 0) {
        await client.query('COMMIT');
        console.warn(`Duplicate purchase (already owned): work=${work_id}, buyer=${buyer_id}, session=${session.id} — REFUND REQUIRED`);
        undeliverable = { work_id, buyer_id, amount, currency };
      } else {
        // Record the transaction, with the tax breakdown of the amount charged
        await client.query(
          `INSERT INTO transactions (user_id, work_id, transaction_type, amount, currency, payment_method, payment_gateway_id, status, buyer_country, vat_rate, vat_amount, net_amount)
           VALUES ($1, $2, 'purchase', $3, $4, 'stripe', $5, 'completed', $6, $7, $8, $9)`,
          [buyer_id, work_id, amount, currency, session.id, buyerCountry, tax.rate, tax.vatAmount, tax.netAmount]
        );

        // Create revenue splits (author / collaborators / platform).
        // 分配は税抜き額に対して行う。VATは誰の取り分でもなく国に納めるお金なので、
        // 分ける前に抜く。総額のまま分けると、納税分を当社の取り分から持ち出すことになる
        const splits = await createRevenueSplits(client, {
          workId: work_id,
          authorId: author_id,
          amount: tax.netAmount,
          currency,
          reference: session.id
        });

        await client.query('COMMIT');
        console.log(`Payment completed: work=${work_id}, buyer=${buyer_id}, amount=${amount} ${currency}, splits=${splits.map(s => `${s.role}:${s.amount}`).join(' ')}`);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing webhook:', error);
    } finally {
      client.release();
    }

    // 門番をすり抜けてEU圏の購入が成立していないか、決済後にもう一度見る
    await notifyEuSaleWhileUnregistered({
      country: buyerCountry, amount, currency, sessionId: session.id
    });

    // 二重購入だった場合の通知（トランザクション外・非致死）。
    // 金銭の返金は自動化しない＝管理者がStripeで手動返金する
    if (undeliverable) {
      try {
        const workTitle = (await db.query(`SELECT title FROM works WHERE work_id = $1`, [undeliverable.work_id])).rows[0];
        await createNotification({
          userId: undeliverable.buyer_id,
          type: 'system',
          title: '二重のご購入を確認しました / Duplicate purchase detected',
          message: `「${(workTitle && workTitle.title) || ''}」はすでにご購入済みのため、今回のお支払い（${undeliverable.amount} ${undeliverable.currency}）は返金いたします。作品はこれまでどおりお読みいただけます。`,
          actionUrl: '/pages/library.html'
        });
        const admins = (await db.query(`SELECT user_id FROM users WHERE role = 'admin'`)).rows;
        for (const a of admins) {
          await createNotification({
            userId: a.user_id,
            type: 'system',
            title: '要対応: 二重購入の返金',
            message: `同じ作品への二重の支払いを検出しました。Stripeで返金してください。session=${session.id}`,
            actionUrl: '/pages/admin/index.html#finance',
            icon: 'fa-triangle-exclamation',
            iconColor: 'warning'
          });
        }
      } catch (e) { console.error('Duplicate purchase notification failed:', e.message); }
    }
  }

  res.json({ received: true });
});

module.exports = router;