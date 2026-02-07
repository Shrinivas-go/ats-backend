/**
 * Response Templates
 * Structured, deterministic templates for each intent
 * 
 * Uses simple variable substitution - NO free-form generation
 */

// =================== RESPONSE TEMPLATES ===================

const TEMPLATES = {
    // Domain refusal
    DOMAIN_REFUSAL: {
        message: `I can only assist with resume analysis and ATS optimization.

**Try asking:**
• "Why is my score low?"
• "What skills am I missing?"
• "How can I improve my experience section?"
• "How well do I match this job?"`,
        type: 'refusal'
    },

    // Score explanation
    SCORE_EXPLANATION: {
        EXCELLENT: `## Great News! 🎉

Your ATS score is **{{overallScore}}%** - this is an excellent match!

{{#sectionBreakdown}}
**Section Scores:**
{{#skills}}- Skills: {{skills}}%{{/skills}}
{{#experience}}- Experience: {{experience}}%{{/experience}}
{{#education}}- Education: {{education}}%{{/education}}
{{#format}}- Format: {{format}}%{{/format}}
{{/sectionBreakdown}}

**Strongest Area:** {{highestSection.name}} ({{highestSection.score}}%)

**Recommendation:** Your resume is well-optimized. Consider applying soon!`,

        GOOD: `## Good Match ✓

Your ATS score is **{{overallScore}}%** - you're a solid candidate.

{{#sectionBreakdown}}
**Section Scores:**
{{#skills}}- Skills: {{skills}}%{{/skills}}
{{#experience}}- Experience: {{experience}}%{{/experience}}
{{#education}}- Education: {{education}}%{{/education}}
{{#format}}- Format: {{format}}%{{/format}}
{{/sectionBreakdown}}

**Area to Improve:** {{lowestSection.name}} ({{lowestSection.score}}%)

**Recommendation:** {{primaryIssue.recommendation}}`,

        MODERATE: `## Room for Improvement

Your ATS score is **{{overallScore}}%** - there's potential to improve.

{{#sectionBreakdown}}
**Section Scores:**
{{#skills}}- Skills: {{skills}}%{{/skills}}
{{#experience}}- Experience: {{experience}}%{{/experience}}
{{#education}}- Education: {{education}}%{{/education}}
{{#format}}- Format: {{format}}%{{/format}}
{{/sectionBreakdown}}

**Main Issue:** {{lowestSection.name}} section needs work ({{lowestSection.score}}%)

**Action Items:**
{{#actionItems}}
• {{.}}
{{/actionItems}}`,

        LOW: `## Significant Improvements Needed

Your ATS score is **{{overallScore}}%** - this needs attention before applying.

{{#sectionBreakdown}}
**Section Scores:**
{{#skills}}- Skills: {{skills}}%{{/skills}}
{{#experience}}- Experience: {{experience}}%{{/experience}}
{{#education}}- Education: {{education}}%{{/education}}
{{#format}}- Format: {{format}}%{{/format}}
{{/sectionBreakdown}}

**Primary Focus:** {{lowestSection.name}} ({{lowestSection.score}}%)

**Urgent Action Items:**
{{#actionItems}}
• {{.}}
{{/actionItems}}

**Tip:** Focus on adding missing core skills from the job description.`
    },

    // Skills gap
    SKILLS_GAP: {
        HIGH_URGENCY: `## Skills Gap Analysis ⚠️

You're missing **{{missingCoreCount}}** core skills from the job description.

**Must Add (High Priority):**
{{#primaryFocus}}
• **{{.}}** - This is a core requirement
{{/primaryFocus}}

{{#hasSecondary}}
**Nice to Have:**
{{#secondaryFocus}}
• {{.}}
{{/secondaryFocus}}
{{/hasSecondary}}

**Potential Impact:** Adding these skills could improve your score by ~**{{potentialScoreGain}}%**`,

        MEDIUM_URGENCY: `## Skills Gap Analysis

You're missing **{{missingCoreCount}}** core skills.

**Top Skills to Add:**
{{#primaryFocus}}
• **{{.}}**
{{/primaryFocus}}

{{#hasSecondary}}
**Optional (Stand Out):**
{{#secondaryFocus}}
• {{.}}
{{/secondaryFocus}}
{{/hasSecondary}}

**Estimated Impact:** +**{{potentialScoreGain}}%** score improvement`,

        LOW_URGENCY: `## Skills Analysis ✓

Great news! You have most core skills covered.

{{#hasSecondary}}
**Consider Adding (Nice to Have):**
{{#secondaryFocus}}
• {{.}}
{{/secondaryFocus}}
{{/hasSecondary}}

**Already Covered:** {{matchedCount}} of {{totalSkills}} required skills`
    },

    // JD Match
    JD_MATCH: {
        STRONG_FIT: `## Strong Match! 🎯

**Match Rate:** {{matchPercentage}}% ({{matchedCount}}/{{totalRequired}} skills)

**Your Matching Skills:**
{{#topMatches}}
• ✓ {{.}}
{{/topMatches}}

**Verdict:** You're a strong candidate for this role. Consider applying!`,

        GOOD_FIT: `## Good Match ✓

**Match Rate:** {{matchPercentage}}% ({{matchedCount}}/{{totalRequired}} skills)

**Matching Skills:**
{{#topMatches}}
• ✓ {{.}}
{{/topMatches}}

**Skills to Add:**
{{#topGaps}}
• {{.}}
{{/topGaps}}

**Verdict:** Good fit - adding missing skills would make you a top candidate.`,

        PARTIAL_FIT: `## Partial Match

**Match Rate:** {{matchPercentage}}% ({{matchedCount}}/{{totalRequired}} skills)

**Currently Matching:**
{{#topMatches}}
• ✓ {{.}}
{{/topMatches}}

**Key Gaps:**
{{#topGaps}}
• ✗ {{.}}
{{/topGaps}}

**Recommendation:** Focus on acquiring the missing core skills before applying.`,

        WEAK_FIT: `## Limited Match ⚠️

**Match Rate:** {{matchPercentage}}% ({{matchedCount}}/{{totalRequired}} skills)

**Critical Gaps:**
{{#topGaps}}
• ✗ {{.}}
{{/topGaps}}

**Recommendation:** This role may require significant skill development. Consider roles that better match your current skillset, or focus on upskilling.`
    },

    // Experience improvement
    EXPERIENCE_IMPROVE: `## Experience Section Feedback

{{#hasWeakVerbs}}
**Weak Action Verbs Found:**
{{#weakVerbs}}
• "{{.}}" → Replace with stronger verbs
{{/weakVerbs}}

**Recommended Action Verbs:**
{{#actionVerbs}}
• {{.}}
{{/actionVerbs}}
{{/hasWeakVerbs}}

**Key Improvements:**
{{#primaryIssues}}
• {{fix}}
{{/primaryIssues}}

**Tips:**
• Start each bullet with a strong action verb
• Quantify achievements (numbers, percentages, metrics)
• Focus on impact and results, not just duties`,

    // Keyword suggestions
    KEYWORD_SUGGESTION: `## Keyword Suggestions 🔑

**Must Add (High Priority):**
{{#mustAdd}}
• **{{.}}**
{{/mustAdd}}

{{#hasNiceToHave}}
**Nice to Have:**
{{#niceToHave}}
• {{.}}
{{/niceToHave}}
{{/hasNiceToHave}}

**Already Included:** {{alreadyCount}} keywords

**Impact:** {{estimatedImpact}} improvement expected`,

    // Formatting feedback
    FORMATTING_FEEDBACK: `## Formatting Feedback

{{#hasScore}}**Format Score:** {{formatScore}}%{{/hasScore}}

{{#hasIssues}}
**Issues Found:**
{{#issues}}
• {{description}}
{{/issues}}
{{/hasIssues}}

**Recommendations:**
{{#recommendations}}
• {{.}}
{{/recommendations}}

**General Tips:**
{{#generalTips}}
• {{.}}
{{/generalTips}}`,

    // Resume rewrite (requires LLM)
    RESUME_REWRITE: `## Rewrite Assistance

I can help improve your resume text. Please provide the specific bullet point or section you'd like me to rewrite.

{{#hasWeakVerbs}}
**Weak verbs I noticed:** {{weakVerbs}}
{{/hasWeakVerbs}}

**Guidelines I'll follow:**
{{#guidelines}}
• {{.}}
{{/guidelines}}`,

    // Clarification needed
    CLARIFICATION: `I'm not quite sure what you're asking. {{clarificationQuestion}}`,

    // Error
    ERROR: `I encountered an issue: {{message}}

Please try again or ask a different question about your resume.`
};

// =================== EXPORTS ===================
module.exports = {
    TEMPLATES
};
