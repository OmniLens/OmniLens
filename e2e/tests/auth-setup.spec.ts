import { test, expect } from '@playwright/test';
import { authenticate, saveAuthenticatedState, getAuthStatePath } from '../helpers/auth';
import fs from 'fs/promises';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file for test context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

if (!process.env.PLAYWRIGHT_BASE_URL) {
  throw new Error('PLAYWRIGHT_BASE_URL environment variable is required. Set it in e2e/.env file.');
}
const baseURL = process.env.PLAYWRIGHT_BASE_URL;
const authStatePath = getAuthStatePath(baseURL);

/**
 * Authentication setup test
 * This test authenticates the user and saves the state for other tests to use
 * Run this test first in UI mode to see the authentication flow
 */
test.describe('Authentication Setup', () => {
  test('authenticate and save state', async ({ page, browser }) => {
    
    // Check if auth state already exists and is recent
    try {
      const stats = await fs.stat(authStatePath);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      if (stats.mtimeMs > oneDayAgo) {
        return; // Auth state is recent, skip authentication
      }
    } catch {
      // Auth state doesn't exist, proceed with authentication
    }
    
    try {
      // Authenticate - this will be visible in Playwright UI
      await authenticate(page, baseURL);
      
      // Save authenticated state
      await saveAuthenticatedState(page, authStatePath);
      
      // Validate saved state
      const stateContent = await fs.readFile(authStatePath, 'utf-8');
      const state = JSON.parse(stateContent);
      
      if (!state.cookies || state.cookies.length === 0) {
        throw new Error('Saved auth state is invalid: no cookies found');
      }
    } catch (error) {
      // Clean up invalid state file if it exists
      await fs.unlink(authStatePath).catch(() => {});
      throw error;
    }
  });
});
