# E2E Tests

End-to-end tests for OmniLens using Playwright.

## Prerequisites

1. **Install Playwright browsers** (first time only):
   ```bash
   bunx playwright install chromium
   ```

2. **Environment variables**:
   - **E2E-specific vars** in `e2e/.env` (copy from `e2e/.env.example`):
     - `PLAYWRIGHT_GITHUB_USERNAME` and `PLAYWRIGHT_GITHUB_PASSWORD` (test account credentials - **REQUIRED**)
     - `PLAYWRIGHT_BASE_URL` (optional, defaults to http://localhost:3000)
   - **App vars** in `apps/web/.env` (needed for Next.js server):
     - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (GitHub OAuth app)
     - `BETTER_AUTH_SECRET` (Better Auth secret)
     - `DB_*` variables (PostgreSQL connection)

3. **PostgreSQL** database running and schema initialized

4. **Dependencies** installed: `bun install`

## Running Tests

**Execute all commands from the project root directory** (`/Users/omnilens/Documents/GitHub/OmniLens`)

### Run all E2E tests
```bash
bun run test:e2e
```

### Run smoke tests only
```bash
bun run test:e2e smoke
```

### Run with UI (interactive)
```bash
bun run test:e2e:ui
```

### Run in debug mode
```bash
bun run test:e2e:debug
```

### Run in headed mode (see browser)
```bash
bun run test:e2e:headed
```

## Smoke Tests

The smoke test suite (`e2e/smoke/login-dashboard.spec.ts`) validates:
- User can authenticate via GitHub OAuth
- User lands on dashboard after authentication
- Dashboard page loads correctly
- Authenticated state persists

## First Run / Authentication Setup

**Before running other tests, you need to authenticate first:**

1. **Run the authentication setup test** (visible in Playwright UI):
   ```bash
   bun run test:e2e:ui auth-setup
   ```
   Or run just that test:
   ```bash
   bun run test:e2e auth-setup
   ```

2. This will:
   - Authenticate via GitHub OAuth (using test account credentials)
   - Save authenticated state to `playwright/.auth/user-{hostname}.json` (e.g., `user-localhost.json` or `user-www-omnilens-xyz.json`)
   - Show the entire authentication flow in the Playwright UI for debugging

3. **Subsequent test runs** will reuse the saved auth state (refreshed if older than 24 hours)

## Viewing Results

After tests complete, view the HTML report:
```bash
bunx playwright show-report
```

## Running Against Production

Set the base URL:
```bash
PLAYWRIGHT_BASE_URL=https://www.omnilens.xyz bun run test:e2e
```
