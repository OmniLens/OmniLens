import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global setup - checks if auth state exists, but doesn't authenticate
 * Authentication is now done in auth-setup.spec.ts so it's visible in Playwright UI
 */
async function globalSetup(_config: FullConfig) {
  const authStatePath = path.join(__dirname, '../playwright/.auth/user.json');
  
  // Check if auth state exists
  try {
    const stats = await fs.stat(authStatePath);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    if (stats.mtimeMs > oneDayAgo) {
      console.log('✅ Existing auth state found and is recent');
      return;
    } else {
      console.log('⚠️  Auth state exists but is older than 24 hours');
      console.log('   Run the "Authentication Setup" test to refresh it');
    }
  } catch {
    console.log('ℹ️  No auth state found');
    console.log('   Run the "Authentication Setup" test first to authenticate');
  }
}

export default globalSetup;
