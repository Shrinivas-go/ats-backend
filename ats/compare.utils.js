// =================== SKILL COMPARISON UTILITIES ===================
// File: backend/ats/compare.utils.js
// Purpose: Compare resume skills against job description skills
const { normalizeSkills } = require('./normalize.utils');

/**
 * Compare resume skills with job description skills
 * @param {Array<string>} resumeSkills - Skills extracted from resume
 * @param {Array<string>} jdSkills - Skills extracted from job description
 * @returns {Object} - Object containing matchedSkills and missingSkills arrays
 */
function compareSkills(resumeSkills, jdSkills) {
  // Validate inputs
  if (!Array.isArray(resumeSkills)) resumeSkills = [];
  if (!Array.isArray(jdSkills)) jdSkills = [];

  // Normalize skills to lowercase for comparison
// Normalize skills using alias map
const normalizedResumeSkills = normalizeSkills(resumeSkills);
const normalizedJDSkills = normalizeSkills(jdSkills);


  // Create sets to avoid duplicates and for efficient lookup
  const resumeSkillSet = new Set(normalizedResumeSkills);
  const jdSkillSet = new Set(normalizedJDSkills);

  // Find matched skills (skills present in both resume and JD)
  const matchedSkillsSet = new Set();
  const missingSkillsSet = new Set();

  // Check each JD skill
  jdSkillSet.forEach(jdSkill => {
    if (resumeSkillSet.has(jdSkill)) {
      matchedSkillsSet.add(jdSkill);
    } else {
      missingSkillsSet.add(jdSkill);
    }
  });

  // Convert sets back to arrays and preserve original casing from JD
  const matchedSkills = [];
  const missingSkills = [];
  
  normalizedJDSkills.forEach(skill => {
    if (matchedSkillsSet.has(skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });
  

  return {
    matchedSkills,
    missingSkills
  };
}

// =================== EXPORTS ===================
module.exports = {
  compareSkills
};