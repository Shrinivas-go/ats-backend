// =================== WEIGHTED ATS SCORE CALCULATION UTILITIES ===================
// File: backend/ats/scoreWeighted.utils.js
// Purpose: Calculate weighted ATS score based on core and optional skills

/**
 * Calculate weighted ATS score based on core and optional skill matching
 * @param {Object} weightedComparison - Object containing skill matching results
 * @param {Array<string>} weightedComparison.matchedCoreSkills - Matched core skills
 * @param {Array<string>} weightedComparison.missingCoreSkills - Missing core skills
 * @param {Array<string>} weightedComparison.matchedOptionalSkills - Matched optional skills
 * @param {Array<string>} weightedComparison.missingOptionalSkills - Missing optional skills
 * @returns {Object} - Object containing atsScore (number) and explanation (string)
 */
function calculateWeightedATSScore(weightedComparison) {
  // Validate input
  if (!weightedComparison || typeof weightedComparison !== 'object') {
    return {
      atsScore: 0,
      explanation: 'Invalid comparison data provided.'
    };
  }

  // Extract and validate arrays
  const matchedCore = Array.isArray(weightedComparison.matchedCoreSkills) 
    ? weightedComparison.matchedCoreSkills 
    : [];
  const missingCore = Array.isArray(weightedComparison.missingCoreSkills) 
    ? weightedComparison.missingCoreSkills 
    : [];
  const matchedOptional = Array.isArray(weightedComparison.matchedOptionalSkills) 
    ? weightedComparison.matchedOptionalSkills 
    : [];
  const missingOptional = Array.isArray(weightedComparison.missingOptionalSkills) 
    ? weightedComparison.missingOptionalSkills 
    : [];

  // Calculate totals
  const totalCoreSkills = matchedCore.length + missingCore.length;
  const totalOptionalSkills = matchedOptional.length + missingOptional.length;

  // Calculate individual scores
  let coreScore = 0;
  let optionalScore = 0;

  if (totalCoreSkills > 0) {
    coreScore = (matchedCore.length / totalCoreSkills) * 100;
  }

  if (totalOptionalSkills > 0) {
    optionalScore = (matchedOptional.length / totalOptionalSkills) * 100;
  }

  // Determine weights based on what skills are present
  let coreWeight = 0.7; // 70%
  let optionalWeight = 0.3; // 30%

  if (totalCoreSkills === 0 && totalOptionalSkills === 0) {
    // No skills found in job description
    return {
      atsScore: 0,
      explanation: 'No skills found in the job description to evaluate against.'
    };
  } else if (totalCoreSkills === 0) {
    // Only optional skills present
    coreWeight = 0;
    optionalWeight = 1.0; // 100%
  } else if (totalOptionalSkills === 0) {
    // Only core skills present
    coreWeight = 1.0; // 100%
    optionalWeight = 0;
  }

  // Calculate weighted ATS score
  const atsScore = Math.round((coreScore * coreWeight) + (optionalScore * optionalWeight));

  // Generate detailed explanation
  let explanation = generateExplanation(
    atsScore,
    matchedCore.length,
    totalCoreSkills,
    matchedOptional.length,
    totalOptionalSkills,
    coreScore,
    optionalScore
  );

  return {
    atsScore,
    explanation
  };
}

/**
 * Generate detailed explanation based on score components
 * @param {number} atsScore - Overall ATS score
 * @param {number} matchedCore - Number of matched core skills
 * @param {number} totalCore - Total core skills required
 * @param {number} matchedOptional - Number of matched optional skills
 * @param {number} totalOptional - Total optional skills
 * @param {number} coreScore - Core skills score percentage
 * @param {number} optionalScore - Optional skills score percentage
 * @returns {string} - Detailed explanation
 */
function generateExplanation(
  atsScore,
  matchedCore,
  totalCore,
  matchedOptional,
  totalOptional,
  coreScore,
  optionalScore
) {
  let explanation = '';

  // Overall score assessment
  if (atsScore >= 80) {
    explanation = 'Excellent match! ';
  } else if (atsScore >= 60) {
    explanation = 'Good match! ';
  } else if (atsScore >= 40) {
    explanation = 'Moderate match. ';
  } else if (atsScore > 0) {
    explanation = 'Low match. ';
  } else {
    explanation = 'No match found. ';
  }

  // Core skills breakdown
  if (totalCore > 0) {
    explanation += `You matched ${matchedCore} out of ${totalCore} core/required skills (${Math.round(coreScore)}%). `;
    
    if (coreScore >= 80) {
      explanation += 'Your core skills are very strong. ';
    } else if (coreScore >= 60) {
      explanation += 'Your core skills are good but could be improved. ';
    } else if (coreScore > 0) {
      explanation += 'You are missing several critical core skills. ';
    } else {
      explanation += 'You do not possess the required core skills. ';
    }
  }

  // Optional skills breakdown
  if (totalOptional > 0) {
    explanation += `You matched ${matchedOptional} out of ${totalOptional} optional/preferred skills (${Math.round(optionalScore)}%). `;
    
    if (optionalScore >= 80) {
      explanation += 'Great bonus skills! ';
    } else if (optionalScore >= 50) {
      explanation += 'Good additional skills. ';
    } else if (optionalScore > 0) {
      explanation += 'Some bonus skills present. ';
    }
  }

  // Recommendation
  if (atsScore >= 70) {
    explanation += 'You are a strong candidate for this position.';
  } else if (atsScore >= 50) {
    explanation += 'Consider highlighting relevant experience or acquiring missing skills.';
  } else if (atsScore > 0) {
    explanation += 'Significant skill development may be needed for this role.';
  } else {
    explanation += 'This position may not align with your current skill set.';
  }

  return explanation;
}

// =================== EXPORTS ===================
module.exports = {
  calculateWeightedATSScore
};