/**
 * AuctLect Platform - Shared wizard pricing helpers
 *
 * Single source of truth for the demo currency table, the platform payment
 * minimums, and the currency conversion / formatting / minimum-charge logic
 * shared by the manga-translator, novel-translator and ai-editor wizards.
 *
 * The three wizards previously each carried byte-identical copies of this
 * code. They now keep thin local wrappers (same names/signatures) that pass
 * the page's selectedCurrency / selectedPayMethod into these functions, so no
 * call sites changed.
 *
 * NOTE: per-model pricing (PRICING_JPY) is intentionally NOT centralized here
 * — it differs per wizard (manga = per page, novel/ai-editor = per 1k chars).
 */
(function (global) {
    // symbol, approximate rate from JPY, decimal places
    var CURRENCIES = {
        JPY: { symbol: '¥', rate: 1,      decimals: 0, name: 'JPY' },
        USD: { symbol: '$',      rate: 0.0067, decimals: 2, name: 'USD' },
        EUR: { symbol: '€', rate: 0.0061, decimals: 2, name: 'EUR' },
        GBP: { symbol: '£', rate: 0.0053, decimals: 2, name: 'GBP' },
        AUD: { symbol: 'A$',     rate: 0.0103, decimals: 2, name: 'AUD' },
        CAD: { symbol: 'C$',     rate: 0.0093, decimals: 2, name: 'CAD' },
        KRW: { symbol: '₩', rate: 9.17,   decimals: 0, name: 'KRW' },
        BRL: { symbol: 'R$',     rate: 0.038,  decimals: 2, name: 'BRL' }
    };

    // Minimum charge per payment method per currency (platform minimums, covering fees)
    var PAY_MINIMUMS = {
        stripe: { JPY: 100, USD: 1.00, EUR: 1.00, GBP: 0.80, AUD: 1.50, CAD: 1.50, KRW: 1000, BRL: 5.00 },
        paypal: { JPY: 150, USD: 1.50, EUR: 1.50, GBP: 1.20, AUD: 2.00, CAD: 2.00, KRW: 1500, BRL: 7.00 }
    };

    function toSelectedCurrency(jpyAmount, currencyCode) {
        var cur = CURRENCIES[currencyCode];
        return Number((jpyAmount * cur.rate).toFixed(cur.decimals));
    }

    function formatPrice(amount, currencyCode) {
        var cur = CURRENCIES[currencyCode];
        var formatted = cur.decimals === 0 ? Math.round(amount).toLocaleString() : amount.toFixed(cur.decimals);
        return cur.symbol + formatted;
    }

    function getMinimum(currencyCode, payMethod) {
        return PAY_MINIMUMS[payMethod][currencyCode] || PAY_MINIMUMS[payMethod]['USD'];
    }

    global.WizardCommon = {
        CURRENCIES: CURRENCIES,
        PAY_MINIMUMS: PAY_MINIMUMS,
        toSelectedCurrency: toSelectedCurrency,
        formatPrice: formatPrice,
        getMinimum: getMinimum
    };
})(window);
