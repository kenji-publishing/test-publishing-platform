-- =============================================
-- 023: Add like/comment counters to works (2026-07)
--
-- GET /api/works selects w.like_count and w.comment_count, but the
-- base schema never created them, so the public browse listing
-- failed. Idempotent: safe to run multiple times.
-- =============================================

ALTER TABLE works ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE works ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

DO $$
BEGIN
    RAISE NOTICE '=== 023 Complete: works.like_count / comment_count added ===';
END $$;
