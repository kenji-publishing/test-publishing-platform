-- =============================================
-- Phase 10: Analytics System Migration
-- =============================================

-- =============================================
-- 1. Page Views Tracking
-- =============================================
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    page_path VARCHAR(500) NOT NULL,
    page_type VARCHAR(50), -- 'home', 'work', 'reader', 'profile', 'explore', etc.
    referrer VARCHAR(500),
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
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

-- =============================================
-- 2. Work Analytics (Detailed)
-- =============================================
CREATE TABLE IF NOT EXISTS work_views (
    id SERIAL PRIMARY KEY,
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    view_type VARCHAR(20) DEFAULT 'page', -- 'page', 'preview', 'read', 'download'
    chapter_index INTEGER,
    reading_time_seconds INTEGER DEFAULT 0,
    scroll_percentage INTEGER DEFAULT 0,
    device_type VARCHAR(20),
    country VARCHAR(2),
    referrer_type VARCHAR(30), -- 'direct', 'search', 'social', 'internal', 'external'
    referrer_source VARCHAR(100), -- 'google', 'twitter', 'explore_page', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_views_work ON work_views(work_id);
CREATE INDEX IF NOT EXISTS idx_work_views_user ON work_views(user_id);
CREATE INDEX IF NOT EXISTS idx_work_views_created ON work_views(created_at);
CREATE INDEX IF NOT EXISTS idx_work_views_date ON work_views(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_work_views_work_date ON work_views(work_id, DATE(created_at));

-- =============================================
-- 3. Daily Aggregated Stats (for fast queries)
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    
    -- Platform-wide stats
    total_page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    
    -- Content stats
    total_work_views INTEGER DEFAULT 0,
    total_reading_time_minutes INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    
    -- Revenue stats
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    platform_revenue DECIMAL(12, 2) DEFAULT 0,
    author_payouts DECIMAL(12, 2) DEFAULT 0,
    
    -- Device breakdown (JSON)
    device_breakdown JSONB DEFAULT '{"desktop": 0, "mobile": 0, "tablet": 0}',
    
    -- Top referrers (JSON)
    top_referrers JSONB DEFAULT '[]',
    
    -- Geographic data (JSON)
    country_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);

-- =============================================
-- 4. Author Analytics Daily
-- =============================================
CREATE TABLE IF NOT EXISTS author_analytics_daily (
    id SERIAL PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Views
    total_views INTEGER DEFAULT 0,
    unique_readers INTEGER DEFAULT 0,
    
    -- Engagement
    total_reading_time_minutes INTEGER DEFAULT 0,
    avg_reading_time_minutes DECIMAL(8, 2) DEFAULT 0,
    avg_scroll_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Actions
    downloads INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- Revenue
    revenue DECIMAL(10, 2) DEFAULT 0,
    
    -- Top work (JSON)
    top_works JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(author_id, date)
);

CREATE INDEX IF NOT EXISTS idx_author_analytics_author ON author_analytics_daily(author_id);
CREATE INDEX IF NOT EXISTS idx_author_analytics_date ON author_analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_author_analytics_author_date ON author_analytics_daily(author_id, date);

-- =============================================
-- 5. Work Analytics Daily
-- =============================================
CREATE TABLE IF NOT EXISTS work_analytics_daily (
    id SERIAL PRIMARY KEY,
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Views
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    preview_views INTEGER DEFAULT 0,
    full_reads INTEGER DEFAULT 0,
    
    -- Engagement
    total_reading_time_minutes INTEGER DEFAULT 0,
    avg_reading_time_minutes DECIMAL(8, 2) DEFAULT 0,
    avg_scroll_percentage DECIMAL(5, 2) DEFAULT 0,
    bounce_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Actions
    downloads INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- Revenue
    revenue DECIMAL(10, 2) DEFAULT 0,
    
    -- Device breakdown
    device_breakdown JSONB DEFAULT '{"desktop": 0, "mobile": 0, "tablet": 0}',
    
    -- Geographic
    country_breakdown JSONB DEFAULT '{}',
    
    -- Referrer sources
    referrer_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(work_id, date)
);

CREATE INDEX IF NOT EXISTS idx_work_analytics_work ON work_analytics_daily(work_id);
CREATE INDEX IF NOT EXISTS idx_work_analytics_date ON work_analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_work_analytics_work_date ON work_analytics_daily(work_id, date);

-- =============================================
-- 6. User Events (for detailed tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS user_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL, -- 'click', 'scroll', 'purchase', 'download', 'share', etc.
    event_category VARCHAR(50), -- 'work', 'navigation', 'social', 'commerce'
    event_target VARCHAR(200), -- element or page identifier
    event_value JSONB, -- additional data
    page_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_date ON user_events(DATE(created_at));

-- =============================================
-- 7. Real-time Stats Cache
-- =============================================
CREATE TABLE IF NOT EXISTS realtime_stats (
    id SERIAL PRIMARY KEY,
    stat_key VARCHAR(100) NOT NULL UNIQUE,
    stat_value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default realtime stats
INSERT INTO realtime_stats (stat_key, stat_value, expires_at) VALUES
('active_users_now', '{"count": 0, "users": []}', NOW() + INTERVAL '5 minutes'),
('popular_works_today', '{"works": []}', NOW() + INTERVAL '15 minutes'),
('trending_authors', '{"authors": []}', NOW() + INTERVAL '1 hour')
ON CONFLICT (stat_key) DO NOTHING;

-- =============================================
-- 8. Add view_count to works table if not exists
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'view_count'
    ) THEN
        ALTER TABLE works ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'download_count'
    ) THEN
        ALTER TABLE works ADD COLUMN download_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'unique_readers'
    ) THEN
        ALTER TABLE works ADD COLUMN unique_readers INTEGER DEFAULT 0;
    END IF;
END $$;

-- =============================================
-- Sample Data for Testing
-- =============================================

-- Insert sample platform analytics for the last 30 days
INSERT INTO analytics_daily (date, total_page_views, unique_visitors, new_users, active_users, total_work_views, total_reading_time_minutes, total_purchases, total_revenue, platform_revenue, device_breakdown, country_breakdown)
SELECT 
    generate_series::date,
    floor(random() * 500 + 100)::int, -- page_views
    floor(random() * 200 + 50)::int, -- unique_visitors
    floor(random() * 30 + 5)::int, -- new_users
    floor(random() * 150 + 30)::int, -- active_users
    floor(random() * 300 + 50)::int, -- work_views
    floor(random() * 1000 + 200)::int, -- reading_time
    floor(random() * 20 + 2)::int, -- purchases
    (random() * 500 + 50)::decimal(12,2), -- total_revenue
    (random() * 150 + 15)::decimal(12,2), -- platform_revenue
    jsonb_build_object('desktop', floor(random() * 200 + 50), 'mobile', floor(random() * 150 + 30), 'tablet', floor(random() * 50 + 10)),
    jsonb_build_object('JP', floor(random() * 100 + 30), 'US', floor(random() * 50 + 10), 'GB', floor(random() * 20 + 5), 'DE', floor(random() * 15 + 3))
FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, INTERVAL '1 day')
ON CONFLICT (date) DO NOTHING;

-- Insert sample work analytics (assuming works exist)
INSERT INTO work_analytics_daily (work_id, date, page_views, unique_visitors, preview_views, full_reads, total_reading_time_minutes, downloads, likes, comments, bookmarks, revenue, device_breakdown, country_breakdown)
SELECT 
    w.id,
    d.date,
    floor(random() * 50 + 5)::int,
    floor(random() * 30 + 3)::int,
    floor(random() * 20 + 2)::int,
    floor(random() * 15 + 1)::int,
    floor(random() * 100 + 10)::int,
    floor(random() * 5)::int,
    floor(random() * 10)::int,
    floor(random() * 5)::int,
    floor(random() * 8)::int,
    (random() * 50)::decimal(10,2),
    jsonb_build_object('desktop', floor(random() * 20 + 5), 'mobile', floor(random() * 15 + 3), 'tablet', floor(random() * 5 + 1)),
    jsonb_build_object('JP', floor(random() * 15 + 5), 'US', floor(random() * 8 + 2))
FROM works w
CROSS JOIN (
    SELECT generate_series::date as date 
    FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, INTERVAL '1 day')
) d
WHERE w.status = 'published'
ON CONFLICT (work_id, date) DO NOTHING;

-- Update works view_count from analytics
UPDATE works w SET 
    view_count = COALESCE((SELECT SUM(page_views) FROM work_analytics_daily WHERE work_id = w.id), 0),
    unique_readers = COALESCE((SELECT SUM(unique_visitors) FROM work_analytics_daily WHERE work_id = w.id), 0)
WHERE w.status = 'published';

-- Insert sample author analytics
INSERT INTO author_analytics_daily (author_id, date, total_views, unique_readers, total_reading_time_minutes, downloads, purchases, likes, comments, bookmarks, revenue, top_works)
SELECT 
    u.id,
    d.date,
    COALESCE(SUM(wa.page_views), 0)::int,
    COALESCE(SUM(wa.unique_visitors), 0)::int,
    COALESCE(SUM(wa.total_reading_time_minutes), 0)::int,
    COALESCE(SUM(wa.downloads), 0)::int,
    COALESCE(SUM(wa.purchases), 0)::int,
    COALESCE(SUM(wa.likes), 0)::int,
    COALESCE(SUM(wa.comments), 0)::int,
    COALESCE(SUM(wa.bookmarks), 0)::int,
    COALESCE(SUM(wa.revenue), 0)::decimal(10,2),
    '[]'::jsonb
FROM users u
CROSS JOIN (
    SELECT generate_series::date as date 
    FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, INTERVAL '1 day')
) d
LEFT JOIN works w ON w.author_id = u.id
LEFT JOIN work_analytics_daily wa ON wa.work_id = w.id AND wa.date = d.date
WHERE u.role IN ('author', 'translator', 'admin')
GROUP BY u.id, d.date
ON CONFLICT (author_id, date) DO NOTHING;

COMMIT;