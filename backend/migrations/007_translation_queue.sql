-- Publisher Platform - Translation Queue Tables
-- Phase 7: Translation Queue Management
-- Created: 2025-12-02

-- Translation requests table (for human translator assignments)
CREATE TABLE IF NOT EXISTS translation_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Work information
    work_id UUID REFERENCES works(work_id) ON DELETE CASCADE,
    chapter_id UUID, -- Optional: specific chapter translation
    
    -- Language settings
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    
    -- Request details
    request_type VARCHAR(20) DEFAULT 'human', -- 'human', 'ai', 'hybrid'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'review', 'completed', 'cancelled'
    
    -- Assignment
    requested_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Content
    word_count INTEGER DEFAULT 0,
    estimated_hours DECIMAL(5,2),
    
    -- Payment
    payment_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    
    -- Quality
    quality_score INTEGER, -- 0-100
    review_notes TEXT,
    reviewed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Deadlines
    deadline TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Translation progress tracking
CREATE TABLE IF NOT EXISTS translation_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES translation_requests(request_id) ON DELETE CASCADE,
    
    -- Progress details
    progress_percent INTEGER DEFAULT 0, -- 0-100
    words_translated INTEGER DEFAULT 0,
    
    -- Notes
    translator_notes TEXT,
    
    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Translation activity log
CREATE TABLE IF NOT EXISTS translation_activity (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES translation_requests(request_id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- 'created', 'assigned', 'status_change', 'progress_update', 'completed', 'reviewed'
    activity_description TEXT,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    
    -- Who performed
    performed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    performed_by_name VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_translation_requests_status ON translation_requests(status);
CREATE INDEX IF NOT EXISTS idx_translation_requests_assigned_to ON translation_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_translation_requests_work_id ON translation_requests(work_id);
CREATE INDEX IF NOT EXISTS idx_translation_requests_priority ON translation_requests(priority);
CREATE INDEX IF NOT EXISTS idx_translation_requests_created_at ON translation_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_translation_progress_request_id ON translation_progress(request_id);
CREATE INDEX IF NOT EXISTS idx_translation_activity_request_id ON translation_activity(request_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_translation_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS translation_requests_updated_at ON translation_requests;
CREATE TRIGGER translation_requests_updated_at
    BEFORE UPDATE ON translation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_translation_request_updated_at();

-- Comments
COMMENT ON TABLE translation_requests IS 'Stores translation requests for human translators and AI translations';
COMMENT ON TABLE translation_progress IS 'Tracks progress updates for ongoing translations';
COMMENT ON TABLE translation_activity IS 'Audit log for all translation-related activities';
