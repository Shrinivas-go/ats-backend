/**
 * Context Builder Module
 * Extracts relevant data from ATS analysis based on detected intent
 * 
 * Only returns data that exists - NEVER infers or hallucinates
 */

// =================== CONTEXT BUILDERS BY INTENT ===================

/**
 * Build context for SCORE_EXPLANATION intent
 */
function buildScoreContext(atsResult) {
    const context = {
        type: 'SCORE_EXPLANATION',
        overallScore: atsResult.atsScore || 0,
        sectionScores: {},
        lowestSection: null,
        highestSection: null
    };

    // Extract section scores if available
    if (atsResult.skillsScore !== undefined) {
        context.sectionScores.skills = atsResult.skillsScore;
    }
    if (atsResult.experienceScore !== undefined) {
        context.sectionScores.experience = atsResult.experienceScore;
    }
    if (atsResult.educationScore !== undefined) {
        context.sectionScores.education = atsResult.educationScore;
    }
    if (atsResult.formatScore !== undefined) {
        context.sectionScores.format = atsResult.formatScore;
    }

    // Find lowest and highest sections
    const scores = Object.entries(context.sectionScores);
    if (scores.length > 0) {
        scores.sort((a, b) => a[1] - b[1]);
        context.lowestSection = { name: scores[0][0], score: scores[0][1] };
        context.highestSection = { name: scores[scores.length - 1][0], score: scores[scores.length - 1][1] };
    }

    // Include explanation if available
    if (atsResult.explanation) {
        context.explanation = atsResult.explanation;
    }

    return context;
}

/**
 * Build context for SKILLS_GAP intent
 */
function buildSkillsGapContext(atsResult) {
    return {
        type: 'SKILLS_GAP',
        matchedCoreSkills: atsResult.matchedCoreSkills || [],
        missingCoreSkills: atsResult.missingCoreSkills || [],
        matchedOptionalSkills: atsResult.matchedOptionalSkills || [],
        missingOptionalSkills: atsResult.missingOptionalSkills || [],
        totalCoreSkills: (atsResult.matchedCoreSkills?.length || 0) + (atsResult.missingCoreSkills?.length || 0),
        totalOptionalSkills: (atsResult.matchedOptionalSkills?.length || 0) + (atsResult.missingOptionalSkills?.length || 0),
        coreMatchRate: calculateMatchRate(
            atsResult.matchedCoreSkills?.length || 0,
            atsResult.missingCoreSkills?.length || 0
        )
    };
}

/**
 * Build context for JD_MATCH intent
 */
function buildJDMatchContext(atsResult) {
    return {
        type: 'JD_MATCH',
        overallMatch: atsResult.atsScore || 0,
        matchedSkills: atsResult.matchedCoreSkills || [],
        missingSkills: atsResult.missingCoreSkills || [],
        matchCount: atsResult.matchedCoreSkills?.length || 0,
        totalRequired: (atsResult.matchedCoreSkills?.length || 0) + (atsResult.missingCoreSkills?.length || 0),
        feedback: atsResult.feedback || null
    };
}

/**
 * Build context for EXPERIENCE_IMPROVE intent
 */
function buildExperienceContext(atsResult) {
    return {
        type: 'EXPERIENCE_IMPROVE',
        experienceScore: atsResult.experienceScore || null,
        weakVerbs: atsResult.weakVerbs || [],
        recommendations: atsResult.recommendations?.filter(r =>
            r.toLowerCase().includes('experience') ||
            r.toLowerCase().includes('action') ||
            r.toLowerCase().includes('verb')
        ) || []
    };
}

/**
 * Build context for KEYWORD_SUGGESTION intent
 */
function buildKeywordContext(atsResult) {
    const allMissing = [
        ...(atsResult.missingCoreSkills || []),
        ...(atsResult.missingOptionalSkills || [])
    ];

    // Prioritize core skills
    const prioritizedKeywords = [
        ...(atsResult.missingCoreSkills || []).map(k => ({ keyword: k, priority: 'high' })),
        ...(atsResult.missingOptionalSkills || []).map(k => ({ keyword: k, priority: 'medium' }))
    ];

    return {
        type: 'KEYWORD_SUGGESTION',
        suggestedKeywords: prioritizedKeywords.slice(0, 10),
        totalMissing: allMissing.length,
        alreadyPresent: atsResult.matchedCoreSkills || []
    };
}

/**
 * Build context for FORMATTING_FEEDBACK intent
 */
function buildFormattingContext(atsResult) {
    return {
        type: 'FORMATTING_FEEDBACK',
        formatScore: atsResult.formatScore || null,
        formatIssues: atsResult.formatIssues || [],
        recommendations: atsResult.recommendations?.filter(r =>
            r.toLowerCase().includes('format') ||
            r.toLowerCase().includes('structure') ||
            r.toLowerCase().includes('section') ||
            r.toLowerCase().includes('length')
        ) || []
    };
}

/**
 * Build context for RESUME_REWRITE intent
 */
function buildRewriteContext(atsResult, userQuery) {
    return {
        type: 'RESUME_REWRITE',
        weakVerbs: atsResult.weakVerbs || [],
        needsLLM: true,
        originalQuery: userQuery
    };
}

/**
 * Build general context when intent is unclear
 */
function buildGeneralContext(atsResult) {
    return {
        type: 'GENERAL',
        overallScore: atsResult.atsScore || 0,
        matchedSkillsCount: atsResult.matchedCoreSkills?.length || 0,
        missingSkillsCount: atsResult.missingCoreSkills?.length || 0,
        hasFeedback: !!atsResult.feedback,
        hasRecommendations: atsResult.recommendations?.length > 0
    };
}

// =================== UTILITY FUNCTIONS ===================

function calculateMatchRate(matched, missing) {
    const total = matched + missing;
    if (total === 0) return 0;
    return Math.round((matched / total) * 100);
}

// =================== MAIN CONTEXT BUILDER ===================

/**
 * Build context based on intent and ATS result
 * @param {Object} atsResult - The ATS analysis result
 * @param {string} intent - Detected intent
 * @param {string} query - Original user query
 * @returns {Object} - Context relevant to the intent
 */
function buildContext(atsResult, intent, query = '') {
    // Validate ATS result
    if (!atsResult || typeof atsResult !== 'object') {
        return {
            type: 'ERROR',
            error: 'No analysis data available. Please run an ATS scan first.'
        };
    }

    // Select context builder based on intent
    switch (intent) {
        case 'SCORE_EXPLANATION':
            return buildScoreContext(atsResult);

        case 'SKILLS_GAP':
            return buildSkillsGapContext(atsResult);

        case 'JD_MATCH':
            return buildJDMatchContext(atsResult);

        case 'EXPERIENCE_IMPROVE':
            return buildExperienceContext(atsResult);

        case 'KEYWORD_SUGGESTION':
            return buildKeywordContext(atsResult);

        case 'FORMATTING_FEEDBACK':
            return buildFormattingContext(atsResult);

        case 'RESUME_REWRITE':
            return buildRewriteContext(atsResult, query);

        case 'SECTION_ANALYSIS':
            return buildGeneralContext(atsResult);

        default:
            return buildGeneralContext(atsResult);
    }
}

module.exports = {
    buildContext,
    buildScoreContext,
    buildSkillsGapContext,
    buildJDMatchContext,
    buildExperienceContext,
    buildKeywordContext,
    buildFormattingContext,
    buildRewriteContext,
    buildGeneralContext
};
