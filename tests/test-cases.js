/**
 * Test Cases and Test Data
 * Predefined test cases and data for health testing
 */

// Repository test data (used by validation tests)
export const REPO_TEST_DATA = {
  omniLens: {
    url: 'https://github.com/Visi0ncore/OmniLens',
    slug: 'Visi0ncore-OmniLens',
    displayName: 'OmniLens'
  }
};

// Zod validation test cases
export const ZOD_VALIDATION_TEST_CASES = [
  {
    name: 'Valid request with repoUrl',
    data: { repoUrl: REPO_TEST_DATA.omniLens.url },
    shouldPass: true
  },
  {
    name: 'Empty repoUrl',
    data: { repoUrl: '' },
    shouldPass: false
  },
  {
    name: 'Missing repoUrl',
    data: {},
    shouldPass: false
  }
];

// Slug generation test cases
export const SLUG_TEST_CASES = [
  {
    repoPath: 'Visi0ncore/OmniLens',
    expectedSlug: 'Visi0ncore-OmniLens',
    description: 'Should generate unique slug with org-repo format'
  },
  {
    repoPath: 'OmniLens/OmniLens',
    expectedSlug: 'OmniLens-OmniLens',
    description: 'Should generate unique slug even when org matches repo name'
  },
  {
    repoPath: 'microsoft/vscode',
    expectedSlug: 'microsoft-vscode',
    description: 'Should include organization name for uniqueness'
  }
];
