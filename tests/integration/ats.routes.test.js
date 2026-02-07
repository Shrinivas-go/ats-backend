/**
 * Integration Tests for ATS Analysis Routes
 * Tests: POST /ats-analyze
 * 
 * Uses mongodb-memory-server for isolated database testing
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../setup/mongoTestServer');

let app;

describe('ATS Analysis Routes Integration Tests', () => {
    // =================== SETUP & TEARDOWN ===================

    beforeAll(async () => {
        await connect();

        // Create minimal Express app for testing
        const express = require('express');
        const { compareWeightedSkills } = require('../../ats/compareWeighted.utils');
        const { calculateWeightedATSScore } = require('../../ats/scoreWeighted.utils');
        const { generateATSFeedback } = require('../../ats/feedback.utils');

        app = express();
        app.use(express.json());

        // Mock ATS analyze endpoint for testing
        app.post('/ats-analyze', (req, res) => {
            try {
                const { parsedResume, jobDescription } = req.body;

                if (!parsedResume || !jobDescription) {
                    return res.status(400).json({
                        success: false,
                        message: 'Missing required fields: parsedResume and jobDescription',
                    });
                }

                // Extract skills (simplified for testing)
                const resumeSkills = parsedResume.skills || [];
                const coreSkills = ['JavaScript', 'React', 'Node.js'];
                const optionalSkills = ['Docker', 'AWS'];

                // Run ATS pipeline
                const comparison = compareWeightedSkills(resumeSkills, coreSkills, optionalSkills);
                const scoreResult = calculateWeightedATSScore(comparison);
                const feedback = generateATSFeedback({
                    atsScore: scoreResult.atsScore,
                    ...comparison,
                });

                res.json({
                    success: true,
                    atsScore: scoreResult.atsScore,
                    matchedCoreSkills: comparison.matchedCoreSkills,
                    missingCoreSkills: comparison.missingCoreSkills,
                    matchedOptionalSkills: comparison.matchedOptionalSkills,
                    missingOptionalSkills: comparison.missingOptionalSkills,
                    feedback,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Analysis failed',
                });
            }
        });
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await disconnect();
    });

    // =================== ATS ANALYSIS TESTS ===================

    describe('POST /ats-analyze', () => {
        test('should analyze resume successfully with valid input', async () => {
            const response = await request(app)
                .post('/ats-analyze')
                .send({
                    parsedResume: {
                        skills: ['JavaScript', 'React', 'Node.js', 'Docker'],
                    },
                    jobDescription: 'Looking for a JavaScript developer with React experience.',
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('atsScore');
            expect(typeof response.body.atsScore).toBe('number');
        });

        test('should return high score for well-matched resume', async () => {
            const response = await request(app)
                .post('/ats-analyze')
                .send({
                    parsedResume: {
                        skills: ['JavaScript', 'React', 'Node.js', 'Docker', 'AWS'],
                    },
                    jobDescription: 'Full stack developer needed.',
                });

            expect(response.body.atsScore).toBeGreaterThanOrEqual(80);
        });

        test('should return low score for poorly-matched resume', async () => {
            const response = await request(app)
                .post('/ats-analyze')
                .send({
                    parsedResume: {
                        skills: ['Python', 'Django'],
                    },
                    jobDescription: 'JavaScript developer needed.',
                });

            expect(response.body.atsScore).toBeLessThan(50);
        });

        test('should return matched and missing skills', async () => {
            const response = await request(app)
                .post('/ats-analyze')
                .send({
                    parsedResume: {
                        skills: ['JavaScript', 'React'],
                    },
                    jobDescription: 'Software engineer position.',
                });

            expect(response.body).toHaveProperty('matchedCoreSkills');
            expect(response.body).toHaveProperty('missingCoreSkills');
            expect(Array.isArray(response.body.matchedCoreSkills)).toBe(true);
            expect(Array.isArray(response.body.missingCoreSkills)).toBe(true);
        });

        test('should return 400 for missing parsedResume', async () => {
            const response = await request(app)
                .post('/ats-analyze')
                .send({
                    jobDescription: 'Software engineer position.',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
        });

        test('should return 400 for missing jobDescription', async () => {
            const response = await request(app)
                .post('/ats-analyze')
                .send({
                    parsedResume: {
                        skills: ['JavaScript'],
                    },
                });

            expect(response.status).toBe(400);
        });

        test('should return feedback with summary and recommendations', async () => {
            const response = await request(app)
                .post('/ats-analyze')
                .send({
                    parsedResume: {
                        skills: ['JavaScript', 'React'],
                    },
                    jobDescription: 'Developer needed.',
                });

            expect(response.body).toHaveProperty('feedback');
            expect(response.body.feedback).toHaveProperty('summary');
            expect(response.body.feedback).toHaveProperty('recommendations');
        });

        test('should handle empty skills array', async () => {
            const response = await request(app)
                .post('/ats-analyze')
                .send({
                    parsedResume: {
                        skills: [],
                    },
                    jobDescription: 'Developer needed.',
                });

            expect(response.status).toBe(200);
            expect(response.body.atsScore).toBe(0);
        });
    });
});
