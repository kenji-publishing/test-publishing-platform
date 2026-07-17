/**
 * AuctLect Platform - Editor Directory Routes
 *
 * 編集者ディレクトリ。translator-marketplace の編集者版だが、
 * 依頼の実体はDM（/api/messages/send）+ 既存コラボフロー
 * （work-detailから申請→承認→同意書）なので、ここはプロフィールの
 * 一覧・詳細・自分のプロフィール管理のみを提供する。
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// GET /api/editors - 編集者を検索（公開）
router.get('/', async (req, res) => {
    try {
        const {
            source_language,   // ページの「言語」フィルター
            target_language,   // ページの「第二言語」フィルター
            min_rating,
            specialization,
            sort = 'rating',
            page = 1,
            limit = 20
        } = req.query;

        const where = ['ep.is_available = true', 'ep.accepting_new_clients = true'];
        const params = [];
        let i = 1;

        // 言語フィルター（どちらの欄も「この言語に対応している編集者」の意味）
        for (const lang of [source_language, target_language]) {
            if (lang) {
                where.push(`EXISTS (SELECT 1 FROM editor_languages el WHERE el.profile_id = ep.profile_id AND el.language = $${i++}::varchar)`);
                params.push(lang);
            }
        }
        if (min_rating) {
            where.push(`ep.avg_rating >= $${i++}::decimal`);
            params.push(min_rating);
        }
        if (specialization) {
            where.push(`$${i++}::varchar = ANY(ep.specializations)`);
            params.push(specialization);
        }

        const whereClause = 'WHERE ' + where.join(' AND ');

        let orderBy = 'ep.avg_rating DESC, ep.completed_projects DESC';
        if (sort === 'projects') orderBy = 'ep.completed_projects DESC';
        if (sort === 'reviews') orderBy = 'ep.total_reviews DESC';

        const total = parseInt((await db.query(
            `SELECT COUNT(*) FROM editor_profiles ep ${whereClause}`, params
        )).rows[0].count) || 0;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        params.push(parseInt(limit), offset);

        const result = await db.query(
            `SELECT ep.*, u.pen_name,
                    (SELECT json_agg(json_build_object('language', el.language, 'is_native', el.is_native))
                     FROM editor_languages el WHERE el.profile_id = ep.profile_id) AS languages
             FROM editor_profiles ep
             JOIN users u ON ep.user_id = u.user_id
             ${whereClause}
             ORDER BY ${orderBy}
             LIMIT $${i++}::int OFFSET $${i}::int`,
            params
        );

        res.json({
            editors: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error searching editors:', error);
        res.status(500).json({ error: 'Failed to search editors' });
    }
});

// GET /api/editors/:profileId - 編集者プロフィール詳細（公開）
router.get('/:profileId', async (req, res) => {
    try {
        if (!/^[0-9a-f-]{36}$/i.test(req.params.profileId)) {
            return res.status(404).json({ error: 'Editor not found' });
        }
        const profile = (await db.query(
            `SELECT ep.*, u.pen_name, u.created_at AS member_since
             FROM editor_profiles ep JOIN users u ON ep.user_id = u.user_id
             WHERE ep.profile_id = $1::uuid`,
            [req.params.profileId]
        )).rows[0];
        if (!profile) return res.status(404).json({ error: 'Editor not found' });

        const languages = (await db.query(
            `SELECT * FROM editor_languages WHERE profile_id = $1::uuid ORDER BY is_native DESC, language`,
            [req.params.profileId]
        )).rows;

        res.json({ profile, languages, reviews: [] });
    } catch (error) {
        console.error('Error fetching editor profile:', error);
        res.status(500).json({ error: 'Failed to fetch editor profile' });
    }
});

// ===== 要ログイン =====
router.use(authenticate);

// POST /api/editors/profile - 自分の編集者プロフィールを作成/更新
router.post('/profile', async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            displayName, bio, yearsExperience, specializations,
            certifications, portfolioUrl, avgResponseHours,
            languages // [{language, isNative}] — まとめて置き換え
        } = req.body;

        const existing = (await db.query(
            'SELECT profile_id FROM editor_profiles WHERE user_id = $1::uuid', [userId]
        )).rows[0];

        let profile;
        if (existing) {
            profile = (await db.query(
                `UPDATE editor_profiles SET
                    display_name = COALESCE($1::varchar, display_name),
                    bio = COALESCE($2::text, bio),
                    years_experience = COALESCE($3::int, years_experience),
                    specializations = COALESCE($4::text[], specializations),
                    certifications = COALESCE($5::text, certifications),
                    portfolio_url = COALESCE($6::varchar, portfolio_url),
                    avg_response_hours = COALESCE($7::int, avg_response_hours),
                    updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $8::uuid RETURNING *`,
                [displayName, bio, yearsExperience, specializations, certifications, portfolioUrl, avgResponseHours, userId]
            )).rows[0];
        } else {
            profile = (await db.query(
                `INSERT INTO editor_profiles (
                    user_id, display_name, bio, years_experience,
                    specializations, certifications, portfolio_url, avg_response_hours
                 ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [userId, displayName, bio, yearsExperience || 0, specializations || [], certifications, portfolioUrl, avgResponseHours || 24]
            )).rows[0];
        }

        // 対応言語はまとめて置き換え（指定があった場合のみ）
        if (Array.isArray(languages)) {
            await db.query('DELETE FROM editor_languages WHERE profile_id = $1::uuid', [profile.profile_id]);
            for (const l of languages.slice(0, 20)) {
                if (!l || !l.language) continue;
                await db.query(
                    `INSERT INTO editor_languages (profile_id, language, is_native)
                     VALUES ($1::uuid, $2::varchar, $3::boolean) ON CONFLICT DO NOTHING`,
                    [profile.profile_id, String(l.language).slice(0, 10), !!l.isNative]
                );
            }
        }

        res.json({ success: true, message: existing ? 'Profile updated' : 'Profile created', profile });
    } catch (error) {
        console.error('Error saving editor profile:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

module.exports = router;
