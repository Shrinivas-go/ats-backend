/**
 * ATS Score Improvement Simulator Utility
 * Simulates score improvements by adding missing skills one at a time
 */

/**
 * Calculates ATS score based on skill matching
 * @param {number} matchedCore - Number of matched core skills
 * @param {number} totalCore - Total number of core skills
 * @param {number} matchedOptional - Number of matched optional skills
 * @param {number} totalOptional - Total number of optional skills
 * @returns {number} ATS score (0-100)
 */
function calculateATSScore(matchedCore, totalCore, matchedOptional, totalOptional) {
  const CORE_WEIGHT = 0.7;
  const OPTIONAL_WEIGHT = 0.3;

  const coreScore = totalCore > 0 ? (matchedCore / totalCore) * 100 : 100;
  const optionalScore = totalOptional > 0 ? (matchedOptional / totalOptional) * 100 : 100;

  const weightedScore = (coreScore * CORE_WEIGHT) + (optionalScore * OPTIONAL_WEIGHT);

  return Math.round(weightedScore * 100) / 100;
}

/**
 * Simulates ATS score improvements by adding missing skills
 * @param {Object} input - Input data containing skills analysis
 * @param {Array<string>} input.coreSkills - All core skills required
 * @param {Array<string>} input.optionalSkills - All optional skills
 * @param {Array<string>} input.matchedCoreSkills - Core skills found in resume
 * @param {Array<string>} input.missingCoreSkills - Core skills missing from resume
 * @param {Array<string>} input.matchedOptionalSkills - Optional skills found in resume
 * @param {Array<string>} input.missingOptionalSkills - Optional skills missing from resume
 * @returns {Object} Simulation results with current score and improvements
 */
function simulateATSImprovements(input) {
  const {
    coreSkills = [],
    optionalSkills = [],
    matchedCoreSkills = [],
    missingCoreSkills = [],
    matchedOptionalSkills = [],
    missingOptionalSkills = []
  } = input;

  // Calculate current ATS score
  const totalCoreSkills = coreSkills.length;
  const totalOptionalSkills = optionalSkills.length;
  const currentMatchedCore = matchedCoreSkills.length;
  const currentMatchedOptional = matchedOptionalSkills.length;

  const currentScore = calculateATSScore(
    currentMatchedCore,
    totalCoreSkills,
    currentMatchedOptional,
    totalOptionalSkills
  );

  const improvements = [];

  // Simulate adding each missing core skill one at a time
  missingCoreSkills.forEach(skill => {
    const newMatchedCore = currentMatchedCore + 1;
    const newScore = calculateATSScore(
      newMatchedCore,
      totalCoreSkills,
      currentMatchedOptional,
      totalOptionalSkills
    );

    const scoreGain = newScore - currentScore;

    improvements.push({
      skill,
      type: 'core',
      newScore: Math.round(newScore * 100) / 100,
      scoreGain: Math.round(scoreGain * 100) / 100
    });
  });

  // Simulate adding each missing optional skill one at a time
  missingOptionalSkills.forEach(skill => {
    const newMatchedOptional = currentMatchedOptional + 1;
    const newScore = calculateATSScore(
      currentMatchedCore,
      totalCoreSkills,
      newMatchedOptional,
      totalOptionalSkills
    );

    const scoreGain = newScore - currentScore;

    improvements.push({
      skill,
      type: 'optional',
      newScore: Math.round(newScore * 100) / 100,
      scoreGain: Math.round(scoreGain * 100) / 100
    });
  });

  // Sort by highest score gain (descending)
  improvements.sort((a, b) => {
    if (b.scoreGain !== a.scoreGain) {
      return b.scoreGain - a.scoreGain;
    }
    // If score gains are equal, prioritize core skills
    if (a.type === 'core' && b.type === 'optional') {
      return -1;
    }
    if (a.type === 'optional' && b.type === 'core') {
      return 1;
    }
    return 0;
  });

  return {
    currentScore: Math.round(currentScore * 100) / 100,
    improvements: improvements.map(({ skill, newScore }) => ({
      skill,
      newScore
    }))
  };
}

module.exports = {
  simulateATSImprovements
};