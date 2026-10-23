#!/usr/bin/env node
/**
 * 暗号化前に保存された受取口座を、まとめて暗号化する（1回だけ・何度実行しても安全）
 *
 * 対象: user_payout_details の秘密項目と、payout_items.details_snapshot（支払い時の控え）
 * すでに暗号化済みの値は飛ばす。全体を1つのトランザクションで行い、
 * 書いた直後に復号して元と一致するか確かめる。1件でも合わなければ全部取り消す。
 *
 * 使い方（backend/ で）:
 *   node scripts/encrypt-payout-details.js --dry-run   # 件数を見るだけ
 *   node scripts/encrypt-payout-details.js
 *
 * 前提: migration 061 を適用済み・.env に PAYOUT_ENC_KEY があること
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/database');
const {
    PAYOUT_SECRET_FIELDS, isEncrypted, encryptPayoutDetails, decryptPayoutDetails
} = require('../services/fieldCrypto');

const DRY_RUN = process.argv.includes('--dry-run');

function needsWork(obj) {
    return PAYOUT_SECRET_FIELDS.some(f => obj[f] != null && obj[f] !== '' && !isEncrypted(obj[f]));
}

function sameSecrets(a, b) {
    return PAYOUT_SECRET_FIELDS.every(f => (a[f] ?? null) === (b[f] ?? null));
}

async function main() {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const rows = (await client.query(
            `SELECT user_id, ${PAYOUT_SECRET_FIELDS.join(', ')} FROM user_payout_details FOR UPDATE`
        )).rows;
        const todoRows = rows.filter(needsWork);

        const items = (await client.query(
            `SELECT item_id, details_snapshot FROM payout_items
              WHERE details_snapshot IS NOT NULL FOR UPDATE`
        )).rows;
        const todoItems = items.filter(it => needsWork(it.details_snapshot));

        console.log(`受取口座: ${rows.length}件中 ${todoRows.length}件が未暗号化`);
        console.log(`支払いの控え: ${items.length}件中 ${todoItems.length}件が未暗号化`);

        if (DRY_RUN) {
            await client.query('ROLLBACK');
            console.log('--dry-run のため何も変更していません');
            return;
        }

        for (const r of todoRows) {
            const enc = encryptPayoutDetails(r);
            if (!sameSecrets(decryptPayoutDetails(enc), r)) {
                throw new Error(`復号して元に戻りません: user ${r.user_id}`);
            }
            const sets = PAYOUT_SECRET_FIELDS.map((f, i) => `${f} = $${i + 2}`).join(', ');
            await client.query(
                `UPDATE user_payout_details SET ${sets} WHERE user_id = $1`,
                [r.user_id, ...PAYOUT_SECRET_FIELDS.map(f => enc[f])]
            );
        }

        for (const it of todoItems) {
            const enc = encryptPayoutDetails(it.details_snapshot);
            if (!sameSecrets(decryptPayoutDetails(enc), it.details_snapshot)) {
                throw new Error(`復号して元に戻りません: payout_item ${it.item_id}`);
            }
            await client.query(
                `UPDATE payout_items SET details_snapshot = $2 WHERE item_id = $1`,
                [it.item_id, JSON.stringify(enc)]
            );
        }

        // 書き込んだ後の状態をもう一度読んで、平文が残っていないか確かめる
        const left = (await client.query(
            `SELECT ${PAYOUT_SECRET_FIELDS.join(', ')} FROM user_payout_details`
        )).rows.filter(needsWork).length
            + (await client.query(
                `SELECT details_snapshot FROM payout_items WHERE details_snapshot IS NOT NULL`
            )).rows.filter(it => needsWork(it.details_snapshot)).length;
        if (left > 0) throw new Error(`暗号化されていない値が ${left} 件残っています`);

        await client.query('COMMIT');
        console.log(`暗号化しました（受取口座 ${todoRows.length}件・控え ${todoItems.length}件）`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('失敗したので全部取り消しました:', error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await db.pool.end();
    }
}

main();
