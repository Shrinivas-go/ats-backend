/**
 * Unit Tests for Skill Normalization
 * Tests: normalizeSkills function and SKILL_ALIASES
 * 
 * Test Philosophy:
 * - Pure function testing (no DB, no network)
 * - Test alias mapping, case sensitivity, and de-duplication
 */

const { normalizeSkills, SKILL_ALIASES } = require('../../../ats/normalize.utils');

describe('normalizeSkills', () => {
    // =================== ALIAS MAPPING TESTS ===================

    describe('Alias Mapping', () => {
        test('should normalize "js" to "JavaScript"', () => {
            const result = normalizeSkills(['js']);
            expect(result).toContain('JavaScript');
        });

        test('should normalize "javascript" to "JavaScript"', () => {
            const result = normalizeSkills(['javascript']);
            expect(result).toContain('JavaScript');
        });

        test('should normalize "nodejs" to "Node.js"', () => {
            const result = normalizeSkills(['nodejs']);
            expect(result).toContain('Node.js');
        });

        test('should normalize "node" to "Node.js"', () => {
            const result = normalizeSkills(['node']);
            expect(result).toContain('Node.js');
        });

        test('should normalize "reactjs" to "React"', () => {
            const result = normalizeSkills(['reactjs']);
            expect(result).toContain('React');
        });

        test('should normalize cloud platform variations', () => {
            const result = normalizeSkills(['aws', 'gcp', 'azure']);
            expect(result).toContain('AWS');
            expect(result).toContain('Google Cloud');
            expect(result).toContain('Azure');
        });

        test('should normalize database variations', () => {
            const result = normalizeSkills(['mongo', 'postgres', 'mysql']);
            expect(result).toContain('MongoDB');
            expect(result).toContain('PostgreSQL');
            expect(result).toContain('MySQL');
        });

        test('should normalize "k8s" to "Kubernetes"', () => {
            const result = normalizeSkills(['k8s']);
            expect(result).toContain('Kubernetes');
        });

        test('should normalize TypeScript variations', () => {
            const result = normalizeSkills(['ts', 'typescript']);
            expect(result).toContain('TypeScript');
            expect(result).toHaveLength(1); // should dedupe
        });
    });

    // =================== CASE INSENSITIVITY TESTS ===================

    describe('Case Insensitivity', () => {
        test('should handle uppercase input', () => {
            const result = normalizeSkills(['JAVASCRIPT', 'REACT']);
            expect(result).toContain('JavaScript');
            expect(result).toContain('React');
        });

        test('should handle mixed case input', () => {
            const result = normalizeSkills(['JavaScript', 'NodeJS', 'ReactJS']);
            expect(result).toContain('JavaScript');
            expect(result).toContain('Node.js');
            expect(result).toContain('React');
        });

        test('should handle lowercase input', () => {
            const result = normalizeSkills(['python', 'java', 'docker']);
            expect(result).toContain('Python');
            expect(result).toContain('Java');
            expect(result).toContain('Docker');
        });
    });

    // =================== DEDUPLICATION TESTS ===================

    describe('Deduplication', () => {
        test('should remove duplicate skills', () => {
            const result = normalizeSkills(['javascript', 'JavaScript', 'js', 'JS']);
            expect(result).toHaveLength(1);
            expect(result).toContain('JavaScript');
        });

        test('should remove duplicates after normalization', () => {
            const result = normalizeSkills(['nodejs', 'node.js', 'node', 'Node.js']);
            expect(result).toHaveLength(1);
            expect(result).toContain('Node.js');
        });

        test('should preserve unique skills', () => {
            const result = normalizeSkills(['JavaScript', 'Python', 'Java']);
            expect(result).toHaveLength(3);
        });
    });

    // =================== EDGE CASE TESTS ===================

    describe('Edge Cases', () => {
        test('should return empty array for empty input', () => {
            const result = normalizeSkills([]);
            expect(result).toEqual([]);
        });

        test('should return empty array for null input', () => {
            const result = normalizeSkills(null);
            expect(result).toEqual([]);
        });

        test('should return empty array for undefined input', () => {
            const result = normalizeSkills(undefined);
            expect(result).toEqual([]);
        });

        test('should filter out empty strings', () => {
            const result = normalizeSkills(['', 'JavaScript', '', 'React']);
            expect(result).toHaveLength(2);
            expect(result).not.toContain('');
        });

        test('should handle whitespace-only strings', () => {
            const result = normalizeSkills(['   ', 'JavaScript', '  ']);
            expect(result).toHaveLength(1);
            expect(result).toContain('JavaScript');
        });

        test('should handle non-string values in array', () => {
            const result = normalizeSkills([123, 'JavaScript', null, 'React', undefined]);
            expect(result).toContain('JavaScript');
            expect(result).toContain('React');
        });

        test('should trim whitespace from skills', () => {
            const result = normalizeSkills(['  javascript  ', '  react  ']);
            expect(result).toContain('JavaScript');
            expect(result).toContain('React');
        });
    });

    // =================== UNKNOWN SKILLS TESTS ===================

    describe('Unknown Skills (No Alias)', () => {
        test('should preserve unknown skills as-is (with original casing)', () => {
            const result = normalizeSkills(['CustomFramework', 'MyLibrary']);
            expect(result).toContain('CustomFramework');
            expect(result).toContain('MyLibrary');
        });

        test('should preserve unknown skills without modification', () => {
            const result = normalizeSkills(['SomeUnknownSkill']);
            expect(result).toEqual(['SomeUnknownSkill']);
        });
    });

    // =================== SKILL ALIASES EXPORT TEST ===================

    describe('SKILL_ALIASES Export', () => {
        test('should export SKILL_ALIASES as an object', () => {
            expect(typeof SKILL_ALIASES).toBe('object');
            expect(SKILL_ALIASES).not.toBeNull();
        });

        test('should contain common JavaScript aliases', () => {
            expect(SKILL_ALIASES['js']).toBe('JavaScript');
            expect(SKILL_ALIASES['javascript']).toBe('JavaScript');
        });

        test('should contain Node.js aliases', () => {
            expect(SKILL_ALIASES['node']).toBe('Node.js');
            expect(SKILL_ALIASES['nodejs']).toBe('Node.js');
        });
    });

    // =================== DETERMINISM TESTS ===================

    describe('Determinism', () => {
        test('should return same output for same input', () => {
            const input = ['javascript', 'react', 'nodejs', 'aws'];

            const result1 = normalizeSkills(input);
            const result2 = normalizeSkills(input);

            expect(result1).toEqual(result2);
        });

        test('should maintain consistent order', () => {
            const input = ['React', 'JavaScript', 'Node.js'];

            const result1 = normalizeSkills(input);
            const result2 = normalizeSkills(input);

            expect(result1[0]).toBe(result2[0]);
            expect(result1[1]).toBe(result2[1]);
            expect(result1[2]).toBe(result2[2]);
        });
    });
});
