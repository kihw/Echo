module.exports = {
    // Environment de test
    testEnvironment: 'node',

    // Répertoires de test
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Coverage configuration
    collectCoverage: true,
    collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/node_modules/**',
        '!backend/logs/**',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60
        }
    },

    // Test timeout
    testTimeout: 30000,

    // Module path mapping
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@backend/(.*)$': '<rootDir>/backend/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1'
    },

    // Files to ignore
    testPathIgnorePatterns: [
        '/node_modules/',
        '/coverage/',
        '/logs/'
    ],

    // Global variables
    globals: {
        'NODE_ENV': 'test'
    },

    // Setup for database tests
    globalSetup: '<rootDir>/tests/globalSetup.js',
    globalTeardown: '<rootDir>/tests/globalTeardown.js',

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,

    // Force exit after tests
    forceExit: true,

    // Detect open handles
    detectOpenHandles: true
};
