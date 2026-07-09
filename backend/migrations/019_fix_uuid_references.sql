-- =============================================
-- 019: Fix UUID reference bugs (2026-07)
--
-- 010_support_system.sql と 012_analytics.sql が
-- 存在しない users(id) / works(id) を参照していたため、
-- 以下のテーブルが本番DBで作成に失敗していた。
-- このパッチは正しい参照 (users(user_id) UUID / works(work_id) UUID)
-- で欠けているテーブルのみを作成する。
-- 既存テーブルには影響しない（IF NOT EXISTS）。何度実行しても安全。
-- =============================================

-- ---------------------------------------------
-- 1. support_tickets (from 010)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    guest_email VARCHAR(255),
    guest_name VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    initial_message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(30) DEFAULT 'open',
    assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
    related_work_id UUID REFERENCES works(work_id) ON DELETE SET NULL,
    related_order_id VARCHAR(100),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- 2. ticket_messages (from 010)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    sender_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_internal_note BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- 3. ticket_ratings (from 010)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_ratings (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES support_tickets(id) ON DELETE CASCADE UNIQUE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ticket indexes (from 010)
CREATE INDEX IF NOT EXISTS idx_tickets_user
ON support_tickets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_status
ON support_tickets(status, priority, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_assigned
ON support_tickets(assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket
ON ticket_messages(ticket_id, created_at);

-- ---------------------------------------------
-- 4. page_views (from 012)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    page_path VARCHAR(500) NOT NULL,
    page_type VARCHAR(50),
    referrer VARCHAR(500),
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_user ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_type ON page_views(page_type);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(DATE(created_at));

-- ---------------------------------------------
-- 5. work_views (from 012)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS work_views (
    id SERIAL PRIMARY KEY,
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    view_type VARCHAR(20) DEFAULT 'page',
    chapter_index INTEGER,
    reading_time_seconds INTEGER DEFAULT 0,
    scroll_percentage INTEGER DEFAULT 0,
    device_type VARCHAR(20),
    country VARCHAR(2),
    referrer_type VARCHAR(30),
    referrer_source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_views_work ON work_views(work_id);
CREATE INDEX IF NOT EXISTS idx_work_views_user ON work_views(user_id);
CREATE INDEX IF NOT EXISTS idx_work_views_created ON work_views(created_at);
CREATE INDEX IF NOT EXISTS idx_work_views_date ON work_views(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_work_views_work_date ON work_views(work_id, DATE(created_at));

-- ---------------------------------------------
-- 6. author_analytics_daily (from 012)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS author_analytics_daily (
    id SERIAL PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_readers INTEGER DEFAULT 0,
    total_reading_time_minutes INTEGER DEFAULT 0,
    avg_reading_time_minutes DECIMAL(8, 2) DEFAULT 0,
    avg_scroll_percentage DECIMAL(5, 2) DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    top_works JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(author_id, date)
);

CREATE INDEX IF NOT EXISTS idx_author_analytics_author ON author_analytics_daily(author_id);
CREATE INDEX IF NOT EXISTS idx_author_analytics_date ON author_analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_author_analytics_author_date ON author_analytics_daily(author_id, date);

-- ---------------------------------------------
-- 7. work_analytics_daily (from 012)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS work_analytics_daily (
    id SERIAL PRIMARY KEY,
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    preview_views INTEGER DEFAULT 0,
    full_reads INTEGER DEFAULT 0,
    total_reading_time_minutes INTEGER DEFAULT 0,
    avg_reading_time_minutes DECIMAL(8, 2) DEFAULT 0,
    avg_scroll_percentage DECIMAL(5, 2) DEFAULT 0,
    bounce_rate DECIMAL(5, 2) DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    device_breakdown JSONB DEFAULT '{"desktop": 0, "mobile": 0, "tablet": 0}',
    country_breakdown JSONB DEFAULT '{}',
    referrer_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(work_id, date)
);

CREATE INDEX IF NOT EXISTS idx_work_analytics_work ON work_analytics_daily(work_id);
CREATE INDEX IF NOT EXISTS idx_work_analytics_date ON work_analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_work_analytics_work_date ON work_analytics_daily(work_id, date);

-- ---------------------------------------------
-- 8. user_events (from 012)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS user_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50),
    event_target VARCHAR(200),
    event_value JSONB,
    page_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_date ON user_events(DATE(created_at));

-- ---------------------------------------------
-- 9. email_logs (from phase8e)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_user_id UUID REFERENCES users(user_id),
    email_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    ticket_id INTEGER REFERENCES support_tickets(id),
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_ticket ON email_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);

-- ---------------------------------------------
-- 10. 本番クリーンアップ:
-- 012 が analytics_daily に投入したランダムな
-- サンプルデータ（テスト用）を削除する。
-- ---------------------------------------------
DELETE FROM analytics_daily;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '=== 019 Fix Complete: missing tables created with correct UUID references ===';
END $$;
