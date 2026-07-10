-- =============================================
-- 022: Add works columns expected by application code (2026-07)
--
-- The base schema (setup-database.js) predates the current works.js:
-- it lacks synopsis, content (the manuscript body itself), language,
-- cover_image, AI-disclosure fields, preview/word/page counts.
-- Work creation fails with 'column "synopsis" does not exist'.
-- Idempotent: safe to run multiple times.
-- =============================================

ALTER TABLE works ADD COLUMN IF NOT EXISTS synopsis TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS language VARCHAR(5);
ALTER TABLE works ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT FALSE;
ALTER TABLE works ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE works ADD COLUMN IF NOT EXISTS ai_tools_used TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS preview_percent INTEGER DEFAULT 10;
ALTER TABLE works ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE works ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 0;

-- Belt and braces: currency (021) in case it was skipped
ALTER TABLE works ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Keep language consistent with original_language for existing rows
UPDATE works SET language = original_language WHERE language IS NULL;

DO $$
BEGIN
    RAISE NOTICE '=== 022 Complete: works columns (synopsis/content/language/etc.) added ===';
END $$;
