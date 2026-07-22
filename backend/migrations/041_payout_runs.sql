-- 041: Monthly payout runs (収益分配の月次支払い)
--
-- 運用ルール（2026-07-20 オーナー決定）:
--   月末締め・翌月15日までに支払い / 最低支払額 ¥3,000/$20/£15相当（未満は繰越）
--   少額オプトイン時は手数料（¥300/$2/£1.50相当）を差し引いて毎月支払い
--   送金は手動（Starling→Wise一括CSV）。このテーブル群は「どの分配行を
--   どの支払いで払ったか」の台帳。
--
-- 流れ: プレビュー（無記録）→ 確定＝payout_runs+payout_items作成と同時に
--   対象のrevenue_splits.payout_run_idを刻印（二重払い防止）→ Wiseで送金
--   → 支払完了マーク（status='paid'）で受取人へ通知。
-- 未払い残高 = revenue_splits WHERE payout_run_id IS NULL の合計。

CREATE TABLE IF NOT EXISTS payout_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_end DATE NOT NULL,                -- この日までの分配を含む（月末締めの締め日）
    status VARCHAR(20) NOT NULL DEFAULT 'finalized'
        CHECK (status IN ('finalized', 'paid')),
    item_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payout_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES payout_runs(run_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    payout_currency VARCHAR(3) NOT NULL,
    gross_amount NUMERIC(12,2) NOT NULL,     -- 換算後の支払対象額
    fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,  -- 少額オプトイン時の差引手数料
    net_amount NUMERIC(12,2) NOT NULL,       -- 実際の送金額
    split_count INTEGER NOT NULL,
    details_snapshot JSONB                   -- 送金時点の受取口座情報の控え
);
CREATE INDEX IF NOT EXISTS idx_payout_items_run ON payout_items(run_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_user ON payout_items(user_id);

ALTER TABLE revenue_splits ADD COLUMN IF NOT EXISTS payout_run_id UUID REFERENCES payout_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_payout_run ON revenue_splits(payout_run_id);
