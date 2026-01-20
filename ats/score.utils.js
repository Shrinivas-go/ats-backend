// =================== ATS SCORE CALCULATION UTILITIES ===================
// File: backend/ats/score.utils.js
// Purpose: Calculate ATS score based on skill matching

/**
 * Calculate ATS score based on matched skills vs required skills
 * @param {Array<string>} jdSkills - Skills required by job description
 * @param {Array<string>} matchedSkills - Skills matched between resume and JD
 * @returns {Object} - Object containing atsScore (number) and explanation (string)
 */
function calculateATSScore(jdSkills, matchedSkills) {
  // Validate inputs
  if (!Array.isArray(jdSkills)) jdSkills = [];
  if (!Array.isArray(matchedSkills)) matchedSkills = [];

  // If no skills required in JD, return 0 score
  if (jdSkills.length === 0) {
    return {
      atsScore: 0,
      explanation: 'No skills found in the job description to compare against.'
    };
  }

  // Calculate ATS score: (matched / total) * 100
  const atsScore = Math.round((matchedSkills.length / jdSkills.length) * 100);

  // Generate explanation based on score
  let explanation = '';

  if (atsScore >= 80) {
    explanation = `Excellent match! Your resume matches ${matchedSkills.length} out of ${jdSkills.length} required skills (${atsScore}%). You are a strong candidate for this position.`;
  } else if (atsScore >= 60) {
    explanation = `Good match! Your resume matches ${matchedSkills.length} out of ${jdSkills.length} required skills (${atsScore}%). Consider adding the missing skills if you have them.`;
  } else if (atsScore >= 40) {
    explanation = `Moderate match. Your resume matches ${matchedSkills.length} out of ${jdSkills.length} required skills (${atsScore}%). You may need to develop additional skills for this role.`;
  } else if (atsScore > 0) {
    explanation = `Low match. Your resume matches only ${matchedSkills.length} out of ${jdSkills.length} required skills (${atsScore}%). This position may not be the best fit.`;
  } else {
    explanation = `No match found. Your resume does not contain any of the ${jdSkills.length} required skills for this position.`;
  }

  return {
    atsScore,
    explanation
  };
}

// =================== EXPORTS ===================
module.exports = {
  calculateATSScore
};