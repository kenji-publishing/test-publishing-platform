-- =============================================
-- 025: Allow soft-delete status; store AI disclosure detail (2026-07)
--
-- DELETE /api/works soft-deletes by setting status='deleted', but the
-- enum lacked that value ("invalid input value for enum
-- work_status_enum: deleted"). The upload form also collects separate
-- AI usage for text / cover / translation, which was never stored.
-- Idempotent: safe to run multiple times.
-- =============================================

ALTER TYPE work_status_enum ADD VALUE IF NOT EXISTS 'deleted';

ALTER TABLE works ADD COLUMN IF NOT EXISTS ai_text_usage VARCHAR(20) DEFAULT 'none';
ALTER TABLE works ADD COLUMN IF NOT EXISTS ai_cover_usage VARCHAR(20) DEFAULT 'none';
ALTER TABLE works ADD COLUMN IF NOT EXISTS ai_translation_usage VARCHAR(20) DEFAULT 'none';

DO $$
BEGIN
    RAISE NOTICE '=== 025 Complete: deleted status + ai_*_usage columns ===';
END $$;
