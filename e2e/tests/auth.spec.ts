import { test, expect } from '@playwright/test';

test.describe('Authentication State', () => {
  test('should access dashboard when authenticated', async ({ page }) => {
    // Navigate to dashboard (we're already authenticated from setup)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Dashboard content should be visible
    await expect(page.locator('h1, h2, h3')).toBeVisible();
  });

  test('should display dashboard content when authenticated', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Dashboard content should be visible
    await expect(page.locator('h1, h2, h3')).toBeVisible();
  });

  test('should access protected routes when authenticated', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should be able to access (not redirected to login)
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should redirect to dashboard when accessing login while authenticated', async ({ page }) => {
    // Navigate to login page when already authenticated
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
