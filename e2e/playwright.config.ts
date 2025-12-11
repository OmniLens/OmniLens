import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env files - E2E vars LAST so they take precedence (don't want app .env overriding E2E credentials)
config({ path: path.join(__dirname, '.env') }); // e2e/.env (E2E-specific - loaded last to override)

/**
 * See https://playwright.dev/docs/test-configuration.
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
  reporter: 'html',
  /* Global setup - checks for auth state (authentication is in auth-setup.spec.ts) */
  globalSetup: './global-setup.ts',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
