import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { setAuthenticatedSession, waitForAuthentication } from '../helpers/auth-helpers.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine which environment we're setting up auth for
const getAuthFilePath = () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  
  if (baseURL.includes('localhost')) {
    return path.join(__dirname, '../.auth/localhost.json');
  } else if (baseURL.includes('vercel.app') || baseURL.includes('preview')) {
    return path.join(__dirname, '../.auth/preview.json');
  } else {
    return path.join(__dirname, '../.auth/production.json');
  }
};

setup('authenticate', async ({ page }) => {
  const authFile = getAuthFilePath();
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  
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
