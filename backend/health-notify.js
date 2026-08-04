// サーバーの状態が基準を超えたときだけ知らせる。
// 「今すぐ壊れる」ではなく「そろそろ手を打つ時期」を伝えるのが目的なので、
// 慌てなくてよいことを本文に明記する。
require('dotenv').config();
const { sendEmail } = require('./config/email');

const warnings = process.argv[2] || '';
const detail = process.argv[3] || '';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lines = warnings.split('\n').filter(Boolean);

const text =
  `AuctLect のサーバーが、あらかじめ決めた基準に達しました。\n\n` +
  warnings + `\n\n--- 現在の状態 ---\n` + detail +
  `\n\n今すぐ止まるわけではありません。次にClaudeを開いたときに、` +
  `このメールを見せていただければ対応を進めます。\n`;

const html =
  `<p><b>AuctLect のサーバーが、あらかじめ決めた基準に達しました。</b></p>` +
  `<ul>${lines.map(l => `<li>${esc(l.replace(/^・/, ''))}</li>`).join('')}</ul>` +
  `<p><b>現在の状態</b></p><pre style="background:#f7f4ef;padding:12px;border-radius:8px;font-size:13px;">${esc(detail)}</pre>` +
  `<p>今すぐ止まるわけではありません。余裕をもって知らせています。` +
  `次に Claude を開いたときに、このメールを見せていただければ対応を進めます。</p>`;

sendEmail('info@auctlect.com', '【AuctLect】サーバーの状態をご確認ください', text, html)
  .then(r => console.log(r.success ? '通知しました' : '通知失敗: ' + r.error))
  .catch(e => console.log('通知失敗: ' + e.message));
