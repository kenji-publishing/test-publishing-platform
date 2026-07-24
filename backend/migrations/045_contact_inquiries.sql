-- 045: Contact inquiries (お問い合わせフォーム)
--
-- ヘルプセンターの絞り込み動線（カテゴリ選択→関連FAQ→それでも解決しない場合のみ
-- フォーム）の最終到達点。ログイン必須（kenjiさん決定）。
-- 返信はメールではなく**アプリ内メッセージ（既存のconversations/messages）**で行い、
-- 返信時に status='answered' になる。SESの承認状況に依存しない。

CREATE TABLE IF NOT EXISTS contact_inquiries (
    inquiry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL,          -- faq_categoriesのid（文脈FAQ表示と対応）
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'answered', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_user ON contact_inquiries(user_id);
