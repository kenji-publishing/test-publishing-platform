/**
 * Publisher Platform - Translator Marketplace Routes
 * Phase 7b: Translator Marketplace
 * 
 * Allows authors to find, contact, and hire translators directly.
 */

const express = require('express');
const router = express.Router();

// Helper function to get database pool
function getPool(req) {
    return req.app.get('db');
}

// Language names mapping
const LANGUAGE_NAMES = {
    'ja': '日本語',
    'en': 'English',
    'zh': '中文',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'ko': '한국어',
    'ar': 'العربية'
};

// ===== PUBLIC ENDPOINTS =====

// GET /api/translators - Search translators
router.get('/', async (req, res) => {
    try {
        const pool = getPool(req);
        const { 
            source_language, 
            target_language, 
            min_rating,
            max_rate,
            specialization,
            sort = 'rating',
            page = 1, 
            limit = 20 
        } = req.query;
        
        let whereConditions = ['tp.is_available = true', 'tp.accepting_new_clients = true'];
        let params = [];
        let paramIndex = 1;
        
        // Language pair filter
        let languageJoin = '';
        if (source_language || target_language) {
            languageJoin = 'INNER JOIN translator_languages tl ON tp.profile_id = tl.profile_id';
            if (source_language) {
                whereConditions.push(`tl.source_language = $${paramIndex++}::varchar`);
                params.push(source_language);
            }
            if (target_language) {
                whereConditions.push(`tl.target_language = $${paramIndex++}::varchar`);
                params.push(target_language);
            }
        } else {
            languageJoin = 'LEFT JOIN translator_languages tl ON tp.profile_id = tl.profile_id';
        }
        
        // Rating filter
        if (min_rating) {
            whereConditions.push(`tp.avg_rating >= $${paramIndex++}::decimal`);
            params.push(min_rating);
        }
        
        // Max rate filter
        if (max_rate) {
            whereConditions.push(`tp.base_rate_per_1000 <= $${paramIndex++}::decimal`);
            params.push(max_rate);
        }
        
        // Specialization filter
        if (specialization) {
            whereConditions.push(`$${paramIndex++}::varchar = ANY(tp.specializations)`);
            params.push(specialization);
        }
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';
        
        // Sort options
        let orderBy = 'tp.avg_rating DESC, tp.completed_projects DESC';
        if (sort === 'rate_low') orderBy = 'tp.base_rate_per_1000 ASC';
        if (sort === 'rate_high') orderBy = 'tp.base_rate_per_1000 DESC';
        if (sort === 'projects') orderBy = 'tp.completed_projects DESC';
        if (sort === 'reviews') orderBy = 'tp.total_reviews DESC';
        
        // Count total
        const countQuery = `
            SELECT COUNT(DISTINCT tp.profile_id) 
            FROM translator_profiles tp
            ${languageJoin}
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count) || 0;
        
        // Get translators
        const offset = (parseInt(page) - 1) * parseInt(limit);
        params.push(parseInt(limit));
        params.push(offset);
        
        const query = `
            SELECT DISTINCT ON (tp.profile_id)
                tp.*,
                u.pen_name,
                u.email,
                (
                    SELECT json_agg(json_build_object(
                        'source', tl2.source_language,
                        'target', tl2.target_language,
                        'is_native', tl2.is_native_target,
                        'projects', tl2.projects_completed,
                        'rating', tl2.avg_rating_for_pair,
                        'custom_rate', tl2.custom_rate_per_1000
                    ))
                    FROM translator_languages tl2
                    WHERE tl2.profile_id = tp.profile_id
                ) as language_pairs
            FROM translator_profiles tp
            INNER JOIN users u ON tp.user_id = u.user_id
            ${languageJoin}
            ${whereClause}
            ORDER BY tp.profile_id, ${orderBy}
            LIMIT $${paramIndex++}::int OFFSET $${paramIndex}::int
        `;
        
        const result = await pool.query(query, params);
        
        res.json({
            translators: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error searching translators:', error);
        res.status(500).json({ error: 'Failed to search translators' });
    }
});

// GET /api/translators/:profileId - Get translator profile
router.get('/:profileId', async (req, res) => {
    try {
        const pool = getPool(req);
        const { profileId } = req.params;
        
        // Get profile
        const profileQuery = `
            SELECT 
                tp.*,
                u.pen_name,
                u.email,
                u.created_at as member_since
            FROM translator_profiles tp
            INNER JOIN users u ON tp.user_id = u.user_id
            WHERE tp.profile_id = $1::uuid
        `;
        const profileResult = await pool.query(profileQuery, [profileId]);
        
        if (profileResult.rows.length === 0) {
            return res.status(404).json({ error: 'Translator not found' });
        }
        
        const profile = profileResult.rows[0];
        
        // Get language pairs
        const languagesQuery = `
            SELECT * FROM translator_languages
            WHERE profile_id = $1::uuid
            ORDER BY projects_completed DESC
        `;
        const languagesResult = await pool.query(languagesQuery, [profileId]);
        
        // Get reviews
        const reviewsQuery = `
            SELECT 
                r.*,
                u.pen_name as reviewer_name
            FROM translator_reviews r
            INNER JOIN users u ON r.reviewer_id = u.user_id
            WHERE r.translator_profile_id = $1::uuid
            AND r.is_public = true
            ORDER BY r.created_at DESC
            LIMIT 10
        `;
        const reviewsResult = await pool.query(reviewsQuery, [profileId]);
        
        res.json({
            profile,
            languages: languagesResult.rows,
            reviews: reviewsResult.rows
        });
    } catch (error) {
        console.error('Error fetching translator profile:', error);
        res.status(500).json({ error: 'Failed to fetch translator profile' });
    }
});

// GET /api/translators/languages/pairs - Get available language pairs
router.get('/languages/pairs', async (req, res) => {
    try {
        const pool = getPool(req);
        
        const query = `
            SELECT 
                source_language,
                target_language,
                COUNT(DISTINCT profile_id) as translator_count,
                AVG(avg_rating_for_pair) as avg_rating
            FROM translator_languages tl
            INNER JOIN translator_profiles tp ON tl.profile_id = tp.profile_id
            WHERE tp.is_available = true
            GROUP BY source_language, target_language
            ORDER BY translator_count DESC
        `;
        
        const result = await pool.query(query);
        
        res.json({
            languagePairs: result.rows,
            languageNames: LANGUAGE_NAMES
        });
    } catch (error) {
        console.error('Error fetching language pairs:', error);
        res.status(500).json({ error: 'Failed to fetch language pairs' });
    }
});

// ===== AUTHENTICATED ENDPOINTS =====

// POST /api/translators/profile - Create/Update translator profile
router.post('/profile', async (req, res) => {
    try {
        const pool = getPool(req);
        const userId = req.headers['x-user-id']; // In production, get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const {
            displayName,
            bio,
            yearsExperience,
            specializations,
            certifications,
            portfolioUrl,
            baseRate,
            avgResponseHours,
            maxConcurrentProjects
        } = req.body;
        
        // Check if profile exists
        const existingProfile = await pool.query(
            'SELECT profile_id FROM translator_profiles WHERE user_id = $1::uuid',
            [userId]
        );
        
        let result;
        if (existingProfile.rows.length > 0) {
            // Update existing
            result = await pool.query(`
                UPDATE translator_profiles
                SET 
                    display_name = COALESCE($1::varchar, display_name),
                    bio = COALESCE($2::text, bio),
                    years_experience = COALESCE($3::int, years_experience),
                    specializations = COALESCE($4::text[], specializations),
                    certifications = COALESCE($5::text, certifications),
                    portfolio_url = COALESCE($6::varchar, portfolio_url),
                    base_rate_per_1000 = COALESCE($7::decimal, base_rate_per_1000),
                    avg_response_hours = COALESCE($8::int, avg_response_hours),
                    max_concurrent_projects = COALESCE($9::int, max_concurrent_projects),
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $10::uuid
                RETURNING *
            `, [
                displayName, bio, yearsExperience, specializations,
                certifications, portfolioUrl, baseRate, avgResponseHours,
                maxConcurrentProjects, userId
            ]);
        } else {
            // Create new
            result = await pool.query(`
                INSERT INTO translator_profiles (
                    user_id, display_name, bio, years_experience,
                    specializations, certifications, portfolio_url,
                    base_rate_per_1000, avg_response_hours, max_concurrent_projects
                ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                userId, displayName, bio, yearsExperience || 0,
                specializations || [], certifications, portfolioUrl,
                baseRate || 10.00, avgResponseHours || 24, maxConcurrentProjects || 3
            ]);
        }
        
        res.json({
            success: true,
            message: existingProfile.rows.length > 0 ? 'Profile updated' : 'Profile created',
            profile: result.rows[0]
        });
    } catch (error) {
        console.error('Error saving translator profile:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// POST /api/translators/profile/languages - Add language pair
router.post('/profile/languages', async (req, res) => {
    try {
        const pool = getPool(req);
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const { sourceLanguage, targetLanguage, proficiencyLevel, isNativeTarget, customRate } = req.body;
        
        if (!sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Source and target languages are required' });
        }
        
        // Get profile ID
        const profileResult = await pool.query(
            'SELECT profile_id FROM translator_profiles WHERE user_id = $1::uuid',
            [userId]
        );
        
        if (profileResult.rows.length === 0) {
            return res.status(400).json({ error: 'Please create your translator profile first' });
        }
        
        const profileId = profileResult.rows[0].profile_id;
        
        // Insert or update language pair
        const result = await pool.query(`
            INSERT INTO translator_languages (
                profile_id, source_language, target_language,
                proficiency_level, is_native_target, custom_rate_per_1000
            ) VALUES ($1::uuid, $2::varchar, $3::varchar, $4::varchar, $5::boolean, $6::decimal)
            ON CONFLICT (profile_id, source_language, target_language)
            DO UPDATE SET
                proficiency_level = EXCLUDED.proficiency_level,
                is_native_target = EXCLUDED.is_native_target,
                custom_rate_per_1000 = EXCLUDED.custom_rate_per_1000
            RETURNING *
        `, [profileId, sourceLanguage, targetLanguage, proficiencyLevel || 'professional', isNativeTarget || false, customRate]);
        
        res.json({
            success: true,
            message: 'Language pair added',
            language: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding language pair:', error);
        res.status(500).json({ error: 'Failed to add language pair' });
    }
});

// DELETE /api/translators/profile/languages/:languageId - Remove language pair
router.delete('/profile/languages/:languageId', async (req, res) => {
    try {
        const pool = getPool(req);
        const userId = req.headers['x-user-id'];
        const { languageId } = req.params;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Verify ownership
        const result = await pool.query(`
            DELETE FROM translator_languages
            WHERE language_id = $1::uuid
            AND profile_id IN (SELECT profile_id FROM translator_profiles WHERE user_id = $2::uuid)
            RETURNING *
        `, [languageId, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Language pair not found' });
        }
        
        res.json({ success: true, message: 'Language pair removed' });
    } catch (error) {
        console.error('Error removing language pair:', error);
        res.status(500).json({ error: 'Failed to remove language pair' });
    }
});

// POST /api/translators/:profileId/request - Send translation request to translator
router.post('/:profileId/request', async (req, res) => {
    try {
        const pool = getPool(req);
        const authorId = req.headers['x-user-id'];
        const { profileId } = req.params;
        
        if (!authorId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const {
            workId,
            chapterId,
            sourceLanguage,
            targetLanguage,
            title,
            description,
            wordCount,
            proposedRate,
            deadline
        } = req.body;
        
        if (!sourceLanguage || !targetLanguage || !title) {
            return res.status(400).json({ error: 'Source language, target language, and title are required' });
        }
        
        // Get translator info
        const translatorResult = await pool.query(
            'SELECT user_id FROM translator_profiles WHERE profile_id = $1::uuid',
            [profileId]
        );
        
        if (translatorResult.rows.length === 0) {
            return res.status(404).json({ error: 'Translator not found' });
        }
        
        const translatorId = translatorResult.rows[0].user_id;
        
        // Calculate total price
        const totalPrice = proposedRate && wordCount ? (proposedRate * wordCount / 1000) : null;
        
        // Create job request
        const result = await pool.query(`
            INSERT INTO translation_jobs (
                author_id, translator_id, translator_profile_id,
                work_id, chapter_id, source_language, target_language,
                title, description, word_count, proposed_rate, total_price, deadline
            ) VALUES (
                $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid,
                $6::varchar, $7::varchar, $8::varchar, $9::text,
                $10::int, $11::decimal, $12::decimal, $13::timestamp
            )
            RETURNING *
        `, [
            authorId, translatorId, profileId,
            workId || null, chapterId || null,
            sourceLanguage, targetLanguage,
            title, description, wordCount || 0,
            proposedRate, totalPrice, deadline || null
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Translation request sent',
            job: result.rows[0]
        });
    } catch (error) {
        console.error('Error sending translation request:', error);
        res.status(500).json({ error: 'Failed to send translation request' });
    }
});

// GET /api/translators/jobs/received - Get received translation requests (for translators)
router.get('/jobs/received', async (req, res) => {
    try {
        const pool = getPool(req);
        const translatorId = req.headers['x-user-id'];
        const { status, page = 1, limit = 20 } = req.query;
        
        if (!translatorId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        let whereConditions = ['tj.translator_id = $1::uuid'];
        let params = [translatorId];
        let paramIndex = 2;
        
        if (status) {
            whereConditions.push(`tj.status = $${paramIndex++}::varchar`);
            params.push(status);
        }
        
        const whereClause = 'WHERE ' + whereConditions.join(' AND ');
        
        // Count
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM translation_jobs tj ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count) || 0;
        
        // Get jobs
        const offset = (parseInt(page) - 1) * parseInt(limit);
        params.push(parseInt(limit));
        params.push(offset);
        
        const query = `
            SELECT 
                tj.*,
                author.pen_name as author_name,
                author.email as author_email,
                w.title as work_title
            FROM translation_jobs tj
            INNER JOIN users author ON tj.author_id = author.user_id
            LEFT JOIN works w ON tj.work_id = w.work_id
            ${whereClause}
            ORDER BY tj.created_at DESC
            LIMIT $${paramIndex++}::int OFFSET $${paramIndex}::int
        `;
        
        const result = await pool.query(query, params);
        
        res.json({
            jobs: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching received jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// GET /api/translators/jobs/sent - Get sent translation requests (for authors)
router.get('/jobs/sent', async (req, res) => {
    try {
        const pool = getPool(req);
        const authorId = req.headers['x-user-id'];
        const { status, page = 1, limit = 20 } = req.query;
        
        if (!authorId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        let whereConditions = ['tj.author_id = $1::uuid'];
        let params = [authorId];
        let paramIndex = 2;
        
        if (status) {
            whereConditions.push(`tj.status = $${paramIndex++}::varchar`);
            params.push(status);
        }
        
        const whereClause = 'WHERE ' + whereConditions.join(' AND ');
        
        // Count
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM translation_jobs tj ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count) || 0;
        
        // Get jobs
        const offset = (parseInt(page) - 1) * parseInt(limit);
        params.push(parseInt(limit));
        params.push(offset);
        
        const query = `
            SELECT 
                tj.*,
                tp.display_name as translator_name,
                tp.avg_rating as translator_rating,
                u.email as translator_email
            FROM translation_jobs tj
            LEFT JOIN translator_profiles tp ON tj.translator_profile_id = tp.profile_id
            LEFT JOIN users u ON tj.translator_id = u.user_id
            ${whereClause}
            ORDER BY tj.created_at DESC
            LIMIT $${paramIndex++}::int OFFSET $${paramIndex}::int
        `;
        
        const result = await pool.query(query, params);
        
        res.json({
            jobs: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching sent jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// PATCH /api/translators/jobs/:jobId/respond - Accept or reject a job (for translators)
router.patch('/jobs/:jobId/respond', async (req, res) => {
    try {
        const pool = getPool(req);
        const translatorId = req.headers['x-user-id'];
        const { jobId } = req.params;
        const { accept, agreedRate, message } = req.body;
        
        if (!translatorId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Verify this job belongs to the translator
        const jobResult = await pool.query(
            'SELECT * FROM translation_jobs WHERE job_id = $1::uuid AND translator_id = $2::uuid',
            [jobId, translatorId]
        );
        
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const job = jobResult.rows[0];
        
        if (job.status !== 'pending') {
            return res.status(400).json({ error: 'This job has already been responded to' });
        }
        
        const newStatus = accept ? 'accepted' : 'rejected';
        const finalRate = accept ? (agreedRate || job.proposed_rate) : null;
        const totalPrice = finalRate && job.word_count ? (finalRate * job.word_count / 1000) : null;
        
        const result = await pool.query(`
            UPDATE translation_jobs
            SET 
                status = $1::varchar,
                agreed_rate = $2::decimal,
                total_price = $3::decimal,
                updated_at = CURRENT_TIMESTAMP
            WHERE job_id = $4::uuid
            RETURNING *
        `, [newStatus, finalRate, totalPrice, jobId]);
        
        // Add message if provided
        if (message) {
            await pool.query(`
                INSERT INTO translation_job_messages (job_id, sender_id, message_text)
                VALUES ($1::uuid, $2::uuid, $3::text)
            `, [jobId, translatorId, message]);
        }
        
        res.json({
            success: true,
            message: accept ? 'Job accepted' : 'Job rejected',
            job: result.rows[0]
        });
    } catch (error) {
        console.error('Error responding to job:', error);
        res.status(500).json({ error: 'Failed to respond to job' });
    }
});

// PATCH /api/translators/jobs/:jobId/status - Update job status
router.patch('/jobs/:jobId/status', async (req, res) => {
    try {
        const pool = getPool(req);
        const userId = req.headers['x-user-id'];
        const { jobId } = req.params;
        const { status } = req.body;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Verify user is part of this job
        const jobResult = await pool.query(
            'SELECT * FROM translation_jobs WHERE job_id = $1::uuid AND (author_id = $2::uuid OR translator_id = $2::uuid)',
            [jobId, userId]
        );
        
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const job = jobResult.rows[0];
        const isAuthor = job.author_id === userId;
        const isTranslator = job.translator_id === userId;
        
        // Validate status transitions
        const validTransitions = {
            'accepted': { translator: ['in_progress'] },
            'in_progress': { translator: ['submitted'] },
            'submitted': { author: ['completed', 'revision_requested'] },
            'revision_requested': { translator: ['submitted'] }
        };
        
        const role = isAuthor ? 'author' : 'translator';
        const allowed = validTransitions[job.status]?.[role] || [];
        
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid status transition' });
        }
        
        let updateFields = ['status = $1::varchar', 'updated_at = CURRENT_TIMESTAMP'];
        let params = [status];
        let paramIndex = 2;
        
        if (status === 'in_progress') {
            updateFields.push(`started_at = CURRENT_TIMESTAMP`);
        } else if (status === 'submitted') {
            updateFields.push(`submitted_at = CURRENT_TIMESTAMP`);
        } else if (status === 'completed') {
            updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
        }
        
        params.push(jobId);
        
        const result = await pool.query(`
            UPDATE translation_jobs
            SET ${updateFields.join(', ')}
            WHERE job_id = $${paramIndex}::uuid
            RETURNING *
        `, params);
        
        res.json({
            success: true,
            message: 'Status updated',
            job: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating job status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// POST /api/translators/jobs/:jobId/review - Leave a review (for authors)
router.post('/jobs/:jobId/review', async (req, res) => {
    try {
        const pool = getPool(req);
        const authorId = req.headers['x-user-id'];
        const { jobId } = req.params;
        const { 
            overallRating, 
            accuracyRating, 
            communicationRating, 
            timelinessRating,
            reviewTitle,
            reviewText 
        } = req.body;
        
        if (!authorId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!overallRating || overallRating < 1 || overallRating > 5) {
            return res.status(400).json({ error: 'Overall rating (1-5) is required' });
        }
        
        // Get job info
        const jobResult = await pool.query(
            `SELECT * FROM translation_jobs 
             WHERE job_id = $1::uuid AND author_id = $2::uuid AND status = 'completed'`,
            [jobId, authorId]
        );
        
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ error: 'Completed job not found' });
        }
        
        const job = jobResult.rows[0];
        
        // Check if review already exists
        const existingReview = await pool.query(
            'SELECT review_id FROM translator_reviews WHERE job_id = $1::uuid',
            [jobId]
        );
        
        if (existingReview.rows.length > 0) {
            return res.status(400).json({ error: 'Review already exists for this job' });
        }
        
        const result = await pool.query(`
            INSERT INTO translator_reviews (
                job_id, translator_profile_id, reviewer_id,
                overall_rating, accuracy_rating, communication_rating, timeliness_rating,
                review_title, review_text, source_language, target_language
            ) VALUES (
                $1::uuid, $2::uuid, $3::uuid,
                $4::int, $5::int, $6::int, $7::int,
                $8::varchar, $9::text, $10::varchar, $11::varchar
            )
            RETURNING *
        `, [
            jobId, job.translator_profile_id, authorId,
            overallRating, accuracyRating, communicationRating, timelinessRating,
            reviewTitle, reviewText, job.source_language, job.target_language
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Review submitted',
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// GET /api/translators/jobs/:jobId/messages - Get job messages
router.get('/jobs/:jobId/messages', async (req, res) => {
    try {
        const pool = getPool(req);
        const userId = req.headers['x-user-id'];
        const { jobId } = req.params;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Verify user is part of this job
        const jobResult = await pool.query(
            'SELECT job_id FROM translation_jobs WHERE job_id = $1::uuid AND (author_id = $2::uuid OR translator_id = $2::uuid)',
            [jobId, userId]
        );
        
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const result = await pool.query(`
            SELECT 
                m.*,
                u.pen_name as sender_name
            FROM translation_job_messages m
            INNER JOIN users u ON m.sender_id = u.user_id
            WHERE m.job_id = $1::uuid
            ORDER BY m.created_at ASC
        `, [jobId]);
        
        // Mark as read
        await pool.query(`
            UPDATE translation_job_messages
            SET is_read = true
            WHERE job_id = $1::uuid AND sender_id != $2::uuid
        `, [jobId, userId]);
        
        res.json({ messages: result.rows });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST /api/translators/jobs/:jobId/messages - Send message
router.post('/jobs/:jobId/messages', async (req, res) => {
    try {
        const pool = getPool(req);
        const userId = req.headers['x-user-id'];
        const { jobId } = req.params;
        const { messageText, attachmentUrl, attachmentName } = req.body;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!messageText) {
            return res.status(400).json({ error: 'Message text is required' });
        }
        
        // Verify user is part of this job
        const jobResult = await pool.query(
            'SELECT job_id FROM translation_jobs WHERE job_id = $1::uuid AND (author_id = $2::uuid OR translator_id = $2::uuid)',
            [jobId, userId]
        );
        
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const result = await pool.query(`
            INSERT INTO translation_job_messages (job_id, sender_id, message_text, attachment_url, attachment_name)
            VALUES ($1::uuid, $2::uuid, $3::text, $4::varchar, $5::varchar)
            RETURNING *
        `, [jobId, userId, messageText, attachmentUrl || null, attachmentName || null]);
        
        // Update message count
        await pool.query(
            'UPDATE translation_jobs SET message_count = message_count + 1 WHERE job_id = $1::uuid',
            [jobId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Message sent',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;
