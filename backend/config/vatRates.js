/**
 * 販売にかかる付加価値税（VAT）の税率。
 *
 * ■ いまは無効です
 * K's Publisher Ltd はまだVAT登録事業者ではないため、VAT_REGISTERED = false の間、
 * 税率は常に 0 を返します。登録していない事業者がVATを徴収するのは違法なので、
 * この既定値を勝手に変えないでください。
 *
 * ■ 税率は「購入者の国」で決まります
 * 著者・翻訳者・編集者がどこにいるかは関係ありません
 * （アイルランド歳入庁に確認済み 2026-08-07：売主は当社であり、著者との関係は別のB2B取引）。
 *
 * ■ 電子書籍は軽減税率です
 * 標準税率（19〜25%）ではありません。英国は 0%、EUの多くの国は 0〜10% です。
 * オーディオブックは軽減税率の対象外なので、扱い始めるときは別の表が要ります。
 *
 * ■ 数字の出どころを必ず書くこと
 * 各国の値には source と verifiedOn を付けます。裏を取っていない数字を入れると、
 * そのまま誤った額を国に納めることになります。「たぶんこれ」で入れないでください。
 * 確認先: EU委員会の TEDB（Taxes in Europe Database）、または各国税務当局。
 *
 * ■ 有効にする手順
 *   1. EU27か国ぶんを、確認したうえで RATES に追加する
 *   2. VAT_REGISTERED を true にする
 *   3. サーバーを起動する。表が不完全なら起動時に落ちる（下の assertRateTableComplete）
 *   4. 利用規約 8.4 と、収益分配の説明の文言を「登録済み」の内容に更新する
 */

// OSS登録が完了し、下の表を埋め終えるまで false のままにすること
const VAT_REGISTERED = false;

// non-Union OSS で申告が必要になる国（EU27）＋ 自国
const EU27 = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
              'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
              'SI', 'ES', 'SE'];
const REQUIRED_COUNTRIES = ['GB', ...EU27];

/**
 * 電子書籍・電子コミックの税率（%）。ISO 3166-1 alpha-2。
 *
 * ここにあるのは、公表資料で裏を取れたものだけです。
 * 残りは OSS 登録の際に、TEDB か各国当局で確認して追加してください。
 */
const RATES = {
  GB: { rate: 0,   source: 'VAT Notice 701/10 — 電子出版物は2020-05-01からゼロ税率。コミックも対象', verifiedOn: '2026-08-07' },
  DE: { rate: 7,   source: 'EU委員会の軽減税率一覧', verifiedOn: '2026-08-07' },
  FR: { rate: 5.5, source: 'EU委員会の軽減税率一覧', verifiedOn: '2026-08-07' },
  // TODO(OSS登録時): 残る24か国を確認して追加する
  //   AT BE BG HR CY CZ DK EE FI GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE
};

/**
 * まだ確認できていない国の一覧。登録前の準備状況を見るために使う。
 */
function missingCountries() {
  return REQUIRED_COUNTRIES.filter(cc => RATES[cc] === undefined);
}

/**
 * 表が埋まっていないのに VAT_REGISTERED を true にしてしまう事故を、起動時に止める。
 *
 * 決済のたびに気づくのでは遅い。サーバーが上がらなければ、必ず気づきます。
 * server.js から呼びます。
 */
function assertRateTableComplete() {
  if (!VAT_REGISTERED) return;
  const missing = missingCountries();
  if (missing.length) {
    throw new Error(
      'VAT_REGISTERED = true ですが、税率が未確認の国があります: ' + missing.join(', ') +
      '\nconfig/vatRates.js の RATES に、確認した税率と出典を追加してください。' +
      '\n未確認のまま動かすと、誤った税額で納付することになります。'
    );
  }
}

/**
 * 購入者の国から税率を引く。
 *
 * 未登録なら常に 0。登録済みで表に無い国が来た場合は、決済を止めずに 0 とし、
 * 呼び出し側が気づけるよう unknownCountry を立てる。
 * ここで例外を投げると購入そのものが失敗し、記録も残らない。
 * 徴収漏れは後から是正できるが、失った決済は取り戻せない。
 */
function getVatRate(countryCode) {
  if (!VAT_REGISTERED) {
    return { rate: 0, registered: false, unknownCountry: false };
  }
  const cc = (countryCode || '').toUpperCase();
  if (!cc) return { rate: 0, registered: true, unknownCountry: true };

  const entry = RATES[cc];
  if (!entry) return { rate: 0, registered: true, unknownCountry: true };
  return { rate: entry.rate, registered: true, unknownCountry: false };
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

module.exports = {
  VAT_REGISTERED, RATES, EU27, REQUIRED_COUNTRIES,
  getVatRate, splitTaxFromGross, missingCountries, assertRateTableComplete
};
