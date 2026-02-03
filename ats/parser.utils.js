const pdfParse = require('pdf-parse');

/**
 * Clean text by removing extra whitespace and special characters
 */
function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extract contact information (Email, Phone, Links)
 */
function extractContactInfo(text) {
    // Email regex (improved)
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emailMatch = text.match(emailRegex);

    // Phone regex (support various formats)
    const phoneRegex = /(?:(?:\+|00)88|01)?\d{11}|(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/g;
    const phoneMatch = text.match(phoneRegex);

    // LinkedIn/GitHub links
    const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;
    const githubRegex = /github\.com\/[a-zA-Z0-9_-]+/gi;

    const linkedin = text.match(linkedinRegex);
    const github = text.match(githubRegex);

    return {
        email: emailMatch ? emailMatch[0].toLowerCase() : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        linkedin: linkedin ? `https://www.${linkedin[0]}` : null,
        github: github ? `https://www.${github[0]}` : null,
    };
}

/**
 * Extract specific section content based on keywords
 */
function extractSection(text, lowerText, sectionKeywords, nextSectionKeywords) {
    // Find start index
    let startIndex = -1;
    let bestKeyword = '';

    for (const keyword of sectionKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        const match = regex.exec(text); // Use case-insensitive search on original text to preserve casing if needed, but indices matching lowerText logic

        // Simple indexOf is safer for raw text matching
        const idx = lowerText.indexOf(keyword.toLowerCase());

        if (idx !== -1) {
            // Heuristic: Header usually at start of line or properly spaced? 
            // For now, simple index
            if (startIndex === -1 || idx < startIndex) {
                startIndex = idx;
                bestKeyword = keyword;
            }
        }
    }

    if (startIndex === -1) return null;

    // Move start index past the keyword
    startIndex += bestKeyword.length;

    // Find end index (next section)
    let endIndex = text.length;
    for (const keyword of nextSectionKeywords) {
        const idx = lowerText.indexOf(keyword.toLowerCase(), startIndex + 50); // Offset to avoid finding current section title again
        if (idx !== -1 && idx < endIndex) {
            endIndex = idx;
        }
    }

    const content = text.slice(startIndex, endIndex).trim();

    // Split into lines and cleanup
    return content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 2); // Filter empty/short lines
}

/**
 * Detect Skills from text using regex list
 */
function extractSkills(text) {
    const skillPatterns = [
        // Languages
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Ruby', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin', 'Solidity',
        // Frontend
        'React', 'Angular', 'Vue', 'Next\\.js', 'Redux', 'HTML5', 'CSS3', 'Sass', 'Tailwind', 'Bootstrap', 'Material UI', 'Webpack', 'Vite',
        // Backend
        'Node\\.js', 'Express', 'NestJS', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'ASP\\.NET', 'FastAPI',
        // Database
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase', 'Neo4j', 'Cassandra', 'DynamoDB',
        // DevOps/Cloud
        'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible', 'CircleCI',
        // Tools
        'Git', 'Jira', 'Figma', 'Postman', 'Swagger',
        // AI/ML
        'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'OpenAI', 'LLM', 'NLP', 'Computer Vision'
    ];

    const foundSkills = new Set();
    const lowerText = text.toLowerCase();

    skillPatterns.forEach(pattern => {
        // Escape special chars for raw string usage if not regex
        // But pattern is regex string
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        if (regex.test(text)) {
            foundSkills.add(pattern.replace(/\\/g, ''));
        }
    });

    return Array.from(foundSkills);
}

/**
 * Parse Resume PDF Text into structured data
 */
function parseResumeText(text) {
    const clean = cleanText(text).replace(/\n/g, '\n '); // Normalize whitespace
    const lower = text.toLowerCase();

    // Extract Contact
    const contact = extractContactInfo(text);

    // Define section keywords
    const sections = {
        education: ['education', 'academic background', 'qualifications'],
        experience: ['experience', 'work history', 'professional experience', 'employment history'],
        projects: ['projects', 'personal projects', 'key projects'],
        skills: ['skills', 'technical skills', 'technologies', 'core competencies'],
        summary: ['summary', 'profile', 'objective', 'about me'],
        certifications: ['certifications', 'licences', 'courses']
    };

    const allKeywords = Object.values(sections).flat();

    // Extract sections
    const education = extractSection(text, lower, sections.education, allKeywords.filter(k => !sections.education.includes(k)));
    const experience = extractSection(text, lower, sections.experience, allKeywords.filter(k => !sections.experience.includes(k)));
    const projects = extractSection(text, lower, sections.projects, allKeywords.filter(k => !sections.projects.includes(k)));
    const extractedSkills = extractSection(text, lower, sections.skills, allKeywords.filter(k => !sections.skills.includes(k)));

    // If explicit skills section found, try to parse list from it, otherwise parse whole doc
    const skillsList = extractSkills(extractedSkills ? extractedSkills.join('\n') : text);

    // Attempt name extraction ( First few lines, exclude contacts )
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    let name = 'Candidate';

    // Basic heuristic: First line that isn't contact info and has decent length
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        const isEmail = /@/.test(line);
        const isPhone = /\d{10}/.test(line);
        const isLink = /http|www/.test(line);

        if (!isEmail && !isPhone && !isLink && line.length > 3 && line.length < 50) {
            name = line;
            break;
        }
    }

    return {
        personalInfo: {
            name,
            ...contact
        },
        summary: extractSection(text, lower, sections.summary, allKeywords.filter(k => !sections.summary.includes(k))),
        experience: experience || [],
        education: education || [],
        projects: projects || [],
        skills: skillsList,
        rawText: text
    };
}

module.exports = {
    parseResumeText,
    extractSkills
};
