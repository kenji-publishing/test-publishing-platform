-- メールが届かなかったことを記録する。
--
-- なぜ必要か:
--   sendEmail() は SES に渡した時点で success を返す。実際に届いたかは分からない。
--   一度でも不達になると SES がそのアドレスを抑制リストに入れ、以後の送信を黙って止める。
--   2026-08-07 に kenji@auctlect.com で実際に踏んだ。管理者本人だったから気づけたが、
--   読者に起きた場合は誰も気づけない（本人は「メールが来ない」としか分からず、
--   パスワード再設定もできないため連絡もしにくい）。
--
-- SES → SNS → /api/ses/notifications で受け取り、ここに記録する。

CREATE TABLE IF NOT EXISTS email_delivery_issues (
    issue_id        SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
    -- 'Bounce'（不達）か 'Complaint'（迷惑メール報告）
    issue_type      VARCHAR(20)  NOT NULL,
    -- Bounce: 'Permanent'（存在しない等・回復しない） / 'Transient'（満杯等・一時的）
    -- Complaint: 'abuse' など
    issue_subtype   VARCHAR(50),
    -- 送信元サーバーが返した理由。原因の切り分けに要る
    diagnostic      TEXT,
    -- SESのメッセージID。Stripeの決済IDと同じく、追跡の起点になる
    ses_message_id  VARCHAR(255),
    occurred_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 対処済みにした日時（抑制リストから削除した、本人がアドレスを直した等）
    resolved_at     TIMESTAMP,
    resolved_note   TEXT
);

CREATE INDEX IF NOT EXISTS idx_edi_email    ON email_delivery_issues (email);
CREATE INDEX IF NOT EXISTS idx_edi_user     ON email_delivery_issues (user_id);
CREATE INDEX IF NOT EXISTS idx_edi_open     ON email_delivery_issues (occurred_at DESC) WHERE resolved_at IS NULL;

-- 同じ通知が再送されても二重に記録しない
CREATE UNIQUE INDEX IF NOT EXISTS idx_edi_dedupe
  ON email_delivery_issues (ses_message_id, email)
  WHERE ses_message_id IS NOT NULL;

-- 「この人には今メールが届かない」を1回の問い合わせで判定できるようにする。
-- 一時的な不達では立てない（受信箱が満杯なだけで永久に烙印を押さない）
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_undeliverable_at TIMESTAMP;

COMMENT ON COLUMN users.email_undeliverable_at IS
  '恒久的な不達または迷惑メール報告を受けた日時。NULLなら問題なし。アドレス変更時にクリアする。';
