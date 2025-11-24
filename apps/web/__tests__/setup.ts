import { afterEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

// Import jest-dom matchers for component tests (jsdom environment)
// This will be a no-op in node environment
import '@testing-library/jest-dom';

// ============================================================================
// Environment Variable Loading
// ============================================================================

// Load .env file from the workspace root
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

// ============================================================================
// Environment Variable Validation
// ============================================================================

// Only require API environment variables when running API tests
// Check if we're running API tests by looking at command line arguments
const isRunningApiTests = process.argv.some(arg => 
  arg.includes('__tests__/api') || arg.includes('test:api')
);

if (isRunningApiTests) {
  // Required environment variables for API tests
  const requiredEnvVars = [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'BETTER_AUTH_SECRET',
    'DB_USER',
    'DB_HOST',
    'DB_NAME',
    'DB_PASSWORD',
  ];

  // Validate required environment variables
  // Fail fast if required environment variables are missing
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for API tests: ${missingVars.join(', ')}\n` +
      `Please ensure your .env file contains all required variables.\n` +
      `Required variables: ${requiredEnvVars.join(', ')}`
    );
  }
}

// Cleanup React components after each test
// Only applies in jsdom environment, safe to call in node
afterEach(async () => {
  const { cleanup } = await import('@testing-library/react');
  try {
    cleanup();
  } catch {
    // Ignore if not in jsdom environment
  }
});

