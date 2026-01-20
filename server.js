// =================== IMPORT REQUIRED PACKAGES ===================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Import ATS utility functions
const { extractJDSkills } = require('./ats/jd.utils');
const { compareSkills } = require('./ats/compare.utils');
const { calculateATSScore } = require('./ats/score.utils');
const { normalizeSkills } = require('./ats/normalize.utils');
const { extractWeightedJDSkills } = require('./ats/jdWeight.utils');
const { compareWeightedSkills } = require('./ats/compareWeighted.utils');
const { calculateWeightedATSScore } = require('./ats/scoreWeighted.utils');
const { generateATSFeedback } = require('./ats/feedback.utils');
const { simulateATSImprovements } = require('./ats/simulator.utils');

const fs = require("fs");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// =================== INITIALIZE EXPRESS APP ===================
const app = express();

// =================== MIDDLEWARE ===================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =================== MONGODB CONNECTION ===================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// =================== USER SCHEMA & MODEL ===================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// =================== FILE UPLOAD CONFIGURATION ===================
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// =================== HELPER FUNCTION FOR RESUME PARSING ===================

/**
 * Extracts structured data from resume text
 * @param {string} text - Raw text extracted from PDF
 * @returns {object} Parsed resume data
 */
function extractSections(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  const lowerText = text.toLowerCase();

  // Regex declarations moved to the top of the function
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:(?:\+?(\d{1,3}))?[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})(?:\s*(?:#|x.?|ext.?|extension)\s*(\d+))?/g;

  // ========== EXTRACT NAME (usually the first non-empty line) ==========
  let name = 'Not found';
  // Attempt to find a prominent name, often in the first few lines
  const nameCandidate = lines.slice(0, Math.min(5, lines.length)).find(line => {
    // Exclude lines that look like emails or phone numbers
    return !emailRegex.test(line) && !phoneRegex.test(line) && line.length > 5;
  });
  if (nameCandidate) {
    name = nameCandidate;
  } else if (lines.length > 0) {
    // Fallback to the first line if no better candidate is found
    name = lines[0];
  }

  // ========== EXTRACT EMAIL ========== 
  const emailMatch = text.match(emailRegex);
  const email = emailMatch && emailMatch.length > 0 ? emailMatch[0] : 'Not found';

  // ========== EXTRACT PHONE ========== 
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch && phoneMatch.length > 0 ? phoneMatch[0] : 'Not found';

  // ========== EXTRACT SKILLS ==========
  // Find skills section and extract skills
  const skillsKeywords = ['skills', 'technical skills', 'core competencies', 'technologies', 'proficiencies', 'expertise'];
  const skillPatterns = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Ruby', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin', 'Perl', 'Scala', 'R',
    'React', 'Angular', 'Vue', 'Node\\.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', '.NET', 'ASP\\.NET', 'Ruby on Rails',
    'MongoDB', 'MySQL', 'PostgreSQL', 'SQL', 'Oracle', 'Redis', 'Cassandra', 'DynamoDB', 'Firebase', 'SQLite',
    'HTML', 'CSS', 'SCSS', 'Sass', 'Less', 'Tailwind CSS', 'Bootstrap', 'Material-UI', 'Chakra UI',
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Travis CI', 'CircleCI', 'ArgoCD',
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
    'REST', 'GraphQL', 'API', 'Microservices', 'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Keras', 'Pandas', 'NumPy', 'SciPy', 'Scikit-learn',
    'Linux', 'Unix', 'Windows', 'MacOS', 'Shell Scripting', 'Bash', 'Zsh',
    'Azure DevOps', 'Jira', 'Confluence', 'Slack', 'Microsoft Teams',
    'Data Structures', 'Algorithms', 'Object-Oriented Programming', 'Functional Programming', 'Design Patterns'
  ];

  const skills = [];
  
  // Create regex pattern for all skills
  const skillRegex = new RegExp(skillPatterns.join('|'), 'gi');
  const skillMatches = text.match(skillRegex);
  
  if (skillMatches) {
    // Remove duplicates and normalize
    const uniqueSkills = [...new Set(skillMatches.map(s => {
      // Capitalize first letter
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }))];
    skills.push(...uniqueSkills);
  }

  // If no skills found, try extracting from skills section
  // If initial skill extraction is not comprehensive, try extracting from a dedicated skills section
  if (skills.length < 5) { // If fewer than 5 skills found by regex, try section extraction
    const skillsSectionStart = findSectionStart(lowerText, skillsKeywords);
    if (skillsSectionStart !== -1) {
      const nextSectionStart = findNextSection(lowerText, skillsSectionStart, ['education', 'experience', 'work history', 'employment', 'projects', 'awards']);
      const skillsText = text.slice(skillsSectionStart, nextSectionStart !== -1 ? nextSectionStart : text.length);
      const extractedSectionSkills = skillsText.split(/[,;\n•·-]/) // Split by common delimiters
                                        .map(s => s.trim())
                                        .filter(s => s.length > 2 && s.length < 50 && !/^\\d+$/.test(s)) // Basic validation
                                        .map(s => s.charAt(0).toUpperCase() + s.slice(1)); // Capitalize
      
      // Add newly found skills, avoiding duplicates
      extractedSectionSkills.forEach(skill => {
        if (!skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
          skills.push(skill);
        }
      });
    }
  }

  // ========== EXTRACT EDUCATION ==========
  const educationKeywords = ['education', 'academic', 'qualification'];
  const education = extractSection(text, lowerText, educationKeywords, ['experience', 'work history', 'skills', 'projects']);

  // ========== EXTRACT EXPERIENCE ==========
  const experienceKeywords = ['experience', 'work history', 'employment', 'professional experience'];
  const experience = extractSection(text, lowerText, experienceKeywords, ['education', 'skills', 'projects', 'certifications']);

  return {
    name: name || 'Not found',
    email: email || 'Not found',
    phone: phone || 'Not found',
    skills: skills.length > 0 ? skills : ['Not found'],
    education: education.length > 0 ? education : ['Not found'],
    experience: experience.length > 0 ? experience : ['Not found']
  };
}

/**
 * Finds the start index of a section based on keywords
 */
function findSectionStart(lowerText, keywords) {
  let bestIndex = -1;
  for (const keyword of keywords) {
    // Use word boundary to avoid partial matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    let match;
    while ((match = regex.exec(lowerText)) !== null) {
      if (bestIndex === -1 || match.index < bestIndex) {
        bestIndex = match.index;
      }
    }
  }
  return bestIndex;
}

/**
 * Finds the start of the next section
 */
function findNextSection(lowerText, currentStart, sectionKeywords) {
  let minIndex = -1;
  for (const keyword of sectionKeywords) {
    const index = lowerText.indexOf(keyword, currentStart + 1);
    if (index !== -1 && (minIndex === -1 || index < minIndex)) {
      minIndex = index;
    }
  }
  return minIndex;
}

/**
 * Extracts a specific section from resume text
 */
function extractSection(text, lowerText, startKeywords, endKeywords) {
  const startIndex = findSectionStart(lowerText, startKeywords);
  if (startIndex === -1) return [];

  const endIndex = findNextSection(lowerText, startIndex, endKeywords);
  const sectionText = text.slice(startIndex, endIndex !== -1 ? endIndex : text.length);

  // Extract lines from the section
  const lines = sectionText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(1, 25); // Skip header, take up to 25 lines for more content

  return lines;
}

// =================== ROUTES ===================

// ========== ROOT ROUTE ==========
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to ATS Resume Checker API',
    version: '2.0',
    endpoints: {
      register: 'POST /register',
      uploadResume: 'POST /upload-resume',
      parseResume: 'POST /parse-resume',
      extractJDSkills: 'POST /extract-jd-skills',
      compareSkills: 'POST /compare-skills',
      atsScore: 'POST /ats-score',
      atsScoreWeighted: 'POST /ats-score-weighted',
      atsSimulator: 'POST /ats-simulator'
    }
  });
});

// ========== USER REGISTRATION ==========
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email, and password' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create new user (NOTE: In production, hash the password using bcrypt)
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        email: newUser.email 
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration', 
      error: error.message 
    });
  }
});

// ========== UPLOAD RESUME (File Upload Only) ==========
app.post('/upload-resume', upload.single('resume'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please upload a PDF.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading file', 
      error: error.message 
    });
  }
});

// ========== PARSE RESUME (Upload + Parse) ==========
app.post('/parse-resume', upload.single('resume'), async (req, res) => {
  let filePath = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please upload a PDF resume.' 
      });
    }

    filePath = req.file.path;

    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse PDF to extract text
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;
    console.log('Extracted text from PDF:', text.substring(0, 500) + '...'); // Log first 500 chars

    // Extract structured data from text
    const extractedData = extractSections(text);
    console.log('Extracted data from resume:', JSON.stringify(extractedData, null, 2));

    // Clean up: Delete uploaded file after parsing
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Send successful response
    return res.status(200).json({ 
      success: true, 
      data: extractedData 
    });

  } catch (error) {
    console.error('Parse Error:', error);

    // Clean up file if it exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Error parsing resume', 
      error: error.message 
    });
  }
});

// ========== EXTRACT JD SKILLS ==========
app.post('/extract-jd-skills', (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'jobDescription is required'
      });
    }

    const skills = extractJDSkills(jobDescription);

    return res.json({
      success: true,
      skills
    });

  } catch (error) {
    console.error('Extract JD Skills Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error extracting skills from job description',
      error: error.message
    });
  }
});

// ========== COMPARE SKILLS ==========
app.post('/compare-skills', (req, res) => {
  try {
    const { resumeSkills, jobDescription } = req.body;

    if (!resumeSkills || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'resumeSkills and jobDescription are required'
      });
    }

    const jdSkills = extractJDSkills(jobDescription);
    const comparison = compareSkills(resumeSkills, jdSkills);

    return res.json({
      success: true,
      jdSkills,
      ...comparison
    });

  } catch (error) {
    console.error('Compare Skills Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error comparing skills',
      error: error.message
    });
  }
});

// ========== ATS SCORE (Basic) ==========
app.post('/ats-score', (req, res) => {
  try {
    const { resumeSkills, jobDescription } = req.body;

    if (!resumeSkills || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'resumeSkills and jobDescription are required'
      });
    }

    const jdSkills = extractJDSkills(jobDescription);
    const { matchedSkills, missingSkills } = compareSkills(resumeSkills, jdSkills);
    const { atsScore, explanation } = calculateATSScore(jdSkills, matchedSkills);

    return res.json({
      success: true,
      atsScore,
      explanation,
      matchedSkills,
      missingSkills
    });

  } catch (error) {
    console.error('ATS Score Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating ATS score',
      error: error.message
    });
  }
});

// ========== WEIGHTED ATS SCORE ==========
app.post('/ats-score-weighted', (req, res) => {
  try {
    const { resumeSkills, jobDescription } = req.body;

    if (!resumeSkills || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'resumeSkills and jobDescription are required'
      });
    }

    // Extract weighted JD skills
    const { coreSkills, optionalSkills } = extractWeightedJDSkills(jobDescription);

    // Compare resume vs weighted JD skills
    const comparison = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);

    // Calculate weighted ATS score
    const { atsScore, explanation } = calculateWeightedATSScore(comparison);

    // Generate ATS feedback
    const feedback = generateATSFeedback({
      atsScore,
      ...comparison
    });

    return res.json({
      success: true,
      atsScore,
      explanation,
      feedback,
      coreSkills,
      optionalSkills,
      ...comparison
    });

  } catch (error) {
    console.error('Weighted ATS Score Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating weighted ATS score',
      error: error.message
    });
  }
});

// ========== ATS SIMULATOR ==========
app.post('/ats-simulator', (req, res) => {
  try {
    const { resumeSkills, jobDescription } = req.body;

    if (!resumeSkills || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'resumeSkills and jobDescription are required'
      });
    }

    // Extract weighted JD skills
    const { coreSkills, optionalSkills } = extractWeightedJDSkills(jobDescription);

    // Compare resume vs weighted JD skills
    const comparison = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);

    // Simulate ATS score improvements
    const simulation = simulateATSImprovements({
      coreSkills,
      optionalSkills,
      ...comparison
    });

    return res.json({
      success: true,
      ...simulation
    });

  } catch (error) {
    console.error('ATS Simulator Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error running ATS simulation',
      error: error.message
    });
  }
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// =================== START SERVER ===================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve(uploadDir)}`);
  console.log(`💾 MongoDB connected: ${mongoose.connection.readyState === 1 ? 'Yes' : 'No'}`);
});