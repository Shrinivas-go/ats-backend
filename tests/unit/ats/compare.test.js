/**
 * Unit Tests for Skill Comparison Utilities
 * Tests: compareSkills function
 * 
 * Test Philosophy:
 * - Pure function testing (no DB, no network)
 * - Test skill matching with normalization
 */

const { compareSkills } = require('../../../ats/compare.utils');

describe('compareSkills', () => {
    // =================== BASIC MATCHING TESTS ===================

    describe('Basic Skill Matching', () => {
        test('should find matched skills when resume contains JD skills', () => {
            const resumeSkills = ['JavaScript', 'React', 'Node.js', 'Python'];
            const jdSkills = ['JavaScript', 'React'];

            const result = compareSkills(resumeSkills, jdSkills);

            expect(result.matchedSkills).toContain('JavaScript');
            expect(result.matchedSkills).toContain('React');
            expect(result.missingSkills).toHaveLength(0);
        });

        test('should find missing skills when resume lacks JD requirements', () => {
            const resumeSkills = ['JavaScript', 'React'];
            const jdSkills = ['JavaScript', 'React', 'Node.js', 'TypeScript'];

            const result = compareSkills(resumeSkills, jdSkills);

            expect(result.matchedSkills).toContain('JavaScript');
            expect(result.matchedSkills).toContain('React');
            expect(result.missingSkills).toContain('Node.js');
            expect(result.missingSkills).toContain('TypeScript');
        });

        test('should return all JD skills as missing when no overlap', () => {
            const resumeSkills = ['Python', 'Django', 'Flask'];
            const jdSkills = ['JavaScript', 'React', 'Node.js'];

            const result = compareSkills(resumeSkills, jdSkills);

            expect(result.matchedSkills).toHaveLength(0);
            expect(result.missingSkills).toHaveLength(3);
        });

        test('should return all JD skills as matched when fully qualified', () => {
            const resumeSkills = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'];
            const jdSkills = ['JavaScript', 'React', 'Node.js'];

            const result = compareSkills(resumeSkills, jdSkills);

            expect(result.matchedSkills).toHaveLength(3);
            expect(result.missingSkills).toHaveLength(0);
        });
    });

    // =================== NORMALIZATION TESTS ===================

    describe('Skill Normalization', () => {
        test('should match skills case-insensitively', () => {
            const resumeSkills = ['javascript', 'REACT', 'Node.JS'];
            const jdSkills = ['JavaScript', 'React', 'Node.js'];

            const result = compareSkills(resumeSkills, jdSkills);

            expect(result.matchedSkills.length).toBe(3);
            expect(result.missingSkills).toHaveLength(0);
        });

        test('should normalize aliases during comparison', () => {
            const resumeSkills = ['js', 'reactjs', 'nodejs'];
            const jdSkills = ['JavaScript', 'React', 'Node.js'];

            const result = compareSkills(resumeSkills, jdSkills);

            // After normalization, aliases should match
            expect(result.matchedSkills.length).toBe(3);
        });

        test('should handle whitespace in skills', () => {
            const resumeSkills = ['  JavaScript  ', 'React', '  Node.js'];
            const jdSkills = ['JavaScript', 'React'];

            const result = compareSkills(resumeSkills, jdSkills);

            expect(result.matchedSkills.length).toBe(2);
        });
    });

    // =================== EDGE CASE TESTS ===================

    describe('Edge Cases', () => {
        test('should handle empty resume skills', () => {
            const resumeSkills = [];
            const jdSkills = ['JavaScript', 'React'];

            const result = compareSkills(resumeSkills, jdSkills);

            expect(result.matchedSkills).toHaveLength(0);
            expect(result.missingSkills).toHaveLength(2);
        });

        test('should handle empty JD skills', () => {
            const resumeSkills = ['JavaScript', 'React'];
            const jdSkills = [];

            const result = compareSkills(resumeSkills, jdSkills);

            expect(result.matchedSkills).toHaveLength(0);
            expect(result.missingSkills).toHaveLength(0);
        });

        test('should handle null resume skills', () => {
            const result = compareSkills(null, ['JavaScript']);

            expect(result.matchedSkills).toHaveLength(0);
            expect(result.missingSkills).toHaveLength(1);
        });

        test('should handle undefined inputs', () => {
            const result = compareSkills(undefined, undefined);

            expect(result.matchedSkills).toHaveLength(0);
            expect(result.missingSkills).toHaveLength(0);
        });

        test('should handle duplicate skills in resume', () => {
            const resumeSkills = ['JavaScript', 'JavaScript', 'React', 'React'];
            const jdSkills = ['JavaScript', 'React'];

            const result = compareSkills(resumeSkills, jdSkills);

            expect(result.matchedSkills.length).toBe(2);
        });

        test('should handle duplicate skills in JD', () => {
            const resumeSkills = ['JavaScript', 'React'];
            const jdSkills = ['JavaScript', 'JavaScript', 'React'];

            const result = compareSkills(resumeSkills, jdSkills);

            // Should deduplicate
            expect(result.matchedSkills.length).toBeLessThanOrEqual(2);
        });
    });

    // =================== RETURN STRUCTURE TESTS ===================

    describe('Return Structure', () => {
        test('should return object with matchedSkills and missingSkills arrays', () => {
            const result = compareSkills(['JavaScript'], ['JavaScript', 'React']);

            expect(result).toHaveProperty('matchedSkills');
            expect(result).toHaveProperty('missingSkills');
            expect(Array.isArray(result.matchedSkills)).toBe(true);
            expect(Array.isArray(result.missingSkills)).toBe(true);
        });
    });

    // =================== DETERMINISM TESTS ===================

    describe('Determinism', () => {
        test('should return same output for same input', () => {
            const resumeSkills = ['JavaScript', 'React', 'Node.js'];
            const jdSkills = ['JavaScript', 'TypeScript', 'React'];

            const result1 = compareSkills(resumeSkills, jdSkills);
            const result2 = compareSkills(resumeSkills, jdSkills);

            expect(result1.matchedSkills).toEqual(result2.matchedSkills);
            expect(result1.missingSkills).toEqual(result2.missingSkills);
        });
    });
});
