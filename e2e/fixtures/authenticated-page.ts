import { test as base, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env to get baseURL
config({ path: path.join(__dirname, '../.env') });

/**
 * Get environment-specific auth state path based on baseURL
 */
function getAuthStatePath(): string {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  if (!baseURL) {
    throw new Error('PLAYWRIGHT_BASE_URL environment variable is required.');
  }
  const url = new URL(baseURL);
  const hostname = url.hostname.replace(/\./g, '-');
  const filename = `user-${hostname}.json`;
  return path.join(__dirname, '../../playwright/.auth', filename);
}

/**
 * Extended test with authenticated page fixture
 */
type AuthenticatedPageFixture = {
  authenticatedPage: Page;
};

/**
 * Authentication fixture that loads saved authenticated state
 * Authentication should be done in beforeAll hook of test files
 */
export const test = base.extend<AuthenticatedPageFixture>({
  authenticatedPage: async ({ browser }, use) => {
    const authStatePath = getAuthStatePath();
    
    // Check if auth state exists
    try {
      await fs.access(authStatePath);
    } catch {
      throw new Error(
        `Authenticated state not found for ${process.env.PLAYWRIGHT_BASE_URL}. ` +
        'Ensure authentication runs in beforeAll hook.'
      );
    }
    
    // Create new context with saved auth state
    const context = await browser.newContext({
      storageState: authStatePath,
    });
    
    const page = await context.newPage();
    
    try {
      await use(page);
    } finally {
      await context.close();
    }
  },
});

export { expect } from '@playwright/test';
