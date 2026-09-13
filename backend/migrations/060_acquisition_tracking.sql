-- =============================================
-- 060: 来訪の記録と、登録者の獲得元（UTM）
-- =============================================
-- page_views は 012 で作ってあったが、フロントから呼ばれておらず空だった。
-- navbar.js が全ページで1回ずつ知らせるようにし、投稿ごとの目印（utm_*）と
-- Cloudflare が付ける国も一緒に残す。
-- users には「最初にどこから来たか」（ファーストタッチ）を登録時に写す。

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_source   VARCHAR(100);
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_medium   VARCHAR(100);
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_content  VARCHAR(100);
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS lang         VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_page_views_utm_campaign ON page_views(utm_campaign) WHERE utm_campaign IS NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_source   VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_medium   VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_campaign VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_content  VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_referrer VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_landing  VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_at       TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.acquisition_source IS '最初の来訪の utm_source。無ければ参照元のドメイン、それも無ければ direct';
