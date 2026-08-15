-- 055: AIツールの注文に「文体・トーン」と「ジャンル」を保存する
--
-- これらの選択欄は画面にはあったが、値がどこにも送られておらず結果に影響していなかった。
-- 実際にAIへの指示文に反映させるため、注文と一緒に保存する。
-- NULL = 未指定（従来どおり、指示文にはこの一文が入らない）。
ALTER TABLE ai_tool_orders ADD COLUMN IF NOT EXISTS style VARCHAR(30);
ALTER TABLE ai_tool_orders ADD COLUMN IF NOT EXISTS genre VARCHAR(30);

COMMENT ON COLUMN ai_tool_orders.style IS
    'Register/tone chosen by the author. Whitelisted in services/workProfile.js; NULL means unspecified.';
COMMENT ON COLUMN ai_tool_orders.genre IS
    'Genre chosen by the author. Whitelisted in services/workProfile.js; NULL means unspecified.';
