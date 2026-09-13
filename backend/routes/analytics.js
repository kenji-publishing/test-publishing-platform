/**
 * Analytics Routes
 * Phase 10: アナリティクスシステム
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { cleanToken, cleanUrl } = require('../services/acquisition');

// 自サイト内の遷移は「参照元」に数えない
const OWN_HOSTS = ['auctlect.com', 'www.auctlect.com', 'localhost', '127.0.0.1'];
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|monitor/i;

/** ログイン中なら user_id、そうでなければ null（来訪の記録はログイン必須にしない） */
function optionalUserId(req) {
    const h = req.headers['authorization'];
    const token = h && h.split(' ')[1];
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).userId || null;
    } catch (e) {
        return null;
    }
}

/** IPは末尾を落として保存する（IPv4は最後の1区切り、IPv6は下位を切る） */
function maskIp(ip) {
    if (!ip) return null;
    ip = String(ip).replace(/^::ffff:/, '');
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return ip.replace(/\.\d+$/, '.0');
    if (ip.includes(':')) {
        if (ip === '::1') return ip;
        const head = ip.split('::')[0].split(':').filter(Boolean).slice(0, 3);
        return head.length === 3 ? head.join(':') + '::' : null;
    }
    return null;
}

/** SQL: referrer から www. 抜きのドメインを取り出す式 */
const REF_HOST_SQL = "substring(referrer from '^https?://(?:www\\.)?([^/:?#]+)')";
/** SQL: 来訪の入口。utm_source > 外部の参照元ドメイン > direct */
const ENTRY_SOURCE_SQL = `COALESCE(utm_source,
    CASE WHEN ${REF_HOST_SQL} = ANY($2::text[]) THEN NULL ELSE ${REF_HOST_SQL} END,
    'direct')`;
/** SQL: 訪問者の識別子。ログイン中はuser、そうでなければセッション */
const VISITOR_SQL = "COALESCE(user_id::text, session_id)";

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
 * ページを開いたことを1回知らせる（navbar.js から全ページで呼ばれる）
 * 目印（utm_*）と Cloudflare の国も一緒に残す。失敗しても閲覧には影響させない。
 */
router.post('/track/pageview', async (req, res) => {
    const pool = req.app.get('db');
    const b = req.body || {};
    const userAgent = (req.headers['user-agent'] || '').slice(0, 500);
    if (BOT_RE.test(userAgent)) return res.json({ success: true, skipped: 'bot' });

    const pagePath = cleanUrl(b.page_path, 500);
    if (!pagePath) return res.status(400).json({ error: 'page_path required' });

    try {
        const country = (req.headers['cf-ipcountry'] || '').toUpperCase().slice(0, 2);
        await pool.query(`
            INSERT INTO page_views
                (user_id, session_id, page_path, page_type, referrer, user_agent, ip_address,
                 device_type, browser, os, country, utm_source, utm_medium, utm_campaign, utm_content, lang)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
            optionalUserId(req),
            cleanToken(b.session_id, 100),
            pagePath,
            cleanToken(b.page_type, 50),
            cleanUrl(b.referrer, 500),
            userAgent,
            maskIp(req.ip),
            detectDeviceType(userAgent),
            detectBrowser(userAgent),
            detectOS(userAgent),
            /^[A-Z]{2}$/.test(country) ? country : null,
            cleanToken(b.utm_source),
            cleanToken(b.utm_medium),
            cleanToken(b.utm_campaign),
            cleanToken(b.utm_content),
            cleanToken(b.lang, 10)
        ]);
        res.json({ success: true });
    } catch (error) {
        console.error('Track pageview error:', error.message);
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
                w.work_id as id,
                w.title,
                COALESCE(SUM(wa.page_views), 0) as views,
                COALESCE(SUM(wa.unique_visitors), 0) as readers,
                COALESCE(SUM(wa.revenue), 0) as revenue
            FROM works w
            LEFT JOIN work_analytics_daily wa ON w.work_id = wa.work_id AND wa.date >= CURRENT_DATE - $2::int
            WHERE w.author_id = $1
            GROUP BY w.work_id, w.title
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
 * 全体の来訪・登録・購入。集計表（analytics_daily）は誰も埋めていなかったので、
 * page_views / users / transactions から直接数える。
 */
router.get('/admin/overview', authenticateToken, requireAdmin, async (req, res) => {
    const pool = req.app.get('db');
    const days = parseInt(req.query.period) || 30;
    const own = OWN_HOSTS;

    try {
        // $1 = 期間の日数、$2 = 何日前まで戻すか（0 = 今期、days = 前期）
        const periodStats = (offsetDays) => pool.query(`
            SELECT
                (SELECT COUNT(*) FROM page_views
                  WHERE created_at >= CURRENT_DATE - ($1::int + $2::int)
                    AND created_at <  CURRENT_DATE - $2::int + 1) AS page_views,
                (SELECT COUNT(DISTINCT ${VISITOR_SQL}) FROM page_views
                  WHERE created_at >= CURRENT_DATE - ($1::int + $2::int)
                    AND created_at <  CURRENT_DATE - $2::int + 1) AS unique_visitors,
                (SELECT COUNT(*) FROM users
                  WHERE created_at >= CURRENT_DATE - ($1::int + $2::int)
                    AND created_at <  CURRENT_DATE - $2::int + 1) AS new_users,
                (SELECT COUNT(*) FROM transactions
                  WHERE status = 'completed' AND transaction_type IN ('purchase', 'ai_tool')
                    AND created_at >= CURRENT_DATE - ($1::int + $2::int)
                    AND created_at <  CURRENT_DATE - $2::int + 1) AS purchases
        `, [days, offsetDays]);

        const [curRes, prevRes] = await Promise.all([periodStats(0), periodStats(days)]);

        const revenueRes = await pool.query(`
            SELECT currency, SUM(amount) AS total, COUNT(*) AS count
            FROM transactions
            WHERE status = 'completed' AND transaction_type IN ('purchase', 'ai_tool')
              AND created_at >= CURRENT_DATE - $1::int
            GROUP BY currency ORDER BY count DESC
        `, [days]);

        const trendRes = await pool.query(`
            SELECT d::date AS date,
                   COALESCE(pv.page_views, 0)::int AS page_views,
                   COALESCE(pv.unique_visitors, 0)::int AS unique_visitors,
                   COALESCE(nu.new_users, 0)::int AS new_users
            FROM generate_series(CURRENT_DATE - $1::int, CURRENT_DATE, interval '1 day') d
            LEFT JOIN (
                SELECT DATE(created_at) AS dt, COUNT(*) AS page_views,
                       COUNT(DISTINCT ${VISITOR_SQL}) AS unique_visitors
                FROM page_views WHERE created_at >= CURRENT_DATE - $1::int GROUP BY 1
            ) pv ON pv.dt = d::date
            LEFT JOIN (
                SELECT DATE(created_at) AS dt, COUNT(*) AS new_users
                FROM users WHERE created_at >= CURRENT_DATE - $1::int GROUP BY 1
            ) nu ON nu.dt = d::date
            ORDER BY 1
        `, [days]);

        const topWorksRes = await pool.query(`
            SELECT w.work_id AS id, w.title,
                   COALESCE(u.pen_name, u.first_name || ' ' || u.last_name) AS author_name,
                   COALESCE(w.view_count, 0)::int AS views,
                   COALESCE(t.purchases, 0)::int AS purchases
            FROM works w
            JOIN users u ON w.author_id = u.user_id
            LEFT JOIN (
                SELECT work_id, COUNT(*) AS purchases FROM transactions
                WHERE status = 'completed' AND transaction_type = 'purchase'
                  AND created_at >= CURRENT_DATE - $1::int
                GROUP BY work_id
            ) t ON t.work_id = w.work_id
            WHERE w.status = 'published'
            ORDER BY purchases DESC, views DESC
            LIMIT 10
        `, [days]);

        const deviceRes = await pool.query(`
            SELECT COALESCE(device_type, 'desktop') AS device, COUNT(*)::int AS n
            FROM page_views WHERE created_at >= CURRENT_DATE - $1::int GROUP BY 1
        `, [days]);

        const countryRes = await pool.query(`
            SELECT country, COUNT(DISTINCT ${VISITOR_SQL})::int AS visitors
            FROM page_views
            WHERE created_at >= CURRENT_DATE - $1::int AND country IS NOT NULL
            GROUP BY country ORDER BY visitors DESC LIMIT 10
        `, [days]);

        // 入口別の訪問者数。訪問者ごとに「最初に開いたページ」の参照元で数える
        // （サイト内を回るたびに direct が増えないように）
        const sourcesRes = await pool.query(`
            WITH firsts AS (
                SELECT DISTINCT ON (${VISITOR_SQL})
                       ${ENTRY_SOURCE_SQL} AS source
                FROM page_views
                WHERE created_at >= CURRENT_DATE - $1::int
                ORDER BY ${VISITOR_SQL}, created_at
            )
            SELECT source, COUNT(*)::int AS visitors
            FROM firsts GROUP BY source ORDER BY visitors DESC LIMIT 15
        `, [days, own]);

        // 目印（UTM）別。閲覧数・訪問者数と、その目印から来て登録した人数
        const campaignsRes = await pool.query(`
            SELECT utm_source AS source, utm_medium AS medium, utm_campaign AS campaign, utm_content AS content,
                   COUNT(*)::int AS page_views,
                   COUNT(DISTINCT ${VISITOR_SQL})::int AS visitors
            FROM page_views
            WHERE created_at >= CURRENT_DATE - $1::int
              AND (utm_source IS NOT NULL OR utm_campaign IS NOT NULL)
            GROUP BY 1, 2, 3, 4 ORDER BY visitors DESC LIMIT 30
        `, [days]);

        const signupsRes = await pool.query(`
            SELECT COALESCE(acquisition_source,
                       CASE WHEN substring(acquisition_referrer from '^https?://(?:www\\.)?([^/:?#]+)') = ANY($2::text[]) THEN NULL
                            ELSE substring(acquisition_referrer from '^https?://(?:www\\.)?([^/:?#]+)') END,
                       CASE WHEN acquisition_at IS NULL THEN 'unknown' ELSE 'direct' END) AS source,
                   acquisition_medium AS medium,
                   acquisition_campaign AS campaign,
                   acquisition_content AS content,
                   COUNT(*)::int AS signups
            FROM users
            WHERE created_at >= CURRENT_DATE - $1::int
            GROUP BY 1, 2, 3, 4 ORDER BY signups DESC LIMIT 30
        `, [days, own]);

        const cur = curRes.rows[0];
        const prev = prevRes.rows[0];
        const calcChange = (c, p) => {
            c = parseInt(c) || 0; p = parseInt(p) || 0;
            if (!p) return c ? 100 : 0;
            return ((c - p) / p * 100).toFixed(1);
        };

        const device = { desktop: 0, mobile: 0, tablet: 0 };
        deviceRes.rows.forEach(r => { device[r.device] = (device[r.device] || 0) + r.n; });
        const country = {};
        countryRes.rows.forEach(r => { country[r.country] = r.visitors; });

        // 目印ごとに登録者数を突き合わせる
        const key = r => [r.source || '', r.medium || '', r.campaign || '', r.content || ''].join('|');
        const signupByKey = {};
        signupsRes.rows.forEach(r => { signupByKey[key(r)] = r.signups; });
        const campaigns = campaignsRes.rows.map(r => ({ ...r, signups: signupByKey[key(r)] || 0 }));

        res.json({
            success: true,
            period: days,
            overview: {
                pageViews: { value: parseInt(cur.page_views), change: calcChange(cur.page_views, prev.page_views) },
                uniqueVisitors: { value: parseInt(cur.unique_visitors), change: calcChange(cur.unique_visitors, prev.unique_visitors) },
                newUsers: { value: parseInt(cur.new_users), change: calcChange(cur.new_users, prev.new_users) },
                purchases: { value: parseInt(cur.purchases), change: calcChange(cur.purchases, prev.purchases) },
                revenue: revenueRes.rows.map(r => ({ currency: r.currency, total: parseFloat(r.total), count: parseInt(r.count) }))
            },
            trend: trendRes.rows,
            topWorks: topWorksRes.rows,
            deviceBreakdown: device,
            countryBreakdown: country,
            sources: sourcesRes.rows,
            campaigns,
            signupSources: signupsRes.rows,
            userGrowth: trendRes.rows.map(r => ({ date: r.date, new_users: r.new_users }))
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
                (SELECT COUNT(*) FROM page_views WHERE created_at >= CURRENT_DATE)::int AS page_views,
                (SELECT COUNT(DISTINCT ${VISITOR_SQL}) FROM page_views WHERE created_at >= CURRENT_DATE)::int AS visitors,
                (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE)::int AS new_users,
                (SELECT COUNT(*) FROM transactions
                  WHERE status = 'completed' AND transaction_type IN ('purchase', 'ai_tool')
                    AND created_at >= CURRENT_DATE)::int AS purchases
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
                    purchases: 0
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
            // 日別の来訪・訪問者に、入口（utm_source か参照元）と目印を添えて出す
            const result = await pool.query(`
                SELECT to_char(DATE(created_at), 'YYYY-MM-DD') AS date,
                       ${ENTRY_SOURCE_SQL} AS source,
                       utm_campaign AS campaign,
                       COUNT(*)::int AS page_views,
                       COUNT(DISTINCT ${VISITOR_SQL})::int AS visitors
                FROM page_views
                WHERE created_at >= CURRENT_DATE - $1::int
                GROUP BY 1, 2, 3 ORDER BY 1, 4 DESC
            `, [days, OWN_HOSTS]);
            data = result.rows;
        } else if (type === 'works') {
            const result = await pool.query(`
                SELECT 
                    wa.*,
                    w.title as work_title,
                    COALESCE(u.pen_name, u.first_name || ' ' || u.last_name) as author_name
                FROM work_analytics_daily wa
                JOIN works w ON wa.work_id = w.work_id
                JOIN users u ON w.author_id = u.user_id
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
