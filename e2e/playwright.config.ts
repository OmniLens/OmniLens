import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI 
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['github']
      ]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }]
      ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Default project for all test specs (localhost)
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        storageState: '.auth/localhost.json',
      },
      dependencies: ['setup'],
    },

    // Localhost environment
    {
      name: 'localhost',
      testMatch: /.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        storageState: '.auth/localhost.json',
      },
      dependencies: ['setup'],
    },

    // Preview environment (Vercel preview deployments)
    {
      name: 'preview',
      testMatch: /.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.VERCEL_PREVIEW_URL || 'https://omnilens-git-main-christopher-zeuchs-projects.vercel.app',
        storageState: '.auth/preview.json',
      },
      dependencies: ['setup'],
    },

    // Production environment
    {
      name: 'production',
      testMatch: /.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.omnilens.xyz',
        storageState: '.auth/production.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'cd .. && bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
