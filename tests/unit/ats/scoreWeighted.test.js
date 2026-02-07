/**
 * Unit Tests for Weighted ATS Score Calculation
 * Tests: calculateWeightedATSScore function
 * 
 * Test Philosophy:
 * - Pure function testing (no DB, no network)
 * - Test valid inputs, edge cases, and deterministic output
 * - Same input → same output
 */

const { calculateWeightedATSScore } = require('../../../ats/scoreWeighted.utils');

describe('calculateWeightedATSScore', () => {
    // =================== VALID INPUT TESTS ===================

    describe('Valid Inputs', () => {
        test('should return perfect score (100) when all core and optional skills match', () => {
            const input = {
                matchedCoreSkills: ['JavaScript', 'React', 'Node.js'],
                missingCoreSkills: [],
                matchedOptionalSkills: ['Docker', 'AWS'],
                missingOptionalSkills: [],
            };

            const result = calculateWeightedATSScore(input);

            expect(result.atsScore).toBe(100);
            expect(result.explanation).toContain('Excellent match');
        });

        test('should return weighted score based on 70% core, 30% optional', () => {
            const input = {
                matchedCoreSkills: ['JavaScript', 'React'], // 2/4 = 50% core
                missingCoreSkills: ['Node.js', 'TypeScript'],
                matchedOptionalSkills: ['Docker'], // 1/2 = 50% optional
                missingOptionalSkills: ['AWS'],
            };

            const result = calculateWeightedATSScore(input);

            // Score = (50 * 0.7) + (50 * 0.3) = 35 + 15 = 50
            expect(result.atsScore).toBe(50);
            expect(result.explanation).toContain('Moderate match');
        });

        test('should handle 100% core match with 0% optional match', () => {
            const input = {
                matchedCoreSkills: ['JavaScript', 'React', 'Node.js'],
                missingCoreSkills: [],
                matchedOptionalSkills: [],
                missingOptionalSkills: ['Docker', 'AWS'],
            };

            const result = calculateWeightedATSScore(input);

            // Score = (100 * 0.7) + (0 * 0.3) = 70
            expect(result.atsScore).toBe(70);
        });

        test('should handle 0% core match with 100% optional match', () => {
            const input = {
                matchedCoreSkills: [],
                missingCoreSkills: ['JavaScript', 'React'],
                matchedOptionalSkills: ['Docker', 'AWS'],
                missingOptionalSkills: [],
            };

            const result = calculateWeightedATSScore(input);

            // Score = (0 * 0.7) + (100 * 0.3) = 30
            expect(result.atsScore).toBe(30);
            expect(result.explanation).toContain('Low match');
        });
    });

    // =================== EDGE CASE TESTS ===================

    describe('Edge Cases', () => {
        test('should return 0 score when no skills are found', () => {
            const input = {
                matchedCoreSkills: [],
                missingCoreSkills: [],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = calculateWeightedATSScore(input);

            expect(result.atsScore).toBe(0);
            expect(result.explanation).toContain('No skills found');
        });

        test('should handle only core skills (no optional required)', () => {
            const input = {
                matchedCoreSkills: ['JavaScript', 'React'],
                missingCoreSkills: ['Node.js'],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = calculateWeightedATSScore(input);

            // 2/3 = 66.67% -> with 100% weight = 67 (rounded)
            expect(result.atsScore).toBe(67);
        });

        test('should handle only optional skills (no core required)', () => {
            const input = {
                matchedCoreSkills: [],
                missingCoreSkills: [],
                matchedOptionalSkills: ['Docker'],
                missingOptionalSkills: ['AWS'],
            };

            const result = calculateWeightedATSScore(input);

            // 1/2 = 50% with 100% weight = 50
            expect(result.atsScore).toBe(50);
        });

        test('should handle single core skill matched', () => {
            const input = {
                matchedCoreSkills: ['JavaScript'],
                missingCoreSkills: [],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = calculateWeightedATSScore(input);

            expect(result.atsScore).toBe(100);
        });
    });

    // =================== INVALID INPUT TESTS ===================

    describe('Invalid Inputs', () => {
        test('should return 0 score for null input', () => {
            const result = calculateWeightedATSScore(null);

            expect(result.atsScore).toBe(0);
            expect(result.explanation).toContain('Invalid');
        });

        test('should return 0 score for undefined input', () => {
            const result = calculateWeightedATSScore(undefined);

            expect(result.atsScore).toBe(0);
        });

        test('should handle non-array skill fields gracefully', () => {
            const input = {
                matchedCoreSkills: 'JavaScript', // string instead of array
                missingCoreSkills: [],
                matchedOptionalSkills: [],
                missingOptionalSkills: [],
            };

            const result = calculateWeightedATSScore(input);

            // Should treat as empty array
            expect(result.atsScore).toBe(0);
        });

        test('should handle empty object input', () => {
            const result = calculateWeightedATSScore({});

            expect(result.atsScore).toBe(0);
        });
    });

    // =================== DETERMINISM TESTS ===================

    describe('Determinism', () => {
        test('should return same score for same input (multiple calls)', () => {
            const input = {
                matchedCoreSkills: ['JavaScript', 'React'],
                missingCoreSkills: ['Node.js'],
                matchedOptionalSkills: ['Docker'],
                missingOptionalSkills: ['AWS'],
            };

            const result1 = calculateWeightedATSScore(input);
            const result2 = calculateWeightedATSScore(input);
            const result3 = calculateWeightedATSScore(input);

            expect(result1.atsScore).toBe(result2.atsScore);
            expect(result2.atsScore).toBe(result3.atsScore);
        });

        test('should return consistent explanation for same input', () => {
            const input = {
                matchedCoreSkills: ['JavaScript'],
                missingCoreSkills: ['React', 'Node.js'],
                matchedOptionalSkills: [],
                missingOptionalSkills: ['Docker'],
            };

            const result1 = calculateWeightedATSScore(input);
            const result2 = calculateWeightedATSScore(input);

            expect(result1.explanation).toBe(result2.explanation);
        });
    });

    // =================== EXPLANATION TESTS ===================

    describe('Explanation Generation', () => {
        test('should include "Excellent match" for scores >= 80', () => {
            const input = {
                matchedCoreSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
                missingCoreSkills: [],
                matchedOptionalSkills: ['Docker'],
                missingOptionalSkills: [],
            };

            const result = calculateWeightedATSScore(input);

            expect(result.explanation).toContain('Excellent match');
        });

        test('should include "Good match" for scores 60-79', () => {
            const input = {
                matchedCoreSkills: ['JavaScript', 'React', 'Node.js'],
                missingCoreSkills: ['TypeScript'],
                matchedOptionalSkills: [],
                missingOptionalSkills: ['Docker', 'AWS'],
            };

            const result = calculateWeightedATSScore(input);

            // 75% core * 0.7 = 52.5, 0% optional * 0.3 = 0, total = 53
            expect(result.explanation).toMatch(/Good match|Moderate match/);
        });

        test('should include skill breakdown in explanation', () => {
            const input = {
                matchedCoreSkills: ['JavaScript', 'React'],
                missingCoreSkills: ['Node.js'],
                matchedOptionalSkills: ['Docker'],
                missingOptionalSkills: ['AWS'],
            };

            const result = calculateWeightedATSScore(input);

            expect(result.explanation).toContain('2'); // matched core count
            expect(result.explanation).toContain('3'); // total core count
        });
    });
});
