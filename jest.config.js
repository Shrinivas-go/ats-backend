/**
 * Jest Configuration for ATS Backend
 * Separates unit and integration test environments
 */
module.exports = {
    testEnvironment: 'node',

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

    // Test patterns
    testMatch: [
        '<rootDir>/tests/**/*.test.js',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'ats/**/*.js',
        'src/**/*.js',
        '!src/config/**',
        '!**/node_modules/**',
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60,
        },
    },

    // Coverage directory
    coverageDirectory: 'coverage',

    // Timeout for async operations
    testTimeout: 30000,

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,

    // Force exit after tests complete
    forceExit: true,

    // Detect open handles
    detectOpenHandles: true,
};
