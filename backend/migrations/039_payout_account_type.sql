-- 039: Account type for payout details (Japanese bank accounts)
--
-- Wise local JPY transfers require the account type (普通/貯蓄/当座) in
-- addition to bank/branch/number. Optional — not applicable to most
-- non-Japanese accounts. (SWIFT code and bank/beneficiary addresses are
-- NOT needed for Wise local transfers, so no columns for them.)

ALTER TABLE user_payout_details ADD COLUMN IF NOT EXISTS account_type VARCHAR(20);
