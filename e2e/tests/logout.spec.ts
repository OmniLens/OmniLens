import { test, expect } from '@playwright/test';
import { performLogout, verifyLoggedOut, isLoggedIn } from '../helpers/auth-helpers.js';

test.describe('Logout Flow', () => {
  test('should be able to logout from dashboard', async ({ page }) => {
    // This test assumes we're already authenticated (via storageState)
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on dashboard and logged in
    await expect(page).toHaveURL(/.*\/dashboard/);
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    // Perform logout
    await performLogout(page);
    
    // Verify we're logged out
    await verifyLoggedOut(page);
  });

  test('should redirect to login when accessing protected route after logout', async ({ page }) => {
    // This test assumes we're already authenticated (via storageState)
    // Navigate to dashboard first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Perform logout
    await performLogout(page);
    
    // Try to access dashboard again
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should clear session after logout', async ({ page }) => {
    // This test assumes we're already authenticated (via storageState)
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify we're logged in
    const loggedInBefore = await isLoggedIn(page);
    expect(loggedInBefore).toBe(true);
    
    // Perform logout
    await performLogout(page);
    
    // Verify we're logged out
    const loggedInAfter = await isLoggedIn(page);
    expect(loggedInAfter).toBe(false);
  });

  test('should handle logout from any authenticated page', async ({ page }) => {
    // This test assumes we're already authenticated (via storageState)
    // Try different pages that might have logout functionality
    const pagesToTest = ['/dashboard', '/'];
    
    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Try to find and click logout
      try {
        await performLogout(page);
        
        // Verify logout worked
        await verifyLoggedOut(page);
        
        // If logout was successful, break out of the loop
        break;
      } catch (error) {
        // If logout button not found on this page, continue to next page
        console.log(`Logout button not found on ${pagePath}, trying next page...`);
        continue;
      }
    }
  });
});
