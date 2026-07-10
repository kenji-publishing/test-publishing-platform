-- =============================================
-- 021: Add currency to works (2026-07)
--
-- The upload form lets authors pick a currency (USD/JPY/EUR/GBP/
-- KRW/CNY/BRL/SAR) but it was never stored; checkout hardcoded USD.
-- Idempotent: safe to run multiple times.
-- =============================================

ALTER TABLE works ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

UPDATE works SET currency = 'USD' WHERE currency IS NULL;

DO $$
BEGIN
    RAISE NOTICE '=== 021 Complete: works.currency added ===';
END $$;
