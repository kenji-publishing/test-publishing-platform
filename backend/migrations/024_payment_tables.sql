-- =============================================
-- 024: Create payment tables the code writes to (2026-07)
--
-- The Stripe webhook and PayPal capture insert into transactions and
-- revenue_splits, and works.js / interactions.js read/write likes,
-- but none of these tables were ever created. purchases (phase8d)
-- also lacked the unique constraint its ON CONFLICT relies on.
-- Idempotent: safe to run multiple times.
-- =============================================

-- 1. Transactions (read by finance/admin dashboards)
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    work_id UUID REFERENCES works(work_id) ON DELETE SET NULL,
    transaction_type VARCHAR(30) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(30),
    payment_gateway_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_work ON transactions(work_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- 2. Revenue splits (creator payouts ledger: author/translator/editor/platform)
CREATE TABLE IF NOT EXISTS revenue_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID REFERENCES works(work_id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revenue_splits_recipient ON revenue_splits(recipient_id);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_work ON revenue_splits(work_id);

-- 3. Likes (work like/unlike, feeds works.like_count)
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- 4. purchases: unique constraint for webhook idempotency
--    (ON CONFLICT (user_id, work_id) DO NOTHING requires it)
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_user_work
ON purchases(user_id, work_id);

DO $$
BEGIN
    RAISE NOTICE '=== 024 Complete: transactions / revenue_splits / likes created ===';
END $$;
