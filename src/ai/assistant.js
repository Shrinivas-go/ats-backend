/**
 * AI Assistant Orchestrator
 * Main entry point for the Rufus-style AI assistant
 * 
 * Coordinates all 5 layers of the AI system
 */

const { analyzeQuery } = require('./intents');
const { buildContext } = require('./retrieval/contextBuilder');
const { decide } = require('./engine/decisionEngine');
const { generateResponse, generateDomainRefusalResponse, generateClarificationResponse } = require('./responses/generator');

// =================== DOMAIN REFUSAL MESSAGE ===================
const DOMAIN_REFUSAL = {
    success: false,
    type: 'DOMAIN_REFUSAL',
    message: `I can only assist with resume analysis and ATS optimization.

**Try asking:**
• "Why is my score low?"
• "What skills am I missing?"
• "How can I improve my experience section?"
• "How well do I match this job?"`,
    suggestions: [
        'Why is my score low?',
        'What skills am I missing?',
        'How can I improve my experience section?'
    ]
};

// =================== MAIN PROCESSOR ===================

/**
 * Process a user query through the AI assistant pipeline
 * 
 * Pipeline:
 * 1. Domain validation - reject off-topic queries
 * 2. Intent detection - classify the query
 * 3. Context retrieval - get relevant ATS data
 * 4. Decision engine - prioritize recommendations
 * 5. Response generation - template-based output
 * 
 * @param {string} query - User's natural language query
 * @param {Object} atsResult - ATS analysis result (optional)
 * @returns {Object} - Assistant response
 */
async function processQuery(query, atsResult = null) {
    // Validate input
    if (!query || typeof query !== 'string') {
        return {
            success: false,
            type: 'ERROR',
            message: 'Please enter a valid question.'
        };
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
        return {
            success: false,
            type: 'ERROR',
            message: 'Please enter a question about your resume or ATS score.'
        };
    }

    // Step 1: Analyze query (domain validation + intent detection)
    const intentResult = analyzeQuery(trimmedQuery);

    // Handle domain refusal
    if (!intentResult.isValid) {
        return DOMAIN_REFUSAL;
    }

    // Handle clarification needed
    if (intentResult.needsClarification) {
        return {
            success: true,
            type: 'CLARIFICATION',
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            message: intentResult.clarificationQuestion,
            possibleIntents: intentResult.possibleIntents || []
        };
    }

    // Check if we have ATS data for context
    if (!atsResult && requiresATSData(intentResult.intent)) {
        return {
            success: false,
            type: 'MISSING_DATA',
            message: 'I need your ATS analysis results to answer this question. Please upload your resume and run an analysis first.',
            intent: intentResult.intent
        };
    }

    // Step 2: Build context based on intent
    const context = buildContext(atsResult || {}, intentResult.intent, trimmedQuery);

    // Handle context errors
    if (context.type === 'ERROR') {
        return {
            success: false,
            type: 'ERROR',
            message: context.error
        };
    }

    // Step 3: Make decisions (prioritize, analyze)
    const decision = decide(context, intentResult.intent);

    // Step 4: Generate response
    const response = generateResponse(intentResult.intent, context, decision);

    // Step 5: Check if LLM polishing is needed (RESUME_REWRITE only)
    const needsLLM = intentResult.intent === 'RESUME_REWRITE' && decision.requiresLLM;

    return {
        success: true,
        type: 'RESPONSE',
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        message: response,
        needsLLM,
        context: {
            type: context.type,
            overallScore: context.overallScore || null
        }
    };
}

/**
 * Check if intent requires ATS data
 */
function requiresATSData(intent) {
    const dataRequiredIntents = [
        'SCORE_EXPLANATION',
        'SKILLS_GAP',
        'JD_MATCH',
        'EXPERIENCE_IMPROVE',
        'KEYWORD_SUGGESTION',
        'FORMATTING_FEEDBACK'
    ];

    return dataRequiredIntents.includes(intent);
}

// =================== QUICK ACTIONS ===================

/**
 * Get suggested quick actions based on ATS result
 */
function getSuggestedActions(atsResult) {
    if (!atsResult) {
        return [
            { action: 'Upload resume for analysis', query: null }
        ];
    }

    const actions = [];

    // Always show score explanation
    actions.push({
        label: 'Explain my score',
        query: 'Why is my score what it is?'
    });

    // Show skills gap if missing skills exist
    if (atsResult.missingCoreSkills?.length > 0) {
        actions.push({
            label: 'Show missing skills',
            query: 'What skills am I missing?'
        });
    }

    // Show keyword suggestions
    actions.push({
        label: 'Suggest keywords',
        query: 'What keywords should I add?'
    });

    // Show improvement tips for low scores
    if (atsResult.atsScore < 70) {
        actions.push({
            label: 'How to improve',
            query: 'How can I improve my experience section?'
        });
    }

    return actions.slice(0, 4);
}

// =================== EXPORTS ===================

module.exports = {
    processQuery,
    getSuggestedActions,
    requiresATSData,
    DOMAIN_REFUSAL
};
