/**
 * 販売にかかる付加価値税（VAT）の税率。
 *
 * ■ いまは無効です
 * K's Publisher Ltd はまだVAT登録事業者ではないため、VAT_REGISTERED = false の間、
 * 税率は常に 0 を返します。登録していない事業者がVATを徴収するのは違法なので、
 * この既定値を変えないでください。
 *
 * ■ 有効にするとき
 * アイルランドの non-Union OSS に登録したら:
 *   1. 下の表を、公的資料で確認した税率で埋める（EU27か国ぶん）
 *   2. VAT_REGISTERED を true にする
 *   3. 利用規約 8.4 と、収益分配の説明の文言を「登録済み」の内容に更新する
 *
 * ■ 税率は「購入者の国」で決まります
 * 著者・翻訳者・編集者がどこにいるかは関係ありません（アイルランド歳入庁に確認済み、
 * 2026-08-07: 売主は当社であり、著者との関係は別のB2B取引という回答）。
 *
 * ■ 電子書籍は軽減税率です
 * 標準税率（19〜25%）ではありません。英国は 0%、EUの多くの国は 0〜10% です。
 * オーディオブックは軽減税率の対象外なので、扱い始めるときは別の表が要ります。
 */

// OSS登録が完了するまで false のままにすること
const VAT_REGISTERED = false;

/**
 * 電子書籍・電子コミックの税率（%）。ISO 3166-1 alpha-2。
 *
 * 「確認済み」と書いた国だけが、公的資料で裏を取ったものです。
 * 残りは登録の手続きをするときに埋めます。裏取りせずに数字を入れると、
 * 誤った額を納付することになります。
 */
const EBOOK_VAT_RATES = {
  // 確認済み
  GB: 0,    // 英国: 2020-05-01 から電子出版物はゼロ税率（VAT Notice 701/10、コミックも対象）
  DE: 7,    // ドイツ
  FR: 5.5,  // フランス

  // TODO: OSS登録時に、残るEU加盟国を公的資料で確認して追加する
  //       AT BE BG HR CY CZ DK EE FI GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE
};

/**
 * 購入者の国から税率を引く。
 *
 * 未登録なら常に 0。登録済みで表に無い国が来た場合は、決済を止めずに 0 とし、
 * 呼び出し側が気づけるよう unknownCountry を立てる。
 * ここで例外を投げると購入そのものが失敗し、記録も残らない。
 * 徴収漏れは後から是正できるが、決済の失敗は取り戻せない。
 */
function getVatRate(countryCode) {
  if (!VAT_REGISTERED) {
    return { rate: 0, registered: false, unknownCountry: false };
  }
  const cc = (countryCode || '').toUpperCase();
  if (!cc) return { rate: 0, registered: true, unknownCountry: true };

  const rate = EBOOK_VAT_RATES[cc];
  if (rate === undefined) {
    return { rate: 0, registered: true, unknownCountry: true };
  }
  return { rate, registered: true, unknownCountry: false };
}

/**
 * 税込価格から、税額と税抜き額を出す。
 *
 * 表示価格が総額（税込）である前提。EUの消費者向け表示は税込が求められるため。
 *   税額   = 総額 × 率 / (100 + 率)
 *   税抜き = 総額 − 税額
 *
 * 端数は2桁に丸め、税抜き額は引き算で出す。それぞれ独立に丸めると
 * 税額 + 税抜き ≠ 総額 になり、1円ぶん合わなくなる。
 */
function splitTaxFromGross(grossAmount, rate) {
  const gross = Number(grossAmount);
  if (!rate || rate <= 0) {
    return { vatAmount: 0, netAmount: round2(gross) };
  }
  const vatAmount = round2(gross * rate / (100 + rate));
  return { vatAmount, netAmount: round2(gross - vatAmount) };
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

module.exports = { VAT_REGISTERED, EBOOK_VAT_RATES, getVatRate, splitTaxFromGross };
