-- 054: 作品ごとの著者名（表示名）
--
-- これまで作品の著者名はアカウントの pen_name（無ければ姓名）から毎回組み立てていたため、
-- 作品ごとに変えられなかった。別の言語で出す作品では名前もその言語の表記にする必要があるので
-- （例: 日本語作品は「森島 健二」、英語版は「Kenji Morishima」）、作品側に持たせる。
--
-- NULL または空文字 = 未設定。その場合は従来どおりアカウント側の名前を表示する。
ALTER TABLE works ADD COLUMN IF NOT EXISTS author_name VARCHAR(150);

COMMENT ON COLUMN works.author_name IS
    'Byline shown to readers for this work. NULL/empty falls back to users.pen_name (then first+last name).';
