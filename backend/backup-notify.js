// バックアップが失敗したときだけ info@auctlect.com に知らせる。
// 送信はサイト本体と同じ AWS SES 経路（backend/config/email.js）を使う。
// 失敗に気づけないバックアップは、無いのとほぼ同じなので必ず通知する。
require('dotenv').config();
const { sendEmail } = require('./config/email');

const reason = process.argv[2] || '（理由不明）';
const when = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

const text =
  `AuctLect のデータベースのバックアップに失敗しました。\n\n` +
  `日時: ${when}\n理由: ${reason}\n\n` +
  `確認方法:\n  ssh でサーバーに入り  tail -30 ~/backups/backup.log\n`;

const html =
  `<p><b>AuctLect のデータベースのバックアップに失敗しました。</b></p>` +
  `<p>日時: ${when}<br>理由: ${escapeHtml(reason)}</p>` +
  `<p>サーバーの <code>~/backups/backup.log</code> の末尾に詳細が残っています。</p>` +
  `<p>スナップショット（毎日 03:00 UTC）は別に動いているので、すぐにデータが失われるわけではありません。` +
  `ただし放置すると、整合の取れた控えが古いままになります。</p>`;

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

sendEmail('info@auctlect.com', '【AuctLect】DBバックアップ失敗', text, html)
  .then(r => console.log(r.success ? '通知メールを送信しました' : '通知メール失敗: ' + r.error))
  .catch(e => console.log('通知メール失敗: ' + e.message));
