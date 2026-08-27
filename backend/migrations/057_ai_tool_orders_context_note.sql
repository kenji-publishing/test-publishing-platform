-- 057: AIツールの注文に「コンテキスト（作品の背景情報）」を保存する
--
-- 055 の style/genre と同じで、入力欄は画面にあったのに値がどこにも送られておらず、
-- 書いても捨てられていた。用語集は「何と訳すか」しか伝えられないため、
-- 「その語が人名なのか普通名詞なのか」を伝える手段が無く、
-- 「うそつき -> Liar」が a liar と訳し戻される取りこぼしが残っていた。
--
-- 自由文なので、指示の乗っ取りを防ぐ整形を services/workProfile.js の
-- normalizeContextNote() で行ってから保存する（長さも500字で切る）。
-- NULL = 未指定（従来どおり、指示文にこの一節が入らない）。
ALTER TABLE ai_tool_orders ADD COLUMN IF NOT EXISTS context_note VARCHAR(500);

COMMENT ON COLUMN ai_tool_orders.context_note IS
    'Author-written background about the work (setting, who is a character vs an ordinary noun). Sanitized by services/workProfile.js normalizeContextNote(); NULL means unspecified.';
