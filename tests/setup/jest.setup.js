/**
 * Jest Global Setup
 * Configures test environment before all tests run
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global beforeAll - runs once before all test suites
beforeAll(async () => {
    // Silence console during tests (optional, uncomment if needed)
    // jest.spyOn(console, 'log').mockImplementation(() => {});
    // jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Global afterAll - runs once after all test suites
afterAll(async () => {
    // Cleanup any global resources
});

// Suppress unhandled promise rejection warnings in tests
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection in test:', reason);
});
