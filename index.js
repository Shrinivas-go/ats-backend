// =================== IMPORT REQUIRED PACKAGES ===================
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Import config
const config = require('./src/config/env');

// Import routes
const authRoutes = require('./src/routes/auth.routes');

// Import utilities
const { parseResumeText } = require('./ats/parser.utils');
const { analyzeResume } = require('./ats/analyzer.utils');
const { apiLimiter, uploadLimiter } = require('./src/middlewares/rateLimiter');

// Import ATS utility functions
const { extractJDSkills } = require('./ats/jd.utils');
const { compareSkills } = require('./ats/compare.utils');
const { calculateATSScore } = require('./ats/score.utils');
const { extractWeightedJDSkills } = require('./ats/jdWeight.utils');
const { compareWeightedSkills } = require('./ats/compareWeighted.utils');
const { calculateWeightedATSScore } = require('./ats/scoreWeighted.utils');
const { generateATSFeedback } = require('./ats/feedback.utils');
const { simulateATSImprovements } = require('./ats/simulator.utils');

// =================== INITIALIZE EXPRESS APP ===================
const app = express();

// =================== SECURITY MIDDLEWARE ===================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// =================== CORS CONFIGURATION ===================
app.use(cors({
  origin: config.cors.frontendUrl,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// =================== BODY PARSING ===================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// =================== RATE LIMITING (Global) ===================
app.use('/api', apiLimiter);

// =================== MONGODB CONNECTION ===================
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri || process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    // Don't exit process in dev, just log
    // process.exit(1); 
  }
};

connectDB();

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB Reconnected');
});

// =================== FILE UPLOAD CONFIGURATION ===================
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
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

// =================== ROUTES ===================

// Auth routes
app.use('/auth', authRoutes);

// Legacy registration route (for backward compatibility)
app.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const User = require('./src/models/User');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ATS Resume Checker API',
    version: '2.0',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout',
        me: 'GET /auth/me',
      },
      resume: {
        upload: 'POST /upload-resume',
        parse: 'POST /parse-resume',
      },
      ats: {
        extractJDSkills: 'POST /extract-jd-skills',
        compareSkills: 'POST /compare-skills',
        score: 'POST /ats-score',
        scoreWeighted: 'POST /ats-score-weighted',
        simulator: 'POST /ats-simulator',
      }
    }
  });
});

// Resume upload
app.post('/upload-resume', uploadLimiter, upload.single('resume'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please upload a PDF.' });
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
    res.status(500).json({ success: false, message: 'Error uploading file', error: error.message });
  }
});

// Parse resume
app.post('/parse-resume', uploadLimiter, upload.single('resume'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please upload a PDF resume.' });
    }

    filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    const extractedData = parseResumeText(text);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({ success: true, data: extractedData });
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { }
    }
    return res.status(500).json({ success: false, message: 'Error parsing resume', error: error.message });
  }
});

// ATS endpoints (keeping existing functionality)
app.post('/extract-jd-skills', (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ success: false, message: 'jobDescription is required' });
    }
    const skills = extractJDSkills(jobDescription);
    return res.json({ success: true, skills });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error extracting skills', error: error.message });
  }
});

app.post('/compare-skills', (req, res) => {
  try {
    const { resumeSkills, jobDescription } = req.body;
    if (!resumeSkills || !jobDescription) {
      return res.status(400).json({ success: false, message: 'resumeSkills and jobDescription are required' });
    }
    const jdSkills = extractJDSkills(jobDescription);
    const comparison = compareSkills(resumeSkills, jdSkills);
    return res.json({ success: true, jdSkills, ...comparison });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error comparing skills', error: error.message });
  }
});

app.post('/ats-score', (req, res) => {
  try {
    const { resumeSkills, jobDescription } = req.body;
    if (!resumeSkills || !jobDescription) {
      return res.status(400).json({ success: false, message: 'resumeSkills and jobDescription are required' });
    }
    const jdSkills = extractJDSkills(jobDescription);
    const { matchedSkills, missingSkills } = compareSkills(resumeSkills, jdSkills);
    const { atsScore, explanation } = calculateATSScore(jdSkills, matchedSkills);
    return res.json({ success: true, atsScore, explanation, matchedSkills, missingSkills });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error calculating ATS score', error: error.message });
  }
});

app.post('/ats-score-weighted', (req, res) => {
  try {
    const { resumeSkills, jobDescription } = req.body;
    if (!resumeSkills || !jobDescription) {
      return res.status(400).json({ success: false, message: 'resumeSkills and jobDescription are required' });
    }

    const { coreSkills, optionalSkills } = extractWeightedJDSkills(jobDescription);
    const comparison = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);
    const { atsScore, explanation } = calculateWeightedATSScore(comparison);
    const feedback = generateATSFeedback({ atsScore, ...comparison });

    return res.json({ success: true, atsScore, explanation, feedback, coreSkills, optionalSkills, ...comparison });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error calculating weighted ATS score', error: error.message });
  }
});

app.post('/ats-simulator', (req, res) => {
  try {
    const { resumeSkills, jobDescription } = req.body;
    if (!resumeSkills || !jobDescription) {
      return res.status(400).json({ success: false, message: 'resumeSkills and jobDescription are required' });
    }

    const { coreSkills, optionalSkills } = extractWeightedJDSkills(jobDescription);
    const comparison = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);
    const simulation = simulateATSImprovements({ coreSkills, optionalSkills, ...comparison });

    return res.json({ success: true, ...simulation });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error running ATS simulation', error: error.message });
  }
});

app.post('/ats-analyze', (req, res) => {
  try {
    const { parsedResume, jobDescription } = req.body;
    if (!parsedResume || !jobDescription) {
      return res.status(400).json({ success: false, message: 'parsedResume and jobDescription are required' });
    }

    const result = analyzeResume(parsedResume, jobDescription);
    return res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ success: false, message: 'Error analyzing resume', error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: 'File upload error', error: err.message });
  }

  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// =================== START SERVER ===================
const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve(uploadDir)}`);
  console.log(`🔐 Auth routes: /auth/register, /auth/login, /auth/refresh, /auth/logout`);
});
