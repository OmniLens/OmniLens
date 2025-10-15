import { test as setup } from '@playwright/test';
import { loadAuthStateFromEnv } from '../helpers/auth-helpers.js';

setup('load-ci-auth', async ({ page }) => {
  if (process.env.CI) {
    console.log('🔄 Loading authentication state from GitHub environment variable');
    
    const authState = loadAuthStateFromEnv();
    if (authState) {
      // Apply the authentication state to the page context
      await page.context().addCookies(authState.cookies || []);
      console.log('✅ Authentication state loaded from environment variable');
    } else {
      console.log('⚠️ No authentication state found in environment variable');
    }
  } else {
    console.log('ℹ️ Not in CI environment, skipping environment variable auth loading');
  }
});
