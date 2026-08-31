-- 058: 「AI翻訳だが、母語話者の確認はまだ」という状態を作品に持たせる
--
-- なぜ必要か:
--   自分が読めない言語へAIで訳した作品は、作者自身に正しさを確かめる手立てがない。
--   伏せておけばその言語の読者に出会うこともないので、
--   「未確認である」と明示したうえで公開し、読める人の協力を募れるようにする。
--
-- ai_translation_usage（na / none / assisted / full_ai）とは別の軸。
--   assisted や full_ai であっても、母語話者が確認済みなら false になる。
ALTER TABLE works ADD COLUMN IF NOT EXISTS needs_translation_review BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN works.needs_translation_review IS
    'The author cannot vouch for this translation and is asking readers of that language for help. Shown on the work page; independent of ai_translation_usage.';
