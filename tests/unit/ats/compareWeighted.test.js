/**
 * Unit Tests for Weighted Skill Comparison
 * Tests: compareWeightedSkills function
 * 
 * Test Philosophy:
 * - Pure function testing (no DB, no network)
 * - Test core/optional skill separation
 */

const { compareWeightedSkills } = require('../../../ats/compareWeighted.utils');

describe('compareWeightedSkills', () => {
    // =================== BASIC MATCHING TESTS ===================

    describe('Core and Optional Skill Matching', () => {
        test('should separate matched/missing for core and optional skills', () => {
            const resumeSkills = ['JavaScript', 'React', 'Docker'];
            const coreSkills = ['JavaScript', 'React', 'Node.js'];
            const optionalSkills = ['Docker', 'AWS', 'Kubernetes'];

            const result = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);

            expect(result.matchedCoreSkills).toContain('JavaScript');
            expect(result.matchedCoreSkills).toContain('React');
            expect(result.missingCoreSkills).toContain('Node.js');
            expect(result.matchedOptionalSkills).toContain('Docker');
            expect(result.missingOptionalSkills).toContain('AWS');
            expect(result.missingOptionalSkills).toContain('Kubernetes');
        });

        test('should handle all core skills matched', () => {
            const resumeSkills = ['JavaScript', 'React', 'Node.js'];
            const coreSkills = ['JavaScript', 'React', 'Node.js'];
            const optionalSkills = ['Docker'];

            const result = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);

            expect(result.matchedCoreSkills).toHaveLength(3);
            expect(result.missingCoreSkills).toHaveLength(0);
        });

        test('should handle all optional skills matched', () => {
            const resumeSkills = ['JavaScript', 'Docker', 'AWS'];
            const coreSkills = ['JavaScript'];
            const optionalSkills = ['Docker', 'AWS'];

            const result = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);

            expect(result.matchedOptionalSkills).toHaveLength(2);
            expect(result.missingOptionalSkills).toHaveLength(0);
        });

        test('should handle no core skills matched', () => {
            const resumeSkills = ['Python', 'Django'];
            const coreSkills = ['JavaScript', 'React'];
            const optionalSkills = ['Docker'];

            const result = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);

            expect(result.matchedCoreSkills).toHaveLength(0);
            expect(result.missingCoreSkills).toHaveLength(2);
        });
    });

    // =================== EDGE CASE TESTS ===================

    describe('Edge Cases', () => {
        test('should handle empty resume skills', () => {
            const result = compareWeightedSkills([], ['JavaScript'], ['Docker']);

            expect(result.matchedCoreSkills).toHaveLength(0);
            expect(result.missingCoreSkills).toHaveLength(1);
            expect(result.matchedOptionalSkills).toHaveLength(0);
            expect(result.missingOptionalSkills).toHaveLength(1);
        });

        test('should handle empty core skills', () => {
            const result = compareWeightedSkills(['JavaScript'], [], ['Docker']);

            expect(result.matchedCoreSkills).toHaveLength(0);
            expect(result.missingCoreSkills).toHaveLength(0);
        });

        test('should handle empty optional skills', () => {
            const result = compareWeightedSkills(['JavaScript'], ['JavaScript'], []);

            expect(result.matchedOptionalSkills).toHaveLength(0);
            expect(result.missingOptionalSkills).toHaveLength(0);
        });

        test('should handle null/undefined inputs gracefully', () => {
            const result = compareWeightedSkills(null, undefined, null);

            expect(result).toHaveProperty('matchedCoreSkills');
            expect(result).toHaveProperty('missingCoreSkills');
            expect(result).toHaveProperty('matchedOptionalSkills');
            expect(result).toHaveProperty('missingOptionalSkills');
        });

        test('should handle all inputs empty', () => {
            const result = compareWeightedSkills([], [], []);

            expect(result.matchedCoreSkills).toHaveLength(0);
            expect(result.missingCoreSkills).toHaveLength(0);
            expect(result.matchedOptionalSkills).toHaveLength(0);
            expect(result.missingOptionalSkills).toHaveLength(0);
        });
    });

    // =================== NORMALIZATION TESTS ===================

    describe('Skill Normalization', () => {
        test('should match case-insensitively', () => {
            const resumeSkills = ['javascript', 'REACT'];
            const coreSkills = ['JavaScript', 'React'];
            const optionalSkills = [];

            const result = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);

            expect(result.matchedCoreSkills).toHaveLength(2);
        });

        test('should handle whitespace in skills', () => {
            const resumeSkills = ['  JavaScript  ', '  React  '];
            const coreSkills = ['JavaScript', 'React'];
            const optionalSkills = [];

            const result = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);

            expect(result.matchedCoreSkills).toHaveLength(2);
        });
    });

    // =================== RETURN STRUCTURE TESTS ===================

    describe('Return Structure', () => {
        test('should return object with all four skill arrays', () => {
            const result = compareWeightedSkills(['JavaScript'], ['JavaScript'], ['Docker']);

            expect(result).toHaveProperty('matchedCoreSkills');
            expect(result).toHaveProperty('missingCoreSkills');
            expect(result).toHaveProperty('matchedOptionalSkills');
            expect(result).toHaveProperty('missingOptionalSkills');

            expect(Array.isArray(result.matchedCoreSkills)).toBe(true);
            expect(Array.isArray(result.missingCoreSkills)).toBe(true);
            expect(Array.isArray(result.matchedOptionalSkills)).toBe(true);
            expect(Array.isArray(result.missingOptionalSkills)).toBe(true);
        });
    });

    // =================== DETERMINISM TESTS ===================

    describe('Determinism', () => {
        test('should return same output for same input', () => {
            const resumeSkills = ['JavaScript', 'React'];
            const coreSkills = ['JavaScript', 'Node.js'];
            const optionalSkills = ['Docker', 'AWS'];

            const result1 = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);
            const result2 = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);

            expect(result1).toEqual(result2);
        });
    });
});
