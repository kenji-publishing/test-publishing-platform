-- 046: プレゼント機能（作品を他のアカウントに贈る）
--
-- 支払いは贈る人（sender）、作品の所有権は受け取る人（recipient）。
-- purchases は受取人名義で作られ、transactions は支払った人名義で残る
-- （収益レポートの購入者＝実際に支払った人、という既存の考え方を保つ）。
-- 収益分配は通常購入とまったく同じ（著者・翻訳者・編集者・プラットフォーム）。
--
-- statusの意味:
--   pending       決済ページを開いた直後（まだ支払われていない）
--   delivered     支払い完了→受取人のライブラリに追加済み
--   undeliverable 支払い後に「受取人が既に所有」と判明（要手動返金）
--   refunded      返金済み（受取人のアクセスは失効）

CREATE TABLE IF NOT EXISTS gifts (
    gift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT,                              -- 贈る人からの一言（任意・500字まで）
    amount NUMERIC(10,2),
    currency VARCHAR(3),
    stripe_session_id VARCHAR(100) UNIQUE,     -- Webhookからの引き当てキー
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'delivered', 'undeliverable', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gifts_recipient ON gifts(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_gifts_sender ON gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_gifts_session ON gifts(stripe_session_id);
