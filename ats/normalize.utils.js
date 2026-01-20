// =================== SKILL NORMALIZATION UTILITIES ===================
// File: backend/ats/normalize.utils.js
// Purpose: Normalize skills by converting aliases to canonical names

/**
 * Skill aliases mapping
 * Maps common variations and aliases to their canonical skill names
 */
const SKILL_ALIASES = {
  // JavaScript variations
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ecmascript': 'JavaScript',
  
  // TypeScript variations
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  
  // Node.js variations
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  
  // React variations
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  
  // Vue variations
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  
  // Angular variations
  'angular': 'Angular',
  'angularjs': 'Angular',
  'angular.js': 'Angular',
  
  // Express variations
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'express.js': 'Express.js',
  
  // Next.js variations
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  
  // MongoDB variations
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'mongo db': 'MongoDB',
  
  // PostgreSQL variations
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'psql': 'PostgreSQL',
  
  // MySQL variations
  'mysql': 'MySQL',
  'my sql': 'MySQL',
  
  // Python variations
  'python': 'Python',
  'py': 'Python',
  
  // Java variations
  'java': 'Java',
  
  // C++ variations
  'c++': 'C++',
  'cpp': 'C++',
  'cplusplus': 'C++',
  
  // C# variations
  'c#': 'C#',
  'csharp': 'C#',
  'c sharp': 'C#',
  
  // Docker variations
  'docker': 'Docker',
  'dockerfile': 'Docker',
  
  // Kubernetes variations
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'kube': 'Kubernetes',
  
  // AWS variations
  'aws': 'AWS',
  'amazon web services': 'AWS',
  
  // Azure variations
  'azure': 'Azure',
  'microsoft azure': 'Azure',
  
  // GCP variations
  'gcp': 'Google Cloud',
  'google cloud': 'Google Cloud',
  'google cloud platform': 'Google Cloud',
  
  // Git variations
  'git': 'Git',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  
  // HTML variations
  'html': 'HTML',
  'html5': 'HTML',
  
  // CSS variations
  'css': 'CSS',
  'css3': 'CSS',
  
  // SQL variations
  'sql': 'SQL',
  'structured query language': 'SQL',
  
  // NoSQL variations
  'nosql': 'NoSQL',
  'no sql': 'NoSQL',
  
  // REST API variations
  'rest': 'REST API',
  'rest api': 'REST API',
  'restful': 'RESTful',
  'restful api': 'REST API',
  
  // GraphQL variations
  'graphql': 'GraphQL',
  'graph ql': 'GraphQL',
  
  // CI/CD variations
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'continuous integration': 'CI/CD',
  
  // Machine Learning variations
  'ml': 'Machine Learning',
  'machine learning': 'Machine Learning',
  
  // Artificial Intelligence variations
  'ai': 'AI',
  'artificial intelligence': 'Artificial Intelligence',
  
  // Redux variations
  'redux': 'Redux',
  'redux toolkit': 'Redux',
  
  // Tailwind variations
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS'
};

/**
 * Normalize an array of skills
 * Converts aliases to canonical names and removes duplicates
 * @param {Array<string>} skillsArray - Array of skill strings to normalize
 * @returns {Array<string>} - Array of normalized, unique skills
 */
function normalizeSkills(skillsArray) {
  // Validate input
  if (!Array.isArray(skillsArray)) {
    return [];
  }

  // Filter out non-string values and empty strings
  const validSkills = skillsArray.filter(
    skill => typeof skill === 'string' && skill.trim() !== ''
  );

  // Set to track unique normalized skills (case-insensitive)
  const normalizedSet = new Set();
  const normalizedSkills = [];

  validSkills.forEach(skill => {
    // Trim and convert to lowercase for lookup
    const trimmedSkill = skill.trim();
    const lowerSkill = trimmedSkill.toLowerCase();

    // Check if skill has an alias mapping
    const canonicalSkill = SKILL_ALIASES[lowerSkill] || trimmedSkill;

    // Use lowercase version for duplicate checking
    const canonicalLower = canonicalSkill.toLowerCase();

    // Add only if not already present (case-insensitive)
    if (!normalizedSet.has(canonicalLower)) {
      normalizedSet.add(canonicalLower);
      normalizedSkills.push(canonicalSkill);
    }
  });

  return normalizedSkills;
}

// =================== EXPORTS ===================
module.exports = {
  normalizeSkills,
  SKILL_ALIASES // Export aliases in case other modules need it
};