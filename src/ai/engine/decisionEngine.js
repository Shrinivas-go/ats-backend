/**
 * Decision Engine Module
 * Prioritizes issues and generates actionable recommendations
 * 
 * Uses rule-based logic, NOT generative AI
 */

// =================== IMPACT WEIGHTS ===================
const IMPACT_WEIGHTS = {
    missingCoreSkill: 10,      // High impact - directly affects ATS score
    missingOptionalSkill: 3,   // Medium impact
    weakVerb: 2,               // Low-Medium impact
    formatIssue: 5,            // Medium impact
    lowSectionScore: 8         // High impact
};

// =================== PRIORITY THRESHOLDS ===================
const SCORE_THRESHOLDS = {
    EXCELLENT: 80,
    GOOD: 60,
    MODERATE: 40,
    LOW: 20
};

// =================== DECISION MAKERS ===================

/**
 * Make decision for SCORE_EXPLANATION
 */
function decideScoreExplanation(context) {
    const { overallScore, sectionScores, lowestSection, highestSection } = context;

    // Determine score category
    let category;
    if (overallScore >= SCORE_THRESHOLDS.EXCELLENT) category = 'EXCELLENT';
    else if (overallScore >= SCORE_THRESHOLDS.GOOD) category = 'GOOD';
    else if (overallScore >= SCORE_THRESHOLDS.MODERATE) category = 'MODERATE';
    else category = 'LOW';

    // Primary issue is always the lowest section
    const primaryIssue = lowestSection ? {
        section: lowestSection.name,
        score: lowestSection.score,
        impact: 'high',
        recommendation: getScoreRecommendation(lowestSection.name, lowestSection.score)
    } : null;

    return {
        category,
        primaryIssue,
        sectionBreakdown: sectionScores,
        actionItems: generateScoreActionItems(context)
    };
}

/**
 * Make decision for SKILLS_GAP
 */
function decideSkillsGap(context) {
    const { missingCoreSkills, missingOptionalSkills, coreMatchRate } = context;

    // Prioritize missing core skills
    const prioritizedSkills = [];

    // Add core skills first (higher priority)
    missingCoreSkills.slice(0, 5).forEach((skill, index) => {
        prioritizedSkills.push({
            skill,
            priority: 'HIGH',
            impact: IMPACT_WEIGHTS.missingCoreSkill,
            recommendation: `Add "${skill}" to your resume - this is a core requirement.`
        });
    });

    // Add optional skills (lower priority)
    missingOptionalSkills.slice(0, 3).forEach(skill => {
        prioritizedSkills.push({
            skill,
            priority: 'MEDIUM',
            impact: IMPACT_WEIGHTS.missingOptionalSkill,
            recommendation: `Consider adding "${skill}" to stand out from other candidates.`
        });
    });

    // Calculate potential score gain
    const potentialGain = Math.min(
        missingCoreSkills.length * 5 + missingOptionalSkills.length * 2,
        100 - (coreMatchRate || 0)
    );

    return {
        primaryFocus: missingCoreSkills.slice(0, 3),
        secondaryFocus: missingOptionalSkills.slice(0, 2),
        prioritizedSkills,
        potentialScoreGain: Math.round(potentialGain),
        urgency: missingCoreSkills.length > 3 ? 'HIGH' : (missingCoreSkills.length > 0 ? 'MEDIUM' : 'LOW')
    };
}

/**
 * Make decision for JD_MATCH
 */
function decideJDMatch(context) {
    const { overallMatch, matchedSkills, missingSkills, matchCount, totalRequired } = context;

    // Calculate match percentage
    const matchPercentage = totalRequired > 0
        ? Math.round((matchCount / totalRequired) * 100)
        : 0;

    // Determine fit level
    let fitLevel;
    if (matchPercentage >= 80) fitLevel = 'STRONG_FIT';
    else if (matchPercentage >= 60) fitLevel = 'GOOD_FIT';
    else if (matchPercentage >= 40) fitLevel = 'PARTIAL_FIT';
    else fitLevel = 'WEAK_FIT';

    return {
        fitLevel,
        matchPercentage,
        matchedCount: matchCount,
        totalRequired,
        topMatches: matchedSkills.slice(0, 5),
        topGaps: missingSkills.slice(0, 5),
        shouldApply: matchPercentage >= 50,
        improvementNeeded: missingSkills.slice(0, 3)
    };
}

/**
 * Make decision for EXPERIENCE_IMPROVE
 */
function decideExperienceImprove(context) {
    const { experienceScore, weakVerbs, recommendations } = context;

    const issues = [];

    // Check weak verbs
    if (weakVerbs.length > 0) {
        issues.push({
            type: 'WEAK_VERBS',
            severity: weakVerbs.length > 3 ? 'HIGH' : 'MEDIUM',
            details: weakVerbs.slice(0, 5),
            fix: 'Replace weak verbs with strong action verbs like "Led", "Developed", "Achieved", "Implemented"'
        });
    }

    // Check experience score
    if (experienceScore !== null && experienceScore < 60) {
        issues.push({
            type: 'LOW_EXPERIENCE_SCORE',
            severity: 'HIGH',
            score: experienceScore,
            fix: 'Quantify achievements with numbers and metrics'
        });
    }

    // Sort by severity
    issues.sort((a, b) => {
        const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return {
        primaryIssues: issues.slice(0, 2),
        allIssues: issues,
        actionVerbs: ['Led', 'Developed', 'Implemented', 'Achieved', 'Increased', 'Reduced', 'Managed', 'Created'],
        recommendations
    };
}

/**
 * Make decision for KEYWORD_SUGGESTION
 */
function decideKeywordSuggestion(context) {
    const { suggestedKeywords, totalMissing, alreadyPresent } = context;

    // Group by priority
    const highPriority = suggestedKeywords.filter(k => k.priority === 'high').slice(0, 5);
    const mediumPriority = suggestedKeywords.filter(k => k.priority === 'medium').slice(0, 3);

    return {
        mustAdd: highPriority.map(k => k.keyword),
        niceToHave: mediumPriority.map(k => k.keyword),
        alreadyIncluded: alreadyPresent.slice(0, 5),
        totalMissing,
        estimatedImpact: highPriority.length > 3 ? 'SIGNIFICANT' : 'MODERATE'
    };
}

/**
 * Make decision for FORMATTING_FEEDBACK
 */
function decideFormattingFeedback(context) {
    const { formatScore, formatIssues, recommendations } = context;

    const issues = [];

    // Common formatting issues
    if (formatIssues.length > 0) {
        formatIssues.forEach(issue => {
            issues.push({
                type: 'FORMAT_ISSUE',
                description: issue,
                severity: 'MEDIUM'
            });
        });
    }

    return {
        formatScore,
        issues,
        recommendations: recommendations.slice(0, 3),
        generalTips: [
            'Use consistent formatting throughout',
            'Keep resume to 1-2 pages',
            'Use standard section headers',
            'Avoid tables and graphics for ATS compatibility'
        ]
    };
}

/**
 * Make decision for RESUME_REWRITE
 */
function decideResumeRewrite(context) {
    return {
        requiresLLM: true,
        weakVerbs: context.weakVerbs || [],
        guidelines: [
            'Start bullets with strong action verbs',
            'Quantify achievements when possible',
            'Focus on impact and results',
            'Use industry-specific keywords'
        ]
    };
}

// =================== HELPER FUNCTIONS ===================

function getScoreRecommendation(section, score) {
    const recommendations = {
        skills: score < 50
            ? 'Add more relevant skills from the job description'
            : 'Continue adding industry-specific keywords',
        experience: score < 50
            ? 'Use stronger action verbs and quantify achievements'
            : 'Add more measurable outcomes to your bullet points',
        education: score < 50
            ? 'Include relevant coursework or certifications'
            : 'Add any professional certifications or training',
        format: score < 50
            ? 'Simplify your resume format for better ATS parsing'
            : 'Ensure consistent formatting throughout'
    };

    return recommendations[section] || 'Focus on improving this section with relevant content';
}

function generateScoreActionItems(context) {
    const items = [];
    const { overallScore, lowestSection, sectionScores } = context;

    if (overallScore < SCORE_THRESHOLDS.GOOD) {
        items.push('Focus on adding missing core skills');
    }

    if (lowestSection && lowestSection.score < 50) {
        items.push(`Improve your ${lowestSection.name} section`);
    }

    if (Object.keys(sectionScores).length === 0) {
        items.push('Run a complete ATS analysis for detailed feedback');
    }

    return items.slice(0, 3);
}

// =================== MAIN DECISION FUNCTION ===================

/**
 * Make decisions based on intent and context
 * @param {Object} context - Context from context builder
 * @param {string} intent - Detected intent
 * @returns {Object} - Decision with prioritized recommendations
 */
function decide(context, intent) {
    if (context.type === 'ERROR') {
        return {
            error: true,
            message: context.error
        };
    }

    switch (intent) {
        case 'SCORE_EXPLANATION':
            return decideScoreExplanation(context);

        case 'SKILLS_GAP':
            return decideSkillsGap(context);

        case 'JD_MATCH':
            return decideJDMatch(context);

        case 'EXPERIENCE_IMPROVE':
            return decideExperienceImprove(context);

        case 'KEYWORD_SUGGESTION':
            return decideKeywordSuggestion(context);

        case 'FORMATTING_FEEDBACK':
            return decideFormattingFeedback(context);

        case 'RESUME_REWRITE':
            return decideResumeRewrite(context);

        default:
            return {
                general: true,
                message: 'Please ask a specific question about your resume or ATS score.'
            };
    }
}

module.exports = {
    decide,
    IMPACT_WEIGHTS,
    SCORE_THRESHOLDS
};
