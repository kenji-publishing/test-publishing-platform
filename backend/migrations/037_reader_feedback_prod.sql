-- 037: 読者フィードバックのテーブル一式（本番向け・009の適合版）
--
-- 経緯: translation_feedback系はmigration 009で定義されていたが、本番DBは
-- 019以降のみ適用の運用だったため存在せず、フィードバック送信が
-- 「relation "translation_feedback" does not exist」で失敗していた
-- （2026-07-18 kenjiさんの実機確認で発覚）。
-- 009との違い（本番DBに合わせた調整）:
--   - chapter_id は REFERENCES chapters(...) を外して素のUUIDに
--     （本番にchaptersテーブルは無く、現行アプリも章テーブルを使わない）
--   - ルートが参照しない translation_feedback_view は作らない
-- IF NOT EXISTS / OR REPLACE のみなので、適用済みのローカルに流しても無害。

CREATE TABLE IF NOT EXISTS translation_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    chapter_id UUID,
    translation_id UUID REFERENCES translations(translation_id) ON DELETE SET NULL,
    reporter_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    original_text TEXT,
    translated_text TEXT NOT NULL,
    text_position_start INTEGER,
    text_position_end INTEGER,
    category VARCHAR(30) NOT NULL DEFAULT 'other',
    description TEXT,
    suggested_correction TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    agree_count INTEGER DEFAULT 0,
    resolved_by UUID REFERENCES users(user_id),
    resolution_note TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS translation_feedback_agreements (
    agreement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES translation_feedback(feedback_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feedback_id, user_id)
);

CREATE TABLE IF NOT EXISTS translation_feedback_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES translation_feedback(feedback_id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_role VARCHAR(20) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feedback_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_work ON translation_feedback(work_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reporter ON translation_feedback(reporter_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON translation_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON translation_feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_agree_count ON translation_feedback(agree_count DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_agreements_feedback ON translation_feedback_agreements(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_agreements_user ON translation_feedback_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_notifications_recipient ON translation_feedback_notifications(recipient_id, is_read);

-- 3人が同感したら作者・翻訳者に通知（トリガーから呼ばれる）
CREATE OR REPLACE FUNCTION notify_on_feedback_threshold(p_feedback_id UUID)
RETURNS VOID AS $$
DECLARE
    v_agree_count INTEGER;
    v_work_id UUID;
    v_translation_id UUID;
    v_author_id UUID;
    v_translator_id UUID;
    v_threshold INTEGER := 3;
BEGIN
    SELECT agree_count, work_id, translation_id
    INTO v_agree_count, v_work_id, v_translation_id
    FROM translation_feedback
    WHERE feedback_id = p_feedback_id;

    IF v_agree_count = v_threshold THEN
        SELECT author_id INTO v_author_id FROM works WHERE work_id = v_work_id;
        IF v_author_id IS NOT NULL THEN
            INSERT INTO translation_feedback_notifications (feedback_id, recipient_id, recipient_role)
            VALUES (p_feedback_id, v_author_id, 'author')
            ON CONFLICT (feedback_id, recipient_id) DO NOTHING;
        END IF;

        IF v_translation_id IS NOT NULL THEN
            SELECT translator_id INTO v_translator_id FROM translations WHERE translation_id = v_translation_id;
            IF v_translator_id IS NOT NULL THEN
                INSERT INTO translation_feedback_notifications (feedback_id, recipient_id, recipient_role)
                VALUES (p_feedback_id, v_translator_id, 'translator')
                ON CONFLICT (feedback_id, recipient_id) DO NOTHING;
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 同感の追加/削除でagree_countを自動更新（ルートはこのトリガーに依存して値を読む）
CREATE OR REPLACE FUNCTION update_feedback_agree_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE translation_feedback
        SET agree_count = agree_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE feedback_id = NEW.feedback_id;
        PERFORM notify_on_feedback_threshold(NEW.feedback_id);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE translation_feedback
        SET agree_count = agree_count - 1, updated_at = CURRENT_TIMESTAMP
        WHERE feedback_id = OLD.feedback_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_feedback_agree_count ON translation_feedback_agreements;
CREATE TRIGGER trigger_update_feedback_agree_count
    AFTER INSERT OR DELETE ON translation_feedback_agreements
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_agree_count();
