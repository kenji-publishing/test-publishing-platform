/**
 * Content Moderation Module
 * Uses OpenAI Moderation API + Custom Word Filter
 * 
 * Philosophy:
 * - AI flags content for human review
 * - Only absolute violations (child safety) are auto-blocked
 * - Fiction/creative works are treated with tolerance
 * - Final decisions are made by human moderators
 */

// Prohibited words list (customize as needed)
const PROHIBITED_WORDS = [
    // Add specific prohibited words here if needed
];

// Severity levels
const SEVERITY = {
    SAFE: 'safe',
    REVIEW: 'review',      // Needs human review
    WARNING: 'warning',    // Warning shown to user
    BLOCKED: 'blocked'     // Auto-blocked (only for absolute violations)
};

// Review status
const REVIEW_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

// Thresholds - RAISED for fiction tolerance
// Scale: 0.0 to 1.0 (higher = more tolerant)
const THRESHOLDS = {
    'hate': 0.85,
    'hate/threatening': 0.80,
    'harassment': 0.85,
    'harassment/threatening': 0.80,
    'self-harm': 0.75,
    'self-harm/intent': 0.70,
    'self-harm/instructions': 0.60,
    'sexual': 0.90,
    'sexual/minors': 0.001,  // ZERO tolerance - auto-block
    'violence': 0.90,
    'violence/graphic': 0.85
};

// Categories that AUTO-BLOCK (absolute violations only)
const AUTO_BLOCK_CATEGORIES = [
    'sexual/minors'  // Only this is auto-blocked
];

// Categories that require adult content marking
const ADULT_TAG_CATEGORIES = [
    'sexual',
    'violence/graphic'
];

// Categories that trigger human review (NOT auto-block)
const REVIEW_CATEGORIES = [
    'hate',
    'hate/threatening',
    'harassment',
    'harassment/threatening',
    'self-harm',
    'self-harm/intent',
    'self-harm/instructions',
    'violence'
];

/**
 * Check text using OpenAI Moderation API
 */
async function checkWithOpenAI(text) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.warn('OpenAI API key not configured, skipping AI moderation');
        return { flagged: false, categories: {}, category_scores: {} };
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
 * @param {object} options - Options { genre: 'general', isComment: false }
 * @returns {object} Moderation result
 */
async function moderateContent(text, options = {}) {
    const { genre = 'general', isComment = false } = options;

    const result = {
        approved: true,
        severity: SEVERITY.SAFE,
        requiresAdultTag: false,
        requiresReview: false,
        autoBlocked: false,
        flags: [],
        flagDetails: [],
        reviewReason: null,
        details: {}
    };

    // Skip empty text
    if (!text || text.trim().length === 0) {
        return result;
    }

    // Step 1: Check prohibited words
    const wordCheck = checkProhibitedWords(text);
    if (wordCheck.found) {
        result.requiresReview = true;
        result.severity = SEVERITY.REVIEW;
        result.flags.push('prohibited_words');
        result.flagDetails.push({
            category: 'prohibited_words',
            reason: 'Contains prohibited words',
            words: wordCheck.words
        });
        result.reviewReason = 'Prohibited words detected';
    }

    // Step 2: Check with OpenAI Moderation API
    const aiResult = await checkWithOpenAI(text);
    result.details.openai = {
        flagged: aiResult.flagged,
        scores: aiResult.category_scores || {}
    };

    if (aiResult.flagged || aiResult.category_scores) {
        const scores = aiResult.category_scores || {};

        for (const [category, threshold] of Object.entries(THRESHOLDS)) {
            const score = scores[category] || 0;

            if (score >= threshold) {
                const scorePercent = Math.round(score * 100);

                // Check if it's an AUTO-BLOCK category (only sexual/minors)
                if (AUTO_BLOCK_CATEGORIES.includes(category)) {
                    result.approved = false;
                    result.autoBlocked = true;
                    result.severity = SEVERITY.BLOCKED;
                    result.flags.push(category);
                    result.flagDetails.push({
                        category: category,
                        score: scorePercent,
                        reason: 'Absolute violation - auto-blocked',
                        action: 'blocked'
                    });
                    // Return immediately for auto-block
                    return result;
                }

                // Check if it requires adult tag
                if (ADULT_TAG_CATEGORIES.includes(category)) {
                    result.requiresAdultTag = true;
                    result.flags.push(category);
                    result.flagDetails.push({
                        category: category,
                        score: scorePercent,
                        reason: 'Adult content detected - requires 18+ tag',
                        action: 'adult_tag'
                    });
                    if (result.severity === SEVERITY.SAFE) {
                        result.severity = SEVERITY.WARNING;
                    }
                }

                // Check if it requires human review
                if (REVIEW_CATEGORIES.includes(category)) {
                    result.requiresReview = true;
                    result.flags.push(category);
                    result.flagDetails.push({
                        category: category,
                        score: scorePercent,
                        reason: 'Flagged for human review',
                        action: 'review'
                    });
                    if (result.severity === SEVERITY.SAFE || result.severity === SEVERITY.WARNING) {
                        result.severity = SEVERITY.REVIEW;
                    }
                    if (!result.reviewReason) {
                        result.reviewReason = `Flagged: ${category} (${scorePercent}%)`;
                    }
                }
            }
        }
    }

    // Comments are stricter (user-generated, not fiction)
    if (isComment && result.requiresReview) {
        result.approved = false;
        result.severity = SEVERITY.REVIEW;
    }

    return result;
}

/**
 * Moderate a work submission (title + description + content)
 */
async function moderateWork(work) {
    const { title, description, content, genre } = work;

    const options = { genre: genre || 'general', isComment: false };

    // Check all parts
    const titleResult = await moderateContent(title, options);
    const descResult = await moderateContent(description, options);
    const contentResult = await moderateContent(content, options);

    // If any part is auto-blocked, block the whole work
    if (titleResult.autoBlocked || descResult.autoBlocked || contentResult.autoBlocked) {
        return {
            approved: false,
            autoBlocked: true,
            severity: SEVERITY.BLOCKED,
            requiresAdultTag: false,
            requiresReview: false,
            flags: ['auto_blocked'],
            message: 'Content automatically blocked due to policy violation',
            details: { title: titleResult, description: descResult, content: contentResult }
        };
    }

    // Combine results
    const combined = {
        approved: true,  // Works are approved by default, pending review
        autoBlocked: false,
        requiresAdultTag: titleResult.requiresAdultTag || descResult.requiresAdultTag || contentResult.requiresAdultTag,
        requiresReview: titleResult.requiresReview || descResult.requiresReview || contentResult.requiresReview,
        severity: SEVERITY.SAFE,
        flags: [],
        flagDetails: [],
        reviewReason: null,
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
        combined.approved = false;
    } else if (severities.includes(SEVERITY.REVIEW)) {
        combined.severity = SEVERITY.REVIEW;
        // Still approved, but flagged for review
    } else if (severities.includes(SEVERITY.WARNING)) {
        combined.severity = SEVERITY.WARNING;
    }

    // Combine flags
    combined.flags = [
        ...titleResult.flags.map(f => `title:${f}`),
        ...descResult.flags.map(f => `description:${f}`),
        ...contentResult.flags.map(f => `content:${f}`)
    ];

    // Combine flag details
    combined.flagDetails = [
        ...titleResult.flagDetails.map(d => ({ ...d, location: 'title' })),
        ...descResult.flagDetails.map(d => ({ ...d, location: 'description' })),
        ...contentResult.flagDetails.map(d => ({ ...d, location: 'content' }))
    ];

    // Set review reason
    if (combined.requiresReview) {
        combined.reviewReason = titleResult.reviewReason || descResult.reviewReason || contentResult.reviewReason;
    }

    // Generate message
    if (combined.requiresReview && combined.requiresAdultTag) {
        combined.message = 'Content flagged for review. Adult tag required if approved.';
    } else if (combined.requiresReview) {
        combined.message = 'Content flagged for human review before publication.';
    } else if (combined.requiresAdultTag) {
        combined.message = 'Content approved. Adult (18+) tag required.';
    } else {
        combined.message = 'Content approved.';
    }

    return combined;
}

/**
 * Quick check for user-generated content (comments, reviews)
 * More strict than work content
 */
async function moderateUserContent(text) {
    return await moderateContent(text, { isComment: true });
}

/**
 * Get human-readable explanation for flags
 */
function explainFlags(flags) {
    const explanations = {
        'hate': 'Potential hate speech detected',
        'hate/threatening': 'Threatening hate speech detected',
        'harassment': 'Potential harassment detected',
        'harassment/threatening': 'Threatening harassment detected',
        'self-harm': 'Self-harm related content detected',
        'self-harm/intent': 'Self-harm intent detected',
        'self-harm/instructions': 'Self-harm instructions detected',
        'sexual': 'Sexual content detected (adult tag required)',
        'sexual/minors': 'BLOCKED: Illegal content',
        'violence': 'Violent content detected',
        'violence/graphic': 'Graphic violence detected (adult tag required)',
        'prohibited_words': 'Prohibited words detected'
    };

    return flags.map(flag => {
        const cleanFlag = flag.replace(/^(title|description|content):/, '');
        return explanations[cleanFlag] || `Unknown flag: ${flag}`;
    });
}

module.exports = {
    moderateContent,
    moderateWork,
    moderateUserContent,
    explainFlags,
    SEVERITY,
    REVIEW_STATUS,
    THRESHOLDS
};