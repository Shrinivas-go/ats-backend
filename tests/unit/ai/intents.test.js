/**
 * Unit Tests for Intent Detection
 * Tests: analyzeQuery, detectIntent, validateDomain
 */

const { analyzeQuery, detectIntent, validateDomain } = require('../../../src/ai/intents');

describe('Intent Detection', () => {
    // =================== DOMAIN VALIDATION TESTS ===================

    describe('validateDomain', () => {
        test('should accept resume-related queries', () => {
            const result = validateDomain('Why is my resume score low?');
            expect(result.isValid).toBe(true);
        });

        test('should accept ATS-related queries', () => {
            const result = validateDomain('What is my ATS score?');
            expect(result.isValid).toBe(true);
        });

        test('should accept skills queries', () => {
            const result = validateDomain('What skills am I missing?');
            expect(result.isValid).toBe(true);
        });

        test('should reject weather queries', () => {
            const result = validateDomain('What is the weather today?');
            expect(result.isValid).toBe(false);
        });

        test('should reject news queries', () => {
            const result = validateDomain('Tell me the latest news');
            expect(result.isValid).toBe(false);
        });

        test('should reject recipe queries', () => {
            const result = validateDomain('How do I cook pasta?');
            expect(result.isValid).toBe(false);
        });
    });

    // =================== INTENT DETECTION TESTS ===================

    describe('detectIntent', () => {
        test('should detect SCORE_EXPLANATION intent', () => {
            const result = detectIntent('Why is my score low?');
            expect(result.intent).toBe('SCORE_EXPLANATION');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should detect SKILLS_GAP intent', () => {
            const result = detectIntent('What skills am I missing?');
            expect(result.intent).toBe('SKILLS_GAP');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should detect JD_MATCH intent', () => {
            const result = detectIntent('How well do I match this job?');
            expect(result.intent).toBe('JD_MATCH');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should detect EXPERIENCE_IMPROVE intent', () => {
            const result = detectIntent('How can I improve my experience section?');
            expect(result.intent).toBe('EXPERIENCE_IMPROVE');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should detect KEYWORD_SUGGESTION intent', () => {
            const result = detectIntent('Suggest keywords for my resume');
            expect(result.intent).toBe('KEYWORD_SUGGESTION');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should detect FORMATTING_FEEDBACK intent', () => {
            const result = detectIntent('Are there any format issues with my resume structure?');
            expect(result.intent).toBe('FORMATTING_FEEDBACK');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should detect RESUME_REWRITE intent', () => {
            const result = detectIntent('Rewrite this bullet point and use stronger action verbs');
            expect(result.intent).toBe('RESUME_REWRITE');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should request clarification for ambiguous queries', () => {
            const result = detectIntent('help');
            expect(result.needsClarification).toBe(true);
        });
    });

    // =================== ANALYZE QUERY TESTS ===================

    describe('analyzeQuery', () => {
        test('should return valid result for domain query', () => {
            const result = analyzeQuery('Why is my score low? Explain my ATS result.');
            expect(result.isValid).toBe(true);
            expect(result.intent).toBe('SCORE_EXPLANATION');
        });

        test('should return OUT_OF_SCOPE for off-topic queries', () => {
            const result = analyzeQuery('What is the stock price of Apple?');
            expect(result.isValid).toBe(false);
            expect(result.intent).toBe('OUT_OF_SCOPE');
        });

        test('should return INVALID_INPUT for empty query', () => {
            const result = analyzeQuery('');
            expect(result.isValid).toBe(false);
            expect(result.intent).toBe('INVALID_INPUT');
        });

        test('should return INVALID_INPUT for null query', () => {
            const result = analyzeQuery(null);
            expect(result.isValid).toBe(false);
            expect(result.intent).toBe('INVALID_INPUT');
        });

        test('should handle mixed case queries', () => {
            const result = analyzeQuery('WHY IS MY SCORE SO LOW?');
            expect(result.isValid).toBe(true);
            expect(result.intent).toBe('SCORE_EXPLANATION');
        });
    });

    // =================== DETERMINISM TESTS ===================

    describe('Determinism', () => {
        test('should return same result for same input', () => {
            const query = 'What skills are missing from my resume?';
            const result1 = analyzeQuery(query);
            const result2 = analyzeQuery(query);

            expect(result1.intent).toBe(result2.intent);
            expect(result1.confidence).toBe(result2.confidence);
        });
    });
});
