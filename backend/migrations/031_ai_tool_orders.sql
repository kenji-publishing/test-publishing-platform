-- 031: Paid AI tool orders (AI editor / AI translator wizards)
--
-- The wizard posts the manuscript BEFORE payment; it is stored here so the
-- Stripe Checkout redirect cannot lose it. Flow:
--   pending -> (Stripe webhook or /confirm verifies) -> paid
--   -> /run starts the Claude job -> processing -> completed (result_text saved)
-- A failed job returns the order to 'paid' so the user can retry (already paid).

CREATE TABLE IF NOT EXISTS ai_tool_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    tool VARCHAR(20) NOT NULL CHECK (tool IN ('editor', 'translator')),
    model VARCHAR(20) NOT NULL CHECK (model IN ('haiku', 'sonnet', 'opus')),
    source_lang VARCHAR(5),
    target_lang VARCHAR(5),
    glossary JSONB,
    text_content TEXT NOT NULL,
    char_count INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'processing', 'completed', 'canceled')),
    stripe_session_id VARCHAR(255),
    result_text TEXT,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_tool_orders_user ON ai_tool_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_orders_session ON ai_tool_orders(stripe_session_id);
