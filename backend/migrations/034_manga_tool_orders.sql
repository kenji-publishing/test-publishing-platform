-- 034: Manga translation tool (Plan A: AI extracts+translates bubble text,
-- the human places it with the manga editor — no automatic image re-lettering)
--
-- Reuses ai_tool_orders (payment / resumable-job plumbing shared with the
-- editor & novel translator). Manga orders store page image paths instead of
-- text; char_count holds the page count (pricing unit).

ALTER TABLE ai_tool_orders DROP CONSTRAINT IF EXISTS ai_tool_orders_tool_check;
ALTER TABLE ai_tool_orders ADD CONSTRAINT ai_tool_orders_tool_check
    CHECK (tool IN ('editor', 'translator', 'manga'));

-- マンガ注文は原稿テキストを持たない
ALTER TABLE ai_tool_orders ALTER COLUMN text_content DROP NOT NULL;

-- ページ画像のファイルパス一覧（uploads/manga-orders/<orderId>/ 配下）
ALTER TABLE ai_tool_orders ADD COLUMN IF NOT EXISTS pages JSONB;
