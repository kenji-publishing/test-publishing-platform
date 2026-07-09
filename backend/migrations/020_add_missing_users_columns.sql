-- =============================================
-- 020: Add users columns expected by application code (2026-07)
--
-- The base schema (setup-database.js) keeps roles in the separate
-- user_roles table, but newer route code (auth.js, auth-magic.js,
-- finance.js, translation-queue.js) reads/writes these columns
-- directly on users. Registration fails without users.role.
-- Idempotent: safe to run multiple times.
-- =============================================

-- Role: 'reader' | 'author' | 'translator' | 'editor' | 'admin'
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'reader';

-- UI language preference (used by magic-link registration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';

-- Creator payout details (used by finance admin views)
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_method VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_details JSONB;

-- Translator language list (read by translation-queue admin view)
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]';

-- Keep role consistent for any rows created before this migration
UPDATE users SET role = 'reader' WHERE role IS NULL;

DO $$
BEGIN
    RAISE NOTICE '=== 020 Complete: users.role / preferred_language / payout_* / languages added ===';
END $$;
