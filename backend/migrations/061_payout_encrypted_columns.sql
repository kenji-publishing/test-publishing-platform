-- 061: 受取口座の秘密項目を暗号化して保存できる長さにする
--
-- services/fieldCrypto.js で暗号化すると、元の文字数より長くなる
-- （例: 120文字の口座番号 → 約200文字）。VARCHAR の上限に当たらないよう TEXT にする。
-- 入力の長さ制限は routes/users.js の clip() が暗号化の前に掛けている。

ALTER TABLE user_payout_details ALTER COLUMN account_number TYPE TEXT;
ALTER TABLE user_payout_details ALTER COLUMN branch_info TYPE TEXT;
ALTER TABLE user_payout_details ALTER COLUMN extra_info TYPE TEXT;
ALTER TABLE user_payout_details ALTER COLUMN beneficiary_address TYPE TEXT;
