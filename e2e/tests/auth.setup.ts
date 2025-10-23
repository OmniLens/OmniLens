import { test as setup } from '@playwright/test';
import fs from 'fs';
import { setAuthenticatedSession, waitForAuthentication } from '../helpers/auth-helpers.js';

// Auth file path - using Playwright's standard convention
const AUTH_FILE = '.auth/localhost.json';

// Clear any existing auth file to force fresh authentication
const clearAuthFile = () => {
  if (fs.existsSync(AUTH_FILE)) {
    fs.unlinkSync(AUTH_FILE);
    console.log('🗑️ Cleared existing auth file to force fresh authentication');
  }
};

setup('authenticate', async ({ page }) => {
  const baseURL = 'http://localhost:3000';
  
  // Clear any existing auth file to force fresh authentication
  clearAuthFile();
  
  // Clear browser storage and cookies for fresh session
  await page.context().clearCookies();
  await page.context().clearPermissions();
  console.log('🧹 Cleared browser storage and cookies for fresh session');
  
  console.log(`🔐 Setting up authentication for: ${baseURL}`);
  console.log(`💾 Auth file will be saved to: ${AUTH_FILE}`);
  
  try {
    // Set authenticated session using GitHub OAuth flow
    await setAuthenticatedSession(page);
    
    // Wait for authentication to complete
    await waitForAuthentication(page);
    
    // Save authenticated state - Playwright will create the directory automatically
    await page.context().storageState({ path: AUTH_FILE });
    
    console.log('✅ Authentication setup completed successfully');
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error instanceof Error ? error.message : String(error));
    
    // Take a screenshot for debugging (without sensitive data) - only if page is still available
    try {
      if (!page.isClosed()) {
        await page.screenshot({ 
          path: `test-results/auth-setup-failure-${Date.now()}.png`,
          fullPage: true 
        });
        console.log('📸 Screenshot saved for debugging');
      }
    } catch (screenshotError) {
      console.log('⚠️ Could not take screenshot (page may be closed)');
    }
    
    throw error;
  }
});
