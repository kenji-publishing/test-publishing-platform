-- 038: Payout details for revenue recipients (authors / translators / editors)
--
-- Payouts are made MANUALLY by the operator (Starling -> Wise batch):
-- monthly close at month-end, paid by the 15th of the following month.
-- Minimum payout JPY 3,000 / USD 20 / GBP 15. If allow_small_payout is
-- set, the balance is paid every month regardless, with a flat transfer
-- fee (JPY 300 / USD 2 / GBP 1.50) deducted.
--
-- method is bank-only for now (Wise transfers to bank accounts); the
-- column exists so other methods can be added without a schema change.

CREATE TABLE IF NOT EXISTS user_payout_details (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL DEFAULT 'bank' CHECK (method IN ('bank')),
    account_holder VARCHAR(200) NOT NULL,
    bank_country VARCHAR(60) NOT NULL,
    account_currency VARCHAR(3) NOT NULL,
    bank_name VARCHAR(200) NOT NULL,
    branch_info VARCHAR(200),
    account_number VARCHAR(120) NOT NULL,
    extra_info VARCHAR(300),
    allow_small_payout BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
