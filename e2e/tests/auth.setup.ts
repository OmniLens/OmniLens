import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { setAuthenticatedSession, waitForAuthentication } from '../helpers/auth-helpers.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auth file path for localhost environment
const getAuthFilePath = () => {
  return path.join(__dirname, '../.auth/localhost.json');
};

// Clear any existing auth file to force fresh authentication
const clearAuthFile = () => {
  const authFile = getAuthFilePath();
  if (fs.existsSync(authFile)) {
    fs.unlinkSync(authFile);
    console.log('🗑️ Cleared existing auth file to force fresh authentication');
  }
};

setup('authenticate', async ({ page }) => {
  const authFile = getAuthFilePath();
  const baseURL = 'http://localhost:3000';
  
  // Clear any existing auth file to force fresh authentication
  clearAuthFile();
  
  // Clear browser storage and cookies for fresh session
  await page.context().clearCookies();
  await page.context().clearPermissions();
  console.log('🧹 Cleared browser storage and cookies for fresh session');
  
  console.log(`🔐 Setting up authentication for: ${baseURL}`);
  console.log(`💾 Auth file will be saved to: ${authFile}`);
  
  try {
    // Set authenticated session using GitHub OAuth flow
    await setAuthenticatedSession(page);
    
    // Wait for authentication to complete
    await waitForAuthentication(page);
    
    // Save authenticated state
    await page.context().storageState({ path: authFile });
    
    console.log('✅ Authentication setup completed successfully');
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error instanceof Error ? error.message : String(error));
    
    // Take a screenshot for debugging (without sensitive data)
    await page.screenshot({ 
      path: `test-results/auth-setup-failure-${Date.now()}.png`,
      fullPage: true 
    });
    
    throw error;
  }
});
