-- 032: Resumable AI tool jobs
--
-- Long jobs (novel translation: dozens of Claude calls) previously lost ALL
-- progress if one chunk failed (e.g. API credit exhaustion at 58%). Completed
-- chunks are now persisted here after each chunk, so a retry resumes from the
-- failure point instead of restarting — no wasted API cost, no re-waiting.
-- Cleared when the job completes (result_text is the durable final output).

ALTER TABLE ai_tool_orders ADD COLUMN IF NOT EXISTS partial_chunks JSONB;
