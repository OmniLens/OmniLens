import { Page, expect } from '@playwright/test';

/**
 * Get test GitHub credentials from environment variables
 * Never logs the actual credentials
 */
function getTestCredentials() {
  const username = process.env.TEST_GITHUB_USERNAME;
  const password = process.env.TEST_GITHUB_PASSWORD;
  
  if (!username || !password) {
    throw new Error('TEST_GITHUB_USERNAME and TEST_GITHUB_PASSWORD environment variables are required');
  }
  
  // Debug: Log environment info (without credentials)
  console.log('🔍 Environment Debug Info:');
  console.log(`  - Username length: ${username.length}`);
  console.log(`  - Password length: ${password.length}`);
  console.log(`  - CI Environment: ${process.env.CI ? 'Yes' : 'No'}`);
  console.log(`  - Node Environment: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`  - Base URL: ${process.env.PLAYWRIGHT_BASE_URL || 'undefined'}`);
  
  return { username, password };
}

/**
 * Perform GitHub OAuth login flow
 * This handles the complete GitHub OAuth flow including GitHub login
 */
export async function performGitHubLogin(page: Page) {
  const { username, password } = getTestCredentials();
  
  console.log('🔐 Starting GitHub OAuth login flow...');
  
  try {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');
    
    // Click "Continue with GitHub" button
    await page.click('text=Continue with GitHub');
    console.log('✅ Clicked GitHub button');
    
    // Wait for GitHub OAuth page to load
    await page.waitForURL('**/github.com/**', { timeout: 10000 });
    console.log('✅ Redirected to GitHub');
    
    // Fill in GitHub credentials (only if not already logged in)
    const loginField = page.locator('#login_field');
    if (await loginField.isVisible({ timeout: 5000 })) {
      console.log('📝 Filling GitHub credentials...');
      
      // Fill username first
      await loginField.fill(username);
      
      // Fill password
      const passwordField = page.locator('#password');
      await passwordField.click(); // Focus the field
      await passwordField.fill(password);
      
      // Wait for form to be ready
      await page.waitForTimeout(1000);
      
      // Submit the form
      await page.click('input[type="submit"]');
      
      // Wait for GitHub to process login and check for errors
      await page.waitForTimeout(3000);
      
      // Check for the specific "Incorrect username or password" error
      const incorrectCredentials = page.locator('text=Incorrect username or password');
      if (await incorrectCredentials.isVisible({ timeout: 2000 })) {
        console.error('❌ GitHub login error: Incorrect username or password');
        throw new Error('GitHub login failed: Incorrect username or password');
      }
    }
    
    // Handle GitHub OAuth authorization
    const authorizeButton = page.locator('button:has-text("Authorize")');
    if (await authorizeButton.isVisible({ timeout: 10000 })) {
      console.log('✅ Authorizing OAuth application...');
      await authorizeButton.click();
      console.log('✅ Clicked authorize button');
    } else {
      console.log('⚠️ No authorize button found - might already be authorized');
    }
    
    // Wait for redirect back to the application
    console.log('⏳ Waiting for redirect to dashboard...');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ Redirected to dashboard');
    
    console.log('✅ GitHub OAuth login completed successfully');
    
  } catch (error) {
    console.error('❌ GitHub OAuth login failed:', error instanceof Error ? error.message : String(error));
    console.log('Current URL:', page.url());
    throw error;
  }
}

/**
 * Navigate to login page and wait for it to load
 */
export async function navigateToLogin(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Verify we're on the login page
  await expect(page).toHaveURL(/.*\/login/);
  await expect(page.locator('text=Continue with GitHub')).toBeVisible();
}

/**
 * Set authenticated session using GitHub OAuth flow
 * This performs the complete GitHub OAuth login flow
 */
export async function setAuthenticatedSession(page: Page) {
  // Use GitHub OAuth login flow
  await performGitHubLogin(page);
}

/**
 * Logout from the application using Better Auth
 */
export async function performLogout(page: Page) {
  // Look for logout button/link - this might be in a dropdown menu
  // Try common logout patterns
  const logoutSelectors = [
    'text=Sign out',
    'text=Logout',
    'text=Log out',
    '[data-testid="logout"]',
    '[data-testid="sign-out"]',
    'button:has-text("Sign out")',
    'a:has-text("Sign out")'
  ];
  
  let logoutFound = false;
  for (const selector of logoutSelectors) {
    try {
      await page.click(selector, { timeout: 2000 });
      logoutFound = true;
      break;
    } catch (error) {
      // Continue to next selector
    }
  }
  
  if (!logoutFound) {
    // If no logout button found, try to call Better Auth signOut directly
    try {
      await page.evaluate(() => {
        // Try to find and call Better Auth signOut if available
        if ((window as any).signOut) {
          (window as any).signOut();
        }
      });
      logoutFound = true;
    } catch (error) {
      throw new Error('Could not find logout button or signOut function. Please check the logout implementation.');
    }
  }
  
  // Wait for redirect after logout
  await page.waitForURL('**/(login|/)', { timeout: 10000 });
}

/**
 * Check if user is currently logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Navigate to dashboard to check if we're authenticated
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // If we're redirected to login, we're not logged in
    if (page.url().includes('/login')) {
      return false;
    }
    
    // If we're on dashboard, we're logged in
    return page.url().includes('/dashboard');
  } catch (error) {
    return false;
  }
}

/**
 * Verify that user is logged out
 */
export async function verifyLoggedOut(page: Page) {
  // Should be redirected to login or home page
  await expect(page).toHaveURL(/.*\/(login|\/)/);
  
  // If on login page, should show login button
  if (page.url().includes('/login')) {
    await expect(page.locator('text=Continue with GitHub')).toBeVisible();
  }
}
