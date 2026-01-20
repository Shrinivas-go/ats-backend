/**
 * ATS Feedback Generator Utility
 * Generates human-readable feedback based on ATS scoring results
 */

/**
 * Generates ATS feedback summary and recommendations
 * @param {Object} weightedResult - The weighted ATS analysis result
 * @param {number} weightedResult.atsScore - Overall ATS score (0-100)
 * @param {Array<string>} weightedResult.matchedCoreSkills - Core skills found in resume
 * @param {Array<string>} weightedResult.missingCoreSkills - Core skills missing from resume
 * @param {Array<string>} weightedResult.matchedOptionalSkills - Optional skills found in resume
 * @param {Array<string>} weightedResult.missingOptionalSkills - Optional skills missing from resume
 * @returns {Object} Feedback object with summary and recommendations
 */
function generateATSFeedback(weightedResult) {
  const {
    atsScore,
    matchedCoreSkills = [],
    missingCoreSkills = [],
    matchedOptionalSkills = [],
    missingOptionalSkills = []
  } = weightedResult;

  // Generate summary based on ATS score
  const summary = generateSummary(atsScore, matchedCoreSkills, missingCoreSkills);

  // Generate recommendations
  const recommendations = generateRecommendations(
    atsScore,
    missingCoreSkills,
    missingOptionalSkills,
    matchedCoreSkills,
    matchedOptionalSkills
  );

  return {
    summary,
    recommendations
  };
}

/**
 * Generates summary text based on ATS score and skills analysis
 */
function generateSummary(atsScore, matchedCoreSkills, missingCoreSkills) {
  const totalCoreSkills = matchedCoreSkills.length + missingCoreSkills.length;
  const coreSkillsMatchRate = totalCoreSkills > 0 
    ? Math.round((matchedCoreSkills.length / totalCoreSkills) * 100)
    : 0;

  if (atsScore >= 80) {
    return `Excellent match! Your resume scores ${atsScore}% and includes ${matchedCoreSkills.length} of ${totalCoreSkills} essential skills. You're in a strong position for this role.`;
  } else if (atsScore >= 60) {
    return `Good match with room for improvement. Your resume scores ${atsScore}% and covers ${coreSkillsMatchRate}% of the core requirements. Adding a few key skills could significantly strengthen your application.`;
  } else if (atsScore >= 40) {
    return `Moderate match. Your resume scores ${atsScore}% and is missing some important qualifications. Consider highlighting relevant experience or developing key skills before applying.`;
  } else {
    return `Limited match. Your resume scores ${atsScore}% and lacks several essential requirements for this position. Significant skill development may be needed to qualify for this role.`;
  }
}

/**
 * Generates actionable recommendations based on missing and matched skills
 */
function generateRecommendations(
  atsScore,
  missingCoreSkills,
  missingOptionalSkills,
  matchedCoreSkills,
  matchedOptionalSkills
) {
  const recommendations = [];

  // Critical: Missing core skills (highest priority)
  if (missingCoreSkills.length > 0) {
    if (missingCoreSkills.length === 1) {
      recommendations.push(
        `Add "${missingCoreSkills[0]}" to your resume - this is a critical requirement for the role.`
      );
    } else if (missingCoreSkills.length <= 3) {
      recommendations.push(
        `Include these essential skills in your resume: ${missingCoreSkills.join(', ')}. These are core requirements that hiring managers look for.`
      );
    } else {
      const topMissing = missingCoreSkills.slice(0, 3);
      recommendations.push(
        `Focus on adding these critical skills first: ${topMissing.join(', ')}. You're also missing ${missingCoreSkills.length - 3} other core requirements.`
      );
    }
  }

  // If score is very low, suggest broader skill development
  if (atsScore < 40 && missingCoreSkills.length > 3) {
    recommendations.push(
      `Consider gaining experience in the core areas where you're lacking qualifications before applying. This will significantly improve your chances.`
    );
  }

  // Medium priority: Highlight matched core skills better
  if (matchedCoreSkills.length > 0 && atsScore < 70) {
    recommendations.push(
      `Make sure your existing skills (${matchedCoreSkills.slice(0, 3).join(', ')}) are prominently featured in your resume summary and work experience.`
    );
  }

  // Lower priority: Optional skills for competitive edge
  if (missingOptionalSkills.length > 0 && missingCoreSkills.length < 3) {
    if (missingOptionalSkills.length <= 2) {
      recommendations.push(
        `To stand out from other candidates, consider adding: ${missingOptionalSkills.join(', ')}.`
      );
    } else {
      const topOptional = missingOptionalSkills.slice(0, 2);
      recommendations.push(
        `To strengthen your application further, consider highlighting these additional skills if you have them: ${topOptional.join(', ')}.`
      );
    }
  }

  // General resume optimization tips based on score
  if (atsScore >= 60 && atsScore < 80) {
    recommendations.push(
      `Use industry-standard terms and keywords naturally throughout your resume to improve visibility in applicant tracking systems.`
    );
  }

  if (atsScore >= 80) {
    recommendations.push(
      `Your resume is well-aligned with the job requirements. Ensure your experience section provides specific examples of how you've applied these skills.`
    );
  }

  // Ensure we always have at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push(
      `Review the job description carefully and tailor your resume to emphasize relevant experience and accomplishments.`
    );
  }

  return recommendations;
}

module.exports = {
  generateATSFeedback
};