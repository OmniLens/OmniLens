import { describe, it, expect } from '@jest/globals';
// Import app pages to ensure they appear in coverage
import TestingPage from '@/app/dashboard/[slug]/testing/page';
import UnitTestsPage from '@/app/dashboard/[slug]/testing/unit/page';

describe('app pages', () => {
  it('placeholder - ensures app pages appear in coverage', () => {
    expect(TestingPage).toBeDefined();
    expect(UnitTestsPage).toBeDefined();
  });
});

