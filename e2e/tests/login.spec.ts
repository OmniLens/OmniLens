import { test, expect } from '@playwright/test';
import { isLoggedIn } from '../helpers/auth-helpers.js';

test.describe('Login Flow', () => {
  test('should redirect to dashboard when already authenticated', async ({ page }) => {
    // Since we're already authenticated via setup, navigating to login should redirect
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to dashboard when already authenticated
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify we're actually logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test('should be authenticated via session cookie', async ({ page }) => {
    // This test assumes we're already authenticated via session cookie
    // Navigate to dashboard to verify authentication
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on dashboard and authenticated
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify we're logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test('should display dashboard content when authenticated', async ({ page }) => {
    // This test assumes we're already authenticated via session cookie
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard content is visible
    await expect(page.locator('h1, h2, h3')).toBeVisible();
  });

});
