/**
 * AI Assistant Routes
 * API endpoints for the Rufus-style AI assistant
 */

const express = require('express');
const router = express.Router();

const { processQuery, getSuggestedActions } = require('../ai/assistant');

// =================== MIDDLEWARE ===================

// Optional: Import auth middleware if you want protected routes
// const authenticateToken = require('../middleware/auth.middleware');

// =================== ROUTES ===================

/**
 * POST /assistant/query
 * Process a natural language query about resume/ATS
 * 
 * Body:
 * - query: string (required) - User's question
 * - analysisResult: object (optional) - ATS analysis result
 */
router.post('/query', async (req, res) => {
    try {
        const { query, analysisResult } = req.body;

        // Validate query
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Query is required and must be a string'
            });
        }

        // Limit query length
        if (query.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Query is too long. Please keep it under 500 characters.'
            });
        }

        // Process query through AI assistant
        const response = await processQuery(query, analysisResult || null);

        res.json(response);

    } catch (error) {
        console.error('Assistant query error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process query',
            message: 'An unexpected error occurred. Please try again.'
        });
    }
});

/**
 * POST /assistant/suggestions
 * Get suggested quick actions based on ATS result
 * 
 * Body:
 * - analysisResult: object (optional) - ATS analysis result
 */
router.post('/suggestions', async (req, res) => {
    try {
        const { analysisResult } = req.body;

        const suggestions = getSuggestedActions(analysisResult || null);

        res.json({
            success: true,
            suggestions
        });

    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get suggestions'
        });
    }
});

/**
 * GET /assistant/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'active',
        version: '1.0.0',
        capabilities: [
            'SCORE_EXPLANATION',
            'SKILLS_GAP',
            'JD_MATCH',
            'EXPERIENCE_IMPROVE',
            'KEYWORD_SUGGESTION',
            'FORMATTING_FEEDBACK',
            'RESUME_REWRITE'
        ]
    });
});

module.exports = router;
