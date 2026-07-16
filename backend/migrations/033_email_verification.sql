-- 033: Email verification required at signup + magic_links table
--
-- New registrations must click a verification link before they can log in
-- (bot / fake-account protection now that SES sending is live).
-- Existing accounts are grandfathered as verified.

-- Token storage used by routes/auth-magic.js and the new verification flow
-- (this table only ever existed in the old local dev DB, never in production)
CREATE TABLE IF NOT EXISTS magic_links (
    link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    link_type VARCHAR(30) NOT NULL DEFAULT 'login',
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_magic_links_user ON magic_links(user_id, is_used);

-- 既存ユーザーは検証済み扱い（ロックアウト防止）。新規はDEFAULT FALSE（確認済み: 現在の既定値）
UPDATE users SET email_verified = TRUE WHERE email_verified IS NOT TRUE;
