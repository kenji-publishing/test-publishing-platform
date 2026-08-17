-- 056: 翻訳版から翻訳元の作品への紐づけ
--
-- これまで各言語版は完全に独立した作品だった。そのため
--   ・「木鳥建欠」で検索しても、著者名を各言語表記にした版は出てこない
--   ・「カタルシス」で検索しても日本語版しか出てこない（題名が版ごとに違うため）
--   ・作品ページから他の言語版へ行く道がない
-- という状態だった。
--
-- 販売は今までどおり1言語ずつ、収益分配も変更しない。
-- ここで足すのは「どの作品の翻訳版か」という1本の線だけ。
--
-- 原作は NULL。翻訳版は原作の work_id を持つ。
-- 同じ作品の全版は COALESCE(original_work_id, work_id) が一致する。
ALTER TABLE works ADD COLUMN IF NOT EXISTS original_work_id UUID REFERENCES works(work_id) ON DELETE SET NULL;

-- 版の一覧・検索の広げ方の両方でこの列を辿るため索引を張る
CREATE INDEX IF NOT EXISTS idx_works_original_work ON works(original_work_id);

COMMENT ON COLUMN works.original_work_id IS
    'The work this one is a translation of. NULL for an original. All editions of a book share COALESCE(original_work_id, work_id).';
