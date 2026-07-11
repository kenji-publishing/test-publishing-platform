/**
 * Collaboration Agreements Routes
 *
 * A collaborator added to a work starts as 'pending' with an agreement row
 * (created in works.js syncWorkCollaborators). Signing here flips the
 * work_collaborators row to 'active', which makes the collaborator
 * revenue-eligible in revenueSplitService. Declining marks both rows
 * 'declined' (the author sees it and can pick someone else).
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const { generateSignatureHash } = require('../config/revenue');
const { createNotification } = require('../services/notificationService');

/** 署名/辞退を著者に通知（失敗しても本処理は止めない） */
async function notifyAuthor(agreement, signerUserId, action) {
    try {
        const info = (await db.query(
            `SELECT (SELECT title FROM works WHERE work_id = $1) AS title,
                    (SELECT COALESCE(pen_name, first_name || ' ' || last_name) FROM users WHERE user_id = $2) AS signer`,
            [agreement.work_id, signerUserId]
        )).rows[0] || {};
        const signed = action === 'signed';
        await createNotification({
            userId: agreement.author_id,
            type: 'system',
            title: signed ? '同意書が署名されました / Agreement signed' : '同意書が辞退されました / Agreement declined',
            message: signed
                ? `「${info.title}」の同意書に${info.signer}さんが署名しました。コラボレーターとして有効になりました。 / ${info.signer} signed the agreement for "${info.title}" and is now an active collaborator.`
                : `「${info.title}」の同意書を${info.signer}さんが辞退しました。作品の編集画面から別のコラボレーターを指定できます。 / ${info.signer} declined the agreement for "${info.title}". You can assign someone else from the work's edit page.`,
            actionUrl: '/pages/dashboard.html'
        });
    } catch (e) {
        console.error('Notify author failed:', e.message);
    }
}

/**
 * GET /api/agreements/mine
 * Agreements addressed to me (to sign) and issued by me (as author).
 */
router.get('/mine', authenticate, async (req, res) => {
    try {
        const received = (await db.query(
            `SELECT a.agreement_id, a.work_id, a.terms, a.status, a.signed_at, a.created_at,
                    w.title AS work_title,
                    COALESCE(au.pen_name, au.first_name || ' ' || au.last_name) AS author_name
             FROM collaboration_agreements a
             JOIN works w ON a.work_id = w.work_id
             JOIN users au ON a.author_id = au.user_id
             WHERE a.user_id = $1
             ORDER BY a.created_at DESC`,
            [req.user.userId]
        )).rows;

        const sent = (await db.query(
            `SELECT a.agreement_id, a.work_id, a.terms, a.status, a.signed_at, a.created_at,
                    w.title AS work_title,
                    COALESCE(cu.pen_name, cu.first_name || ' ' || cu.last_name) AS collaborator_name
             FROM collaboration_agreements a
             JOIN works w ON a.work_id = w.work_id
             JOIN users cu ON a.user_id = cu.user_id
             WHERE a.author_id = $1
             ORDER BY a.created_at DESC`,
            [req.user.userId]
        )).rows;

        res.json({ success: true, received, sent });
    } catch (error) {
        console.error('Get agreements error:', error);
        res.status(500).json({ error: error.message });
    }
});

/** Load an agreement row with a row lock, enforcing signer identity. */
async function loadForUpdate(client, agreementId, userId) {
    const rows = (await client.query(
        `SELECT * FROM collaboration_agreements WHERE agreement_id = $1 FOR UPDATE`,
        [agreementId]
    )).rows;
    if (rows.length === 0) return { error: 404, message: 'Agreement not found' };
    if (rows[0].user_id !== userId) return { error: 403, message: 'Not your agreement' };
    if (rows[0].status !== 'pending') return { error: 400, message: `Agreement already ${rows[0].status}` };
    return { agreement: rows[0] };
}

/**
 * POST /api/agreements/:agreementId/sign
 * Collaborator signs — becomes active and revenue-eligible.
 */
router.post('/:agreementId/sign', authenticate, async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { agreement, error, message } = await loadForUpdate(client, req.params.agreementId, req.user.userId);
        if (error) {
            await client.query('ROLLBACK');
            return res.status(error).json({ error: message });
        }

        const signedAt = new Date().toISOString();
        const signatureHash = generateSignatureHash({
            agreementId: agreement.agreement_id,
            userId: req.user.userId,
            signedAt,
            ipAddress: req.ip || ''
        });

        await client.query(
            `UPDATE collaboration_agreements
             SET status = 'signed', signed_at = $1, signature_hash = $2
             WHERE agreement_id = $3`,
            [signedAt, signatureHash, agreement.agreement_id]
        );
        await client.query(
            `UPDATE work_collaborators SET status = 'active', updated_at = CURRENT_TIMESTAMP
             WHERE collaborator_id = $1`,
            [agreement.collaborator_id]
        );
        await client.query('COMMIT');
        notifyAuthor(agreement, req.user.userId, 'signed'); // 非同期・失敗しても署名は成立

        res.json({ success: true, status: 'signed', signedAt });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Sign agreement error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

/**
 * POST /api/agreements/:agreementId/decline
 * Collaborator declines — never becomes revenue-eligible.
 */
router.post('/:agreementId/decline', authenticate, async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { agreement, error, message } = await loadForUpdate(client, req.params.agreementId, req.user.userId);
        if (error) {
            await client.query('ROLLBACK');
            return res.status(error).json({ error: message });
        }

        await client.query(
            `UPDATE collaboration_agreements SET status = 'declined' WHERE agreement_id = $1`,
            [agreement.agreement_id]
        );
        await client.query(
            `UPDATE work_collaborators SET status = 'declined', updated_at = CURRENT_TIMESTAMP
             WHERE collaborator_id = $1`,
            [agreement.collaborator_id]
        );
        await client.query('COMMIT');
        notifyAuthor(agreement, req.user.userId, 'declined'); // 非同期・失敗しても辞退は成立

        res.json({ success: true, status: 'declined' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Decline agreement error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;
