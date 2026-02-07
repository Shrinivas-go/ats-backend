/**
 * Unit Tests for ATS Feedback Generator
 * Tests: generateATSFeedback function
 * 
 * Test Philosophy:
 * - Pure function testing (no DB, no network)
 * - Test all score ranges and recommendation logic
 */

const { generateATSFeedback } = require('../../../ats/feedback.utils');

describe('generateATSFeedback', () => {
    // =================== SUMMARY GENERATION TESTS ===================

    describe('Summary Generation by Score Range', () => {
        test('should generate "Excellent match" summary for scores >= 80', () => {
            const input = {
                atsScore: 85,
                matchedCoreSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
                missingCoreSkills: [],
                matchedOptionalSkills: ['Docker'],
                missingOptionalSkills: [],
            };

            const result = generateATSFeedback(input);

            expect(result.summary).toContain('Excellent match');
            expect(result.summary).toContain('85%');
        });

        test('should generate "Good match" summary for scores 60-79', () => {
            const input = {
                atsScore: 65,
                matchedCoreSkills: ['JavaScript', 'React'],
                missingCoreSkills: ['Node.js'],
                matchedOptionalSkills: ['Docker'],
                missingOptionalSkills: ['AWS'],
            };

            const result = generateATSFeedback(input);

            expect(result.summary).toContain('Good match');
            expect(result.summary).toContain('65%');
        });

        test('should generate "Moderate match" summary for scores 40-59', () => {
            const input = {
                atsScore: 45,
                matchedCoreSkills: ['JavaScript'],
                missingCoreSkills: ['React', 'Node.js', 'TypeScript'],
                matchedOptionalSkills: [],
                missingOptionalSkills: ['Docker', 'AWS'],
            };

            const result = generateATSFeedback(input);

            expect(result.summary).toContain('Moderate match');
        });

        test('should generate "Limited match" summary for scores < 40', () => {
            const input = {
                atsScore: 20,
                matchedCoreSkills: [],
                missingCoreSkills: ['JavaScript', 'React', 'Node.js'],
                matchedOptionalSkills: [],
                missingOptionalSkills: ['Docker', 'AWS'],
            };

            const result = generateATSFeedback(input);

            expect(result.summary).toContain('Limited match');
        });
    });

    // =================== RECOMMENDATION TESTS ===================

    describe('Recommendation Generation', () => {
        test('should recommend adding missing core skills', () => {
            const input = {
                atsScore: 50,
                matchedCoreSkills: ['JavaScript'],
                missingCoreSkills: ['React', 'Node.js'],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = generateATSFeedback(input);

            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.recommendations.some(r =>
                r.includes('React') || r.includes('Node.js')
            )).toBe(true);
        });

        test('should recommend single core skill when only one missing', () => {
            const input = {
                atsScore: 70,
                matchedCoreSkills: ['JavaScript', 'React'],
                missingCoreSkills: ['Node.js'],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = generateATSFeedback(input);

            expect(result.recommendations.some(r =>
                r.includes('Node.js')
            )).toBe(true);
        });

        test('should recommend optional skills for competitive edge', () => {
            const input = {
                atsScore: 75,
                matchedCoreSkills: ['JavaScript', 'React', 'Node.js'],
                missingCoreSkills: [],
                matchedOptionalSkills: [],
                missingOptionalSkills: ['Docker', 'AWS'],
            };

            const result = generateATSFeedback(input);

            expect(result.recommendations.some(r =>
                r.includes('Docker') || r.includes('AWS') || r.includes('stand out')
            )).toBe(true);
        });

        test('should suggest skill development for very low scores', () => {
            const input = {
                atsScore: 15,
                matchedCoreSkills: [],
                missingCoreSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'],
                matchedOptionalSkills: [],
                missingOptionalSkills: ['Docker'],
            };

            const result = generateATSFeedback(input);

            expect(result.recommendations.some(r =>
                r.toLowerCase().includes('skill development') ||
                r.toLowerCase().includes('gaining experience')
            )).toBe(true);
        });

        test('should recommend highlighting existing skills for moderate scores', () => {
            const input = {
                atsScore: 55,
                matchedCoreSkills: ['JavaScript', 'React'],
                missingCoreSkills: ['Node.js', 'TypeScript'],
                matchedOptionalSkills: ['Docker'],
                missingOptionalSkills: ['AWS'],
            };

            const result = generateATSFeedback(input);

            expect(result.recommendations.some(r =>
                r.includes('JavaScript') || r.includes('React') || r.includes('prominently')
            )).toBe(true);
        });

        test('should always return at least one recommendation', () => {
            const input = {
                atsScore: 100,
                matchedCoreSkills: ['JavaScript', 'React', 'Node.js'],
                missingCoreSkills: [],
                matchedOptionalSkills: ['Docker', 'AWS'],
                missingOptionalSkills: [],
            };

            const result = generateATSFeedback(input);

            expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
        });
    });

    // =================== EDGE CASE TESTS ===================

    describe('Edge Cases', () => {
        test('should handle empty skills arrays', () => {
            const input = {
                atsScore: 0,
                matchedCoreSkills: [],
                missingCoreSkills: [],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = generateATSFeedback(input);

            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('recommendations');
            expect(Array.isArray(result.recommendations)).toBe(true);
        });

        test('should handle undefined skills arrays', () => {
            const input = {
                atsScore: 50,
                // matchedCoreSkills not provided
            };

            const result = generateATSFeedback(input);

            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('recommendations');
        });

        test('should handle score of 0', () => {
            const input = {
                atsScore: 0,
                matchedCoreSkills: [],
                missingCoreSkills: ['JavaScript', 'React'],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = generateATSFeedback(input);

            expect(result.summary).toBeDefined();
            expect(result.recommendations.length).toBeGreaterThan(0);
        });

        test('should handle score of 100', () => {
            const input = {
                atsScore: 100,
                matchedCoreSkills: ['JavaScript', 'React', 'Node.js'],
                missingCoreSkills: [],
                matchedOptionalSkills: ['Docker', 'AWS'],
                missingOptionalSkills: [],
            };

            const result = generateATSFeedback(input);

            expect(result.summary).toContain('Excellent');
        });

        test('should handle many missing core skills', () => {
            const input = {
                atsScore: 10,
                matchedCoreSkills: [],
                missingCoreSkills: ['JS', 'React', 'Node', 'TypeScript', 'Python', 'Java'],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = generateATSFeedback(input);

            // Should prioritize top 3 skills in recommendations
            expect(result.recommendations.length).toBeGreaterThan(0);
        });
    });

    // =================== RETURN STRUCTURE TESTS ===================

    describe('Return Structure', () => {
        test('should return object with summary and recommendations', () => {
            const input = {
                atsScore: 70,
                matchedCoreSkills: ['JavaScript'],
                missingCoreSkills: ['React'],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = generateATSFeedback(input);

            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('recommendations');
            expect(typeof result.summary).toBe('string');
            expect(Array.isArray(result.recommendations)).toBe(true);
        });

        test('recommendations should be array of strings', () => {
            const input = {
                atsScore: 50,
                matchedCoreSkills: ['JavaScript'],
                missingCoreSkills: ['React', 'Node.js'],
                matchedOptionalSkills: [],
                missingOptionalSkills: ['Docker'],
            };

            const result = generateATSFeedback(input);

            result.recommendations.forEach(rec => {
                expect(typeof rec).toBe('string');
            });
        });
    });

    // =================== DETERMINISM TESTS ===================

    describe('Determinism', () => {
        test('should return same output for same input', () => {
            const input = {
                atsScore: 65,
                matchedCoreSkills: ['JavaScript', 'React'],
                missingCoreSkills: ['Node.js'],
                matchedOptionalSkills: ['Docker'],
                missingOptionalSkills: ['AWS'],
            };

            const result1 = generateATSFeedback(input);
            const result2 = generateATSFeedback(input);

            expect(result1.summary).toBe(result2.summary);
            expect(result1.recommendations).toEqual(result2.recommendations);
        });
    });
});
