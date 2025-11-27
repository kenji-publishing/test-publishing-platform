/**
 * Content Moderation Module
 * Uses OpenAI Moderation API + Custom Word Filter
 */

// Prohibited words list (customize as needed)
const PROHIBITED_WORDS = [
    // Add specific prohibited words here
    // These are examples - customize for your platform
];

// Severity levels
const SEVERITY = {
    SAFE: 'safe',
    WARNING: 'warning',
    BLOCKED: 'blocked'
};

// Thresholds for OpenAI categories
const THRESHOLDS = {
    'hate': 0.7,
    'hate/threatening': 0.5,
    'harassment': 0.7,
    'harassment/threatening': 0.5,
    'self-harm': 0.5,
    'self-harm/intent': 0.5,
    'self-harm/instructions': 0.5,
    'sexual': 0.8,
    'sexual/minors': 0.001,  // Very low threshold - almost zero tolerance
    'violence': 0.8,
    'violence/graphic': 0.7
};

// Categories that require adult content marking
const ADULT_CATEGORIES = ['sexual', 'violence/graphic'];

// Categories that result in immediate block
const BLOCK_CATEGORIES = ['sexual/minors', 'hate/threatening', 'harassment/threatening', 'self-harm/instructions'];

/**
 * Check text using OpenAI Moderation API
 */
async function checkWithOpenAI(text) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.warn('OpenAI API key not configured, skipping AI moderation');
        return { flagged: false, categories: {}, scores: {} };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                input: text
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.results[0];
    } catch (error) {
        console.error('OpenAI Moderation API error:', error);
        // Return safe result on error (fail open for availability)
        return { flagged: false, categories: {}, category_scores: {} };
    }
}

/**
 * Check text against prohibited words list
 */
function checkProhibitedWords(text) {
    const lowerText = text.toLowerCase();
    const foundWords = [];

    for (const word of PROHIBITED_WORDS) {
        if (lowerText.includes(word.toLowerCase())) {
            foundWords.push(word);
        }
    }

    return {
        found: foundWords.length > 0,
        words: foundWords
    };
}

/**
 * Main moderation function
 * @param {string} text - Text to moderate
 * @param {object} options - Options { checkAdult: true, strictMode: false }
 * @returns {object} Moderation result
 */
async function moderateContent(text, options = {}) {
    const { checkAdult = true, strictMode = false } = options;

    const result = {
        approved: true,
        severity: SEVERITY.SAFE,
        requiresAdultTag: false,
        flags: [],
        details: {}
    };

    // Skip empty text
    if (!text || text.trim().length === 0) {
        return result;
    }

    // Step 1: Check prohibited words
    const wordCheck = checkProhibitedWords(text);
    if (wordCheck.found) {
        result.approved = false;
        result.severity = SEVERITY.BLOCKED;
        result.flags.push('prohibited_words');
        result.details.prohibitedWords = wordCheck.words;
        return result;
    }

    // Step 2: Check with OpenAI Moderation API
    const aiResult = await checkWithOpenAI(text);
    result.details.openai = {
        flagged: aiResult.flagged,
        scores: aiResult.category_scores || {}
    };

    if (aiResult.flagged) {
        const scores = aiResult.category_scores || {};

        // Check each category against thresholds
        for (const [category, threshold] of Object.entries(THRESHOLDS)) {
            const score = scores[category] || 0;

            if (score >= threshold) {
                // Check if it's a block category
                if (BLOCK_CATEGORIES.includes(category)) {
                    result.approved = false;
                    result.severity = SEVERITY.BLOCKED;
                    result.flags.push(category);
                }
                // Check if it requires adult tag
                else if (ADULT_CATEGORIES.includes(category) && checkAdult) {
                    result.requiresAdultTag = true;
                    result.flags.push(category);
                    if (result.severity === SEVERITY.SAFE) {
                        result.severity = SEVERITY.WARNING;
                    }
                }
                // Other flagged categories
                else {
                    result.flags.push(category);
                    if (strictMode) {
                        result.approved = false;
                        result.severity = SEVERITY.BLOCKED;
                    } else {
                        result.severity = SEVERITY.WARNING;
                    }
                }
            }
        }
    }

    return result;
}

/**
 * Moderate a work submission (title + description + content)
 */
async function moderateWork(work) {
    const { title, description, content } = work;

    // Check all parts
    const titleResult = await moderateContent(title, { strictMode: true });
    const descResult = await moderateContent(description);
    const contentResult = await moderateContent(content);

    // Combine results
    const combined = {
        approved: titleResult.approved && descResult.approved && contentResult.approved,
        requiresAdultTag: titleResult.requiresAdultTag || descResult.requiresAdultTag || contentResult.requiresAdultTag,
        severity: SEVERITY.SAFE,
        flags: [],
        details: {
            title: titleResult,
            description: descResult,
            content: contentResult
        }
    };

    // Determine overall severity
    const severities = [titleResult.severity, descResult.severity, contentResult.severity];
    if (severities.includes(SEVERITY.BLOCKED)) {
        combined.severity = SEVERITY.BLOCKED;
    } else if (severities.includes(SEVERITY.WARNING)) {
        combined.severity = SEVERITY.WARNING;
    }

    // Combine flags
    combined.flags = [
        ...titleResult.flags.map(f => `title:${f}`),
        ...descResult.flags.map(f => `description:${f}`),
        ...contentResult.flags.map(f => `content:${f}`)
    ];

    return combined;
}

/**
 * Quick check for user-generated content (comments, reviews)
 */
async function moderateUserContent(text) {
    return await moderateContent(text, { strictMode: true });
}

module.exports = {
    moderateContent,
    moderateWork,
    moderateUserContent,
    SEVERITY,
    THRESHOLDS
};