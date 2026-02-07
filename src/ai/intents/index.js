/**
 * Intent Detection Module
 * Deterministic intent classification using pattern matching
 * 
 * NO machine learning - rule-based only
 */

const {
    DOMAIN_KEYWORDS,
    INTENT_PATTERNS,
    OFF_TOPIC_INDICATORS,
    AMBIGUOUS_PATTERNS
} = require('./patterns');

// =================== CONFIDENCE THRESHOLD ===================
const CONFIDENCE_THRESHOLD = 0.6;
const DOMAIN_THRESHOLD = 0.3;

// =================== DOMAIN VALIDATION ===================
/**
 * Check if query is within the resume/ATS domain
 * @param {string} query - User query
 * @returns {Object} - { isValid, confidence, reason }
 */
function validateDomain(query) {
    const normalizedQuery = query.toLowerCase().trim();

    // Check for explicit off-topic indicators
    for (const pattern of OFF_TOPIC_INDICATORS) {
        if (pattern.test(normalizedQuery)) {
            return {
                isValid: false,
                confidence: 0,
                reason: 'OFF_TOPIC'
            };
        }
    }

    // Count domain keywords present
    let domainKeywordCount = 0;
    for (const keyword of DOMAIN_KEYWORDS) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
            domainKeywordCount++;
        }
    }

    // Calculate domain relevance
    const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
    const domainConfidence = words.length > 0
        ? Math.min(domainKeywordCount / Math.max(words.length * 0.3, 1), 1)
        : 0;

    return {
        isValid: domainConfidence >= DOMAIN_THRESHOLD || domainKeywordCount >= 1,
        confidence: domainConfidence,
        reason: domainConfidence >= DOMAIN_THRESHOLD ? 'DOMAIN_MATCH' : 'LOW_RELEVANCE'
    };
}

// =================== INTENT DETECTION ===================
/**
 * Detect intent from user query
 * @param {string} query - User query
 * @returns {Object} - { intent, confidence, needsClarification }
 */
function detectIntent(query) {
    const normalizedQuery = query.toLowerCase().trim();

    // Check for ambiguous queries first
    for (const pattern of AMBIGUOUS_PATTERNS) {
        if (pattern.test(normalizedQuery)) {
            return {
                intent: 'CLARIFICATION_NEEDED',
                confidence: 0,
                needsClarification: true,
                clarificationQuestion: 'Could you be more specific? For example:\n- "Why is my score low?"\n- "What skills am I missing?"\n- "How can I improve my experience section?"'
            };
        }
    }

    // Score each intent
    const scores = [];

    for (const [intentName, pattern] of Object.entries(INTENT_PATTERNS)) {
        let score = 0;
        let matches = [];

        // Check keywords (each keyword adds points)
        for (const keyword of pattern.keywords) {
            if (normalizedQuery.includes(keyword.toLowerCase())) {
                score += 0.15;
                matches.push({ type: 'keyword', value: keyword });
            }
        }

        // Check phrase patterns (regex matches add more points)
        for (const regex of pattern.phrases) {
            if (regex.test(normalizedQuery)) {
                score += 0.35;
                matches.push({ type: 'phrase', pattern: regex.source });
            }
        }

        // Cap at base confidence
        const finalConfidence = Math.min(score, pattern.baseConfidence);

        scores.push({
            intent: intentName,
            confidence: finalConfidence,
            priority: pattern.priority,
            matches
        });
    }

    // Sort by confidence (descending), then by priority (ascending)
    scores.sort((a, b) => {
        if (b.confidence !== a.confidence) {
            return b.confidence - a.confidence;
        }
        return a.priority - b.priority;
    });

    const topIntent = scores[0];

    // Check if confidence is above threshold
    if (topIntent.confidence < CONFIDENCE_THRESHOLD) {
        // Try to suggest based on partial matches
        const partialMatches = scores.filter(s => s.confidence > 0);

        if (partialMatches.length > 0) {
            return {
                intent: 'CLARIFICATION_NEEDED',
                confidence: topIntent.confidence,
                needsClarification: true,
                possibleIntents: partialMatches.slice(0, 2).map(s => s.intent),
                clarificationQuestion: generateClarificationQuestion(partialMatches[0].intent)
            };
        }

        return {
            intent: 'UNKNOWN',
            confidence: 0,
            needsClarification: true,
            clarificationQuestion: 'I\'m not sure what you\'re asking about. Could you please rephrase your question about your resume or ATS score?'
        };
    }

    return {
        intent: topIntent.intent,
        confidence: topIntent.confidence,
        needsClarification: false,
        matches: topIntent.matches
    };
}

// =================== CLARIFICATION HELPERS ===================
/**
 * Generate clarification question based on partial intent
 */
function generateClarificationQuestion(partialIntent) {
    const questions = {
        SCORE_EXPLANATION: 'Are you asking about your ATS score? Would you like me to explain why your score is what it is?',
        SKILLS_GAP: 'Are you interested in knowing which skills are missing from your resume?',
        JD_MATCH: 'Would you like to know how well your resume matches the job description?',
        EXPERIENCE_IMPROVE: 'Are you looking to improve your work experience section?',
        KEYWORD_SUGGESTION: 'Would you like suggestions for keywords to add to your resume?',
        FORMATTING_FEEDBACK: 'Are you asking about your resume\'s format and structure?',
        RESUME_REWRITE: 'Would you like me to help rewrite or improve a specific part of your resume?',
        SECTION_ANALYSIS: 'Which section of your resume would you like me to analyze?'
    };

    return questions[partialIntent] || 'Could you please clarify what aspect of your resume you\'d like help with?';
}

// =================== MAIN EXPORT ===================
/**
 * Process query and return intent with domain validation
 * @param {string} query - User query
 * @returns {Object} - Complete intent analysis result
 */
function analyzeQuery(query) {
    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return {
            isValid: false,
            intent: 'INVALID_INPUT',
            confidence: 0,
            message: 'Please enter a valid question.'
        };
    }

    // Check domain relevance
    const domainResult = validateDomain(query);

    if (!domainResult.isValid) {
        return {
            isValid: false,
            intent: 'OUT_OF_SCOPE',
            confidence: 0,
            message: 'I can only assist with resume analysis and ATS optimization. Please ask about your resume score, missing skills, or how to improve your ATS match.'
        };
    }

    // Detect intent
    const intentResult = detectIntent(query);

    return {
        isValid: true,
        ...intentResult,
        domainConfidence: domainResult.confidence
    };
}

module.exports = {
    analyzeQuery,
    detectIntent,
    validateDomain,
    CONFIDENCE_THRESHOLD
};
