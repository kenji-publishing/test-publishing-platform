-- =============================================
-- Verification Requests Table
-- For user identity verification system
-- =============================================

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Request details
    requested_role VARCHAR(20) NOT NULL CHECK (requested_role IN ('author', 'translator', 'editor')),
    document_type VARCHAR(50) NOT NULL, -- 'passport', 'drivers_license', 'national_id', 'other'
    document_url TEXT, -- Path to uploaded document
    document_filename VARCHAR(255),
    
    -- Additional info provided by user
    full_legal_name VARCHAR(255),
    date_of_birth DATE,
    nationality VARCHAR(100),
    additional_notes TEXT,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
    
    -- Review details
    reviewed_by UUID REFERENCES users(user_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT, -- Internal notes by reviewer
    rejection_reason TEXT, -- Reason shown to user if rejected
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_verification_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_created ON verification_requests(created_at DESC);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verification_updated_at ON verification_requests;
CREATE TRIGGER trigger_verification_updated_at
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_updated_at();

-- Add some test data (optional - comment out in production)
/*
INSERT INTO verification_requests (user_id, requested_role, document_type, full_legal_name, status)
SELECT user_id, 'author', 'passport', 'John Author Smith', 'pending'
FROM users WHERE email = 'author@publisher.com'
ON CONFLICT DO NOTHING;
*/

-- View for pending verifications count (useful for dashboard)
CREATE OR REPLACE VIEW pending_verifications_count AS
SELECT COUNT(*) as count
FROM verification_requests
WHERE status = 'pending';
