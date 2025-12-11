import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuthStatePath } from './helpers/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file to get PLAYWRIGHT_BASE_URL
config({ path: path.join(__dirname, '.env') });

/**
 * Global setup - checks if auth state exists, but doesn't authenticate
 * Authentication is now done in auth-setup.spec.ts so it's visible in Playwright UI
 */
async function globalSetup(_config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || _config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  const authStatePath = getAuthStatePath(baseURL);
  
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
