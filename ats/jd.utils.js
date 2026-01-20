// =================== JOB DESCRIPTION UTILITIES ===================
// File: backend/ats/jd.utils.js
// Purpose: Extract skills from job description text

/**
 * Predefined skill list for matching against job descriptions
 * Add more skills as needed for your ATS system
 */
const SKILL_LIST = [
  // Programming Languages
  'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'PHP', 'Ruby', 
  'Go', 'Rust', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Dart',
  
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
  'AI', 'Artificial Intelligence', 'NLP', 'Computer Vision', 'OpenCV',
  
  // Other Technologies
  'GraphQL', 'REST API', 'RESTful', 'Microservices', 'Agile', 'Scrum',
  'JIRA', 'Confluence', 'Linux', 'Unix', 'Bash', 'Shell Scripting',
  'OAuth', 'JWT', 'WebSockets', 'Socket.io', 'RabbitMQ', 'Kafka',
  'API', 'JSON', 'XML', 'YAML', 'Nginx', 'Apache'
];

/**
 * Extract skills from job description text
 * @param {string} jobDescriptionText - The job description text to analyze
 * @returns {Array<string>} - Array of matched skills (case-preserved from SKILL_LIST)
 */
function extractJDSkills(jobDescriptionText) {
  // Validate input
  if (!jobDescriptionText || typeof jobDescriptionText !== 'string') {
    return [];
  }

  // Convert job description to lowercase for case-insensitive matching
  const lowerText = jobDescriptionText.toLowerCase();

  // Find matching skills
  const matchedSkills = [];
  const addedSkills = new Set(); // Track added skills to avoid duplicates

  SKILL_LIST.forEach(skill => {
    const lowerSkill = skill.toLowerCase();
    
    // Skip skills shorter than 3 characters to avoid false matches
    if (lowerSkill.length < 3) {
      return;
    }
    
    // Create regex with word boundaries for exact word matching
    // \b ensures we match whole words only
    const regex = new RegExp(`\\b${escapeRegex(lowerSkill)}\\b`, 'i');
    
    // Check if skill exists as a complete word in the text
    if (regex.test(jobDescriptionText)) {
      // Avoid duplicates (case-insensitive check)
      if (!addedSkills.has(lowerSkill)) {
        matchedSkills.push(skill); // Add original case from SKILL_LIST
        addedSkills.add(lowerSkill);
      }
    }
  });

  return matchedSkills;
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
  extractJDSkills,
  SKILL_LIST // Export skill list in case other modules need it
};