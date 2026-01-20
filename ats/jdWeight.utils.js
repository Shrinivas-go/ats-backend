// =================== WEIGHTED JOB DESCRIPTION UTILITIES ===================
// File: backend/ats/jdWeight.utils.js
// Purpose: Extract skills from job description with priority weighting

/**
 * Predefined skill list for matching against job descriptions
 */
const SKILL_LIST = [
  // Programming Languages
  'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'PHP', 'Ruby', 
  'Rust', 'Swift', 'Kotlin', 'Scala', 'MATLAB', 'Perl', 'Dart',
  
  // Frontend Technologies
  'React', 'Angular', 'Vue', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt.js', 
  'HTML', 'CSS', 'SASS', 'SCSS', 'Tailwind CSS', 'Bootstrap', 'jQuery',
  'Webpack', 'Vite', 'Redux', 'MobX', 'Gatsby',
  
  // Backend Technologies
  'Node.js', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 
  'Spring Boot', 'Spring', 'ASP.NET', '.NET', 'Laravel', 'Rails', 
  'Ruby on Rails', 'NestJS', 'Fastify', 'Koa',
  
  // Databases
  'MongoDB', 'MySQL', 'PostgreSQL', 'SQL', 'NoSQL', 'SQLite', 'Redis', 
  'Cassandra', 'DynamoDB', 'Firebase', 'Firestore', 'Oracle', 'SQL Server',
  'MariaDB', 'Elasticsearch', 'CouchDB',
  
  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 
  'CI/CD', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'CircleCI', 'Travis CI',
  'GitLab CI', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
  
  // Version Control & Tools
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
  
  // Testing
  'Jest', 'Mocha', 'Chai', 'Jasmine', 'Cypress', 'Selenium', 'Playwright',
  'JUnit', 'PyTest', 'unittest', 'Postman', 'TestNG',
  
  // Mobile Development
  'React Native', 'Flutter', 'Android', 'iOS', 'Xamarin', 'Ionic',
  
  // Data Science & ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
  'Scikit-learn', 'Pandas', 'NumPy', 'Data Analysis', 'Data Science',
  'Artificial Intelligence', 'NLP', 'Computer Vision', 'OpenCV',
  
  // Other Technologies
  'GraphQL', 'REST API', 'RESTful', 'Microservices', 'Agile', 'Scrum',
  'JIRA', 'Confluence', 'Linux', 'Unix', 'Bash', 'Shell Scripting',
  'OAuth', 'JWT', 'WebSockets', 'Socket.io', 'RabbitMQ', 'Kafka',
  'API', 'JSON', 'XML', 'YAML', 'Nginx', 'Apache'
];

/**
 * Keywords that indicate core/required skills
 */
const CORE_KEYWORDS = [
  'must have',
  'required',
  'essential',
  'mandatory',
  'necessary',
  'critical',
  'need to have',
  'must know',
  'expertise in',
  'proficiency in',
  'experience with',
  'strong knowledge',
  'required skills',
  'requirements',
  'qualifications'
];

/**
 * Keywords that indicate optional/nice-to-have skills
 */
const OPTIONAL_KEYWORDS = [
  'good to have',
  'nice to have',
  'optional',
  'plus',
  'bonus',
  'preferred',
  'desirable',
  'advantage',
  'beneficial',
  'would be a plus',
  'nice if you have',
  'additional skills',
  'preferred qualifications'
];

/**
 * Extract weighted skills from job description text
 * @param {string} jdText - The job description text to analyze
 * @returns {Object} - Object containing coreSkills and optionalSkills arrays
 */
function extractWeightedJDSkills(jdText) {
  // Validate input
  if (!jdText || typeof jdText !== 'string') {
    return {
      coreSkills: [],
      optionalSkills: []
    };
  }

  // Split text into sections/sentences for context analysis
  const lines = jdText.split(/\n|\./).map(line => line.trim()).filter(line => line);

  // Store skills with their context
  const coreSkillsSet = new Set();
  const optionalSkillsSet = new Set();
  const allSkillsSet = new Set();

  // Process each line to find skills with context
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();

    // Check if line contains core or optional keywords
    const isCoreContext = CORE_KEYWORDS.some(keyword => lowerLine.includes(keyword));
    const isOptionalContext = OPTIONAL_KEYWORDS.some(keyword => lowerLine.includes(keyword));

    // Find skills in this line
    SKILL_LIST.forEach(skill => {
      const lowerSkill = skill.toLowerCase();

      // Skip skills shorter than 3 characters
      if (lowerSkill.length < 3) {
        return;
      }

      // Create regex with word boundaries
      const regex = new RegExp(`\\b${escapeRegex(lowerSkill)}\\b`, 'i');

      if (regex.test(line)) {
        allSkillsSet.add(skill);

        // Categorize based on context
        if (isCoreContext) {
          coreSkillsSet.add(skill);
        } else if (isOptionalContext) {
          optionalSkillsSet.add(skill);
        }
      }
    });
  });

  // Convert sets to arrays
  let coreSkills = Array.from(coreSkillsSet);
  let optionalSkills = Array.from(optionalSkillsSet);

  // If no context keywords found, treat all detected skills as core
  if (coreSkills.length === 0 && optionalSkills.length === 0 && allSkillsSet.size > 0) {
    coreSkills = Array.from(allSkillsSet);
  }

  // Remove duplicates: if a skill is in both, keep it only in core
  optionalSkills = optionalSkills.filter(skill => !coreSkillsSet.has(skill));

  return {
    coreSkills,
    optionalSkills
  };
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} - Escaped string safe for regex
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =================== EXPORTS ===================
module.exports = {
  extractWeightedJDSkills
};