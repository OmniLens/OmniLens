# OmniLens E2E Tests

This directory contains end-to-end tests for the OmniLens application using Playwright.

## Quick Start

```bash
# From the project root
bun run test:e2e:localhost

# Or from this directory
cd e2e
bun run test:localhost
```

## Structure

- `playwright.config.ts` - Playwright configuration
- `tests/` - Test specifications
- `helpers/` - Shared test utilities
- `.auth/` - Authentication state storage (gitignored)

## Environment Variables

Set these environment variables for testing:

```bash
TEST_GITHUB_USERNAME=omnilens-test-bot
TEST_GITHUB_PASSWORD=your-test-github-password
PLAYWRIGHT_BASE_URL=http://localhost:3000  # or your target URL
```

**Note**: These are GitHub account credentials used for automated OAuth authentication, not app credentials.

See the main `PLAYWRIGHT_SETUP.md` for detailed documentation.
