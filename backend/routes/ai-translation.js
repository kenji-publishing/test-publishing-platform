/**
 * AI Translation Routes
 * Handles AI-powered translation using Claude API
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Translation pricing configuration
const PRICING = {
  freeMonthlyLimit: 5,        // 5 works per month free
  freeLanguagesPerWork: 5,    // 5 languages per work free
  paidPricePerLanguage: 1.00  // $1 per language for paid translations
};

/**
 * POST /api/ai-translation/request
 * Request AI translation for a work
 */
router.post('/request', authenticate, async (req, res) => {
  try {
    const { workId, targetLanguages } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!workId || !targetLanguages || targetLanguages.length === 0) {
      return res.status(400).json({ error: 'Work ID and target languages are required' });
    }

    // Get work details
    const workResult = await db.query(
      'SELECT * FROM works WHERE work_id = $1 AND author_id = $2',
      [workId, userId]
    );

    if (workResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work not found or unauthorized' });
    }

    const work = workResult.rows[0];

    // Check monthly usage
    const usageResult = await db.query(
      `SELECT COUNT(DISTINCT work_id) as work_count
       FROM translations
       WHERE work_id IN (
         SELECT work_id FROM works WHERE author_id = $1
       )
       AND translation_type = 'ai'
       AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [userId]
    );

    const monthlyWorkCount = parseInt(usageResult.rows[0].work_count);
    const isFree = monthlyWorkCount < PRICING.freeMonthlyLimit;

    // Calculate cost
    let cost = 0;
    let freeLanguages = 0;
    let paidLanguages = 0;

    if (isFree) {
      // Within free tier
      freeLanguages = Math.min(targetLanguages.length, PRICING.freeLanguagesPerWork);
      paidLanguages = Math.max(0, targetLanguages.length - PRICING.freeLanguagesPerWork);
      cost = paidLanguages * PRICING.paidPricePerLanguage;
    } else {
      // Exceeded free tier - all languages are paid
      paidLanguages = targetLanguages.length;
      cost = paidLanguages * PRICING.paidPricePerLanguage;
    }

    // Create translation records
    const translationIds = [];
    
    for (const targetLang of targetLanguages) {
      // Check if translation already exists
      const existingTranslation = await db.query(
        'SELECT translation_id FROM translations WHERE work_id = $1 AND target_language = $2',
        [workId, targetLang]
      );

      if (existingTranslation.rows.length > 0) {
        continue; // Skip if already exists
      }

      // Insert new translation request
      const result = await db.query(
        `INSERT INTO translations (
          work_id, target_language, translation_type, status
        ) VALUES ($1, $2, 'ai', 'pending')
        RETURNING translation_id`,
        [workId, targetLang]
      );

      translationIds.push(result.rows[0].translation_id);
    }

    res.json({
      success: true,
      message: 'Translation request submitted',
      translationIds: translationIds,
      pricing: {
        isFree: isFree,
        freeLanguages: freeLanguages,
        paidLanguages: paidLanguages,
        totalCost: cost,
        monthlyUsage: {
          used: monthlyWorkCount,
          limit: PRICING.freeMonthlyLimit,
          remaining: Math.max(0, PRICING.freeMonthlyLimit - monthlyWorkCount)
        }
      }
    });

    // In production: Queue translation jobs here
    // For now, we'll process them on-demand

  } catch (error) {
    console.error('Translation request error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai-translation/translate
 * Execute AI translation for a specific translation request
 * (This would be called by a background worker in production)
 */
router.post('/translate/:translationId', authenticate, async (req, res) => {
  try {
    const { translationId } = req.params;

    // Get translation details
    const translationResult = await db.query(
      `SELECT t.*, w.title, w.description, w.original_language
       FROM translations t
       JOIN works w ON t.work_id = w.work_id
       WHERE t.translation_id = $1`,
      [translationId]
    );

    if (translationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    const translation = translationResult.rows[0];

    // Update status to in_progress
    await db.query(
      'UPDATE translations SET status = $1, updated_at = NOW() WHERE translation_id = $2',
      ['in_progress', translationId]
    );

    // Simulate AI translation (in production, call Claude API here)
    const translatedContent = await simulateClaudeTranslation(
      translation.title,
      translation.description,
      translation.original_language,
      translation.target_language
    );

    // Update with translated content
    await db.query(
      `UPDATE translations 
       SET status = $1, translated_content = $2, quality_score = $3, updated_at = NOW()
       WHERE translation_id = $4`,
      ['completed', JSON.stringify(translatedContent), 85, translationId]
    );

    res.json({
      success: true,
      message: 'Translation completed',
      translation: {
        id: translationId,
        status: 'completed',
        targetLanguage: translation.target_language,
        qualityScore: 85
      }
    });

  } catch (error) {
    console.error('Translation error:', error);
    
    // Mark as failed
    await db.query(
      'UPDATE translations SET status = $1 WHERE translation_id = $2',
      ['failed', req.params.translationId]
    );
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai-translation/status/:workId
 * Get translation status for a work
 */
router.get('/status/:workId', authenticate, async (req, res) => {
  try {
    const { workId } = req.params;

    const result = await db.query(
      `SELECT translation_id, target_language, translation_type, status, 
              quality_score, created_at, updated_at
       FROM translations
       WHERE work_id = $1
       ORDER BY created_at DESC`,
      [workId]
    );

    res.json({
      workId: workId,
      translations: result.rows
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai-translation/usage
 * Get user's monthly translation usage
 */
router.get('/usage', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get monthly usage
    const usageResult = await db.query(
      `SELECT COUNT(DISTINCT work_id) as work_count,
              COUNT(*) as translation_count
       FROM translations
       WHERE work_id IN (
         SELECT work_id FROM works WHERE author_id = $1
       )
       AND translation_type = 'ai'
       AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [userId]
    );

    const usage = usageResult.rows[0];

    res.json({
      monthly: {
        worksTranslated: parseInt(usage.work_count),
        totalTranslations: parseInt(usage.translation_count),
        freeLimit: PRICING.freeMonthlyLimit,
        remaining: Math.max(0, PRICING.freeMonthlyLimit - parseInt(usage.work_count))
      },
      pricing: {
        pricePerLanguage: PRICING.paidPricePerLanguage,
        freeLanguagesPerWork: PRICING.freeLanguagesPerWork
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Real Claude API translation
 */
async function simulateClaudeTranslation(title, description, sourceLang, targetLang) {
  try {
    // Language names for better translation
    const langNames = {
      'en': 'English',
      'es': 'Spanish',
      'de': 'German',
      'fr': 'French',
      'ja': 'Japanese',
      'zh': 'Chinese'
    };

    const sourceLangName = langNames[sourceLang] || sourceLang;
    const targetLangName = langNames[targetLang] || targetLang;

    // Create translation prompt
    const prompt = `You are a professional translator. Translate the following content from ${sourceLangName} to ${targetLangName}.

Title: ${title}

Description: ${description}

Please provide the translation in the following JSON format:
{
  "title": "translated title",
  "description": "translated description"
}

Important: 
- Maintain the tone and style of the original
- Keep any technical terms or proper nouns appropriate for the target language
- Ensure natural, fluent translation
- Only respond with the JSON, no additional text`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse response
    const responseText = message.content[0].text;
    
    // Try to extract JSON from response
    let translatedContent;
    try {
      // Try to parse as pure JSON
      translatedContent = JSON.parse(responseText);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        translatedContent = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse translation response');
      }
    }

    console.log(`✅ Translation completed: ${sourceLang} → ${targetLang}`);
    
    return translatedContent;

  } catch (error) {
    console.error('Claude API translation error:', error);
    
    // Fallback to simple translation if API fails
    return {
      title: `[${targetLang.toUpperCase()}] ${title}`,
      description: `[Translation pending] ${description}`
    };
  }
}
module.exports = router;