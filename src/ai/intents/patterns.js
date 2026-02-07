/**
 * Intent Patterns for AI Assistant
 * Rule-based intent classification using keywords and regex
 * 
 * NO machine learning - deterministic pattern matching only
 */

// =================== DOMAIN KEYWORDS ===================
// Keywords that indicate the query is within our domain
const DOMAIN_KEYWORDS = [
    'resume', 'cv', 'ats', 'score', 'skills', 'experience', 'job',
    'description', 'keywords', 'match', 'format', 'bullet', 'section',
    'work history', 'education', 'certification', 'qualification',
    'hiring', 'recruiter', 'applicant', 'tracking', 'optimize',
    'improve', 'rewrite', 'rephrase', 'missing', 'weak', 'strong'
];

// =================== INTENT PATTERNS ===================
const INTENT_PATTERNS = {
    SCORE_EXPLANATION: {
        keywords: ['score', 'why', 'low', 'high', 'explain', 'breakdown', 'rating', 'grade', 'result', 'percentage'],
        phrases: [
            /why\s+(is|was)\s+(my|the)\s+score/i,
            /explain\s+(my|the)\s+score/i,
            /score\s+(is|was)\s+(low|high|bad|good)/i,
            /how\s+did\s+i\s+(score|do|perform)/i,
            /what\s+does\s+(my|the)\s+score\s+mean/i,
            /breakdown\s+(of|for)\s+(my|the)\s+score/i
        ],
        baseConfidence: 0.9,
        priority: 1
    },

    SKILLS_GAP: {
        keywords: ['missing', 'skills', 'gap', 'lack', 'need', 'required', 'keywords', 'absent', 'not found'],
        phrases: [
            /what\s+(skills|keywords)\s+(am\s+i|are)\s+missing/i,
            /missing\s+(skills|keywords)/i,
            /skills?\s+gap/i,
            /what\s+(should|do)\s+i\s+(add|include)/i,
            /which\s+(skills|keywords)\s+(are|were)\s+not\s+found/i
        ],
        baseConfidence: 0.9,
        priority: 2
    },

    JD_MATCH: {
        keywords: ['match', 'job', 'description', 'fit', 'aligned', 'relevant', 'compatible', 'suitable'],
        phrases: [
            /how\s+(well\s+)?(do|does)\s+(i|it|my resume)\s+match/i,
            /match\s+(percentage|rate|score)/i,
            /fit\s+for\s+(this|the)\s+job/i,
            /aligned\s+with\s+(the\s+)?job/i,
            /compare\s+(to|with)\s+(the\s+)?job/i
        ],
        baseConfidence: 0.9,
        priority: 3
    },

    EXPERIENCE_IMPROVE: {
        keywords: ['experience', 'work', 'history', 'weak', 'improve', 'better', 'strengthen', 'enhance', 'bullets'],
        phrases: [
            /improve\s+(my\s+)?experience/i,
            /weak\s+(experience|work\s+history)/i,
            /how\s+(can|do)\s+i\s+(improve|enhance)\s+(my\s+)?experience/i,
            /experience\s+section\s+(is|looks)\s+(weak|bad)/i,
            /make\s+(my\s+)?experience\s+(better|stronger)/i
        ],
        baseConfidence: 0.85,
        priority: 4
    },

    KEYWORD_SUGGESTION: {
        keywords: ['suggest', 'recommend', 'add', 'include', 'keywords', 'terms', 'phrases', 'words'],
        phrases: [
            /suggest\s+(keywords|skills|terms)/i,
            /what\s+(keywords|skills)\s+(should|can)\s+i\s+add/i,
            /recommend\s+(any\s+)?(keywords|skills)/i,
            /keywords?\s+to\s+(add|include)/i
        ],
        baseConfidence: 0.85,
        priority: 5
    },

    FORMATTING_FEEDBACK: {
        keywords: ['format', 'layout', 'structure', 'design', 'template', 'sections', 'organize', 'length', 'pages'],
        phrases: [
            /format(ting)?\s+(issues?|problems?|feedback)/i,
            /(is|was)\s+(the|my)\s+format/i,
            /how\s+(is|should)\s+(the|my)\s+(format|layout|structure)/i,
            /structure\s+(of|for)\s+(my|the)\s+resume/i,
            /organize\s+(my|the)\s+resume/i
        ],
        baseConfidence: 0.85,
        priority: 6
    },

    RESUME_REWRITE: {
        keywords: ['rewrite', 'rephrase', 'reword', 'improve', 'bullet', 'sentence', 'stronger', 'action verbs'],
        phrases: [
            /rewrite\s+(this|my|the)\s+(bullet|sentence|point)/i,
            /rephrase\s+(this|my)/i,
            /make\s+(this|it)\s+(sound\s+)?(better|stronger|professional)/i,
            /improve\s+(this|my)\s+(bullet|sentence)/i,
            /use\s+(stronger|better|action)\s+verbs/i
        ],
        baseConfidence: 0.8,
        priority: 7
    },

    SECTION_ANALYSIS: {
        keywords: ['section', 'education', 'summary', 'objective', 'projects', 'certifications', 'analyze'],
        phrases: [
            /analyze\s+(my\s+)?(education|summary|projects)/i,
            /(education|summary|projects?)\s+section/i,
            /how\s+(is|was)\s+(my\s+)?(education|summary)/i,
            /feedback\s+(on|for)\s+(my\s+)?(education|summary)/i
        ],
        baseConfidence: 0.8,
        priority: 8
    }
};

// =================== REFUSAL PATTERNS ===================
// Queries that are clearly out of scope
const OFF_TOPIC_INDICATORS = [
    /weather/i, /news/i, /sports/i, /politics/i, /recipe/i, /cook/i,
    /movie/i, /music/i, /game/i, /play/i, /travel/i, /hotel/i,
    /restaurant/i, /shop/i, /buy/i, /price/i, /stock/i, /crypto/i,
    /health/i, /medical/i, /doctor/i, /legal/i, /lawyer/i,
    /math/i, /calculate/i, /translate/i, /language/i,
    /who\s+is/i, /what\s+year/i, /when\s+was/i, /history\s+of/i
];

// =================== CLARIFICATION TRIGGERS ===================
const AMBIGUOUS_PATTERNS = [
    /^help$/i,
    /^improve$/i,
    /^better$/i,
    /^fix$/i,
    /^(what|how)\s+now\??$/i
];

// =================== EXPORTS ===================
module.exports = {
    DOMAIN_KEYWORDS,
    INTENT_PATTERNS,
    OFF_TOPIC_INDICATORS,
    AMBIGUOUS_PATTERNS
};
