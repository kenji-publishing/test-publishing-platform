/**
 * Receipt Generator Service
 * Generates receipts in HTML format for purchases (9 languages supported)
 */

/**
 * Get font and direction settings per language
 */
function getLanguageSettings(lang) {
    const settings = {
        ja: {
            fontFamily: "'Noto Sans JP', sans-serif",
            fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
            direction: 'ltr'
        },
        en: {
            fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
            fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
            direction: 'ltr'
        },
        zh: {
            fontFamily: "'Noto Sans SC', sans-serif",
            fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap',
            direction: 'ltr'
        },
        ko: {
            fontFamily: "'Noto Sans KR', sans-serif",
            fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap',
            direction: 'ltr'
        },
        es: {
            fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
            fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
            direction: 'ltr'
        },
        fr: {
            fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
            fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
            direction: 'ltr'
        },
        de: {
            fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
            fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
            direction: 'ltr'
        },
        ar: {
            fontFamily: "'Noto Sans Arabic', sans-serif",
            fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap',
            direction: 'rtl'
        },
        pt: {
            fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
            fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
            direction: 'ltr'
        }
    };
    
    return settings[lang] || settings['ja'];
}

/**
 * Generate receipt HTML
 * @param {Object} purchase - Purchase data
 * @param {string} lang - Language code (ja, en, zh, es, fr, de, ko, ar, pt)
 * @returns {string} HTML content
 */
function generateReceiptHTML(purchase, lang = 'ja') {
    const texts = getTexts(lang);
    const langSettings = getLanguageSettings(lang);
    const purchaseDate = new Date(purchase.created_at);
    const formattedDate = formatDate(purchaseDate, lang);
    const formattedAmount = formatAmount(purchase.amount, purchase.currency, lang);
    const paymentMethodText = getPaymentMethodText(purchase.payment_method, lang);
    const customerName = formatCustomerName(purchase.first_name, purchase.last_name, lang);
    
    // RTL styles for Arabic
    const rtlStyles = langSettings.direction === 'rtl' ? `
        .info-row { flex-direction: row-reverse; }
        .info-label { text-align: right; }
        .info-value { text-align: left; }
        .total-row { flex-direction: row-reverse; }
    ` : '';
    
    return `<!DOCTYPE html>
<html lang="${lang}" dir="${langSettings.direction}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${texts.title} - AuctLect</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${langSettings.fontUrl}" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${langSettings.fontFamily};
            background: #f5f5f5;
            padding: 20px;
            color: #333;
            line-height: 1.6;
            direction: ${langSettings.direction};
        }
        
        .receipt-container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .receipt-header {
            background: linear-gradient(135deg, #8B7355 0%, #6B5344 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .logo-icon {
            font-size: 32px;
        }
        
        .receipt-title {
            font-size: 24px;
            font-weight: 600;
            margin-top: 10px;
            letter-spacing: 2px;
        }
        
        .receipt-body {
            padding: 30px;
        }
        
        .receipt-number {
            text-align: center;
            padding: 15px;
            background: #f9f7f5;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        
        .receipt-number-label {
            font-size: 12px;
            color: #888;
            margin-bottom: 4px;
        }
        
        .receipt-number-value {
            font-size: 18px;
            font-weight: 600;
            color: #8B7355;
            font-family: 'Consolas', monospace;
        }
        
        .info-section {
            margin-bottom: 25px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            color: #666;
            font-size: 14px;
        }
        
        .info-value {
            font-weight: 500;
            text-align: right;
            max-width: 60%;
        }
        
        .product-section {
            background: #f9f7f5;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        
        .product-label {
            font-size: 12px;
            color: #888;
            margin-bottom: 8px;
        }
        
        .product-name {
            font-size: 16px;
            font-weight: 600;
            color: #333;
        }
        
        .product-type {
            font-size: 12px;
            color: #8B7355;
            margin-top: 4px;
        }
        
        .total-section {
            background: linear-gradient(135deg, #8B7355 0%, #6B5344 100%);
            border-radius: 8px;
            padding: 20px;
            color: white;
            margin-bottom: 25px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .total-label {
            font-size: 16px;
        }
        
        .total-amount {
            font-size: 28px;
            font-weight: 700;
        }
        
        .receipt-footer {
            text-align: center;
            padding: 20px 30px 30px;
            border-top: 1px dashed #ddd;
        }
        
        .thank-you {
            font-size: 14px;
            color: #8B7355;
            margin-bottom: 15px;
        }
        
        .footer-text {
            font-size: 11px;
            color: #999;
            line-height: 1.8;
        }
        
        .print-button {
            display: block;
            width: 100%;
            max-width: 500px;
            margin: 20px auto;
            padding: 15px;
            background: #8B7355;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
        }
        
        .print-button:hover {
            background: #6B5344;
        }
        
        ${rtlStyles}
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .receipt-container {
                box-shadow: none;
                max-width: 100%;
            }
            .print-button {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="receipt-header">
            <div class="logo">
                <span class="logo-icon">📚</span>
                <span>AuctLect</span>
            </div>
            <div class="receipt-title">${texts.title}</div>
        </div>
        
        <div class="receipt-body">
            <div class="receipt-number">
                <div class="receipt-number-label">${texts.receiptNumber}</div>
                <div class="receipt-number-value">RCP-${String(purchase.purchase_id).padStart(8, '0')}</div>
            </div>
            
            <div class="info-section">
                <div class="info-row">
                    <span class="info-label">${texts.issueDate}</span>
                    <span class="info-value">${formattedDate}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">${texts.customerName}</span>
                    <span class="info-value">${customerName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">${texts.paymentMethod}</span>
                    <span class="info-value">${paymentMethodText}</span>
                </div>
                ${purchase.transaction_id ? `
                <div class="info-row">
                    <span class="info-label">${texts.transactionId}</span>
                    <span class="info-value" style="font-family: Consolas, monospace; font-size: 12px;">${purchase.transaction_id}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="product-section">
                <div class="product-label">${texts.productName}</div>
                <div class="product-name">${purchase.work_title || texts.productPurchase}</div>
                <div class="product-type">${texts.productType}</div>
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <span class="total-label">${texts.totalAmount}</span>
                    <span class="total-amount">${formattedAmount}</span>
                </div>
            </div>
        </div>
        
        <div class="receipt-footer">
            <div class="thank-you">${texts.thankYou}</div>
            <div class="footer-text">
                ${texts.footerLine1}<br>
                ${texts.footerLine2}
            </div>
        </div>
    </div>
    
    <button class="print-button" onclick="window.print()">
        ${texts.printButton}
    </button>
</body>
</html>`;
}

/**
 * Get localized texts for all 9 languages
 */
function getTexts(lang) {
    const translations = {
        ja: {
            title: '領収書',
            receiptNumber: '領収書番号',
            issueDate: '発行日',
            customerName: 'お客様名',
            paymentMethod: 'お支払い方法',
            transactionId: '取引ID',
            productName: '商品名',
            productPurchase: '作品購入',
            productType: '電子書籍',
            totalAmount: '合計金額',
            thankYou: 'ご購入ありがとうございます',
            footerLine1: 'AuctLect - 世界中の読者と作家をつなぐ',
            footerLine2: '© 2026 AuctLect. All rights reserved.',
            printButton: '印刷 / PDFとして保存'
        },
        en: {
            title: 'Receipt',
            receiptNumber: 'Receipt Number',
            issueDate: 'Date',
            customerName: 'Customer',
            paymentMethod: 'Payment Method',
            transactionId: 'Transaction ID',
            productName: 'Product',
            productPurchase: 'Work Purchase',
            productType: 'Digital Content',
            totalAmount: 'Total Amount',
            thankYou: 'Thank you for your purchase',
            footerLine1: 'AuctLect - Connecting readers and authors worldwide',
            footerLine2: '© 2026 AuctLect. All rights reserved.',
            printButton: 'Print / Save as PDF'
        },
        zh: {
            title: '收据',
            receiptNumber: '收据编号',
            issueDate: '日期',
            customerName: '客户名称',
            paymentMethod: '支付方式',
            transactionId: '交易ID',
            productName: '商品名称',
            productPurchase: '作品购买',
            productType: '电子书',
            totalAmount: '总金额',
            thankYou: '感谢您的购买',
            footerLine1: 'AuctLect - 连接全球读者与作者',
            footerLine2: '© 2026 AuctLect. 保留所有权利。',
            printButton: '打印 / 保存为PDF'
        },
        ko: {
            title: '영수증',
            receiptNumber: '영수증 번호',
            issueDate: '발행일',
            customerName: '고객명',
            paymentMethod: '결제 방법',
            transactionId: '거래 ID',
            productName: '상품명',
            productPurchase: '작품 구매',
            productType: '전자책',
            totalAmount: '총액',
            thankYou: '구매해 주셔서 감사합니다',
            footerLine1: 'AuctLect - 전 세계 독자와 작가를 연결',
            footerLine2: '© 2026 AuctLect. All rights reserved.',
            printButton: '인쇄 / PDF로 저장'
        },
        es: {
            title: 'Recibo',
            receiptNumber: 'Número de Recibo',
            issueDate: 'Fecha',
            customerName: 'Cliente',
            paymentMethod: 'Método de Pago',
            transactionId: 'ID de Transacción',
            productName: 'Producto',
            productPurchase: 'Compra de Obra',
            productType: 'Libro Digital',
            totalAmount: 'Monto Total',
            thankYou: 'Gracias por su compra',
            footerLine1: 'AuctLect - Conectando lectores y autores en todo el mundo',
            footerLine2: '© 2026 AuctLect. Todos los derechos reservados.',
            printButton: 'Imprimir / Guardar como PDF'
        },
        fr: {
            title: 'Reçu',
            receiptNumber: 'Numéro de Reçu',
            issueDate: 'Date',
            customerName: 'Client',
            paymentMethod: 'Mode de Paiement',
            transactionId: 'ID de Transaction',
            productName: 'Produit',
            productPurchase: 'Achat d\'œuvre',
            productType: 'Livre Numérique',
            totalAmount: 'Montant Total',
            thankYou: 'Merci pour votre achat',
            footerLine1: 'AuctLect - Connecter les lecteurs et les auteurs du monde entier',
            footerLine2: '© 2026 AuctLect. Tous droits réservés.',
            printButton: 'Imprimer / Enregistrer en PDF'
        },
        de: {
            title: 'Quittung',
            receiptNumber: 'Quittungsnummer',
            issueDate: 'Datum',
            customerName: 'Kunde',
            paymentMethod: 'Zahlungsmethode',
            transactionId: 'Transaktions-ID',
            productName: 'Produkt',
            productPurchase: 'Werk-Kauf',
            productType: 'E-Book',
            totalAmount: 'Gesamtbetrag',
            thankYou: 'Vielen Dank für Ihren Kauf',
            footerLine1: 'AuctLect - Leser und Autoren weltweit verbinden',
            footerLine2: '© 2026 AuctLect. Alle Rechte vorbehalten.',
            printButton: 'Drucken / Als PDF speichern'
        },
        ar: {
            title: 'إيصال',
            receiptNumber: 'رقم الإيصال',
            issueDate: 'التاريخ',
            customerName: 'العميل',
            paymentMethod: 'طريقة الدفع',
            transactionId: 'معرف المعاملة',
            productName: 'المنتج',
            productPurchase: 'شراء عمل',
            productType: 'كتاب إلكتروني',
            totalAmount: 'المبلغ الإجمالي',
            thankYou: 'شكراً لشرائك',
            footerLine1: 'AuctLect - ربط القراء والمؤلفين حول العالم',
            footerLine2: '© 2026 AuctLect. جميع الحقوق محفوظة.',
            printButton: 'طباعة / حفظ كـ PDF'
        },
        pt: {
            title: 'Recibo',
            receiptNumber: 'Número do Recibo',
            issueDate: 'Data',
            customerName: 'Cliente',
            paymentMethod: 'Método de Pagamento',
            transactionId: 'ID da Transação',
            productName: 'Produto',
            productPurchase: 'Compra de Obra',
            productType: 'Livro Digital',
            totalAmount: 'Valor Total',
            thankYou: 'Obrigado pela sua compra',
            footerLine1: 'AuctLect - Conectando leitores e autores em todo o mundo',
            footerLine2: '© 2026 AuctLect. Todos os direitos reservados.',
            printButton: 'Imprimir / Salvar como PDF'
        }
    };
    
    return translations[lang] || translations['ja'];
}

/**
 * Format date based on language
 */
function formatDate(date, lang) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const locales = {
        ja: 'ja-JP',
        en: 'en-US',
        zh: 'zh-CN',
        ko: 'ko-KR',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        ar: 'ar-SA',
        pt: 'pt-BR'
    };
    
    return date.toLocaleDateString(locales[lang] || 'ja-JP', options);
}

/**
 * Format amount based on currency and language
 */
function formatAmount(amount, currency = 'JPY', lang = 'ja') {
    const currencyFormats = {
        JPY: { symbol: '¥', decimals: 0 },
        USD: { symbol: '$', decimals: 2 },
        EUR: { symbol: '€', decimals: 2 },
        GBP: { symbol: '£', decimals: 2 },
        CNY: { symbol: '¥', decimals: 2 },
        KRW: { symbol: '₩', decimals: 0 }
    };
    
    const format = currencyFormats[currency] || currencyFormats['JPY'];
    const formattedNumber = Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: format.decimals,
        maximumFractionDigits: format.decimals
    });
    
    return `${format.symbol}${formattedNumber}`;
}

/**
 * Get payment method text for all 9 languages
 */
function getPaymentMethodText(method, lang) {
    const methods = {
        ja: {
            credit_card: 'クレジットカード',
            paypal: 'PayPal',
            stripe: 'Stripe',
            bank_transfer: '銀行振込',
            default: 'クレジットカード'
        },
        en: {
            credit_card: 'Credit Card',
            paypal: 'PayPal',
            stripe: 'Stripe',
            bank_transfer: 'Bank Transfer',
            default: 'Credit Card'
        },
        zh: {
            credit_card: '信用卡',
            paypal: 'PayPal',
            stripe: 'Stripe',
            bank_transfer: '银行转账',
            default: '信用卡'
        },
        ko: {
            credit_card: '신용카드',
            paypal: 'PayPal',
            stripe: 'Stripe',
            bank_transfer: '계좌이체',
            default: '신용카드'
        },
        es: {
            credit_card: 'Tarjeta de Crédito',
            paypal: 'PayPal',
            stripe: 'Stripe',
            bank_transfer: 'Transferencia Bancaria',
            default: 'Tarjeta de Crédito'
        },
        fr: {
            credit_card: 'Carte de Crédit',
            paypal: 'PayPal',
            stripe: 'Stripe',
            bank_transfer: 'Virement Bancaire',
            default: 'Carte de Crédit'
        },
        de: {
            credit_card: 'Kreditkarte',
            paypal: 'PayPal',
            stripe: 'Stripe',
            bank_transfer: 'Banküberweisung',
            default: 'Kreditkarte'
        },
        ar: {
            credit_card: 'بطاقة ائتمان',
            paypal: 'PayPal',
            stripe: 'Stripe',
            bank_transfer: 'تحويل بنكي',
            default: 'بطاقة ائتمان'
        },
        pt: {
            credit_card: 'Cartão de Crédito',
            paypal: 'PayPal',
            stripe: 'Stripe',
            bank_transfer: 'Transferência Bancária',
            default: 'Cartão de Crédito'
        }
    };
    
    const langMethods = methods[lang] || methods['ja'];
    const key = method?.toLowerCase().replace(/\s+/g, '_') || 'default';
    
    return langMethods[key] || langMethods['default'];
}

/**
 * Format customer name based on language conventions
 */
function formatCustomerName(firstName, lastName, lang) {
    if (!firstName && !lastName) {
        const defaults = {
            ja: 'お客様',
            en: 'Customer',
            zh: '客户',
            ko: '고객님',
            es: 'Cliente',
            fr: 'Client',
            de: 'Kunde',
            ar: 'العميل',
            pt: 'Cliente'
        };
        return defaults[lang] || defaults['en'];
    }
    
    // Japanese: Last name + First name + 様
    if (lang === 'ja') {
        const name = `${lastName || ''} ${firstName || ''}`.trim();
        return name ? `${name} 様` : 'お客様';
    }
    
    // Korean: Name + 님
    if (lang === 'ko') {
        const name = `${lastName || ''} ${firstName || ''}`.trim();
        return name ? `${name} 님` : '고객님';
    }
    
    // Chinese: Last name + First name
    if (lang === 'zh') {
        const name = `${lastName || ''} ${firstName || ''}`.trim();
        return name || '客户';
    }
    
    // Arabic: First name + Last name
    if (lang === 'ar') {
        const name = `${firstName || ''} ${lastName || ''}`.trim();
        return name || 'العميل';
    }
    
    // Western languages: First name + Last name
    const name = `${firstName || ''} ${lastName || ''}`.trim();
    return name || 'Customer';
}

module.exports = {
    generateReceiptHTML,
    getTexts,
    formatDate,
    formatAmount,
    getPaymentMethodText,
    formatCustomerName,
    getLanguageSettings
};
