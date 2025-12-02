-- Publisher Platform - Translator Marketplace Tables
-- Phase 7b: Translator Marketplace
-- Allows authors to find and hire translators directly

-- Translator profiles (extends users table)
CREATE TABLE IF NOT EXISTS translator_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Basic info
    display_name VARCHAR(255),
    bio TEXT,
    profile_image_url VARCHAR(500),
    
    -- Professional info
    years_experience INTEGER DEFAULT 0,
    specializations TEXT[], -- e.g., ['fiction', 'manga', 'technical', 'poetry']
    certifications TEXT,
    portfolio_url VARCHAR(500),
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    max_concurrent_projects INTEGER DEFAULT 3,
    
    -- Pricing (per 1000 characters/words)
    base_rate_per_1000 DECIMAL(10,2) DEFAULT 10.00,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Response time
    avg_response_hours INTEGER DEFAULT 24,
    
    -- Stats (auto-calculated)
    total_projects INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    
    -- Settings
    accepting_new_clients BOOLEAN DEFAULT true,
    auto_accept_under_words INTEGER, -- Auto-accept projects under this word count
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Translator language pairs (what languages they can translate)
CREATE TABLE IF NOT EXISTS translator_languages (
    language_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES translator_profiles(profile_id) ON DELETE CASCADE,
    
    source_language VARCHAR(10) NOT NULL, -- e.g., 'ja'
    target_language VARCHAR(10) NOT NULL, -- e.g., 'en'
    
    -- Proficiency
    proficiency_level VARCHAR(20) DEFAULT 'professional', -- 'native', 'professional', 'intermediate'
    is_native_target BOOLEAN DEFAULT false, -- Native speaker of target language
    
    -- Custom rate for this pair (optional, overrides base_rate)
    custom_rate_per_1000 DECIMAL(10,2),
    
    -- Stats for this language pair
    projects_completed INTEGER DEFAULT 0,
    avg_rating_for_pair DECIMAL(3,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(profile_id, source_language, target_language)
);

-- Translation requests from authors to translators
CREATE TABLE IF NOT EXISTS translation_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parties involved
    author_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    translator_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    translator_profile_id UUID REFERENCES translator_profiles(profile_id) ON DELETE SET NULL,
    
    -- Work to translate
    work_id UUID REFERENCES works(work_id) ON DELETE CASCADE,
    chapter_id UUID, -- Optional: specific chapter
    
    -- Languages
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    
    -- Job details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    word_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending', 
    -- 'pending' (author sent request)
    -- 'accepted' (translator accepted)
    -- 'rejected' (translator declined)
    -- 'in_progress' (translation started)
    -- 'submitted' (translator submitted)
    -- 'revision_requested' (author wants changes)
    -- 'completed' (author approved)
    -- 'cancelled' (either party cancelled)
    
    -- Pricing
    proposed_rate DECIMAL(10,2), -- Rate proposed by author
    agreed_rate DECIMAL(10,2), -- Final agreed rate
    total_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid', 'escrow', 'released', 'refunded'
    payment_id VARCHAR(255), -- Stripe/PayPal reference
    
    -- Timeline
    deadline TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Messages count
    message_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages between author and translator for a job
CREATE TABLE IF NOT EXISTS translation_job_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES translation_jobs(job_id) ON DELETE CASCADE,
    
    sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    
    -- Attachments (for sending translated files)
    attachment_url VARCHAR(500),
    attachment_name VARCHAR(255),
    
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Translator reviews from authors
CREATE TABLE IF NOT EXISTS translator_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    job_id UUID NOT NULL UNIQUE REFERENCES translation_jobs(job_id) ON DELETE CASCADE,
    translator_profile_id UUID NOT NULL REFERENCES translator_profiles(profile_id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Author who wrote review
    
    -- Ratings (1-5)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    
    -- Review text
    review_title VARCHAR(255),
    review_text TEXT,
    
    -- Language pair for this review
    source_language VARCHAR(10),
    target_language VARCHAR(10),
    
    -- Visibility
    is_public BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_translator_profiles_user_id ON translator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_translator_profiles_available ON translator_profiles(is_available, accepting_new_clients);
CREATE INDEX IF NOT EXISTS idx_translator_profiles_rating ON translator_profiles(avg_rating DESC);

CREATE INDEX IF NOT EXISTS idx_translator_languages_profile ON translator_languages(profile_id);
CREATE INDEX IF NOT EXISTS idx_translator_languages_pair ON translator_languages(source_language, target_language);

CREATE INDEX IF NOT EXISTS idx_translation_jobs_author ON translation_jobs(author_id);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_translator ON translation_jobs(translator_id);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON translation_jobs(status);

CREATE INDEX IF NOT EXISTS idx_translator_reviews_profile ON translator_reviews(translator_profile_id);
CREATE INDEX IF NOT EXISTS idx_translator_reviews_rating ON translator_reviews(overall_rating);

-- Trigger to update translator stats after review
CREATE OR REPLACE FUNCTION update_translator_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update average rating and review count
    UPDATE translator_profiles
    SET 
        avg_rating = (
            SELECT COALESCE(AVG(overall_rating), 0)
            FROM translator_reviews
            WHERE translator_profile_id = NEW.translator_profile_id
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM translator_reviews
            WHERE translator_profile_id = NEW.translator_profile_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE profile_id = NEW.translator_profile_id;
    
    -- Update language pair stats
    UPDATE translator_languages
    SET 
        avg_rating_for_pair = (
            SELECT COALESCE(AVG(overall_rating), 0)
            FROM translator_reviews
            WHERE translator_profile_id = NEW.translator_profile_id
            AND source_language = NEW.source_language
            AND target_language = NEW.target_language
        )
    WHERE profile_id = NEW.translator_profile_id
    AND source_language = NEW.source_language
    AND target_language = NEW.target_language;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_translator_stats ON translator_reviews;
CREATE TRIGGER trigger_update_translator_stats
    AFTER INSERT OR UPDATE ON translator_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_translator_stats();

-- Trigger to update job count after completion
CREATE OR REPLACE FUNCTION update_translator_job_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE translator_profiles
        SET 
            completed_projects = completed_projects + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.translator_id;
        
        UPDATE translator_languages
        SET projects_completed = projects_completed + 1
        WHERE profile_id = (SELECT profile_id FROM translator_profiles WHERE user_id = NEW.translator_id)
        AND source_language = NEW.source_language
        AND target_language = NEW.target_language;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_translator_job_count ON translation_jobs;
CREATE TRIGGER trigger_update_translator_job_count
    AFTER UPDATE ON translation_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_translator_job_count();

-- Comments
COMMENT ON TABLE translator_profiles IS 'Extended profiles for users who offer translation services';
COMMENT ON TABLE translator_languages IS 'Language pairs that a translator can work with';
COMMENT ON TABLE translation_jobs IS 'Translation job requests between authors and translators';
COMMENT ON TABLE translation_job_messages IS 'Messages exchanged during a translation job';
COMMENT ON TABLE translator_reviews IS 'Reviews left by authors for translators after job completion';
