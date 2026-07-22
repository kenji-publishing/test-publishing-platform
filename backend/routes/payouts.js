/**
 * Monthly payout runs — 収益分配の月次支払い（管理者専用）
 *
 * 運用ルール（2026-07-20 オーナー決定）:
 *   月末締め・翌月15日までに支払い。最低支払額は受取通貨建てで ¥3,000/$20/£15相当、
 *   未満は翌月繰越。受取人が少額オプトイン（allow_small_payout）している場合は
 *   手数料（¥300/$2/£1.50相当）を差し引いて毎月支払う。
 *
 * 送金自体は手動: 確定→Wise一括CSVをダウンロード→Starlingから入金→Wiseで実行
 * →「支払完了」で受取人に通知。二重払いは revenue_splits.payout_run_id の刻印で防ぐ。
 *
 * 注意: revenue_splitsのstatus列は実質未使用（通常行'pending'・返金相殺行'completed'
 * の混在）のため支払い判定には使わない。未払い = payout_run_id IS NULL が正。
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const db = require('../config/database');
const { createNotification } = require('../services/notificationService');

router.use(authenticate);
router.use(authorize('admin'));

// ===== 通貨換算（JPY基準の固定テーブル） =====
// 実際の両替レートはWiseが送金時に適用する。この表は「誰にいくら払うか」の算定用。
// 販売側の換算表（js/wizard-common.js / routes/ai-tools.js）と改定時期を合わせること
const RATES_JPY = {
    JPY: 1, USD: 0.0067, EUR: 0.0061, GBP: 0.0053, AUD: 0.0103, CAD: 0.0093,
    KRW: 9.17, BRL: 0.038, AED: 0.0246, SAR: 0.0251, EGP: 0.32
};
const ZERO_DECIMAL = ['JPY', 'KRW'];
// 最低支払額（受取通貨建て）。未満は翌月繰越
const MINIMUMS = { JPY: 3000, USD: 20, GBP: 15, EUR: 18, AUD: 30, CAD: 27, KRW: 27000, BRL: 100, AED: 73, SAR: 75, EGP: 950 };
// 少額オプトイン時の送金手数料（送金額から差引）
const SMALL_FEES = { JPY: 300, USD: 2, GBP: 1.5, EUR: 1.8, AUD: 3, CAD: 2.7, KRW: 2700, BRL: 10, AED: 7.3, SAR: 7.5, EGP: 95 };

function roundCur(v, cur) {
    const f = ZERO_DECIMAL.includes(cur) ? 1 : 100;
    return Math.round(v * f) / f;
}

function convert(amount, from, to) {
    const rf = RATES_JPY[from], rt = RATES_JPY[to];
    if (!rf || !rt) return null;
    return (amount / rf) * rt;
}

/** 締め日パラメータ（YYYY-MM-DD、その日まで含む）→ 比較用カットオフ（翌日0時UTC） */
function parseCutoff(until) {
    if (until && /^\d{4}-\d{2}-\d{2}$/.test(until)) {
        const d = new Date(until + 'T00:00:00Z');
        if (!isNaN(d)) {
            d.setUTCDate(d.getUTCDate() + 1);
            return { cutoff: d, periodEnd: until };
        }
    }
    // 既定 = 先月末締め（今月1日より前の分配すべて）
    const now = new Date();
    const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const pe = new Date(cutoff.getTime() - 24 * 60 * 60 * 1000);
    return { cutoff, periodEnd: pe.toISOString().slice(0, 10) };
}

/**
 * 未払い分配を受取人ごとに集計し、支払い可否を判定する（プレビューと確定の共通処理）。
 * queryFn: db.query か トランザクション中のclient.query
 */
async function computePayouts(queryFn, cutoff) {
    const splits = (await queryFn(
        `SELECT id, recipient_id, role, amount, currency
         FROM revenue_splits
         WHERE payout_run_id IS NULL
           AND recipient_id IS NOT NULL
           AND role <> 'platform'
           AND created_at < $1`,
        [cutoff]
    )).rows;

    const byUser = new Map();
    for (const s of splits) {
        if (!byUser.has(s.recipient_id)) {
            byUser.set(s.recipient_id, { splitIds: [], roles: new Set(), rows: [] });
        }
        const g = byUser.get(s.recipient_id);
        g.splitIds.push(s.id);
        g.roles.add(s.role);
        g.rows.push(s);
    }

    const ids = Array.from(byUser.keys());
    const users = ids.length ? (await queryFn(
        `SELECT u.user_id, u.pen_name, u.first_name, u.last_name, u.email,
                p.account_holder, p.beneficiary_address, p.bank_country, p.account_currency,
                p.bank_name, p.branch_info, p.account_number, p.account_type, p.extra_info,
                p.allow_small_payout
         FROM users u
         LEFT JOIN user_payout_details p ON p.user_id = u.user_id
         WHERE u.user_id = ANY($1)`,
        [ids]
    )).rows : [];
    const userMap = new Map(users.map(u => [u.user_id, u]));

    const items = [];
    for (const [userId, g] of byUser) {
        const u = userMap.get(userId) || {};
        const name = u.pen_name || ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || 'Unknown';
        const item = {
            userId,
            name,
            email: u.email || '',
            roles: Array.from(g.roles).sort().join('+'),
            splitIds: g.splitIds,
            splitCount: g.splitIds.length,
            payoutCurrency: u.account_currency || null,
            gross: 0, fee: 0, net: 0,
            status: 'payable',
            details: u.account_number ? {
                account_holder: u.account_holder,
                beneficiary_address: u.beneficiary_address,
                bank_country: u.bank_country,
                account_currency: u.account_currency,
                bank_name: u.bank_name,
                branch_info: u.branch_info,
                account_number: u.account_number,
                account_type: u.account_type,
                extra_info: u.extra_info
            } : null
        };

        // 口座未登録: 金額の目安をJPYで示し、支払いはできない（繰越のまま）
        if (!item.details || !RATES_JPY[item.payoutCurrency]) {
            let jpy = 0;
            for (const s of g.rows) {
                const v = convert(parseFloat(s.amount), s.currency, 'JPY');
                if (v !== null) jpy += v;
            }
            item.payoutCurrency = 'JPY';
            item.gross = roundCur(jpy, 'JPY');
            item.net = 0;
            item.status = item.details ? 'unsupported_currency' : 'no_account';
            items.push(item);
            continue;
        }

        // 換算して合算（換算不能な通貨の行があれば安全側でその受取人ごと保留）
        let gross = 0, rateMissing = false;
        for (const s of g.rows) {
            const v = convert(parseFloat(s.amount), s.currency, item.payoutCurrency);
            if (v === null) { rateMissing = true; break; }
            gross += v;
        }
        if (rateMissing) {
            item.status = 'rate_missing';
            item.net = 0;
            items.push(item);
            continue;
        }
        item.gross = roundCur(gross, item.payoutCurrency);

        const min = MINIMUMS[item.payoutCurrency];
        if (item.gross <= 0) {
            // 返金相殺でマイナス残高: 繰越して将来の収益と相殺する
            item.status = 'negative_balance';
            item.net = 0;
        } else if (item.gross >= min) {
            item.net = item.gross;
            item.status = 'payable';
        } else if (u.allow_small_payout) {
            const fee = SMALL_FEES[item.payoutCurrency];
            const net = roundCur(item.gross - fee, item.payoutCurrency);
            if (net > 0) {
                item.fee = fee;
                item.net = net;
                item.status = 'payable_small';
            } else {
                item.status = 'below_minimum'; // 手数料を引くと0以下 → 繰越
                item.net = 0;
            }
        } else {
            item.status = 'below_minimum';
            item.net = 0;
        }
        items.push(item);
    }

    items.sort((a, b) => (a.status < b.status ? -1 : a.status > b.status ? 1 : b.net - a.net));
    return items;
}

const PAYABLE = ['payable', 'payable_small'];

/**
 * GET /api/payouts/preview?until=YYYY-MM-DD
 * 支払いリストのプレビュー（DBへの記録なし）。既定は先月末締め
 */
router.get('/preview', async (req, res) => {
    try {
        const { cutoff, periodEnd } = parseCutoff(req.query.until);
        const items = await computePayouts(db.query.bind(db), cutoff);
        res.json({
            success: true,
            periodEnd,
            items,
            payableCount: items.filter(i => PAYABLE.includes(i.status)).length
        });
    } catch (error) {
        console.error('Payout preview error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/payouts/runs { until: 'YYYY-MM-DD' }
 * 支払いを確定: 対象の分配行に刻印し、支払い明細を保存（この時点で二重払い不能になる）
 */
router.post('/runs', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { cutoff, periodEnd } = parseCutoff(req.body && req.body.until);
        await client.query('BEGIN');
        const items = await computePayouts(client.query.bind(client), cutoff);
        const payable = items.filter(i => PAYABLE.includes(i.status));
        if (payable.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No payable recipients for this period', code: 'NOTHING_TO_PAY' });
        }

        const run = (await client.query(
            `INSERT INTO payout_runs (period_end, item_count, created_by)
             VALUES ($1, $2, $3) RETURNING run_id`,
            [periodEnd, payable.length, req.user.userId]
        )).rows[0];

        for (const item of payable) {
            await client.query(
                `INSERT INTO payout_items
                   (run_id, user_id, payout_currency, gross_amount, fee_amount, net_amount, split_count, details_snapshot)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [run.run_id, item.userId, item.payoutCurrency, item.gross, item.fee, item.net,
                 item.splitCount, JSON.stringify({ ...item.details, email: item.email, name: item.name })]
            );
            const stamped = await client.query(
                `UPDATE revenue_splits SET payout_run_id = $1
                 WHERE id = ANY($2) AND payout_run_id IS NULL`,
                [run.run_id, item.splitIds]
            );
            // プレビュー後に別プロセスが刻印していた等の不整合は全体を巻き戻す（二重払い防止が最優先）
            if (stamped.rowCount !== item.splitIds.length) {
                throw new Error(`Split stamping mismatch for user ${item.userId}: expected ${item.splitIds.length}, got ${stamped.rowCount}`);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, runId: run.run_id, periodEnd, itemCount: payable.length });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Payout finalize error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

/** GET /api/payouts/runs — 支払い履歴 */
router.get('/runs', async (req, res) => {
    try {
        const runs = (await db.query(
            `SELECT r.run_id, r.period_end, r.status, r.item_count, r.created_at, r.paid_at,
                    COALESCE(json_agg(json_build_object('currency', t.payout_currency, 'total', t.total)
                             ORDER BY t.payout_currency) FILTER (WHERE t.payout_currency IS NOT NULL), '[]') AS totals
             FROM payout_runs r
             LEFT JOIN (
                 SELECT run_id, payout_currency, SUM(net_amount) AS total
                 FROM payout_items GROUP BY run_id, payout_currency
             ) t ON t.run_id = r.run_id
             GROUP BY r.run_id
             ORDER BY r.created_at DESC`
        )).rows;
        res.json({ success: true, runs });
    } catch (error) {
        console.error('List payout runs error:', error);
        res.status(500).json({ error: error.message });
    }
});

/** GET /api/payouts/runs/:runId — 明細 */
router.get('/runs/:runId', async (req, res) => {
    try {
        const run = (await db.query(`SELECT * FROM payout_runs WHERE run_id = $1`, [req.params.runId])).rows[0];
        if (!run) return res.status(404).json({ error: 'Run not found' });
        const items = (await db.query(
            `SELECT item_id, user_id, payout_currency, gross_amount, fee_amount, net_amount, split_count, details_snapshot
             FROM payout_items WHERE run_id = $1 ORDER BY net_amount DESC`,
            [req.params.runId]
        )).rows;
        res.json({ success: true, run, items });
    } catch (error) {
        console.error('Get payout run error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== CSV出力 =====

function csvCell(v) {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvLine(cells) { return cells.map(csvCell).join(','); }

// 国名（自由入力）→ ISO2コードの推定（Wise CSVの address.country 用）
const COUNTRY_CODES = {
    'japan': 'JP', '日本': 'JP', 'united kingdom': 'GB', 'uk': 'GB', 'united states': 'US', 'usa': 'US',
    'france': 'FR', 'germany': 'DE', 'italy': 'IT', 'spain': 'ES', 'portugal': 'PT', 'brazil': 'BR',
    'south korea': 'KR', 'korea': 'KR', '한국': 'KR', 'australia': 'AU', 'canada': 'CA',
    'united arab emirates': 'AE', 'uae': 'AE', 'saudi arabia': 'SA', 'egypt': 'EG'
};
function countryCode(text) {
    if (!text) return '';
    return COUNTRY_CODES[String(text).trim().toLowerCase()] || '';
}
// 口座種別 → Wise表記
function wiseAccountType(t) {
    if (!t) return '';
    if (t === '当座' || t === 'Checking') return 'CHECKING';
    if (t === '普通' || t === '貯蓄' || t === 'Savings') return 'SAVINGS';
    return '';
}
const digitsOnly = (s, len) => {
    const m = String(s || '').replace(/[^0-9]/g, '');
    return len ? (m.length === len ? m : '') : m;
};

/**
 * GET /api/payouts/runs/:runId/wise.csv
 * Wiseの一括支払い（batch payments）向けCSV。
 * 注意: Wiseのテンプレート列は通貨構成で変わるため、初回アップロードで列名エラーが
 * 出た場合はWise側のテンプレートに合わせてこの関数を調整する
 */
router.get('/runs/:runId/wise.csv', async (req, res) => {
    try {
        const run = (await db.query(`SELECT * FROM payout_runs WHERE run_id = $1`, [req.params.runId])).rows[0];
        if (!run) return res.status(404).json({ error: 'Run not found' });
        const items = (await db.query(
            `SELECT * FROM payout_items WHERE run_id = $1 ORDER BY payout_currency, net_amount DESC`,
            [req.params.runId]
        )).rows;

        const period = String(run.period_end).slice(0, 7);
        const header = ['name', 'recipientEmail', 'paymentReference', 'receiverType',
            'amountCurrency', 'amount', 'sourceCurrency', 'targetCurrency',
            'IBAN', 'accountNumber', 'sortCode', 'abartn', 'accountType', 'bankCode', 'branchCode',
            'address.firstLine', 'address.city', 'address.postCode', 'address.country'];
        const lines = [csvLine(header)];

        for (const it of items) {
            const d = it.details_snapshot || {};
            const cur = it.payout_currency;
            const isIbanCur = ['EUR', 'AED', 'SAR', 'EGP'].includes(cur) || /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(String(d.account_number || '').replace(/\s/g, ''));
            const acct = String(d.account_number || '').replace(/\s/g, '');
            lines.push(csvLine([
                d.account_holder || d.name || '',
                d.email || '',
                'AuctLect ' + period,
                'PERSON',
                cur,                          // amountCurrency = targetCurrency（受取額固定）
                it.net_amount,
                'GBP',                        // 資金はGBP残高から
                cur,
                isIbanCur ? acct : '',
                isIbanCur ? '' : acct,
                cur === 'GBP' ? digitsOnly(d.branch_info, 6) : '',
                cur === 'USD' ? digitsOnly(d.extra_info, 9) : '',
                wiseAccountType(d.account_type),
                cur === 'JPY' ? digitsOnly(d.bank_name) : '',
                cur === 'JPY' ? digitsOnly(d.branch_info) : '',
                d.beneficiary_address || '',
                '', '',
                countryCode(d.bank_country)
            ]));
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="wise-batch-${period}.csv"`);
        res.send('﻿' + lines.join('\n'));
    } catch (error) {
        console.error('Wise CSV error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/payouts/runs/:runId/summary.csv
 * 控え用の支払い明細CSV（全項目・帳簿/確認用）
 */
router.get('/runs/:runId/summary.csv', async (req, res) => {
    try {
        const run = (await db.query(`SELECT * FROM payout_runs WHERE run_id = $1`, [req.params.runId])).rows[0];
        if (!run) return res.status(404).json({ error: 'Run not found' });
        const items = (await db.query(
            `SELECT * FROM payout_items WHERE run_id = $1 ORDER BY payout_currency, net_amount DESC`,
            [req.params.runId]
        )).rows;

        const period = String(run.period_end).slice(0, 7);
        const lines = [csvLine(['name', 'email', 'currency', 'gross', 'fee', 'net', 'splits',
            'account_holder', 'bank_country', 'bank_name', 'branch_info', 'account_number', 'account_type', 'beneficiary_address', 'extra_info'])];
        for (const it of items) {
            const d = it.details_snapshot || {};
            lines.push(csvLine([
                d.name || '', d.email || '', it.payout_currency, it.gross_amount, it.fee_amount, it.net_amount,
                it.split_count, d.account_holder || '', d.bank_country || '', d.bank_name || '',
                d.branch_info || '', d.account_number || '', d.account_type || '',
                d.beneficiary_address || '', d.extra_info || ''
            ]));
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="payout-summary-${period}.csv"`);
        res.send('﻿' + lines.join('\n'));
    } catch (error) {
        console.error('Summary CSV error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/payouts/runs/:runId/mark-paid
 * Wiseでの送金実行後に呼ぶ: 支払済みにして受取人へ通知
 */
router.post('/runs/:runId/mark-paid', async (req, res) => {
    try {
        const updated = (await db.query(
            `UPDATE payout_runs SET status = 'paid', paid_at = CURRENT_TIMESTAMP
             WHERE run_id = $1 AND status = 'finalized' RETURNING period_end`,
            [req.params.runId]
        )).rows[0];
        if (!updated) return res.status(400).json({ error: 'Run not found or already paid' });

        const items = (await db.query(
            `SELECT user_id, payout_currency, net_amount FROM payout_items WHERE run_id = $1`,
            [req.params.runId]
        )).rows;
        const period = String(updated.period_end).slice(0, 7);
        for (const it of items) {
            try {
                await createNotification({
                    userId: it.user_id,
                    type: 'system',
                    title: '収益をお支払いしました / Your revenue has been paid',
                    message: `${period}分の収益 ${it.net_amount} ${it.payout_currency} を、ご登録の口座へ送金しました。着金まで数営業日かかる場合があります。 / Your revenue of ${it.net_amount} ${it.payout_currency} for ${period} has been sent to your registered bank account. It may take a few business days to arrive.`,
                    actionUrl: '/pages/dashboard.html'
                });
            } catch (e) {
                console.error(`Payout notification failed for ${it.user_id}:`, e.message);
            }
        }
        res.json({ success: true, notified: items.length });
    } catch (error) {
        console.error('Mark paid error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
