#!/usr/bin/env node
/**
 * 四半期のOSS申告用データを書き出す。
 *
 *   node scripts/oss-return.js 2026-Q4            画面に表示
 *   node scripts/oss-return.js 2026-Q4 --csv ~/oss   CSVも書き出す
 *   node scripts/oss-return.js                    直前の四半期を自動で選ぶ
 *
 * 出力は2種類:
 *   oss-return-YYYY-Qn.csv   申告書に転記する集計（消費国 × 税率）
 *   oss-records-YYYY-Qn.csv  取引ごとの記録（第63c条・10年保存）
 *
 * ⚠️ ユーロ換算はしていない。申告は四半期末日のECBレートで行う必要があり、
 *    誤ったレートを自動で当てると納付額が狂う。レートは申告時に確認すること。
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const db = require('../config/database');
const oss = require('../services/ossReport');
const { VAT_REGISTERED, missingCountries } = require('../config/vatRates');

function previousQuarter() {
  const now = new Date();
  let y = now.getUTCFullYear();
  let q = Math.floor(now.getUTCMonth() / 3);   // 0-3 の「今の四半期」→ 引くと前期
  if (q === 0) { q = 4; y -= 1; }
  return `${y}-Q${q}`;
}

const num = v => Number(v || 0).toFixed(2);

(async () => {
  const label = process.argv.find(a => /^\d{4}-Q[1-4]$/.test(a)) || previousQuarter();
  const csvIdx = process.argv.indexOf('--csv');
  const outDir = csvIdx >= 0 ? (process.argv[csvIdx + 1] || '.') : null;

  const { start, end } = oss.quarterRange(label);
  console.log(`\n===== OSS 四半期申告データ  ${label} =====`);
  console.log(`対象期間 : ${start.toISOString().slice(0, 10)} 〜 ${new Date(end - 86400000).toISOString().slice(0, 10)}`);
  console.log(`申告期限 : ${oss.filingDeadline(label)}（この日までに申告と納付）`);
  console.log(`換算レート: ${oss.quarterLastDay(label)} 時点のECB公表レートを使うこと`);

  if (!VAT_REGISTERED) {
    console.log(`\n⚠️ 現在まだVAT未登録です（税率表は残り ${missingCountries().length} か国が未確認）。`);
    console.log(`   下の集計は、登録後にどう出るかの確認用です。実際の申告にはまだ使えません。`);
  }

  const summary = await oss.getReturnSummary(label);
  console.log(`\n--- 申告書に転記する集計（消費国 × 税率 × 通貨）---`);
  if (!summary.length) {
    console.log('  EU圏への販売はありません。');
    console.log('  ※ 売上ゼロでも申告は必要です（ゼロ申告）。');
  } else {
    console.log('  国  税率%  通貨   課税標準      VAT額     販売  返金');
    for (const r of summary) {
      console.log(`  ${r.member_state}   ${String(r.vat_rate).padStart(5)}  ${r.currency}  ` +
                  `${num(r.taxable_amount).padStart(11)}  ${num(r.vat_amount).padStart(10)}  ` +
                  `${String(r.sales).padStart(4)}  ${String(r.refunds).padStart(4)}`);
    }
    const byCur = {};
    for (const r of summary) {
      byCur[r.currency] = byCur[r.currency] || { taxable: 0, vat: 0 };
      byCur[r.currency].taxable += Number(r.taxable_amount || 0);
      byCur[r.currency].vat += Number(r.vat_amount || 0);
    }
    console.log('  ' + '-'.repeat(58));
    for (const [c, v] of Object.entries(byCur)) {
      console.log(`  通貨別合計 ${c}: 課税標準 ${num(v.taxable)} / VAT ${num(v.vat)}`);
    }
  }

  const orphans = await oss.getUnattributed(label);
  if (orphans.length) {
    console.log(`\n⚠️ 購入者の国が不明な取引が ${orphans.length} 件あります。`);
    console.log(`   EU圏の取引が紛れていると申告が不足します。Stripeの明細で確認してください。`);
    orphans.slice(0, 5).forEach(o =>
      console.log(`   ${o.created_at.toISOString().slice(0, 10)}  ${num(o.amount)} ${o.currency}  ${o.payment_gateway_id}`));
    if (orphans.length > 5) console.log(`   ... 他 ${orphans.length - 5} 件`);
  }

  const records = await oss.getTransactionRecords(label);
  console.log(`\n--- 保存が必要な取引記録: ${records.length} 件（10年保存）---`);

  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    const f1 = path.join(outDir, `oss-return-${label}.csv`);
    const f2 = path.join(outDir, `oss-records-${label}.csv`);
    fs.writeFileSync(f1, oss.toCsv(summary, oss.SUMMARY_COLUMNS));
    fs.writeFileSync(f2, oss.toCsv(records, oss.RECORD_COLUMNS));
    console.log(`\n書き出しました:`);
    console.log(`  ${f1}`);
    console.log(`  ${f2}`);
  }

  console.log('');
  await db.pool.end();
})().catch(e => {
  console.error('エラー:', e.message);
  process.exit(1);
});
