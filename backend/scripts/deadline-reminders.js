#!/usr/bin/env node
/**
 * 期日が近づいたらメールで知らせる。サーバーの cron で毎日1回動かす。
 *
 * PC や Claude が閉じていても届くように、常に動いているサーバーから送る。
 * 期日の一覧は config/deadlines.js。OSS の四半期申告はここで自動的に作る。
 *
 *   node scripts/deadline-reminders.js                 今日鳴らすべきものがあればメール
 *   node scripts/deadline-reminders.js --dry-run       送らずに、送る内容を表示
 *   node scripts/deadline-reminders.js --force 120     120日以内のものを今すぐ送る（届くかの確認用・既定60日）
 *   node scripts/deadline-reminders.js --list 90       90日以内の期日と期限切れを一覧表示（月次報告用）
 *   node scripts/deadline-reminders.js --date 2026-10-24 --dry-run   日付を変えて試す
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { DONE, ONE_OFF, YEARLY } = require('../config/deadlines');

const TO = 'info@auctlect.com';
const OSS_FIRST_QUARTER = '2026-Q3';          // 登録の発効は 2026-08-10
const OSS_REMIND = [30, 14, 7, 3, 1, 0];
const DAY = 86400000;

const arg = name => { const i = process.argv.indexOf(name); return i >= 0 ? (process.argv[i + 1] || '') : null; };
const has = name => process.argv.includes(name);

function todayUtc() {
  const d = arg('--date');
  if (d) return new Date(d + 'T00:00:00Z');
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}
const ymd = d => d.toISOString().slice(0, 10);
const daysBetween = (from, toYmd) => Math.round((new Date(toYmd + 'T00:00:00Z') - from) / DAY);

// ---- OSS の四半期申告（毎期、自動で作る）----
function ossItems(today) {
  const items = [];
  let [y, q] = OSS_FIRST_QUARTER.split('-Q').map(Number);
  // 今の四半期まで作る（今の四半期の期限は先だが、一覧には出したい）
  const curY = today.getUTCFullYear(), curQ = Math.floor(today.getUTCMonth() / 3) + 1;
  while (y < curY || (y === curY && q <= curQ)) {
    const label = `${y}-Q${q}`;
    const endMonth = q * 3;                                  // 四半期の最終月
    const due = ymd(new Date(Date.UTC(y, endMonth + 1, 0))); // 翌月末
    const months = ['1〜3月', '4〜6月', '7〜9月', '10〜12月'][q - 1];
    items.push({
      id: `oss-${label}`,
      date: due,
      title: `EU VAT（OSS）の四半期申告：${y}年 ${months}分（${label}）`,
      what: 'アイルランド歳入庁（ROS）への申告です。EU圏の売上がゼロでも「ゼロ申告（Nil return）」の提出が必要です。'
          + '売上があった場合は、申告とは別に同じ期限までにユーロで納付します。',
      how: 'ROS にログイン → My Services → File a Return → OSS（VMS）→ 対象の四半期を選ぶ → '
         + '売上ゼロなら Nil return、売上があれば国ごとの金額を入力 → 証明書のパスワードで署名して提出。'
         + '提出後は Revenue Record に届く受付の控えを保存し、Claude に「提出した」と伝えてください（通知が止まります）。',
      remind: OSS_REMIND,
      overdue: true,
      ossLabel: label,
      quarterEnd: new Date(Date.UTC(y, endMonth, 1)),
    });
    q++; if (q > 4) { q = 1; y++; }
  }
  return items;
}

function yearlyItems(today) {
  const items = [];
  const y0 = today.getUTCFullYear();
  for (const it of YEARLY) {
    for (const y of [y0 - 1, y0, y0 + 1]) {
      if (it.from && y < it.from) continue;
      const date = `${y}-${String(it.month).padStart(2, '0')}-${String(it.day).padStart(2, '0')}`;
      items.push({ ...it, id: `${it.id}-${y}`, date });
    }
  }
  return items;
}

function allItems(today) {
  return [...ossItems(today), ...ONE_OFF, ...yearlyItems(today)]
    .filter(it => !DONE.includes(it.id))
    .map(it => ({ ...it, daysLeft: daysBetween(today, it.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 今日知らせるべきか */
function isDue(it) {
  if (it.remind.includes(it.daysLeft)) return true;
  // 届け出・申告は、済むまで毎日（ただし1年より前のものは追わない）
  return !!it.overdue && it.daysLeft < 0 && it.daysLeft >= -365;
}

function when(it) {
  if (it.daysLeft > 0) return `あと${it.daysLeft}日（期限 ${it.date}）`;
  if (it.daysLeft === 0) return `今日が期限（${it.date}）`;
  return `⚠️ 期限を${-it.daysLeft}日過ぎています（期限 ${it.date}）`;
}

// OSS の申告に入れる数字。四半期が終わっていれば集計して本文に載せる
async function ossDetail(it, today) {
  if (today < it.quarterEnd) return 'この四半期はまだ途中です。四半期が終わったら集計します。';
  try {
    const oss = require('../services/ossReport');
    const rows = await oss.getReturnSummary(it.ossLabel);
    const unknown = await oss.getUnattributed(it.ossLabel).catch(() => []);
    let s;
    if (!rows.length) {
      s = '集計結果：この四半期のEU圏への販売は 0件です。→ ゼロ申告（Nil return）で提出できます。納付はありません。';
    } else {
      s = '集計結果：EU圏への販売があります。国ごとに申告し、同じ期限までにユーロで納付します。\n'
        + rows.map(r => `  ${r.member_state}  税率${r.vat_rate}%  ${r.currency}  課税標準 ${Number(r.taxable_amount).toFixed(2)}  VAT ${Number(r.vat_amount).toFixed(2)}  （販売${r.sales}件・返金${r.refunds}件）`).join('\n')
        + `\n  ※ ユーロ以外の通貨は ${ymd(new Date(it.quarterEnd - DAY))} 時点の欧州中央銀行（ECB）レートで換算。`
        + 'Claude に見せていただければ、申告する金額を計算します。';
    }
    if (unknown.length) s += `\n  ⚠️ 購入者の国が分からない取引が ${unknown.length} 件あります。EU分が混じっていないか Claude と確認してください。`;
    return s;
  } catch (e) {
    return '（集計に失敗しました：' + e.message + '）サーバーで `node scripts/oss-return.js ' + it.ossLabel + '` を実行すると確認できます。';
  }
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

(async () => {
  const today = todayUtc();
  const items = allItems(today);

  if (has('--list')) {
    const within = Number(arg('--list')) || 60;
    const list = items.filter(it => it.daysLeft <= within && (it.daysLeft >= 0 || (it.overdue && it.daysLeft >= -365)));
    console.log(`期日の一覧（${ymd(today)} 時点・${within}日以内と期限切れ）`);
    if (!list.length) console.log('  なし');
    list.forEach(it => console.log(`  ${it.date}  ${it.title}  … ${when(it)}`));
    return finish();
  }

  // --force [日数]: 届くかの確認用。指定日数（既定60日）以内のものを今日の日付のまま送る
  const forceDays = has('--force') ? (Number(arg('--force')) || 60) : 0;
  const due = forceDays
    ? items.filter(it => it.daysLeft <= forceDays && (it.daysLeft >= 0 || isDue(it)))
    : items.filter(isDue);
  if (!due.length) {
    console.log(`${ymd(today)}: 今日お知らせする期日はありません`);
    return finish();
  }

  for (const it of due) if (it.ossLabel) it.detail = await ossDetail(it, today);

  // 本文の最後に「この先60日の予定」も添える（全体の見通し）
  const ahead = items.filter(it => !due.includes(it) && it.daysLeft > 0 && it.daysLeft <= 60);

  const urgent = due.some(it => it.daysLeft <= 3);
  const first = due[0];
  const subject = `【AuctLect】${forceDays ? '（テスト送信）' : ''}${urgent ? '⚠️ ' : ''}期日のお知らせ：${first.title.replace(/（[^（）]*）$/, '')}`
    + (due.length > 1 ? ` ほか${due.length - 1}件` : '') + ` — ${when(first).replace(/^⚠️ /, '')}`;

  const text =
    due.map(it =>
      `■ ${it.title}\n  ${when(it)}\n\n  内容：${it.what}\n  やり方：${it.how}` + (it.detail ? `\n\n  ${it.detail}` : '')
    ).join('\n\n------------------------------\n\n')
    + (ahead.length ? `\n\n\n--- この先60日の予定 ---\n` + ahead.map(it => `  ${it.date}  ${it.title}`).join('\n') : '')
    + `\n\n\n済んだら Claude に「〇〇を済ませた」と伝えてください。通知を止めます。\n`
    + `（このメールは AuctLect のサーバーが毎日期日を確認し、近づいたときだけ自動で送っています）\n`;

  const html =
    due.map(it =>
      `<div style="border:1px solid #e5ddd3;border-left:5px solid ${it.daysLeft <= 3 ? '#c0392b' : '#8B7355'};border-radius:8px;padding:14px 16px;margin:0 0 14px;">`
      + `<div style="font-size:16px;font-weight:bold;">${esc(it.title)}</div>`
      + `<div style="margin:4px 0 10px;color:${it.daysLeft <= 3 ? '#c0392b' : '#555'};font-weight:bold;">${esc(when(it))}</div>`
      + `<div><b>内容：</b>${esc(it.what)}</div>`
      + `<div style="margin-top:6px;"><b>やり方：</b>${esc(it.how)}</div>`
      + (it.detail ? `<pre style="background:#f7f4ef;padding:10px;border-radius:6px;white-space:pre-wrap;font-size:13px;margin-top:10px;">${esc(it.detail)}</pre>` : '')
      + `</div>`
    ).join('')
    + (ahead.length ? `<p style="margin-top:18px;"><b>この先60日の予定</b></p><ul>`
        + ahead.map(it => `<li>${esc(it.date)}　${esc(it.title)}</li>`).join('') + `</ul>` : '')
    + `<p>済んだら Claude に「〇〇を済ませた」と伝えてください。通知を止めます。</p>`
    + `<p style="color:#888;font-size:12px;">このメールは AuctLect のサーバーが毎日期日を確認し、近づいたときだけ自動で送っています。</p>`;

  if (has('--dry-run')) {
    console.log('件名: ' + subject + '\n宛先: ' + TO + '\n\n' + text);
    return finish();
  }

  const { sendEmail } = require('../config/email');
  const r = await sendEmail(TO, subject, text, html);
  console.log(`${ymd(today)}: ${due.length}件 ${r.success ? '通知しました' : '通知失敗: ' + r.error}`);
  if (!r.success) process.exitCode = 1;
  return finish();
})().catch(e => {
  console.error('エラー:', e.message);
  process.exit(1);
});

async function finish() {
  // DBを使ったとき（OSSの集計）だけ閉じる。使っていないのに読み込むと接続を作ってしまう
  const id = require.resolve('../config/database');
  if (require.cache[id]) { try { await require.cache[id].exports.pool.end(); } catch (e) { /* 閉じ済み */ } }
}
