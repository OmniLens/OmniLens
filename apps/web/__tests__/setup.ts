import { afterEach } from 'vitest';

// Import jest-dom matchers for component tests (jsdom environment)
// This will be a no-op in node environment
import '@testing-library/jest-dom';

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

