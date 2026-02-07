/**
 * Integration Tests for Auth Routes
 * Tests: /auth/register, /auth/login, /auth/logout, /auth/refresh
 * 
 * Uses mongodb-memory-server for isolated database testing
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../setup/mongoTestServer');

// Import the app (we'll need to create a test-friendly export)
let app;

// Test user data
const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'SecurePassword123!',
};

describe('Auth Routes Integration Tests', () => {
    // =================== SETUP & TEARDOWN ===================

    beforeAll(async () => {
        // Connect to in-memory database
        await connect();

        // Dynamically require app after DB connection
        // Note: The main app needs to be refactored to support this
        // For now, we'll test the routes logic directly
        const express = require('express');
        const authRoutes = require('../../src/routes/auth.routes');

        app = express();
        app.use(express.json());
        app.use('/auth', authRoutes);
    });

    afterEach(async () => {
        // Clear all collections after each test
        await clearDatabase();
    });

    afterAll(async () => {
        // Disconnect and stop MongoDB server
        await disconnect();
    });

    // =================== REGISTRATION TESTS ===================

    describe('POST /auth/register', () => {
        test('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send(testUser)
                .expect('Content-Type', /json/);

            // Registration should succeed
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);
        });

        test('should reject registration with missing email', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Test User',
                    password: 'password123',
                });

            expect(response.status).toBe(400);
        });

        test('should reject registration with missing password', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                });

            expect(response.status).toBe(400);
        });

        test('should reject duplicate email registration', async () => {
            // First registration
            await request(app)
                .post('/auth/register')
                .send(testUser);

            // Duplicate registration
            const response = await request(app)
                .post('/auth/register')
                .send(testUser);

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('success', false);
        });
    });

    // =================== LOGIN TESTS ===================

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            // Register a user before login tests
            await request(app)
                .post('/auth/register')
                .send(testUser);
        });

        test('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        test('should reject login with wrong password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('success', false);
        });

        test('should reject login with non-existent email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(401);
        });

        test('should reject login with missing credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({});

            expect(response.status).toBe(400);
        });
    });

    // =================== LOGOUT TESTS ===================

    describe('POST /auth/logout', () => {
        test('should logout successfully', async () => {
            const response = await request(app)
                .post('/auth/logout');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });
});
