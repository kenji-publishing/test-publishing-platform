-- 取引ごとにVATの内訳を残す。
--
-- 収益分配は「税抜き額」を基準に計算する必要がある。総額のまま70%を払うと、
-- 納めるVATを当社の30%から持ち出すことになり、税率の高い国ほど赤字になる。
--
-- また non-Union OSS の申告では、取引ごとに「課税標準・税率・税額」の保存が
-- 求められる（Implementing Regulation 第63c条、保存期間10年）。集計してからでは
-- 作れないので、取引の時点で確定させて持つ。
--
-- 現在は未登録のため、すべて vat_rate=0 / vat_amount=0 / net_amount=amount になる。

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS vat_rate   NUMERIC(5,2)  DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_amount NUMERIC(12,2);

COMMENT ON COLUMN transactions.vat_rate   IS '購入者の国の税率（%）。未登録の間は0。';
COMMENT ON COLUMN transactions.vat_amount IS '総額に含まれていた税額。amount - net_amount と一致する。';
COMMENT ON COLUMN transactions.net_amount IS '税抜き額。収益分配はこの金額を基準に計算する。';

-- 既存の取引は、VAT未登録の時期のものなので税額ゼロ＝総額がそのまま税抜き額
UPDATE transactions SET net_amount = amount WHERE net_amount IS NULL;

-- 四半期ごとの申告は「国 × 税率」で集計するため
CREATE INDEX IF NOT EXISTS idx_transactions_vat_period
  ON transactions (created_at, buyer_country)
  WHERE transaction_type IN ('purchase', 'refund') AND status = 'completed';
