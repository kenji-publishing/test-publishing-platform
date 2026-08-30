-- 1回の注文に複数のファイル（章）を入れられるようにする。
--
-- 長編を章ごとに校正・翻訳したい人が、1章ずつ注文して10回払う、ということに
-- ならないようにするためのもの。text_content には全章を連結した本文が入り、
-- parts がその中の切れ目（どこからどこまでが何というファイルか）を持つ。
--
--   parts        [{ "name": "01_序章.txt", "start": 0, "len": 4210 }, ...]
--   result_parts ["章1の仕上がり", "章2の仕上がり", ...]  ← 章ごとにダウンロードできる
--
-- result_parts は章が1つ終わるたびに保存する。途中で失敗しても、
-- 終わった章はやり直さない（AI費用の二重払いと待ち時間を防ぐ）。
-- どちらもNULLなら今までどおりの1ファイル注文。
ALTER TABLE ai_tool_orders ADD COLUMN IF NOT EXISTS parts JSONB;
ALTER TABLE ai_tool_orders ADD COLUMN IF NOT EXISTS result_parts JSONB;
