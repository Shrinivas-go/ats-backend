const { extractWeightedJDSkills } = require('./jdWeight.utils');
const { compareWeightedSkills } = require('./compareWeighted.utils');
const { calculateWeightedATSScore } = require('./scoreWeighted.utils');
const { generateATSFeedback } = require('./feedback.utils');

const WEAK_VERBS = [
    'worked', 'helped', 'assisted', 'responsible for', 'handled', 'made', 'did', 'got', 'used', 'tried'
];

const STRONG_VERBS = [
    'engineered', 'developed', 'architected', 'implemented', 'spearheaded', 'orchestrated', 'pioneered',
    'accelerated', 'optimized', 'revitalized', 'automated', 'deployed', 'launched'
];

/**
 * Analyze Resume Quality beyond just skills
 */
function analyzeResumeQuality(parsedResume) {
    const { personalInfo, experience, education, summary, projects, rawText } = parsedResume;

    const quality = {
        score: 0,
        sections: {
            contact: 0,
            summary: 0,
            experience: 0,
            education: 0,
            projects: 0
        },
        issues: [],
        improvements: []
    };

    // 1. Contact Info Analysis (15 points)
    if (personalInfo.email) quality.sections.contact += 5;
    else quality.issues.push({ type: 'critical', message: 'Missing email address' });

    if (personalInfo.phone) quality.sections.contact += 5;
    else quality.issues.push({ type: 'warning', message: 'Missing phone number' });

    if (personalInfo.linkedin) quality.sections.contact += 5;
    else quality.improvements.push('Adding a LinkedIn profile link is recommended');

    // 2. Section Presence (25 points)
    if (summary && summary.length > 0) quality.sections.summary = 5;
    else quality.improvements.push('Consider adding a professional summary');

    if (experience && experience.length > 0) quality.sections.experience = 10;
    else quality.issues.push({ type: 'critical', message: 'Missing Experience section' });

    if (education && education.length > 0) quality.sections.education = 5;
    else quality.issues.push({ type: 'warning', message: 'Missing Education section' });

    if (projects && projects.length > 0) quality.sections.projects = 5;

    // 3. Content Analysis
    let weakVerbCount = 0;
    const lowerText = rawText ? rawText.toLowerCase() : '';

    WEAK_VERBS.forEach(verb => {
        // Check if verb exists as whole word
        const regex = new RegExp(`\\b${verb}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) weakVerbCount += matches.length;
    });

    if (weakVerbCount > 3) {
        quality.improvements.push(`Found ${weakVerbCount} weak action verbs (e.g., "${WEAK_VERBS[0]}"). Replace with strong alternatives like "Engineered", "Optimized", "Spearheaded".`);
    }

    // Calculate total quality score (Max 40 -> scaled to 100 for this component)
    const totalSectionScore = Object.values(quality.sections).reduce((a, b) => a + b, 0);
    // Normalize to 100 max for quality component
    quality.score = Math.min(100, Math.round((totalSectionScore / 40) * 100));

    return quality;
}

/**
 * Comprehensive Resume Analysis
 * Combines Skill Match (70%) + Quality/Formatting (30%)
 * with Logic Gating for logical consistency.
 */
function analyzeResume(parsedResume, jobDescription) {
    // 1. Skill Match Analysis
    const { coreSkills, optionalSkills } = extractWeightedJDSkills(jobDescription);
    const skillComparison = compareWeightedSkills(parsedResume.skills || [], coreSkills, optionalSkills);
    const skillResult = calculateWeightedATSScore(skillComparison); // Returns { atsScore: 0-100 }

    // 2. Quality Analysis
    const qualityAnalysis = analyzeResumeQuality(parsedResume);

    // 3. Combined Score with Logic Gates
    const SKILL_WEIGHT = 0.7;
    const QUALITY_WEIGHT = 0.3;

    let weightedScore = (skillResult.atsScore * SKILL_WEIGHT) + (qualityAnalysis.score * QUALITY_WEIGHT);
    let finalScore = 0;
    let scoreLabel = "";
    let summaryOverride = null;

    // LOGIC GATE: If skill match is effectively zero, formatting cannot save the score.
    if (skillResult.atsScore < 10) {
        // "Not Relevant" State
        // Cap overall score at 15 to reflect "formatted properly but wrong job"
        finalScore = Math.min(Math.round(weightedScore), 15);
        scoreLabel = "Not Relevant";
        summaryOverride = "Your resume has poor alignment with this job description. Even with good formatting, the lack of core keywords prevents a passing score.";
    } else {
        // Normal Scoring
        finalScore = Math.round(weightedScore);

        // Determine Label
        if (finalScore >= 80) scoreLabel = "Excellent Match";
        else if (finalScore >= 60) scoreLabel = "Good Match";
        else if (finalScore >= 40) scoreLabel = "Fair Match";
        else scoreLabel = "Needs Work";
    }

    // Generate specific feedback using the RELEVANCE score for skill details
    const skillFeedback = generateATSFeedback({ atsScore: skillResult.atsScore, ...skillComparison });

    return {
        success: true,
        score: finalScore,           // The gated, weighted final score
        scoreLabel: scoreLabel,      // UI Label for the ring
        skillScore: skillResult.atsScore,
        qualityScore: qualityAnalysis.score,
        skills: {
            matched: skillComparison.matchedCoreSkills.concat(skillComparison.matchedOptionalSkills),
            missing: skillComparison.missingCoreSkills,
            coreMatches: skillComparison.matchedCoreSkills,
            optionalMatches: skillComparison.matchedOptionalSkills
        },
        quality: qualityAnalysis,
        feedback: {
            summary: summaryOverride || skillFeedback.summary, // Use override if gated
            skillRecommendations: skillFeedback.recommendations,
            improvements: qualityAnalysis.improvements,
            criticalIssues: qualityAnalysis.issues
        }
    };
}

module.exports = {
    analyzeResume,
    analyzeResumeQuality
};
