/**
 * Revenue Share API Routes
 * Handles collaboration agreements and revenue distribution
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendEmail } = require('../config/email');
const {
    calculateShares,
    calculateAmounts,
    generateAgreementTerms,
    generateAgreementHash,
    generateSignatureHash,
    validateShares,
    formatSharesForDisplay,
    REVENUE_SHARES,
    SHARE_SCENARIOS
} = require('../config/revenue');

/**
 * GET /api/revenue/shares/calculate
 * Calculate revenue shares based on configuration
 */
router.get('/shares/calculate', (req, res) => {
    try {
        const { isTranslated, hasTranslator, hasEditor } = req.query;

        const config = {
            isTranslated: isTranslated === 'true',
            hasTranslator: hasTranslator === 'true',
            hasEditor: hasEditor === 'true'
        };

        const shares = calculateShares(config);

        res.json({
            success: true,
            config,
            shares,
            display: formatSharesForDisplay(shares),
            isValid: validateShares(shares)
        });

    } catch (error) {
        console.error('Calculate shares error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/revenue/scenarios
 * Get all predefined revenue share scenarios
 */
router.get('/scenarios', (req, res) => {
    res.json({
        success: true,
        scenarios: SHARE_SCENARIOS,
        baseShares: REVENUE_SHARES
    });
});

/**
 * POST /api/revenue/agreement/create
 * Create a new revenue agreement for a work
 */
router.post('/agreement/create', async (req, res) => {
    try {
        const {
            workId,
            workTitle,
            originalLanguage,
            targetLanguages,
            collaborators,
            isTranslated,
            createdBy
        } = req.body;

        // Validate input
        if (!workId || !workTitle || !originalLanguage || !createdBy) {
            return res.status(400).json({ 
                error: 'workId, workTitle, originalLanguage, and createdBy are required' 
            });
        }

        // Determine if there are separate translator/editor
        const hasTranslator = collaborators?.some(c => c.role === 'translator') || false;
        const hasEditor = collaborators?.some(c => c.role === 'editor') || false;

        // Generate agreement terms
        const terms = generateAgreementTerms({
            workId,
            workTitle,
            originalLanguage,
            targetLanguages: targetLanguages || [],
            collaborators: collaborators || [],
            isTranslated: isTranslated || false,
            hasTranslator,
            hasEditor
        });

        // Generate agreement hash
        const agreementHash = generateAgreementHash(terms);

        // Insert agreement into database
        const agreementResult = await db.query(
            `INSERT INTO revenue_agreements 
             (work_id, agreement_type, is_translated, original_language, target_languages, terms_json, agreement_hash, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING agreement_id`,
            [
                workId,
                'standard',
                isTranslated || false,
                originalLanguage,
                targetLanguages || [],
                JSON.stringify(terms),
                agreementHash,
                collaborators && collaborators.length > 1 ? 'pending_signatures' : 'active',
                createdBy
            ]
        );

        const agreementId = agreementResult.rows[0].agreement_id;

        // Add collaborators
        if (collaborators && collaborators.length > 0) {
            for (const collab of collaborators) {
                // Add to work_collaborators
                await db.query(
                    `INSERT INTO work_collaborators 
                     (work_id, user_id, role, language_code, revenue_share, status, invited_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        workId,
                        collab.userId,
                        collab.role,
                        collab.languageCode || null,
                        terms.revenueShares[collab.role],
                        collab.userId === createdBy ? 'active' : 'invited',
                        createdBy
                    ]
                );

                // Add signature requirement
                await db.query(
                    `INSERT INTO agreement_signatures 
                     (agreement_id, user_id, role, status)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        agreementId,
                        collab.userId,
                        collab.role,
                        collab.userId === createdBy ? 'signed' : 'pending'
                    ]
                );

                // Auto-sign for creator
                if (collab.userId === createdBy) {
                    const signedAt = new Date().toISOString();
                    const signatureHash = generateSignatureHash({
                        agreementId,
                        userId: collab.userId,
                        signedAt,
                        ipAddress: req.ip || 'unknown'
                    });

                    await db.query(
                        `UPDATE agreement_signatures 
                         SET signed_at = $1, signature_hash = $2, ip_address = $3
                         WHERE agreement_id = $4 AND user_id = $5`,
                        [signedAt, signatureHash, req.ip || 'unknown', agreementId, collab.userId]
                    );
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Agreement created successfully',
            agreementId,
            terms,
            status: collaborators && collaborators.length > 1 ? 'pending_signatures' : 'active'
        });

    } catch (error) {
        console.error('Create agreement error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/revenue/agreement/:id/sign
 * Sign a revenue agreement
 */
router.post('/agreement/:id/sign', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, agree } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        if (!agree) {
            // User declined
            await db.query(
                `UPDATE agreement_signatures 
                 SET status = 'declined'
                 WHERE agreement_id = $1 AND user_id = $2`,
                [id, userId]
            );

            await db.query(
                `UPDATE work_collaborators 
                 SET status = 'declined'
                 WHERE work_id = (SELECT work_id FROM revenue_agreements WHERE agreement_id = $1) 
                 AND user_id = $2`,
                [id, userId]
            );

            return res.json({
                success: true,
                message: 'Agreement declined',
                status: 'declined'
            });
        }

        // Sign the agreement
        const signedAt = new Date().toISOString();
        const signatureHash = generateSignatureHash({
            agreementId: id,
            userId,
            signedAt,
            ipAddress: req.ip || 'unknown'
        });

        await db.query(
            `UPDATE agreement_signatures 
             SET status = 'signed', signed_at = $1, signature_hash = $2, ip_address = $3
             WHERE agreement_id = $4 AND user_id = $5`,
            [signedAt, signatureHash, req.ip || 'unknown', id, userId]
        );

        await db.query(
            `UPDATE work_collaborators 
             SET status = 'active', accepted_at = $1
             WHERE work_id = (SELECT work_id FROM revenue_agreements WHERE agreement_id = $2) 
             AND user_id = $3`,
            [signedAt, id, userId]
        );

        // Check if all signatures are complete
        const pendingResult = await db.query(
            `SELECT COUNT(*) as pending FROM agreement_signatures 
             WHERE agreement_id = $1 AND status = 'pending'`,
            [id]
        );

        const allSigned = parseInt(pendingResult.rows[0].pending) === 0;

        if (allSigned) {
            await db.query(
                `UPDATE revenue_agreements 
                 SET status = 'active', activated_at = NOW()
                 WHERE agreement_id = $1`,
                [id]
            );
        }

        res.json({
            success: true,
            message: allSigned ? 'Agreement fully signed and activated' : 'Signature recorded',
            allSigned,
            status: allSigned ? 'active' : 'pending_signatures'
        });

    } catch (error) {
        console.error('Sign agreement error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/revenue/agreement/:id
 * Get agreement details
 */
router.get('/agreement/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const agreementResult = await db.query(
            `SELECT * FROM revenue_agreements WHERE agreement_id = $1`,
            [id]
        );

        if (agreementResult.rows.length === 0) {
            return res.status(404).json({ error: 'Agreement not found' });
        }

        const agreement = agreementResult.rows[0];

        const signaturesResult = await db.query(
            `SELECT s.*, u.email, u.first_name, u.last_name
             FROM agreement_signatures s
             JOIN users u ON s.user_id = u.user_id
             WHERE s.agreement_id = $1`,
            [id]
        );

        res.json({
            success: true,
            agreement: {
                ...agreement,
                terms: JSON.parse(agreement.terms_json),
                signatures: signaturesResult.rows
            }
        });

    } catch (error) {
        console.error('Get agreement error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/revenue/calculate-payout
 * Calculate payout amounts for a revenue period
 */
router.post('/calculate-payout', async (req, res) => {
    try {
        const { workId, totalRevenue, currency } = req.body;

        if (!workId || totalRevenue === undefined) {
            return res.status(400).json({ error: 'workId and totalRevenue are required' });
        }

        // Get agreement for this work
        const agreementResult = await db.query(
            `SELECT * FROM revenue_agreements WHERE work_id = $1 AND status = 'active'`,
            [workId]
        );

        if (agreementResult.rows.length === 0) {
            return res.status(404).json({ error: 'No active agreement found for this work' });
        }

        const agreement = agreementResult.rows[0];
        const terms = JSON.parse(agreement.terms_json);

        // Calculate amounts
        const amounts = calculateAmounts(totalRevenue, terms.revenueShares);

        // Get collaborator details
        const collaboratorsResult = await db.query(
            `SELECT c.*, u.email, u.first_name, u.last_name
             FROM work_collaborators c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.work_id = $1 AND c.status = 'active'`,
            [workId]
        );

        const payouts = collaboratorsResult.rows.map(collab => ({
            userId: collab.user_id,
            name: `${collab.first_name} ${collab.last_name}`,
            email: collab.email,
            role: collab.role,
            sharePercent: collab.revenue_share,
            amount: amounts[collab.role] || 0,
            currency: currency || 'USD'
        }));

        // Add platform share
        payouts.push({
            userId: null,
            name: 'Publisher Platform',
            email: null,
            role: 'platform',
            sharePercent: terms.revenueShares.platform,
            amount: amounts.platform,
            currency: currency || 'USD'
        });

        res.json({
            success: true,
            workId,
            totalRevenue,
            currency: currency || 'USD',
            shares: terms.revenueShares,
            payouts
        });

    } catch (error) {
        console.error('Calculate payout error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/revenue/user/:userId/earnings
 * Get earnings summary for a user
 */
router.get('/user/:userId/earnings', async (req, res) => {
    try {
        const { userId } = req.params;

        const collaborationsResult = await db.query(
            `SELECT c.*, ra.terms_json, ra.status as agreement_status
             FROM work_collaborators c
             JOIN revenue_agreements ra ON c.work_id = ra.work_id
             WHERE c.user_id = $1 AND c.status = 'active'`,
            [userId]
        );

        const payoutsResult = await db.query(
            `SELECT * FROM revenue_payouts WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );

        const totalEarnings = payoutsResult.rows
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        const pendingEarnings = payoutsResult.rows
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        res.json({
            success: true,
            userId,
            summary: {
                totalEarnings: Math.round(totalEarnings * 100) / 100,
                pendingEarnings: Math.round(pendingEarnings * 100) / 100,
                activeCollaborations: collaborationsResult.rows.length
            },
            collaborations: collaborationsResult.rows,
            recentPayouts: payoutsResult.rows.slice(0, 10)
        });

    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;