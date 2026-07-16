/**
 * テストメール送信スクリプト（SMTP設定の動作確認用）
 *
 * 使い方（本番サーバー上で）:
 *   cd ~/auctlect/backend && node scripts/send-test-email.js 宛先@example.com
 *
 * .env の EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASSWORD / EMAIL_FROM を使う。
 * NODE_ENV=production かつ EMAIL_HOST が設定されていれば実送信、
 * 未設定ならテストモード（コンソール出力）になる。
 */

require('dotenv').config();
const { sendEmail, BASE_URL } = require('../config/email');

(async () => {
  const to = process.argv[2];
  if (!to || !to.includes('@')) {
    console.error('使い方: node scripts/send-test-email.js 宛先メールアドレス');
    process.exit(1);
  }

  console.log(`送信先: ${to}`);
  console.log(`リンクのベースURL: ${BASE_URL}`);

  const result = await sendEmail(
    to,
    'AuctLect メール送信テスト / Email test',
    `このメールはAuctLectのメール送信設定のテストです。\n受信できていれば設定は成功です。\n\nリンク確認: ${BASE_URL}\n\nAuctLect Team`,
    `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>📧 AuctLect メール送信テスト</h2>
      <p>このメールはAuctLectのメール送信設定のテストです。<br>受信できていれば設定は成功です。</p>
      <p><a href="${BASE_URL}">リンクの確認（${BASE_URL}）</a></p>
      <p style="color:#888; font-size:12px;">AuctLect Team</p>
    </div>`
  );

  console.log(result.success ? '✅ 送信成功: ' + result.messageId : '❌ 送信失敗: ' + result.error);
  process.exit(result.success ? 0 : 1);
})();
