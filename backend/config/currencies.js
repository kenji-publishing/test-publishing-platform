/**
 * 読者に「自分の通貨だといくらか」を見せるための、表示専用の為替レート。
 *
 * 請求はあくまで作品に設定された通貨・金額そのままで、ここの数字は請求に一切関わらない。
 * 目安として添えるだけなので、多少ずれていても実害は出ない（$3の本で数セント）。
 *
 * ⚠ レートは手で更新する。同じ性質の表が他に2つある:
 *     backend/routes/ai-tools.js の CURRENCIES … AIツールの「請求額」を決める（要正確）
 *     js/wizard-common.js の CURRENCIES       … ウィザードの見積表示
 *   数字を直すときは3つとも揃えること。
 *
 * レートは日本円を1とした値（JPY建て）。最終更新: 2026-09（1USD ≒ 149円）
 */

const RATES = {
    JPY: { rate: 1,      decimals: 0, symbol: '¥' },
    USD: { rate: 0.0067, decimals: 2, symbol: '$' },
    EUR: { rate: 0.0061, decimals: 2, symbol: '€' },
    GBP: { rate: 0.0053, decimals: 2, symbol: '£' },
    AUD: { rate: 0.0103, decimals: 2, symbol: 'A$' },
    CAD: { rate: 0.0093, decimals: 2, symbol: 'C$' },
    KRW: { rate: 9.17,   decimals: 0, symbol: '₩' },
    BRL: { rate: 0.038,  decimals: 2, symbol: 'R$' },
    CNY: { rate: 0.0476, decimals: 2, symbol: '¥' },
    SAR: { rate: 0.0251, decimals: 2, symbol: 'SAR ' }
};

// 国 → その国の読者に見せる通貨。
// 表に無い国には目安を出さない。当てずっぽうの通貨を見せるより、
// 作品の値段だけを見せる方が親切（誤解のもとを作らない）
const COUNTRY_CURRENCY = {
    US: 'USD', GB: 'GBP', JP: 'JPY', KR: 'KRW', CN: 'CNY', BR: 'BRL',
    AU: 'AUD', NZ: 'AUD', CA: 'CAD', SA: 'SAR',
    // ユーロを使う国（EU加盟国＋ユーロを法定通貨にしている国）
    AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR',
    GR: 'EUR', IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR',
    NL: 'EUR', PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR', HR: 'EUR',
    AD: 'EUR', MC: 'EUR', SM: 'EUR', VA: 'EUR', ME: 'EUR', XK: 'EUR'
};

function currencyForCountry(countryCode) {
    return COUNTRY_CURRENCY[String(countryCode || '').toUpperCase()] || null;
}

module.exports = { RATES, COUNTRY_CURRENCY, currencyForCountry };
