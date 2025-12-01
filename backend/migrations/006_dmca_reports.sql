-- Publisher Platform - DMCA Reports Table
-- Phase 6: Copyright Infringement Management
-- Created: 2025-12-01

-- DMCA status enum
DO $$ BEGIN
    CREATE TYPE dmca_status AS ENUM ('new', 'reviewing', 'action_taken', 'rejected', 'counter_notice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- DMCA report type enum
DO $$ BEGIN
    CREATE TYPE dmca_report_type AS ENUM ('copyright', 'trademark', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main DMCA reports table
CREATE TABLE IF NOT EXISTS dmca_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reporter information
    reporter_name VARCHAR(255) NOT NULL,
    reporter_email VARCHAR(255) NOT NULL,
    reporter_company VARCHAR(255),
    reporter_address TEXT,
    reporter_phone VARCHAR(50),
    
    -- Reported content
    work_id UUID REFERENCES works(work_id) ON DELETE SET NULL,
    work_title VARCHAR(255),
    infringing_url TEXT,
    
    -- Original work information
    original_work_title VARCHAR(500) NOT NULL,
    original_work_url TEXT,
    original_work_description TEXT,
    ownership_proof TEXT,
    
    -- Report details
    report_type dmca_report_type DEFAULT 'copyright',
    description TEXT NOT NULL,
    
    -- Legal declarations
    good_faith_belief BOOLEAN DEFAULT false,
    accuracy_statement BOOLEAN DEFAULT false,
    authorization_statement BOOLEAN DEFAULT false,
    signature VARCHAR(255),
    
    -- Processing
    status dmca_status DEFAULT 'new',
    assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- DMCA report actions/history table
CREATE TABLE IF NOT EXISTS dmca_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES dmca_reports(report_id) ON DELETE CASCADE,
    
    -- Action details
    action_type VARCHAR(50) NOT NULL, -- status_change, note_added, content_removed, warning_sent, etc.
    action_description TEXT NOT NULL,
    previous_status dmca_status,
    new_status dmca_status,
    
    -- Who performed the action
    performed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    performed_by_name VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Counter-notice table (for when accused party responds)
CREATE TABLE IF NOT EXISTS dmca_counter_notices (
    counter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES dmca_reports(report_id) ON DELETE CASCADE,
    
    -- Counter-notice submitter
    submitter_name VARCHAR(255) NOT NULL,
    submitter_email VARCHAR(255) NOT NULL,
    submitter_address TEXT,
    submitter_phone VARCHAR(50),
    
    -- Counter-notice content
    statement TEXT NOT NULL,
    good_faith_belief BOOLEAN DEFAULT false,
    consent_to_jurisdiction BOOLEAN DEFAULT false,
    signature VARCHAR(255),
    
    -- Processing
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected
    reviewed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    review_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dmca_reports_status ON dmca_reports(status);
CREATE INDEX IF NOT EXISTS idx_dmca_reports_created_at ON dmca_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dmca_reports_work_id ON dmca_reports(work_id);
CREATE INDEX IF NOT EXISTS idx_dmca_reports_reporter_email ON dmca_reports(reporter_email);
CREATE INDEX IF NOT EXISTS idx_dmca_actions_report_id ON dmca_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_dmca_counter_notices_report_id ON dmca_counter_notices(report_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_dmca_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS dmca_reports_updated_at ON dmca_reports;
CREATE TRIGGER dmca_reports_updated_at
    BEFORE UPDATE ON dmca_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_dmca_updated_at();

-- Sample test data (optional)
-- INSERT INTO dmca_reports (
--     reporter_name, reporter_email, reporter_company,
--     work_title, original_work_title, original_work_url,
--     description, good_faith_belief, accuracy_statement, authorization_statement, signature
-- ) VALUES (
--     'Test Reporter', 'reporter@example.com', 'Test Publishing Co.',
--     'Tokyo Dreams', 'Original Tokyo Story', 'https://example.com/original',
--     'This work appears to copy significant portions of my original story.',
--     true, true, true, 'Test Reporter'
-- );

COMMENT ON TABLE dmca_reports IS 'Stores DMCA takedown requests and copyright infringement reports';
COMMENT ON TABLE dmca_actions IS 'Audit log for all actions taken on DMCA reports';
COMMENT ON TABLE dmca_counter_notices IS 'Counter-notices submitted in response to DMCA reports';
