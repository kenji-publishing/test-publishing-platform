/**
 * Revenue split creation shared by the Stripe webhook and PayPal capture.
 *
 * Pattern table (config/revenue.js REVENUE_SHARES):
 *   platform 30% fixed; translator 20% / editor 10% when attached via
 *   work_collaborators; the author receives the remainder, so:
 *     no collaborators          -> author 70
 *     editor only               -> author 60 / editor 10
 *     translator only           -> author 50 / translator 20
 *     translator + editor       -> author 40 / translator 20 / editor 10
 *   (AI-translated works have no translator collaborator -> author keeps 70)
 */

const { REVENUE_SHARES } = require('../config/revenue');

const round2 = (v) => Math.round(v * 100) / 100;

/**
 * Insert revenue_splits rows for one completed purchase.
 * Must be called inside the caller's transaction (client = dedicated
 * connection from db.pool.connect(), between BEGIN and COMMIT).
 *
 * @returns {Array<{recipientId, role, share, amount}>} created split rows
 */
async function createRevenueSplits(client, { workId, authorId, amount, currency, reference }) {
    const collabResult = await client.query(
        `SELECT user_id, role, revenue_share
         FROM work_collaborators
         WHERE work_id = $1 AND status = 'active'`,
        [workId]
    );

    const rows = [];
    let collabShareTotal = 0;

    for (const c of collabResult.rows) {
        const share = parseFloat(c.revenue_share) || 0;
        collabShareTotal += share;
        rows.push({ recipientId: c.user_id, role: c.role, share, amount: round2(amount * share / 100) });
    }

    const authorShare = 100 - REVENUE_SHARES.PLATFORM - collabShareTotal;
    if (authorShare < 0) {
        // Corrupt collaborator data must never produce a negative author payout
        throw new Error(`Invalid collaborator shares for work ${workId}: total ${collabShareTotal}%`);
    }

    rows.unshift({ recipientId: authorId, role: 'author', share: authorShare, amount: round2(amount * authorShare / 100) });
    rows.push({ recipientId: null, role: 'platform', share: REVENUE_SHARES.PLATFORM, amount: round2(amount * REVENUE_SHARES.PLATFORM / 100) });

    for (const r of rows) {
        await client.query(
            `INSERT INTO revenue_splits (work_id, recipient_id, role, amount, currency, transaction_reference)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [workId, r.recipientId, r.role, r.amount, currency, reference]
        );
    }

    return rows;
}

module.exports = { createRevenueSplits };
