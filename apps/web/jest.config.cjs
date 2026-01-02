const { pathsToModuleNameMapper } = require('ts-jest');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Read and parse tsconfig.json
const tsconfigPath = resolve(__dirname, 'tsconfig.json');
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

/** @type {import('jest').Config} */
const config = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment - jsdom for React components, node for API routes
  testEnvironment: 'jsdom',
  
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Module name mapper for path aliases (@/*) and ESM mocks
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Mock ESM modules and problematic imports
    '^@/lib/runtime-init\\.js$': '<rootDir>/__tests__/__mocks__/runtime-init.js',
    '^@/lib/init-db\\.js$': '<rootDir>/__tests__/__mocks__/init-db.js',
    // Handle relative imports from lib files
    '^.*/lib/runtime-init\\.js$': '<rootDir>/__tests__/__mocks__/runtime-init.js',
    '^.*/lib/init-db\\.js$': '<rootDir>/__tests__/__mocks__/init-db.js',
    '^nuqs$': '<rootDir>/__tests__/__mocks__/nuqs.ts',
    '^better-auth/react$': '<rootDir>/__tests__/__mocks__/better-auth.ts',
    '^better-auth$': '<rootDir>/__tests__/__mocks__/better-auth-core.ts',
    '^package\\.json$': '<rootDir>/__tests__/__mocks__/package.json.ts',
  },
  
  // Transform ESM modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(nuqs|better-auth)/)',
  ],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.{test,spec}.{js,ts,tsx}',
    '**/*.{test,spec}.{js,ts,tsx}',
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/',
    '/coverage/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/__tests__/**',
    '!**/e2e/**',
    '!**/coverage/**',
    '!**/types/**',
    '!**/*.config.{js,ts}',
    '!**/instrumentation*.ts',
    '!**/runtime-init.js',
    '!**/init-db.js',
    '!**/scripts/**',
    '!**/schema.sql',
    // Exclude UI component library (well-tested upstream)
    '!**/components/ui/**',
    // Exclude API routes from coverage for now
    '!**/app/api/**',
  ],
  
  // Coverage thresholds - will be updated after baseline snapshot
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  
  // Coverage provider
  coverageProvider: 'v8',
  
  // Coverage reporters
  // text-summary shows a compact summary grouped by directory (better grouping)
  // text shows detailed per-file coverage
  // Include reporters twice: once for console output, once for file output
  coverageReporters: [
    'text-summary', // Console output
    ['text-summary', { file: 'coverage-summary.txt' }], // File output
    'text', // Console output
    ['text', { file: 'coverage.txt' }], // File output
    'json',
    'html',
    'lcov',
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
    // Transform .js files in lib directory (for ESM modules)
    '^.*/lib/.*\\.js$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          allowJs: true,
        },
      },
    ],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

module.exports = config;

