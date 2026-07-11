-- 029: Direct messages — tables required by routes/messages.js
-- (conversations/messages existed only in the old local dev DB; production never had them)

CREATE TABLE IF NOT EXISTS conversations (
    conversation_id SERIAL PRIMARY KEY,
    participant_1 UUID NOT NULL REFERENCES users(user_id),
    participant_2 UUID NOT NULL REFERENCES users(user_id),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- one conversation per user pair regardless of who started it
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_pair
    ON conversations (LEAST(participant_1, participant_2), GREATEST(participant_1, participant_2));

CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(user_id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id) WHERE is_read = FALSE;

CREATE TABLE IF NOT EXISTS blocked_users (
    block_id SERIAL PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES users(user_id),
    blocked_id UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS user_message_settings (
    user_id UUID PRIMARY KEY REFERENCES users(user_id),
    allow_messages VARCHAR(20) DEFAULT 'all',
    allow_proposals BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collaboration_proposals (
    proposal_id SERIAL PRIMARY KEY,
    work_id UUID REFERENCES works(work_id) ON DELETE SET NULL,
    from_user_id UUID NOT NULL REFERENCES users(user_id),
    to_user_id UUID NOT NULL REFERENCES users(user_id),
    proposal_type VARCHAR(20) NOT NULL,
    target_language VARCHAR(10),
    message TEXT NOT NULL,
    portfolio_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_proposals_to ON collaboration_proposals(to_user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_from ON collaboration_proposals(from_user_id);
