import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
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
      ],
      include: [
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
      ],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

