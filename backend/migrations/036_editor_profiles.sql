-- 036: Editor profiles (編集者ディレクトリ用)
--
-- translator_profiles と対になる編集者版。編集者は言語ペアではなく
-- 「対応できる言語」の単一リストを持つ（editor_languages）。
-- 依頼はDM（messages）経由で行い、正式な契約は既存のコラボフロー
-- （work-detailから申請→承認→同意書）を使う。

CREATE TABLE IF NOT EXISTS editor_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    bio TEXT,
    years_experience INTEGER DEFAULT 0,
    specializations TEXT[] DEFAULT '{}',
    certifications TEXT,
    portfolio_url VARCHAR(500),
    avg_response_hours INTEGER DEFAULT 24,
    is_available BOOLEAN DEFAULT TRUE,
    accepting_new_clients BOOLEAN DEFAULT TRUE,
    avg_rating NUMERIC(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS editor_languages (
    language_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES editor_profiles(profile_id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    is_native BOOLEAN DEFAULT FALSE,
    UNIQUE (profile_id, language)
);

CREATE INDEX IF NOT EXISTS idx_editor_languages_lang ON editor_languages(language);
