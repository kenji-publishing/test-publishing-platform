-- Publisher Platform - Reader Feedback System
-- Phase 7c: Translation feedback from readers

-- Translation feedback reports
CREATE TABLE IF NOT EXISTS translation_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What is being reported
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    translation_id UUID REFERENCES translations(translation_id) ON DELETE SET NULL,
    
    -- Who reported
    reporter_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- The problematic text
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    original_text TEXT,
    translated_text TEXT NOT NULL,
    text_position_start INTEGER,
    text_position_end INTEGER,
    
    -- Feedback details
    category VARCHAR(30) NOT NULL DEFAULT 'other',
    -- Categories: mistranslation, unnatural, unclear, typo, cultural, other
    
    description TEXT,
    suggested_correction TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- Status: pending, reviewing, accepted, rejected, fixed
    
    -- Agreement tracking
    agree_count INTEGER DEFAULT 0,
    
    -- Resolution
    resolved_by UUID REFERENCES users(user_id),
    resolution_note TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback agreements (readers agreeing with a report)
CREATE TABLE IF NOT EXISTS translation_feedback_agreements (
    agreement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES translation_feedback(feedback_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- One agreement per user per feedback
    UNIQUE(feedback_id, user_id)
);

-- Notifications for feedback (sent when threshold reached)
CREATE TABLE IF NOT EXISTS translation_feedback_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES translation_feedback(feedback_id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_role VARCHAR(20) NOT NULL, -- author, translator
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- One notification per recipient per feedback
    UNIQUE(feedback_id, recipient_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_work ON translation_feedback(work_id);
CREATE INDEX IF NOT EXISTS idx_feedback_chapter ON translation_feedback(chapter_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reporter ON translation_feedback(reporter_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON translation_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON translation_feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_agree_count ON translation_feedback(agree_count DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_agreements_feedback ON translation_feedback_agreements(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_agreements_user ON translation_feedback_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_notifications_recipient ON translation_feedback_notifications(recipient_id, is_read);

-- Trigger to update agree_count when agreements change
CREATE OR REPLACE FUNCTION update_feedback_agree_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE translation_feedback
        SET agree_count = agree_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE feedback_id = NEW.feedback_id;
        
        -- Check if threshold reached (3 agreements) and send notifications
        PERFORM notify_on_feedback_threshold(NEW.feedback_id);
        
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE translation_feedback
        SET agree_count = agree_count - 1,
            updated_at = CURRENT_TIMESTAMP
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

-- Function to send notifications when threshold is reached
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
    -- Get feedback details
    SELECT agree_count, work_id, translation_id
    INTO v_agree_count, v_work_id, v_translation_id
    FROM translation_feedback
    WHERE feedback_id = p_feedback_id;
    
    -- Only proceed if threshold just reached (exactly 3)
    IF v_agree_count = v_threshold THEN
        -- Get author ID
        SELECT author_id INTO v_author_id
        FROM works
        WHERE work_id = v_work_id;
        
        -- Notify author
        IF v_author_id IS NOT NULL THEN
            INSERT INTO translation_feedback_notifications (feedback_id, recipient_id, recipient_role)
            VALUES (p_feedback_id, v_author_id, 'author')
            ON CONFLICT (feedback_id, recipient_id) DO NOTHING;
        END IF;
        
        -- Get translator ID if exists
        IF v_translation_id IS NOT NULL THEN
            SELECT translator_id INTO v_translator_id
            FROM translations
            WHERE translation_id = v_translation_id;
            
            IF v_translator_id IS NOT NULL THEN
                INSERT INTO translation_feedback_notifications (feedback_id, recipient_id, recipient_role)
                VALUES (p_feedback_id, v_translator_id, 'translator')
                ON CONFLICT (feedback_id, recipient_id) DO NOTHING;
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- View for feedback with work and reporter info
CREATE OR REPLACE VIEW translation_feedback_view AS
SELECT 
    tf.feedback_id,
    tf.work_id,
    tf.chapter_id,
    tf.translation_id,
    tf.reporter_id,
    tf.source_language,
    tf.target_language,
    tf.original_text,
    tf.translated_text,
    tf.text_position_start,
    tf.text_position_end,
    tf.category,
    tf.description,
    tf.suggested_correction,
    tf.status,
    tf.agree_count,
    tf.resolved_by,
    tf.resolution_note,
    tf.resolved_at,
    tf.created_at,
    tf.updated_at,
    w.title AS work_title,
    c.title AS chapter_title,
    u.pen_name AS reporter_name,
    ru.pen_name AS resolver_name
FROM translation_feedback tf
JOIN works w ON tf.work_id = w.work_id
LEFT JOIN chapters c ON tf.chapter_id = c.chapter_id
JOIN users u ON tf.reporter_id = u.user_id
LEFT JOIN users ru ON tf.resolved_by = ru.user_id;

-- Comments
COMMENT ON TABLE translation_feedback IS 'Reader reports of translation issues';
COMMENT ON TABLE translation_feedback_agreements IS 'Reader agreements with feedback reports';
COMMENT ON TABLE translation_feedback_notifications IS 'Notifications sent to authors/translators';
COMMENT ON COLUMN translation_feedback.category IS 'mistranslation, unnatural, unclear, typo, cultural, other';
COMMENT ON COLUMN translation_feedback.status IS 'pending, reviewing, accepted, rejected, fixed';
