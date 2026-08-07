/**
 * non-Union OSS の四半期申告に必要なデータを作る。
 *
 * ■ 申告書に載せるもの（Revenue の Tax and Duty Manual 4章）
 *   消費国ごとに:
 *     (a) その期の供給の総額（VAT抜き）
 *     (b) 税率ごとの内訳
 *     (c) 適用した税率
 *     (d) VAT額の合計
 *
 * ■ 保存が必要な記録（Implementing Regulation 第63c条・10年）
 *   (a)消費国 (b)役務の種類 (c)提供日 (d)課税標準と通貨 (e)その後の増減
 *   (f)税率 (g)VAT額と通貨 (h)入金日と金額 (k)顧客の所在地の判定根拠
 *
 * ■ 申告と納付の期限
 *   対象四半期の翌月末。売上がゼロの期も申告は必要（ゼロ申告）。
 *
 * ■ 通貨について
 *   申告はユーロ建て。ユーロ以外で受け取った分は、その四半期の最終日に
 *   欧州中央銀行が公表したレートで換算する（公表が無ければ次の公表日）。
 *   このレートは自動で取りに行っていない。誤ったレートで申告すると
 *   納付額が狂うため、換算は申告時に確認した値で行うこと。
 *   このモジュールは通貨ごとの小計まで出す。
 */

const db = require('../config/database');

/** 'YYYY-Qn' → その四半期の開始と終了（終了は翌期の開始＝未満で比較する） */
function quarterRange(label) {
  const m = /^(\d{4})-Q([1-4])$/.exec(String(label || '').trim());
  if (!m) throw new Error('四半期は YYYY-Q1〜Q4 の形式で指定してください（例 2026-Q4）');
  const year = Number(m[1]);
  const q = Number(m[2]);
  const startMonth = (q - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 1));
  return { start, end, year, quarter: q };
}

/** その四半期の最終日（ECBのレートを引く日） */
function quarterLastDay(label) {
  const { end } = quarterRange(label);
  const d = new Date(end.getTime() - 86400000);
  return d.toISOString().slice(0, 10);
}

/**
 * 申告書に載せる集計。消費国 × 税率 × 通貨 でまとめる。
 *
 * 返金は課税標準を減らすので、購入(+)と返金(−)を相殺した額を出す
 * （第63c条(e)「その後の増減」）。相殺した結果が負になる期もありうる。
 */
async function getReturnSummary(quarterLabel) {
  const { start, end } = quarterRange(quarterLabel);
  const { rows } = await db.query(
    `SELECT
        t.buyer_country                                   AS member_state,
        t.vat_rate                                        AS vat_rate,
        t.currency                                        AS currency,
        SUM(CASE WHEN t.transaction_type = 'refund' THEN -t.net_amount ELSE t.net_amount END) AS taxable_amount,
        SUM(CASE WHEN t.transaction_type = 'refund' THEN -t.vat_amount ELSE t.vat_amount END) AS vat_amount,
        COUNT(*) FILTER (WHERE t.transaction_type = 'purchase') AS sales,
        COUNT(*) FILTER (WHERE t.transaction_type = 'refund')   AS refunds
       FROM transactions t
      WHERE t.status = 'completed'
        AND t.transaction_type IN ('purchase', 'refund')
        AND t.created_at >= $1 AND t.created_at < $2
        AND t.buyer_country = ANY($3::varchar[])
      GROUP BY 1, 2, 3
      ORDER BY 1, 2, 3`,
    [start, end, require('../config/vatRates').EU27]
  );
  return rows;
}

/**
 * 第63c条が求める、取引ごとの記録。監査で求められたら電子的に提出する。
 * 10年保存が必要なので、四半期ごとに書き出して残しておく。
 */
async function getTransactionRecords(quarterLabel) {
  const { start, end } = quarterRange(quarterLabel);
  const { rows } = await db.query(
    `SELECT
        t.created_at                                      AS supply_date,
        t.buyer_country                                   AS member_state,
        'Electronically supplied service (e-book / e-comic)' AS service_type,
        t.transaction_type                                AS type,
        t.amount                                          AS gross_amount,
        t.net_amount                                      AS taxable_amount,
        t.vat_rate                                        AS vat_rate,
        t.vat_amount                                      AS vat_amount,
        t.currency                                        AS currency,
        t.payment_gateway_id                              AS payment_reference,
        w.title                                           AS work_title,
        'Billing country or card issuing country from payment provider' AS location_evidence
       FROM transactions t
       LEFT JOIN works w ON w.work_id = t.work_id
      WHERE t.status = 'completed'
        AND t.transaction_type IN ('purchase', 'refund')
        AND t.created_at >= $1 AND t.created_at < $2
        AND t.buyer_country = ANY($3::varchar[])
      ORDER BY t.created_at`,
    [start, end, require('../config/vatRates').EU27]
  );
  return rows;
}

/**
 * 国が取れていない完了取引。申告に載せられないので、あれば必ず調べる。
 * （EU圏だったのに国が空、という取引が紛れていると申告が不足する）
 */
async function getUnattributed(quarterLabel) {
  const { start, end } = quarterRange(quarterLabel);
  const { rows } = await db.query(
    `SELECT t.created_at, t.amount, t.currency, t.payment_gateway_id, t.transaction_type
       FROM transactions t
      WHERE t.status = 'completed'
        AND t.transaction_type IN ('purchase', 'refund')
        AND t.created_at >= $1 AND t.created_at < $2
        AND t.buyer_country IS NULL
      ORDER BY t.created_at`,
    [start, end]
  );
  return rows;
}

/** CSV。Excelで開いたときに日本語と記号が壊れないようBOMを付ける */
function toCsv(rows, columns) {
  const esc = v => {
    if (v === null || v === undefined) return '';
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = columns.join(',');
  const body = rows.map(r => columns.map(c => esc(r[c])).join(',')).join('\n');
  return '﻿' + head + '\n' + body + '\n';
}

const SUMMARY_COLUMNS = ['member_state', 'vat_rate', 'currency', 'taxable_amount', 'vat_amount', 'sales', 'refunds'];
const RECORD_COLUMNS = ['supply_date', 'member_state', 'service_type', 'type', 'gross_amount',
                        'taxable_amount', 'vat_rate', 'vat_amount', 'currency',
                        'payment_reference', 'work_title', 'location_evidence'];

/** 申告期限＝対象四半期の翌月末 */
function filingDeadline(quarterLabel) {
  const { end } = quarterRange(quarterLabel);
  const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0));
  return d.toISOString().slice(0, 10);
}

module.exports = {
  quarterRange, quarterLastDay, filingDeadline,
  getReturnSummary, getTransactionRecords, getUnattributed,
  toCsv, SUMMARY_COLUMNS, RECORD_COLUMNS
};
