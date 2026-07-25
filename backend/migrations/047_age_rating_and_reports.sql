-- 047: 対象年齢の申告 + 読者からの通報
--
-- 方針（kenjiさん決定・2026-07-24）:
--   露骨な性的描写は禁止（Stripe/PayPalの禁止業種に該当し決済停止のリスク、
--   英国オンライン安全法の年齢確認義務、英国では絵で描かれた児童の性的画像も
--   刑事罰の対象）。よって age_rating に '18' は入れるが**当面UIからは選べない**。
--   全年齢/15+ の申告と内容注意表示のみ運用する。
--
-- 既存の is_adult 列は作品一覧APIの除外条件（excludeAdult既定true）で
-- 使われているため残し、age_rating='18' と同期させる。

-- ===== 対象年齢と内容の注意表示 =====
ALTER TABLE works ADD COLUMN IF NOT EXISTS age_rating VARCHAR(10) NOT NULL DEFAULT 'all';
ALTER TABLE works ADD COLUMN IF NOT EXISTS content_warnings JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'works_age_rating_check') THEN
        ALTER TABLE works ADD CONSTRAINT works_age_rating_check
            CHECK (age_rating IN ('all', '15', '18'));
    END IF;
END $$;

-- 既に成人向けフラグが立っている作品があれば整合させる
UPDATE works SET age_rating = '18' WHERE is_adult = TRUE AND age_rating <> '18';

-- ===== 読者からの通報 =====
-- 「おかしい」と思った描写を読者が知らせ、管理者が確認して
-- 却下 / 著者へ警告 / 作品を非公開（差し止め）を選ぶ。
CREATE TABLE IF NOT EXISTS content_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason VARCHAR(30) NOT NULL
        CHECK (reason IN ('sexual', 'violence', 'hate', 'illegal', 'wrong_rating', 'copyright', 'other')),
    details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'dismissed', 'warned', 'removed')),
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(user_id),
    -- 同じ人が同じ作品を何度も通報して件数を水増しできないようにする
    UNIQUE (work_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_work ON content_reports(work_id);

-- 著者への警告の履歴（何回警告したかが分かるように）
CREATE TABLE IF NOT EXISTS author_warnings (
    warning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    work_id UUID REFERENCES works(work_id) ON DELETE SET NULL,
    report_id UUID REFERENCES content_reports(report_id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('warned', 'removed')),
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS idx_author_warnings_author ON author_warnings(author_id);
