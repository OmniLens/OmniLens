# Playwright E2E Testing Setup

This document describes the Playwright setup for automated end-to-end testing of the OmniLens application, including GitHub OAuth authentication flows using Better Auth.

## Overview

The Playwright setup is organized in a monorepo structure with:
- Dedicated `e2e/` folder for all Playwright-related files
- Multi-environment testing (localhost, preview, production)
- Automated GitHub OAuth authentication using test account
- Login and logout flow testing
- CI/CD integration with GitHub Actions

## Prerequisites

1. **Test GitHub Account**: Create a dedicated GitHub account for automated testing
2. **Environment Variables**: Set up test GitHub credentials for OAuth flow
3. **Database Access**: Ensure test database is accessible (for localhost tests)

**Important**: This approach automates the complete GitHub OAuth flow using a dedicated test account, making tests fully automated and reliable across all environments.

## Setup Instructions

### 1. Create Test GitHub Account

Create a dedicated GitHub account for automated testing:
- Username: `omnilens-test-bot` (or similar)
- Email: Use a disposable email service
- **Important**: Disable 2FA for this account to allow automated login
- **Note**: This account will be used to authenticate via GitHub OAuth in automated tests

### 2. Configure Environment Variables

Create environment files with your test credentials:

#### For Local Development
Add these to your main `.env` file (or `.env.local`):
```bash
# Test GitHub account credentials for Playwright E2E tests
TEST_GITHUB_USERNAME=omnilens-test-bot
TEST_GITHUB_PASSWORD=your-test-github-password
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

**Note**: These are GitHub account credentials used for automated OAuth authentication, not app credentials. They're added to your main `.env` file because Playwright tests run in the same environment as your dev server.

#### For GitHub Actions
Add these secrets to your GitHub repository:
- `TEST_GITHUB_USERNAME`: Your test GitHub username
- `TEST_GITHUB_PASSWORD`: Your test GitHub password

### 3. Install Dependencies

```bash
# Install Playwright
bun add -D @playwright/test

# Install browsers
bunx playwright install --with-deps chromium
```

## Running Tests

### Local Testing

```bash
# Run all E2E tests
bun run test:e2e

# Run tests for specific environment
bun run test:e2e:localhost
bun run test:e2e:preview
bun run test:e2e:production

# Run tests with UI mode (interactive)
bun run test:e2e:ui

# Run tests in headed mode (see browser)
bun run test:e2e:headed

# Debug tests
bun run test:e2e:debug

# View test report
bun run test:e2e:report
```

**Note**: All commands automatically change to the `e2e/` directory before running Playwright.

### Environment-Specific Testing

#### Localhost Testing
```bash
# Start development server
bun run dev

# In another terminal, run tests
bun run test:e2e:localhost
```

#### Preview Testing
```bash
# Set preview URL
export VERCEL_PREVIEW_URL=https://your-preview-url.vercel.app
bun run test:e2e:preview
```

#### Production Testing
```bash
bun run test:e2e:production
```

## Test Structure

### Authentication Setup
- `tests/auth.setup.ts`: Handles GitHub OAuth authentication for all environments
- `tests/helpers/auth-helpers.ts`: Shared authentication utilities

### Test Specs
- `tests/login.spec.ts`: Tests login flow and authentication
- `tests/logout.spec.ts`: Tests logout flow and session clearing

### Configuration
- `playwright.config.ts`: Main Playwright configuration with multi-environment support
- `playwright/.auth/`: Directory for storing authenticated session states (gitignored)

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/playwright.yml`) automatically:
- Runs tests on push to main/develop branches
- Runs tests on pull requests
- Tests against localhost, preview, and production environments
- Uploads test results and videos as artifacts
- Uses GitHub Secrets for test credentials

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify test GitHub credentials are correct
   - Ensure 2FA is disabled on test account
   - Check if GitHub OAuth app is properly configured
   - Verify the test account has authorized your OAuth app

2. **Environment Issues**
   - Verify base URLs are correct for each environment
   - Check if development server is running (for localhost tests)
   - Ensure database is accessible (for localhost tests)
   - Verify GitHub OAuth app redirect URLs include test environments

3. **Test Flakiness**
   - Increase timeouts in test configuration
   - Add more robust wait conditions
   - Check for race conditions in OAuth flow
   - Ensure GitHub rate limits aren't being hit

### Debug Mode

Run tests in debug mode to step through issues:
```bash
bun run test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through tests line by line
- Inspect page state
- Take screenshots
- View network requests

### Viewing Test Results

After running tests, view the HTML report:
```bash
bun run test:e2e:report
```

## Security Considerations

- **Never commit test credentials** to version control
- **Use dedicated test accounts** separate from personal accounts
- **Disable 2FA** on test accounts to allow automation
- **Rotate test credentials** regularly
- **Monitor test account activity** for any suspicious behavior
- **Limit OAuth app permissions** to only what's needed for testing
- **Use environment-specific OAuth apps** if possible

## File Structure

```
├── e2e/                         # E2E testing directory
│   ├── playwright.config.ts     # Main Playwright configuration
│   ├── tests/
│   │   ├── auth.setup.ts        # Authentication setup
│   │   ├── login.spec.ts        # Login flow tests
│   │   └── logout.spec.ts       # Logout flow tests
│   ├── helpers/
│   │   └── auth-helpers.ts      # Authentication utilities
│   └── .auth/                   # Session storage (gitignored)
├── .github/workflows/
│   └── playwright.yml           # CI/CD workflow
└── PLAYWRIGHT_SETUP.md          # This documentation
```

## Next Steps

To extend the test suite:
1. Add more test scenarios (repository management, workflow monitoring)
2. Implement visual regression testing
3. Add performance testing
4. Set up test data management
5. Add cross-browser testing (Firefox, Safari)
