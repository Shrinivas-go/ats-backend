const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { checkCredits } = require('../middlewares/admin');
const User = require('../models/User');

/**
 * JD Generator Routes
 * Generates job descriptions based on input parameters
 * 
 * Note: This uses a rule-based approach since we don't have AI integration.
 * For production, integrate with OpenAI or similar for better results.
 */

// Template sections for job descriptions
const JD_TEMPLATES = {
    sections: {
        intro: {
            startup: 'We are a fast-growing startup looking for',
            corporate: 'We are seeking a highly qualified',
            agency: 'Our agency is looking for a talented',
            remote: 'We are hiring a remote-first',
        },
        culture: {
            startup: 'Join our dynamic team where innovation and agility drive everything we do. We value bold ideas and quick execution.',
            corporate: 'Be part of an established organization committed to excellence, professional development, and work-life balance.',
            agency: 'Work with diverse clients on exciting projects. Our collaborative environment fosters creativity and growth.',
            remote: 'Enjoy the flexibility of remote work while being part of a connected global team. We prioritize async communication and trust.',
        },
    },
    benefits: {
        standard: [
            'Competitive salary and performance bonuses',
            'Health, dental, and vision insurance',
            'Professional development budget',
            'Paid time off and holidays',
        ],
        premium: [
            'Equity/stock options',
            '401(k) matching',
            'Wellness programs and gym membership',
            'Annual company retreats',
            'Home office stipend',
        ],
    },
};

// Common skill sets by role category
const SKILL_MAPPINGS = {
    'software engineer': {
        required: ['Computer Science degree or equivalent', '3+ years of software development experience', 'Proficiency in at least one programming language'],
        preferred: ['Experience with cloud platforms (AWS, GCP, Azure)', 'Understanding of CI/CD pipelines', 'Strong problem-solving skills'],
    },
    'frontend developer': {
        required: ['Proficiency in JavaScript, HTML, CSS', 'Experience with React, Vue, or Angular', 'Understanding of responsive design'],
        preferred: ['Experience with TypeScript', 'Knowledge of testing frameworks', 'UI/UX design sensibility'],
    },
    'backend developer': {
        required: ['Experience with server-side languages (Node.js, Python, Java)', 'Database design and management', 'API development experience'],
        preferred: ['Microservices architecture knowledge', 'Experience with containerization (Docker, Kubernetes)', 'Security best practices'],
    },
    'data scientist': {
        required: ['Strong background in statistics and mathematics', 'Proficiency in Python or R', 'Experience with machine learning frameworks'],
        preferred: ['PhD or Masters in relevant field', 'Experience with big data technologies', 'Strong communication skills'],
    },
    'product manager': {
        required: ['Experience leading product development', 'Strong analytical and problem-solving skills', 'Excellent communication abilities'],
        preferred: ['Technical background', 'Experience with Agile methodologies', 'User research experience'],
    },
    'default': {
        required: ['Relevant experience in the field', 'Strong communication skills', 'Ability to work in a team environment'],
        preferred: ['Industry-specific certifications', 'Leadership experience', 'Continuous learning mindset'],
    },
};

/**
 * POST /jd/generate
 * Generate a job description
 * Request body: { title, company, culture, level, includeSkills, customSkills }
 */
router.post('/generate', auth, async (req, res) => {
    try {
        const {
            title,
            company = 'Our Company',
            culture = 'startup',
            level = 'mid',
            includeSkills = true,
            customSkills = [],
            department = '',
            location = 'Remote',
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Job title is required',
            });
        }

        // Find matching skill set
        const titleLower = title.toLowerCase();
        let skillSet = JD_TEMPLATES.sections.intro.startup; // default

        for (const [key, skills] of Object.entries(SKILL_MAPPINGS)) {
            if (titleLower.includes(key) || key.includes(titleLower)) {
                skillSet = skills;
                break;
            }
        }
        if (!skillSet.required) skillSet = SKILL_MAPPINGS.default;

        // Experience level mapping
        const levelMap = {
            entry: '0-2 years',
            mid: '3-5 years',
            senior: '5-8 years',
            lead: '8+ years',
        };

        // Generate the job description
        const intro = JD_TEMPLATES.sections.intro[culture] || JD_TEMPLATES.sections.intro.startup;
        const cultureText = JD_TEMPLATES.sections.culture[culture] || JD_TEMPLATES.sections.culture.startup;

        let jd = `# ${title}\n\n`;
        jd += `**${company}** | ${location}${department ? ` | ${department}` : ''}\n\n`;

        jd += `## About the Role\n\n`;
        jd += `${intro} a ${level.charAt(0).toUpperCase() + level.slice(1)}-level ${title} to join our team. `;
        jd += `This is an exciting opportunity to make a significant impact on our products and customers.\n\n`;

        jd += `## About Us\n\n`;
        jd += `${cultureText}\n\n`;

        jd += `## Responsibilities\n\n`;
        jd += `- Lead and contribute to key projects and initiatives\n`;
        jd += `- Collaborate with cross-functional teams to deliver high-quality solutions\n`;
        jd += `- Participate in code reviews, design discussions, and technical planning\n`;
        jd += `- Mentor junior team members and contribute to team knowledge sharing\n`;
        jd += `- Stay current with industry trends and best practices\n\n`;

        if (includeSkills) {
            jd += `## Required Qualifications\n\n`;
            jd += `- ${levelMap[level]} of relevant experience\n`;
            skillSet.required.forEach(skill => {
                jd += `- ${skill}\n`;
            });

            // Add custom skills if provided
            if (customSkills.length > 0) {
                customSkills.forEach(skill => {
                    if (skill.trim()) jd += `- ${skill.trim()}\n`;
                });
            }

            jd += `\n## Preferred Qualifications\n\n`;
            skillSet.preferred.forEach(skill => {
                jd += `- ${skill}\n`;
            });
        }

        jd += `\n## Benefits\n\n`;
        JD_TEMPLATES.benefits.standard.forEach(benefit => {
            jd += `- ${benefit}\n`;
        });
        if (level === 'senior' || level === 'lead') {
            JD_TEMPLATES.benefits.premium.slice(0, 3).forEach(benefit => {
                jd += `- ${benefit}\n`;
            });
        }

        jd += `\n---\n\n`;
        jd += `*${company} is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.*`;

        res.json({
            success: true,
            jobDescription: jd,
            metadata: {
                title,
                company,
                culture,
                level,
                location,
                generatedAt: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('JD generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating job description',
        });
    }
});

/**
 * GET /jd/templates
 * Get available templates and options
 */
router.get('/templates', (req, res) => {
    res.json({
        success: true,
        cultures: ['startup', 'corporate', 'agency', 'remote'],
        levels: ['entry', 'mid', 'senior', 'lead'],
        suggestedTitles: [
            'Software Engineer',
            'Frontend Developer',
            'Backend Developer',
            'Full Stack Developer',
            'Data Scientist',
            'Product Manager',
            'UX Designer',
            'DevOps Engineer',
            'Marketing Manager',
            'Sales Representative',
        ],
    });
});

module.exports = router;
