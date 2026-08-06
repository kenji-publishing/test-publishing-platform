-- 購入者の国を取引に記録する。
--
-- 目的は2つ:
--  1. EU圏の読者への販売が始まった時点で気づけるようにする。デジタル役務の
--     EU向け販売はVATの論点が生じうるため、発生を検知したら専門家に相談する。
--  2. 将来VATの登録が必要になったとき、EUは顧客の所在地を示す証拠の保存を
--     求める。取引時点で記録しておかないと、後から遡って作ることができない。
--
-- 値は ISO 3166-1 alpha-2（GB, JP, DE …）。取得できなかった場合は NULL。

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_country VARCHAR(2);

COMMENT ON COLUMN transactions.buyer_country IS
  'ISO 3166-1 alpha-2. Stripeの請求先の国、取れない場合はカード発行国。不明なら NULL。';

-- 国別の集計を毎日走らせるので、索引を付けておく
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_country
  ON transactions (buyer_country)
  WHERE buyer_country IS NOT NULL;
