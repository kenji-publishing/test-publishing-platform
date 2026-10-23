#!/usr/bin/env node
/**
 * 保存期限を過ぎた個人情報を片付ける。サーバーの cron で毎日1回動かす。
 *
 * 期限の一覧と理由は config/retention.js。ここには「どの表のどの列をどう消すか」だけを書く。
 * 規則ごとに1つのトランザクションで行うので、途中で失敗してもその規則は全部取り消される。
 * 何度動かしても同じ結果になる（片付け済みの行は対象から外れる）。
 *
 *   node scripts/retention.js              片付ける
 *   node scripts/retention.js --dry-run    件数を数えるだけ（何も変えない）
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/database');
const R = require('../config/retention');

const DRY_RUN = process.argv.includes('--dry-run');
const REMOVED = '[removed]';

// 片付ける対象の行を選ぶ条件。$1 は日数
const RULES = [
    {
        name: '退会したアカウントの残りの個人情報',
        table: 'users',
        days: R.DELETED_ACCOUNT_DAYS,
        where: `deleted_at < NOW() - make_interval(days => $1)
                AND (first_name <> '' OR last_name <> '' OR bio IS NOT NULL OR backup_email IS NOT NULL
                     OR password_hash IS NOT NULL OR google_id IS NOT NULL OR profile_image_url IS NOT NULL
                     OR payout_details IS NOT NULL OR acquisition_referrer IS NOT NULL
                     OR (pen_name IS NOT NULL AND NOT EXISTS (
                         SELECT 1 FROM works w WHERE w.author_id = users.user_id AND w.status = 'published')))`,
        // 筆名は、販売を続けている作品（共同制作）がある間は作品の表示に要るので残す
        apply: `UPDATE users SET first_name = '', last_name = '', bio = NULL, backup_email = NULL,
                    backup_email_verified = false, password_hash = NULL, google_id = NULL,
                    profile_image_url = NULL, payout_details = NULL, notification_settings = NULL,
                    languages = NULL, acquisition_referrer = NULL, acquisition_landing = NULL,
                    pen_name = CASE WHEN EXISTS (
                        SELECT 1 FROM works w WHERE w.author_id = users.user_id AND w.status = 'published')
                        THEN pen_name ELSE NULL END
                WHERE {where}`
    },
    {
        name: '退会したアカウントの受取口座（未払いが無いもの）',
        table: 'user_payout_details',
        days: R.DELETED_ACCOUNT_DAYS,
        where: `user_id IN (SELECT user_id FROM users WHERE deleted_at < NOW() - make_interval(days => $1))
                AND NOT EXISTS (SELECT 1 FROM revenue_splits s
                                WHERE s.recipient_id = user_payout_details.user_id AND s.payout_run_id IS NULL)`,
        apply: `DELETE FROM user_payout_details WHERE {where}`
    },
    {
        name: '退会したアカウントへのお知らせ',
        table: 'notifications',
        days: R.DELETED_ACCOUNT_DAYS,
        where: `user_id IN (SELECT user_id FROM users WHERE deleted_at < NOW() - make_interval(days => $1))`,
        apply: `DELETE FROM notifications WHERE {where}`
    },
    {
        name: 'アクセス記録のIPアドレス・ブラウザ情報',
        table: 'page_views',
        days: R.ACCESS_LOG_DAYS,
        where: `created_at < NOW() - make_interval(days => $1) AND (ip_address IS NOT NULL OR user_agent IS NOT NULL)`,
        apply: `UPDATE page_views SET ip_address = NULL, user_agent = NULL WHERE {where}`
    },
    {
        name: 'アカウント復旧の試行記録',
        table: 'recovery_attempts',
        days: R.ACCESS_LOG_DAYS,
        where: `created_at < NOW() - make_interval(days => $1)`,
        apply: `DELETE FROM recovery_attempts WHERE {where}`
    },
    {
        name: 'メール送信の記録',
        table: 'email_logs',
        days: R.ACCESS_LOG_DAYS,
        where: `created_at < NOW() - make_interval(days => $1)`,
        apply: `DELETE FROM email_logs WHERE {where}`
    },
    {
        name: '期限切れ・使用済みのログイン用リンク',
        table: 'magic_links',
        days: R.MAGIC_LINK_DAYS,
        where: `COALESCE(used_at, expires_at) < NOW() - make_interval(days => $1)`,
        apply: `DELETE FROM magic_links WHERE {where}`
    },
    {
        name: '著作権の申し立ての申立人情報',
        table: 'dmca_reports',
        days: R.DMCA_RESOLVED_DAYS,
        where: `resolved_at < NOW() - make_interval(days => $1) AND reporter_email <> '${REMOVED}'`,
        apply: `UPDATE dmca_reports SET reporter_name = '${REMOVED}', reporter_email = '${REMOVED}',
                    reporter_company = NULL, reporter_address = NULL, reporter_phone = NULL, signature = NULL
                WHERE {where}`
    },
    {
        name: '反論通知の提出者情報',
        table: 'dmca_counter_notices',
        days: R.DMCA_RESOLVED_DAYS,
        where: `reviewed_at < NOW() - make_interval(days => $1) AND submitter_email <> '${REMOVED}'`,
        apply: `UPDATE dmca_counter_notices SET submitter_name = '${REMOVED}', submitter_email = '${REMOVED}',
                    submitter_address = NULL, submitter_phone = NULL, signature = NULL
                WHERE {where}`
    },
    {
        name: 'お問い合わせ（ログインなし）の名前・メール',
        table: 'support_tickets',
        days: R.SUPPORT_RESOLVED_DAYS,
        where: `status IN ('resolved', 'closed')
                AND COALESCE(resolved_at, last_message_at, updated_at) < NOW() - make_interval(days => $1)
                AND (guest_email IS NOT NULL OR guest_name IS NOT NULL)`,
        apply: `UPDATE support_tickets SET guest_email = NULL, guest_name = NULL WHERE {where}`
    }
];

async function runRule(rule) {
    const exists = (await db.query('SELECT to_regclass($1) AS t', [rule.table])).rows[0].t;
    if (!exists) return { skipped: true };

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const target = (await client.query(
            `SELECT COUNT(*)::int AS n FROM ${rule.table} WHERE ${rule.where}`, [rule.days]
        )).rows[0].n;
        if (DRY_RUN || target === 0) {
            await client.query('ROLLBACK');
            return { target, changed: 0 };
        }
        const result = await client.query(rule.apply.replace('{where}', rule.where), [rule.days]);
        await client.query('COMMIT');
        return { target, changed: result.rowCount };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    let failed = 0;
    for (const rule of RULES) {
        try {
            const r = await runRule(rule);
            if (r.skipped) {
                console.log(`${stamp}  --  ${rule.name}: 表が無いので飛ばしました`);
                continue;
            }
            const what = DRY_RUN ? `対象 ${r.target}件（--dry-run のため変更なし）`
                : `${r.changed}件を片付けました`;
            console.log(`${stamp}  OK  ${rule.name}（${rule.days}日）: ${what}`);
        } catch (error) {
            failed++;
            console.error(`${stamp}  NG  ${rule.name}: ${error.message}`);
        }
    }
    if (failed) process.exitCode = 1;
    await db.pool.end();
}

main().catch(async error => {
    console.error('retention failed:', error.message);
    process.exitCode = 1;
    try { await db.pool.end(); } catch (e) { /* 閉じ済み */ }
});
