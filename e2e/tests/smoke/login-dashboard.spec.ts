import { test, expect } from '../../fixtures/authenticated-page';
import { ensureAuthenticated } from '../../helpers/auth';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file for test context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

if (!process.env.PLAYWRIGHT_BASE_URL) {
  throw new Error('PLAYWRIGHT_BASE_URL environment variable is required. Set it in e2e/.env file.');
}
const baseURL = process.env.PLAYWRIGHT_BASE_URL;

test.describe('Login and Dashboard Smoke Test', () => {
  test.beforeAll(async ({ browser }) => {
    await ensureAuthenticated(browser, baseURL);
  });

  test('should authenticate and land on dashboard page', async ({ authenticatedPage }) => {
    // Navigate to dashboard (should already be authenticated via fixture)
    await authenticatedPage.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });
    
    // Verify we're on the dashboard page (not redirected to login)
    expect(authenticatedPage.url()).toContain('/dashboard');
    
    // Verify dashboard page loads correctly
    const repositoriesHeading = authenticatedPage.getByRole('heading', { name: 'Repositories' }).first();
    await expect(repositoriesHeading).toBeVisible({ timeout: 10000 });
  });
});
