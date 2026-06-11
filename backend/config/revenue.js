/**
 * Revenue Share Configuration and Calculator
 * 
 * Rules:
 * - Platform always takes 30%
 * - Remaining 70% split by roles:
 *   - Author (base): 40%
 *   - Translator: 20%
 *   - Editor: 10%
 * - When author takes multiple roles, shares are combined
 */

const crypto = require('crypto');

// Fixed revenue shares
const REVENUE_SHARES = {
    PLATFORM: 30,
    AUTHOR: 40,
    TRANSLATOR: 20,
    EDITOR: 10
};

// Scenarios with pre-calculated shares
const SHARE_SCENARIOS = {
    // Original language, author only (author + translator + editor roles)
    'original_author_only': {
        description: 'Original language, author handles everything',
        shares: {
            author: 70,  // 40 + 20 + 10
            platform: 30
        }
    },
    // Original language, author + separate editor
    'original_with_editor': {
        description: 'Original language with separate editor',
        shares: {
            author: 60,  // 40 + 20 (author + translator roles)
            editor: 10,
            platform: 30
        }
    },
    // Translated, author + translator (author also edits)
    'translated_author_edits': {
        description: 'Translated work, author also edits',
        shares: {
            author: 50,  // 40 + 10 (author + editor roles)
            translator: 20,
            platform: 30
        }
    },
    // Translated, all separate roles
    'translated_full_team': {
        description: 'Translated work with full team',
        shares: {
            author: 40,
            translator: 20,
            editor: 10,
            platform: 30
        }
    }
};

/**
 * Calculate revenue shares based on collaborators
 * @param {object} config - Configuration object
 * @param {boolean} config.isTranslated - Whether this is a translated work
 * @param {boolean} config.hasTranslator - Whether there's a separate translator
 * @param {boolean} config.hasEditor - Whether there's a separate editor
 * @returns {object} Share percentages for each role
 */
function calculateShares(config) {
    const { isTranslated = false, hasTranslator = false, hasEditor = false } = config;

    const shares = {
        author: REVENUE_SHARES.AUTHOR,
        translator: 0,
        editor: 0,
        platform: REVENUE_SHARES.PLATFORM
    };

    if (isTranslated) {
        // Translated work
        if (hasTranslator) {
            shares.translator = REVENUE_SHARES.TRANSLATOR;
        } else {
            // Author is also translator
            shares.author += REVENUE_SHARES.TRANSLATOR;
        }

        if (hasEditor) {
            shares.editor = REVENUE_SHARES.EDITOR;
        } else {
            // Author is also editor
            shares.author += REVENUE_SHARES.EDITOR;
        }
    } else {
        // Original language work
        // Author takes translator share (since no translation needed)
        shares.author += REVENUE_SHARES.TRANSLATOR;

        if (hasEditor) {
            shares.editor = REVENUE_SHARES.EDITOR;
        } else {
            // Author is also editor
            shares.author += REVENUE_SHARES.EDITOR;
        }
    }

    return shares;
}

/**
 * Calculate actual revenue amounts
 * @param {number} totalRevenue - Total revenue amount
 * @param {object} shares - Share percentages
 * @returns {object} Actual amounts for each role
 */
function calculateAmounts(totalRevenue, shares) {
    const amounts = {};
    
    for (const [role, percentage] of Object.entries(shares)) {
        if (percentage > 0) {
            amounts[role] = Math.round((totalRevenue * percentage / 100) * 100) / 100;
        }
    }

    return amounts;
}

/**
 * Generate agreement terms JSON
 * @param {object} config - Agreement configuration
 * @returns {object} Agreement terms
 */
function generateAgreementTerms(config) {
    const {
        workId,
        workTitle,
        originalLanguage,
        targetLanguages = [],
        collaborators = [],
        isTranslated = false,
        hasTranslator = false,
        hasEditor = false
    } = config;

    const shares = calculateShares({ isTranslated, hasTranslator, hasEditor });

    const terms = {
        version: '1.0',
        workId,
        workTitle,
        originalLanguage,
        targetLanguages,
        isTranslated,
        revenueShares: shares,
        collaborators: collaborators.map(c => ({
            userId: c.userId,
            email: c.email,
            name: c.name,
            role: c.role,
            languageCode: c.languageCode || null,
            share: shares[c.role] || 0
        })),
        platformShare: REVENUE_SHARES.PLATFORM,
        terms: [
            'Revenue is calculated monthly based on sales',
            'Payments are processed within 30 days of month end',
            'Minimum payout threshold is $10 USD',
            'All parties must agree to any changes in revenue split',
            'Work deletion requires 30 days notice to all collaborators',
            'Disputes will be resolved through AuctLect mediation'
        ],
        createdAt: new Date().toISOString()
    };

    return terms;
}

/**
 * Generate agreement hash for integrity verification
 * @param {object} terms - Agreement terms
 * @returns {string} SHA-256 hash
 */
function generateAgreementHash(terms) {
    const termsString = JSON.stringify(terms);
    return crypto.createHash('sha256').update(termsString).digest('hex');
}

/**
 * Generate signature hash
 * @param {object} data - Signature data
 * @returns {string} SHA-256 hash
 */
function generateSignatureHash(data) {
    const { agreementId, userId, signedAt, ipAddress } = data;
    const signatureString = `${agreementId}-${userId}-${signedAt}-${ipAddress}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
}

/**
 * Validate that shares add up to 100%
 * @param {object} shares - Share percentages
 * @returns {boolean} Whether shares are valid
 */
function validateShares(shares) {
    const total = Object.values(shares).reduce((sum, val) => sum + val, 0);
    return Math.abs(total - 100) < 0.01; // Allow small floating point errors
}

/**
 * Get scenario key based on configuration
 * @param {object} config - Configuration
 * @returns {string} Scenario key
 */
function getScenarioKey(config) {
    const { isTranslated, hasTranslator, hasEditor } = config;

    if (!isTranslated) {
        return hasEditor ? 'original_with_editor' : 'original_author_only';
    } else {
        if (hasTranslator && hasEditor) {
            return 'translated_full_team';
        } else if (hasTranslator) {
            return 'translated_author_edits';
        } else {
            return 'original_author_only'; // Fallback
        }
    }
}

/**
 * Format shares for display
 * @param {object} shares - Share percentages
 * @returns {string} Formatted string
 */
function formatSharesForDisplay(shares) {
    const parts = [];
    
    if (shares.author) parts.push(`Author: ${shares.author}%`);
    if (shares.translator) parts.push(`Translator: ${shares.translator}%`);
    if (shares.editor) parts.push(`Editor: ${shares.editor}%`);
    if (shares.platform) parts.push(`Platform: ${shares.platform}%`);
    
    return parts.join(' | ');
}

module.exports = {
    REVENUE_SHARES,
    SHARE_SCENARIOS,
    calculateShares,
    calculateAmounts,
    generateAgreementTerms,
    generateAgreementHash,
    generateSignatureHash,
    validateShares,
    getScenarioKey,
    formatSharesForDisplay
};