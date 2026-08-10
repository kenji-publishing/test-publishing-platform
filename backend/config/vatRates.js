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
const TEDB = 'EU委員会 TEDB（基準日2026-07-01）';
const EIBF = '欧州書店連盟 VAT rates on all book types (2025-07)';
const BOTH = TEDB + ' ＋ ' + EIBF + ' が一致';

const RATES = {
  GB: { rate: 0,    source: 'VAT Notice 701/10 — 電子出版物は2020-05-01からゼロ税率。コミックも対象', verifiedOn: '2026-08-07' },

  // --- ゼロ税率 ---
  IE: { rate: 0,    source: BOTH + '。2024-01-01から電子書籍もゼロ税率', verifiedOn: '2026-08-10' },
  CZ: { rate: 0,    source: BOTH + '。2024-01-01から紙・電子とも0%', verifiedOn: '2026-08-10' },

  // --- 軽減税率 ---
  CY: { rate: 3,    source: EIBF + '＋EY税務アラート。2023-07-21から紙・電子とも3%（TEDBは未収録）', verifiedOn: '2026-08-10' },
  LU: { rate: 3,    source: BOTH + '。ただし成人向けは対象外（下記 EXCEPTIONS）', verifiedOn: '2026-08-10' },
  IT: { rate: 4,    source: EIBF + '。**ISBNのある電子出版物のみ**4%（下記 EXCEPTIONS）', verifiedOn: '2026-08-10' },
  ES: { rate: 4,    source: EIBF + '＋VAT法91.2.1.2条。電子的役務でも4%（TEDBは未収録）', verifiedOn: '2026-08-10' },
  HR: { rate: 5,    source: TEDB + '＋業界資料。2020-01-01から電子書籍も5%', verifiedOn: '2026-08-10' },
  LV: { rate: 5,    source: BOTH + '。2022-01-01から電子書籍も5%', verifiedOn: '2026-08-10' },
  LT: { rate: 5,    source: TEDB + '。**2026-01-01に9%→5%**（Law XV-287）。EIBFの9%は改正前', verifiedOn: '2026-08-10' },
  MT: { rate: 5,    source: EIBF + '。紙・電子・オーディオとも5%', verifiedOn: '2026-08-10' },
  PL: { rate: 5,    source: BOTH + '。電子的に供給される書籍も5%', verifiedOn: '2026-08-10' },
  SK: { rate: 5,    source: EIBF + '。2025-01-01から電子書籍も5%（TEDBは未収録）', verifiedOn: '2026-08-10' },
  SI: { rate: 5,    source: BOTH + '。2020年から電子書籍も5%', verifiedOn: '2026-08-10' },
  FR: { rate: 5.5,  source: BOTH + '。2020年から電子書籍・オーディオブックも5.5%', verifiedOn: '2026-08-10' },
  BE: { rate: 6,    source: BOTH + '。注記に「digital and on paper」', verifiedOn: '2026-08-10' },
  GR: { rate: 6,    source: BOTH + '。TEDBではEL表記。CPA 58.11.3（オンライン出版物）', verifiedOn: '2026-08-10' },
  PT: { rate: 6,    source: BOTH + '。本土6%（マデイラ5%・アゾレス4%は下記 EXCEPTIONS）', verifiedOn: '2026-08-10' },
  DE: { rate: 7,    source: BOTH + '。ただし青少年有害図書は19%（下記 EXCEPTIONS）', verifiedOn: '2026-08-10' },
  BG: { rate: 9,    source: BOTH + '。2023-01-01から恒久化', verifiedOn: '2026-08-10' },
  EE: { rate: 9,    source: BOTH + '。媒体を問わず9%', verifiedOn: '2026-08-10' },
  NL: { rate: 9,    source: BOTH + '。「digital or physical supplies」', verifiedOn: '2026-08-10' },
  AT: { rate: 10,   source: BOTH + '。CPA 58.11.3 系', verifiedOn: '2026-08-10' },
  RO: { rate: 11,   source: TEDB + '。2025年の増税で5%→11%。EIBFの5%は改正前', verifiedOn: '2026-08-10' },
  FI: { rate: 13.5, source: TEDB + '。EIBFの14%は改正前', verifiedOn: '2026-08-10' },

  // --- 軽減税率が無い国 ---
  HU: { rate: 27,   source: EIBF + '「Online e-books excluded from VAT reduction」。紙は5%だが電子は標準27%', verifiedOn: '2026-08-10' },
  DK: { rate: 25,   source: BOTH + '。デンマークは紙も電子も標準税率', verifiedOn: '2026-08-10' },
  SE: { rate: 6,    source: BOTH + '。紙・電子・オーディオとも6%', verifiedOn: '2026-08-10' },
};

/**
 * 上の税率が「そのままでは当てはまらない」条件。
 *
 * ■ まだコードには反映していません（VAT_REGISTERED = false のため実害なし）。
 *   有効化する前に、どう扱うか決めてから実装すること。放置して登録すると
 *   イタリア・ルクセンブルク・ドイツで過少徴収になります。
 */
const EXCEPTIONS = {
  // ISBN が無い電子書籍は「書籍」ではなく「役務」とされ、標準税率になる
  IT: { condition: 'ISBNなし', rate: 22,
        note: 'イタリア法では ISBN/ISSN のある出版物のみ書籍扱い。自費出版でISBN未取得だと22%' },

  // 成人向け・青少年有害コンテンツを軽減税率から除外する国
  LU: { condition: 'is_adult', rate: 17, note: '主に性的な内容の出版物は3%の対象外' },
  DE: { condition: 'is_adult', rate: 19, note: '青少年に有害な内容の書籍（電子含む）は7%の対象外' },
  LV: { condition: 'is_adult', rate: 21, note: 'エロティック・ポルノ的な出版物は標準税率' },
  ITa:{ condition: 'is_adult', rate: 22, note: 'ポルノ的な新聞・定期刊行物は軽減税率の対象外' },
  PT: { condition: 'is_adult', rate: 23, note: 'わいせつ・ポルノ的内容は6%の対象外' },
  EE: { condition: 'is_adult', rate: 20, note: 'エロティック・ポルノ的な新聞・定期刊行物は20%' },

  // 同じ国でも地域で税率が違う（購入者の所在地で決まるため影響しうる）
  _regions: {
    PT: { 'マデイラ': 5, 'アゾレス': 4 },
    GR: { 'エーゲ海の島(Leros/Lesvos/Kos/Samos/Chios)': 3 },
    ES: { 'カナリア諸島・セウタ・メリリャ': 'EU VAT域外（IGIC等の別税制）' },
    FR: { 'コルシカ・海外県': '本土と別税率' },
    AT: { 'Jungholz/Mittelberg': 19 },
  },

  // 全EU共通で軽減税率から外れる条件（選んだカテゴリ自体の除外条件）
  _common: '広告が主体の出版物／動画・音楽が主体の出版物は、どの国でも標準税率',
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
