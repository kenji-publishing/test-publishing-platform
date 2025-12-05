-- Phase 8D: Self-Service Features Migration
-- Run this after Phase 8 base migration

-- Account deletion requests table
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add notification_settings column to users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'notification_settings'
    ) THEN
        ALTER TABLE users ADD COLUMN notification_settings JSONB DEFAULT '{
            "updates": true,
            "comments": true,
            "sales": true,
            "translation": true,
            "marketing": false
        }'::jsonb;
    END IF;
END $$;

-- Add deleted_at column for soft delete
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
    END IF;
END $$;

-- Purchases table (if not exists)
CREATE TABLE IF NOT EXISTS purchases (
    purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    work_id UUID REFERENCES works(work_id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'completed',
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_token ON account_deletion_requests(token);

-- Verify
SELECT 'Phase 8D Migration Complete' as status;
