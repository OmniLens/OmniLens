import { test, expect } from '@playwright/test';
import { setAuthenticatedSession } from '../helpers/auth-helpers.js';

test.describe('Login Flow', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Should be on login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // Should show GitHub login button
    await expect(page.locator('text=Continue with GitHub')).toBeVisible();
  });

  test('should redirect to dashboard when already authenticated', async ({ page }) => {
    // Setup: Authenticate first
    await setAuthenticatedSession(page);
    
    // Navigate to login page when already authenticated
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should perform GitHub OAuth login flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Click GitHub login button
    await page.click('text=Continue with GitHub');
    
    // Should redirect to GitHub OAuth
    await page.waitForURL('**/github.com/**', { timeout: 10000 });
    
    // Should eventually redirect back to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
