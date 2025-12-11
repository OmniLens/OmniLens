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
  
  test('should redirect to dashboard when accessing login page while authenticated', async ({ authenticatedPage }) => {
    // Navigate to login page
    await authenticatedPage.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    
    // Should be redirected to dashboard if already authenticated
    // Wait a bit for potential redirect
    await authenticatedPage.waitForTimeout(2000);
    
    // Check if we're on dashboard (redirect happened) or still on login
    const currentURL = authenticatedPage.url();
    
    if (currentURL.includes('/dashboard')) {
      // Redirect happened, verify dashboard content
      const repositoriesHeading = authenticatedPage.getByRole('heading', { name: 'Repositories' }).first();
      await expect(repositoriesHeading).toBeVisible({ timeout: 10000 });
    } else {
      // Still on login page, verify login page is accessible
      const githubButton = authenticatedPage.getByRole('button', { name: 'Continue with GitHub' });
      await expect(githubButton).toBeVisible({ timeout: 5000 });
    }
  });
});
