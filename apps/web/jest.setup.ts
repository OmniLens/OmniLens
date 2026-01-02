// Import jest-dom matchers for component tests
import '@testing-library/jest-dom';

// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from the workspace root
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

// Mock window.matchMedia for useIsMobile hook (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => {
      // Parse the query to extract max-width value
      const match = query.match(/max-width:\s*(\d+)px/);
      const maxWidth = match ? parseInt(match[1], 10) : 0;
      const matches = window.innerWidth <= maxWidth;

      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }),
  });

  // Mock window.innerWidth for useIsMobile hook (default to desktop)
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
}

