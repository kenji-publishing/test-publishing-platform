/**
 * Analytics Routes
 * Phase 10: アナリティクスシステム
 */

const express = require('express');
const router = express.Router();

// =============================================
// Middleware
// =============================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// =============================================
// Tracking Endpoints
// =============================================

/**
 * POST /api/analytics/track/pageview
 * Track page view
 */
router.post('/track/pageview', async (req, res) => {
    const pool = req.app.get('db');
    const { page_path, page_type, referrer, session_id } = req.body;
    
    try {
        // Parse user agent
        const userAgent = req.headers['user-agent'] || '';
        const deviceType = detectDeviceType(userAgent);
        const browser = detectBrowser(userAgent);
        const os = detectOS(userAgent);
        
        // Get IP and geo (simplified)
        const ip = req.ip || req.connection.remoteAddress;
        
        await pool.query(`
            INSERT INTO page_views (user_id, session_id, page_path, page_type, referrer, user_agent, ip_address, device_type, browser, os)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            req.body.user_id || null,
            session_id,
            page_path,
            page_type,
            referrer,
            userAgent,
            ip,
            deviceType,
            browser,
            os
        ]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Track pageview error:', error);
        res.status(500).json({ error: 'Failed to track pageview' });
    }
});

/**
 * POST /api/analytics/track/work
 * Track work view
 */
router.post('/track/work', async (req, res) => {
    const pool = req.app.get('db');
    const { work_id, view_type, chapter_index, reading_time_seconds, scroll_percentage, session_id, referrer_type, referrer_source } = req.body;
    
    try {
        const userAgent = req.headers['user-agent'] || '';
        const deviceType = detectDeviceType(userAgent);
        
        await pool.query(`
            INSERT INTO work_views (work_id, user_id, session_id, view_type, chapter_index, reading_time_seconds, scroll_percentage, device_type, referrer_type, referrer_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            work_id,
            req.body.user_id || null,
            session_id,
            view_type || 'page',
            chapter_index,
            reading_time_seconds || 0,
            scroll_percentage || 0,
            deviceType,
            referrer_type,
            referrer_source
        ]);
        
        // Update work view count
        await pool.query(`
            UPDATE works SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1
        `, [work_id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Track work view error:', error);
        res.status(500).json({ error: 'Failed to track work view' });
    }
});

/**
 * POST /api/analytics/track/event
 * Track custom event
 */
router.post('/track/event', async (req, res) => {
    const pool = req.app.get('db');
    const { event_type, event_category, event_target, event_value, page_path, session_id } = req.body;
    
    try {
        await pool.query(`
            INSERT INTO user_events (user_id, session_id, event_type, event_category, event_target, event_value, page_path)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            req.body.user_id || null,
            session_id,
            event_type,
            event_category,
            event_target,
            event_value ? JSON.stringify(event_value) : null,
            page_path
        ]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Track event error:', error);
        res.status(500).json({ error: 'Failed to track event' });
    }
});

// =============================================
// Author Analytics Endpoints
// =============================================

/**
 * GET /api/analytics/author/overview
 * Get author's analytics overview
 */
router.get('/author/overview', authenticateToken, async (req, res) => {
    const pool = req.app.get('db');
    const authorId = req.user.id;
    const { period = '30' } = req.query;
    const days = parseInt(period) || 30;
    
    try {
        // Get total stats
        const totalsResult = await pool.query(`
            SELECT 
                COALESCE(SUM(total_views), 0) as total_views,
                COALESCE(SUM(unique_readers), 0) as unique_readers,
                COALESCE(SUM(total_reading_time_minutes), 0) as total_reading_time,
                COALESCE(SUM(downloads), 0) as downloads,
                COALESCE(SUM(purchases), 0) as purchases,
                COALESCE(SUM(likes), 0) as likes,
                COALESCE(SUM(comments), 0) as comments,
                COALESCE(SUM(bookmarks), 0) as bookmarks,
                COALESCE(SUM(revenue), 0) as revenue
            FROM author_analytics_daily
            WHERE author_id = $1
            AND date >= CURRENT_DATE - $2::int
        `, [authorId, days]);
        
        // Get previous period for comparison
        const previousResult = await pool.query(`
            SELECT 
                COALESCE(SUM(total_views), 0) as total_views,
                COALESCE(SUM(unique_readers), 0) as unique_readers,
                COALESCE(SUM(revenue), 0) as revenue
            FROM author_analytics_daily
            WHERE author_id = $1
            AND date >= CURRENT_DATE - $2::int * 2
            AND date < CURRENT_DATE - $2::int
        `, [authorId, days]);
        
        // Get daily trend
        const trendResult = await pool.query(`
            SELECT 
                date,
                total_views as views,
                unique_readers as readers,
                revenue
            FROM author_analytics_daily
            WHERE author_id = $1
            AND date >= CURRENT_DATE - $2::int
            ORDER BY date ASC
        `, [authorId, days]);
        
        // Get top works
        const topWorksResult = await pool.query(`
            SELECT 
                w.id,
                w.title,
                COALESCE(SUM(wa.page_views), 0) as views,
                COALESCE(SUM(wa.unique_visitors), 0) as readers,
                COALESCE(SUM(wa.revenue), 0) as revenue
            FROM works w
            LEFT JOIN work_analytics_daily wa ON w.id = wa.work_id AND wa.date >= CURRENT_DATE - $2::int
            WHERE w.author_id = $1
            GROUP BY w.id, w.title
            ORDER BY views DESC
            LIMIT 5
        `, [authorId, days]);
        
        const totals = totalsResult.rows[0];
        const previous = previousResult.rows[0];
        
        // Calculate changes
        const calcChange = (current, prev) => {
            if (!prev || prev == 0) return 0;
            return ((current - prev) / prev * 100).toFixed(1);
        };
        
        res.json({
            success: true,
            period: days,
            overview: {
                views: {
                    value: parseInt(totals.total_views),
                    change: calcChange(totals.total_views, previous.total_views)
                },
                readers: {
                    value: parseInt(totals.unique_readers),
                    change: calcChange(totals.unique_readers, previous.unique_readers)
                },
                readingTime: {
                    value: parseInt(totals.total_reading_time),
                    formatted: formatReadingTime(totals.total_reading_time)
                },
                engagement: {
                    likes: parseInt(totals.likes),
                    comments: parseInt(totals.comments),
                    bookmarks: parseInt(totals.bookmarks),
                    downloads: parseInt(totals.downloads)
                },
                revenue: {
                    value: parseFloat(totals.revenue).toFixed(2),
                    change: calcChange(totals.revenue, previous.revenue),
                    currency: 'JPY'
                }
            },
            trend: trendResult.rows,
            topWorks: topWorksResult.rows
        });
    } catch (error) {
        console.error('Author analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

/**
 * GET /api/analytics/author/work/:workId
 * Get analytics for a specific work
 */
router.get('/author/work/:workId', authenticateToken, async (req, res) => {
    const pool = req.app.get('db');
    const { workId } = req.params;
    const authorId = req.user.id;
    const { period = '30' } = req.query;
    const days = parseInt(period) || 30;
    
    try {
        // Verify ownership
        const workCheck = await pool.query(
            'SELECT id, title FROM works WHERE id = $1 AND author_id = $2',
            [workId, authorId]
        );
        
        if (workCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Work not found' });
        }
        
        const work = workCheck.rows[0];
        
        // Get aggregated stats
        const statsResult = await pool.query(`
            SELECT 
                COALESCE(SUM(page_views), 0) as total_views,
                COALESCE(SUM(unique_visitors), 0) as unique_visitors,
                COALESCE(SUM(preview_views), 0) as preview_views,
                COALESCE(SUM(full_reads), 0) as full_reads,
                COALESCE(SUM(total_reading_time_minutes), 0) as reading_time,
                COALESCE(AVG(avg_scroll_percentage), 0) as avg_scroll,
                COALESCE(SUM(downloads), 0) as downloads,
                COALESCE(SUM(purchases), 0) as purchases,
                COALESCE(SUM(likes), 0) as likes,
                COALESCE(SUM(comments), 0) as comments,
                COALESCE(SUM(bookmarks), 0) as bookmarks,
                COALESCE(SUM(revenue), 0) as revenue
            FROM work_analytics_daily
            WHERE work_id = $1
            AND date >= CURRENT_DATE - $2::int
        `, [workId, days]);
        
        // Get daily trend
        const trendResult = await pool.query(`
            SELECT 
                date,
                page_views as views,
                unique_visitors as visitors,
                revenue
            FROM work_analytics_daily
            WHERE work_id = $1
            AND date >= CURRENT_DATE - $2::int
            ORDER BY date ASC
        `, [workId, days]);
        
        // Get device breakdown
        const deviceResult = await pool.query(`
            SELECT 
                COALESCE(
                    jsonb_object_agg(
                        key,
                        COALESCE((value)::int, 0)
                    ),
                    '{}'::jsonb
                ) as breakdown
            FROM (
                SELECT key, SUM((value)::int) as value
                FROM work_analytics_daily, jsonb_each_text(device_breakdown)
                WHERE work_id = $1 AND date >= CURRENT_DATE - $2::int
                GROUP BY key
            ) sub
        `, [workId, days]);
        
        // Get country breakdown
        const countryResult = await pool.query(`
            SELECT 
                COALESCE(
                    jsonb_object_agg(
                        key,
                        COALESCE((value)::int, 0)
                    ),
                    '{}'::jsonb
                ) as breakdown
            FROM (
                SELECT key, SUM((value)::int) as value
                FROM work_analytics_daily, jsonb_each_text(country_breakdown)
                WHERE work_id = $1 AND date >= CURRENT_DATE - $2::int
                GROUP BY key
            ) sub
        `, [workId, days]);
        
        const stats = statsResult.rows[0];
        
        res.json({
            success: true,
            work: {
                id: work.id,
                title: work.title
            },
            period: days,
            stats: {
                views: parseInt(stats.total_views),
                uniqueVisitors: parseInt(stats.unique_visitors),
                previewViews: parseInt(stats.preview_views),
                fullReads: parseInt(stats.full_reads),
                readingTime: {
                    minutes: parseInt(stats.reading_time),
                    formatted: formatReadingTime(stats.reading_time)
                },
                avgScroll: parseFloat(stats.avg_scroll).toFixed(1),
                engagement: {
                    likes: parseInt(stats.likes),
                    comments: parseInt(stats.comments),
                    bookmarks: parseInt(stats.bookmarks),
                    downloads: parseInt(stats.downloads)
                },
                revenue: parseFloat(stats.revenue).toFixed(2)
            },
            trend: trendResult.rows,
            deviceBreakdown: deviceResult.rows[0]?.breakdown || {},
            countryBreakdown: countryResult.rows[0]?.breakdown || {}
        });
    } catch (error) {
        console.error('Work analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch work analytics' });
    }
});

// =============================================
// Admin Analytics Endpoints
// =============================================

/**
 * GET /api/analytics/admin/overview
 * Get platform-wide analytics overview
 */
router.get('/admin/overview', authenticateToken, requireAdmin, async (req, res) => {
    const pool = req.app.get('db');
    const { period = '30' } = req.query;
    const days = parseInt(period) || 30;
    
    try {
        // Get aggregated platform stats
        const statsResult = await pool.query(`
            SELECT 
                COALESCE(SUM(total_page_views), 0) as total_page_views,
                COALESCE(SUM(unique_visitors), 0) as unique_visitors,
                COALESCE(SUM(new_users), 0) as new_users,
                COALESCE(AVG(active_users), 0) as avg_active_users,
                COALESCE(SUM(total_work_views), 0) as total_work_views,
                COALESCE(SUM(total_reading_time_minutes), 0) as total_reading_time,
                COALESCE(SUM(total_purchases), 0) as total_purchases,
                COALESCE(SUM(total_revenue), 0) as total_revenue,
                COALESCE(SUM(platform_revenue), 0) as platform_revenue
            FROM analytics_daily
            WHERE date >= CURRENT_DATE - $1::int
        `, [days]);
        
        // Get previous period
        const prevResult = await pool.query(`
            SELECT 
                COALESCE(SUM(total_page_views), 0) as total_page_views,
                COALESCE(SUM(unique_visitors), 0) as unique_visitors,
                COALESCE(SUM(new_users), 0) as new_users,
                COALESCE(SUM(total_revenue), 0) as total_revenue
            FROM analytics_daily
            WHERE date >= CURRENT_DATE - $1::int * 2
            AND date < CURRENT_DATE - $1::int
        `, [days]);
        
        // Get daily trend
        const trendResult = await pool.query(`
            SELECT 
                date,
                total_page_views as page_views,
                unique_visitors,
                new_users,
                total_revenue as revenue
            FROM analytics_daily
            WHERE date >= CURRENT_DATE - $1::int
            ORDER BY date ASC
        `, [days]);
        
        // Get top works
        const topWorksResult = await pool.query(`
            SELECT 
                w.id,
                w.title,
                u.display_name as author_name,
                COALESCE(SUM(wa.page_views), 0) as views,
                COALESCE(SUM(wa.revenue), 0) as revenue
            FROM works w
            JOIN users u ON w.author_id = u.id
            LEFT JOIN work_analytics_daily wa ON w.id = wa.work_id AND wa.date >= CURRENT_DATE - $1::int
            WHERE w.status = 'published'
            GROUP BY w.id, w.title, u.display_name
            ORDER BY views DESC
            LIMIT 10
        `, [days]);
        
        // Get device breakdown
        const deviceResult = await pool.query(`
            SELECT 
                COALESCE(SUM((device_breakdown->>'desktop')::int), 0) as desktop,
                COALESCE(SUM((device_breakdown->>'mobile')::int), 0) as mobile,
                COALESCE(SUM((device_breakdown->>'tablet')::int), 0) as tablet
            FROM analytics_daily
            WHERE date >= CURRENT_DATE - $1::int
        `, [days]);
        
        // Get country breakdown
        const countryResult = await pool.query(`
            SELECT 
                COALESCE(
                    jsonb_object_agg(
                        key,
                        COALESCE((value)::int, 0)
                    ),
                    '{}'::jsonb
                ) as breakdown
            FROM (
                SELECT key, SUM((value)::int) as value
                FROM analytics_daily, jsonb_each_text(country_breakdown)
                WHERE date >= CURRENT_DATE - $1::int
                GROUP BY key
                ORDER BY value DESC
                LIMIT 10
            ) sub
        `, [days]);
        
        // Get user growth
        const userGrowthResult = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_users
            FROM users
            WHERE created_at >= CURRENT_DATE - $1::int
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [days]);
        
        const stats = statsResult.rows[0];
        const prev = prevResult.rows[0];
        
        const calcChange = (current, previous) => {
            if (!previous || previous == 0) return 0;
            return ((current - previous) / previous * 100).toFixed(1);
        };
        
        res.json({
            success: true,
            period: days,
            overview: {
                pageViews: {
                    value: parseInt(stats.total_page_views),
                    change: calcChange(stats.total_page_views, prev.total_page_views)
                },
                uniqueVisitors: {
                    value: parseInt(stats.unique_visitors),
                    change: calcChange(stats.unique_visitors, prev.unique_visitors)
                },
                newUsers: {
                    value: parseInt(stats.new_users),
                    change: calcChange(stats.new_users, prev.new_users)
                },
                avgActiveUsers: parseInt(stats.avg_active_users),
                workViews: parseInt(stats.total_work_views),
                readingTime: {
                    minutes: parseInt(stats.total_reading_time),
                    formatted: formatReadingTime(stats.total_reading_time)
                },
                purchases: parseInt(stats.total_purchases),
                revenue: {
                    total: parseFloat(stats.total_revenue).toFixed(2),
                    platform: parseFloat(stats.platform_revenue).toFixed(2),
                    change: calcChange(stats.total_revenue, prev.total_revenue),
                    currency: 'JPY'
                }
            },
            trend: trendResult.rows,
            topWorks: topWorksResult.rows,
            deviceBreakdown: deviceResult.rows[0],
            countryBreakdown: countryResult.rows[0]?.breakdown || {},
            userGrowth: userGrowthResult.rows
        });
    } catch (error) {
        console.error('Admin analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch admin analytics' });
    }
});

/**
 * GET /api/analytics/admin/realtime
 * Get real-time stats
 */
router.get('/admin/realtime', authenticateToken, requireAdmin, async (req, res) => {
    const pool = req.app.get('db');
    
    try {
        // Active users in last 5 minutes
        const activeResult = await pool.query(`
            SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id)) as count
            FROM page_views
            WHERE created_at >= NOW() - INTERVAL '5 minutes'
        `);
        
        // Page views in last hour
        const hourlyResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM page_views
            WHERE created_at >= NOW() - INTERVAL '1 hour'
        `);
        
        // Today's stats
        const todayResult = await pool.query(`
            SELECT 
                COALESCE(total_page_views, 0) as page_views,
                COALESCE(unique_visitors, 0) as visitors,
                COALESCE(new_users, 0) as new_users,
                COALESCE(total_revenue, 0) as revenue
            FROM analytics_daily
            WHERE date = CURRENT_DATE
        `);
        
        res.json({
            success: true,
            realtime: {
                activeUsers: parseInt(activeResult.rows[0]?.count || 0),
                pageViewsLastHour: parseInt(hourlyResult.rows[0]?.count || 0),
                today: todayResult.rows[0] || {
                    page_views: 0,
                    visitors: 0,
                    new_users: 0,
                    revenue: 0
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Realtime analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch realtime data' });
    }
});

/**
 * GET /api/analytics/admin/export
 * Export analytics data
 */
router.get('/admin/export', authenticateToken, requireAdmin, async (req, res) => {
    const pool = req.app.get('db');
    const { type = 'platform', period = '30', format = 'json' } = req.query;
    const days = parseInt(period) || 30;
    
    try {
        let data;
        
        if (type === 'platform') {
            const result = await pool.query(`
                SELECT * FROM analytics_daily
                WHERE date >= CURRENT_DATE - $1::int
                ORDER BY date ASC
            `, [days]);
            data = result.rows;
        } else if (type === 'works') {
            const result = await pool.query(`
                SELECT 
                    wa.*,
                    w.title as work_title,
                    u.display_name as author_name
                FROM work_analytics_daily wa
                JOIN works w ON wa.work_id = w.id
                JOIN users u ON w.author_id = u.id
                WHERE wa.date >= CURRENT_DATE - $1::int
                ORDER BY wa.date ASC, wa.page_views DESC
            `, [days]);
            data = result.rows;
        }
        
        if (format === 'csv') {
            const csv = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=analytics_${type}_${days}days.csv`);
            return res.send(csv);
        }
        
        res.json({
            success: true,
            type,
            period: days,
            data
        });
    } catch (error) {
        console.error('Export analytics error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// =============================================
// Helper Functions
// =============================================

function detectDeviceType(userAgent) {
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
}

function detectBrowser(userAgent) {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    if (/opera/i.test(userAgent)) return 'Opera';
    return 'Other';
}

function detectOS(userAgent) {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
    return 'Other';
}

function formatReadingTime(minutes) {
    if (!minutes || minutes < 1) return '0分';
    if (minutes < 60) return `${Math.round(minutes)}分`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (mins === 0) return `${hours}時間`;
    return `${hours}時間${mins}分`;
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            if (typeof val === 'object') return JSON.stringify(val);
            if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
            return val;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

module.exports = router;
