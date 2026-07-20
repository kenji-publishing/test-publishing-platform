-- 040: Beneficiary address for payout details (optional)
--
-- Wise requires the recipient's full address for USD transfers (no PO
-- boxes). Optional for most other corridors, so the column is nullable
-- and the form marks it "optional — required for USD".

ALTER TABLE user_payout_details ADD COLUMN IF NOT EXISTS beneficiary_address VARCHAR(300);
