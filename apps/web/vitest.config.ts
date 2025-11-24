import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Run tests sequentially to prevent race conditions and test isolation issues
    // This ensures tests don't interfere with each other's database state
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    environmentMatchGlobs: [
      ['__tests__/unit/**', 'jsdom'],
      ['__tests__/api/**', 'node'],
    ],
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      '.next',
      'e2e',
      '**/*.config.{js,ts}',
      '**/types/**',
      '**/*.d.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '.next/',
        '**/*.config.{js,ts}',
        '**/types/**',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/e2e/**',
        '**/components/ui/**',
        '**/instrumentation*.ts',
        '**/sentry*.ts',
        '**/runtime-init.js',
        '**/init-db.js',
        '**/scripts/**',
        '**/schema.sql',
        
        // Exclude lib functions mocked in API tests
        // These should be tested separately in unit tests
        'lib/db-storage.ts',
        'lib/auth-middleware.ts',
        'lib/auth.ts',
        'lib/github-auth.ts',
        'lib/github.ts',
        'lib/repo-workflow-fetch.ts',
      ],
      include: [
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',  // Will still include lib/utils.ts, etc.
        'app/**/*.{ts,tsx}',
      ],
      thresholds: {
        // Global thresholds measured against "All files" aggregate coverage
        // Set to current baseline to prevent regression
        // Will incrementally increase as we add more tests
        lines: 14.62,      // Current baseline
        functions: 13.33,  // Current baseline
        branches: 61.43,   // Current baseline
        statements: 14.62, // Current baseline
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

