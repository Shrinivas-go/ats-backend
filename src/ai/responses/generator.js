/**
 * Response Generator Module
 * Renders templates with context data
 * 
 * Simple variable substitution - deterministic output
 */

const { TEMPLATES } = require('./templates');

// =================== TEMPLATE RENDERER ===================

/**
 * Simple template renderer with Mustache-like syntax
 * Supports: {{variable}}, {{#array}}...{{/array}}, {{#condition}}...{{/condition}}
 */
function renderTemplate(template, data) {
    if (!template || !data) return template || '';

    let result = template;

    // 1. Handle conditional sections {{#key}}...{{/key}}
    const sectionRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    result = result.replace(sectionRegex, (match, key, content) => {
        const value = data[key];

        if (Array.isArray(value)) {
            // Array iteration
            if (value.length === 0) return '';
            return value.map(item => {
                if (typeof item === 'object') {
                    return renderTemplate(content, { ...data, ...item });
                }
                // Simple value - replace {{.}} with the value
                return content.replace(/\{\{\.\}\}/g, item);
            }).join('');
        } else if (typeof value === 'object' && value !== null) {
            // Object - render with merged context
            return renderTemplate(content, { ...data, ...value });
        } else if (value) {
            // Truthy value - render content
            return renderTemplate(content, data);
        }
        // Falsy value - hide section
        return '';
    });

    // 2. Handle simple variables {{variable}}
    const variableRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    result = result.replace(variableRegex, (match, path) => {
        const value = getNestedValue(data, path);
        if (value === undefined || value === null) return '';
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
    });

    return result.trim();
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

// =================== RESPONSE GENERATORS ===================

/**
 * Generate response for SCORE_EXPLANATION
 */
function generateScoreResponse(context, decision) {
    const category = decision.category || 'MODERATE';
    const template = TEMPLATES.SCORE_EXPLANATION[category];

    const data = {
        overallScore: context.overallScore,
        sectionBreakdown: context.sectionScores,
        skills: context.sectionScores?.skills,
        experience: context.sectionScores?.experience,
        education: context.sectionScores?.education,
        format: context.sectionScores?.format,
        lowestSection: context.lowestSection,
        highestSection: context.highestSection,
        primaryIssue: decision.primaryIssue,
        actionItems: decision.actionItems || []
    };

    return renderTemplate(template, data);
}

/**
 * Generate response for SKILLS_GAP
 */
function generateSkillsGapResponse(context, decision) {
    const urgency = decision.urgency || 'MEDIUM';
    const templateKey = `${urgency}_URGENCY`;
    const template = TEMPLATES.SKILLS_GAP[templateKey] || TEMPLATES.SKILLS_GAP.MEDIUM_URGENCY;

    const data = {
        missingCoreCount: context.missingCoreSkills?.length || 0,
        primaryFocus: decision.primaryFocus || [],
        secondaryFocus: decision.secondaryFocus || [],
        hasSecondary: (decision.secondaryFocus?.length || 0) > 0,
        potentialScoreGain: decision.potentialScoreGain || 0,
        matchedCount: context.matchedCoreSkills?.length || 0,
        totalSkills: context.totalCoreSkills || 0
    };

    return renderTemplate(template, data);
}

/**
 * Generate response for JD_MATCH
 */
function generateJDMatchResponse(context, decision) {
    const fitLevel = decision.fitLevel || 'PARTIAL_FIT';
    const template = TEMPLATES.JD_MATCH[fitLevel];

    const data = {
        matchPercentage: decision.matchPercentage,
        matchedCount: decision.matchedCount,
        totalRequired: decision.totalRequired,
        topMatches: decision.topMatches || [],
        topGaps: decision.topGaps || []
    };

    return renderTemplate(template, data);
}

/**
 * Generate response for EXPERIENCE_IMPROVE
 */
function generateExperienceResponse(context, decision) {
    const template = TEMPLATES.EXPERIENCE_IMPROVE;

    const data = {
        hasWeakVerbs: (context.weakVerbs?.length || 0) > 0,
        weakVerbs: context.weakVerbs || [],
        actionVerbs: decision.actionVerbs || [],
        primaryIssues: decision.primaryIssues || []
    };

    return renderTemplate(template, data);
}

/**
 * Generate response for KEYWORD_SUGGESTION
 */
function generateKeywordResponse(context, decision) {
    const template = TEMPLATES.KEYWORD_SUGGESTION;

    const data = {
        mustAdd: decision.mustAdd || [],
        niceToHave: decision.niceToHave || [],
        hasNiceToHave: (decision.niceToHave?.length || 0) > 0,
        alreadyCount: context.alreadyPresent?.length || 0,
        estimatedImpact: decision.estimatedImpact || 'MODERATE'
    };

    return renderTemplate(template, data);
}

/**
 * Generate response for FORMATTING_FEEDBACK
 */
function generateFormattingResponse(context, decision) {
    const template = TEMPLATES.FORMATTING_FEEDBACK;

    const data = {
        hasScore: context.formatScore !== null && context.formatScore !== undefined,
        formatScore: context.formatScore,
        hasIssues: (decision.issues?.length || 0) > 0,
        issues: decision.issues || [],
        recommendations: decision.recommendations || [],
        generalTips: decision.generalTips || []
    };

    return renderTemplate(template, data);
}

/**
 * Generate response for RESUME_REWRITE
 */
function generateRewriteResponse(context, decision) {
    const template = TEMPLATES.RESUME_REWRITE;

    const data = {
        hasWeakVerbs: (context.weakVerbs?.length || 0) > 0,
        weakVerbs: context.weakVerbs?.join(', ') || '',
        guidelines: decision.guidelines || []
    };

    return renderTemplate(template, data);
}

/**
 * Generate clarification response
 */
function generateClarificationResponse(intentResult) {
    return renderTemplate(TEMPLATES.CLARIFICATION, {
        clarificationQuestion: intentResult.clarificationQuestion
    });
}

/**
 * Generate error response
 */
function generateErrorResponse(message) {
    return renderTemplate(TEMPLATES.ERROR, { message });
}

/**
 * Generate domain refusal response
 */
function generateDomainRefusalResponse() {
    return TEMPLATES.DOMAIN_REFUSAL.message;
}

// =================== MAIN GENERATOR ===================

/**
 * Generate response based on intent, context, and decision
 * @param {string} intent - Detected intent
 * @param {Object} context - Context data
 * @param {Object} decision - Decision from decision engine
 * @returns {string} - Formatted response
 */
function generateResponse(intent, context, decision) {
    // Handle errors
    if (decision?.error) {
        return generateErrorResponse(decision.message);
    }

    // Route to appropriate generator
    switch (intent) {
        case 'SCORE_EXPLANATION':
            return generateScoreResponse(context, decision);

        case 'SKILLS_GAP':
            return generateSkillsGapResponse(context, decision);

        case 'JD_MATCH':
            return generateJDMatchResponse(context, decision);

        case 'EXPERIENCE_IMPROVE':
            return generateExperienceResponse(context, decision);

        case 'KEYWORD_SUGGESTION':
            return generateKeywordResponse(context, decision);

        case 'FORMATTING_FEEDBACK':
            return generateFormattingResponse(context, decision);

        case 'RESUME_REWRITE':
            return generateRewriteResponse(context, decision);

        case 'OUT_OF_SCOPE':
            return generateDomainRefusalResponse();

        case 'CLARIFICATION_NEEDED':
            return generateClarificationResponse({ clarificationQuestion: decision.clarificationQuestion });

        default:
            return 'I can help you with your resume and ATS optimization. What would you like to know?';
    }
}

module.exports = {
    generateResponse,
    renderTemplate,
    generateDomainRefusalResponse,
    generateClarificationResponse,
    generateErrorResponse
};
