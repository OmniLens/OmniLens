import { test, expect } from '@playwright/test';
import { performGitHubLogin } from '../helpers/auth-helpers.js';

test.describe('Debug Authentication', () => {
  test('debug GitHub login flow step by step', async ({ page }) => {
    console.log('🔍 Starting debug authentication test...');
    
    try {
      // Navigate to login page
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      console.log('✅ Login page loaded');
      console.log('🔍 Login page URL:', page.url());
      
      // Check if GitHub button is visible
      const githubButton = page.locator('text=Continue with GitHub');
      await expect(githubButton).toBeVisible();
      console.log('✅ GitHub button is visible');
      
      // Click GitHub button
      await githubButton.click();
      console.log('✅ Clicked GitHub button');
      
      // Wait for redirect to GitHub
      await page.waitForURL('**/github.com/**', { timeout: 10000 });
      console.log('✅ Redirected to GitHub');
      console.log('🔍 GitHub URL:', page.url());
      
      // Check what's on the GitHub page
      const pageTitle = await page.title();
      console.log('🔍 GitHub page title:', pageTitle);
      
      // Check for login form
      const loginField = page.locator('#login_field');
      const isLoginVisible = await loginField.isVisible({ timeout: 5000 });
      console.log('🔍 Login field visible:', isLoginVisible);
      
      if (isLoginVisible) {
        console.log('📝 Login form found - proceeding with credentials...');
        
        // This will trigger the full login flow with debugging
        await performGitHubLogin(page);
        
        // Check final state
        console.log('🔍 Final URL after login:', page.url());
        const finalTitle = await page.title();
        console.log('🔍 Final page title:', finalTitle);
        
      } else {
        console.log('⚠️ No login form found - might already be logged in');
        
        // Check if we're already on a different page
        const currentUrl = page.url();
        console.log('🔍 Current URL without login form:', currentUrl);
        
        // Look for authorize button
        const authorizeButton = page.locator('button:has-text("Authorize")');
        const isAuthorizeVisible = await authorizeButton.isVisible({ timeout: 5000 });
        console.log('🔍 Authorize button visible:', isAuthorizeVisible);
        
        if (isAuthorizeVisible) {
          console.log('✅ Found authorize button - clicking...');
          await authorizeButton.click();
          console.log('✅ Clicked authorize button');
        }
      }
      
      // Wait for redirect back to app
      console.log('⏳ Waiting for redirect to dashboard...');
      await page.waitForURL('**/dashboard', { timeout: 30000 });
      console.log('✅ Redirected to dashboard');
      console.log('🔍 Final dashboard URL:', page.url());
      
    } catch (error) {
      console.error('❌ Debug test failed:', error instanceof Error ? error.message : String(error));
      console.log('🔍 Error occurred at URL:', page.url());
      
      // Take screenshot for debugging
      try {
        await page.screenshot({ 
          path: `test-results/debug-auth-failure-${Date.now()}.png`,
          fullPage: true 
        });
        console.log('📸 Debug screenshot saved');
      } catch (screenshotError) {
        console.log('⚠️ Could not take debug screenshot');
      }
      
      throw error;
    }
  });
});
