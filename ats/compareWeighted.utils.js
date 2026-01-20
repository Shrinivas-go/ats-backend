// =================== WEIGHTED SKILL COMPARISON UTILITIES ===================
// File: backend/ats/compareWeighted.utils.js
// Purpose: Compare resume skills against weighted job description skills

/**
 * Normalize a skill string for comparison
 * @param {string} skill - Skill to normalize
 * @returns {string} - Normalized skill (lowercase, trimmed)
 */
function normalizeSkill(skill) {
  if (typeof skill !== 'string') return '';
  return skill.toLowerCase().trim();
}

/**
 * Normalize an array of skills
 * @param {Array<string>} skillsArray - Array of skills to normalize
 * @returns {Array<string>} - Array of normalized skills
 */
function normalizeSkillsArray(skillsArray) {
  if (!Array.isArray(skillsArray)) return [];
  
  return skillsArray
    .filter(skill => typeof skill === 'string' && skill.trim() !== '')
    .map(skill => skill.trim());
}

/**
 * Compare skills and find matches and missing skills
 * @param {Set} candidateSet - Set of normalized candidate skills
 * @param {Array<string>} requiredSkills - Array of required skills (original case)
 * @returns {Object} - Object with matched and missing arrays
 */
function compareSkillSets(candidateSet, requiredSkills) {
  const matched = [];
  const missing = [];
  const addedMatched = new Set();
  const addedMissing = new Set();

  requiredSkills.forEach(skill => {
    const normalized = normalizeSkill(skill);
    
    if (candidateSet.has(normalized)) {
      // Skill is matched
      if (!addedMatched.has(normalized)) {
        matched.push(skill);
        addedMatched.add(normalized);
      }
    } else {
      // Skill is missing
      if (!addedMissing.has(normalized)) {
        missing.push(skill);
        addedMissing.add(normalized);
      }
    }
  });

  return { matched, missing };
}

/**
 * Compare resume skills with weighted job description skills
 * @param {Array<string>} resumeSkills - Skills extracted from resume
 * @param {Array<string>} coreSkills - Core/required skills from JD
 * @param {Array<string>} optionalSkills - Optional/nice-to-have skills from JD
 * @returns {Object} - Object containing matched and missing skills for both core and optional
 */
function compareWeightedSkills(resumeSkills, coreSkills, optionalSkills) {
  // Normalize and validate inputs
  const normalizedResumeSkills = normalizeSkillsArray(resumeSkills);
  const normalizedCoreSkills = normalizeSkillsArray(coreSkills);
  const normalizedOptionalSkills = normalizeSkillsArray(optionalSkills);

  // Create a set of normalized resume skills for efficient lookup
  const resumeSkillSet = new Set(
    normalizedResumeSkills.map(skill => normalizeSkill(skill))
  );

  // Compare core skills
  const coreComparison = compareSkillSets(resumeSkillSet, normalizedCoreSkills);

  // Compare optional skills
  const optionalComparison = compareSkillSets(resumeSkillSet, normalizedOptionalSkills);

  return {
    matchedCoreSkills: coreComparison.matched,
    missingCoreSkills: coreComparison.missing,
    matchedOptionalSkills: optionalComparison.matched,
    missingOptionalSkills: optionalComparison.missing
  };
}

// =================== EXPORTS ===================
module.exports = {
  compareWeightedSkills
};