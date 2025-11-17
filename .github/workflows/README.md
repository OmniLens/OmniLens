# GitHub Actions Workflows

This directory contains CI/CD workflows for OmniLens.

## Test Workflows

### 🧪 Unit Tests (`test-unit.yml`)

**Purpose:** Run unit tests for components, utilities, and hooks.

**Characteristics:**
- ✅ Fast execution (no server or database needed)
- ✅ Runs in parallel with other test workflows
- ✅ Generates coverage reports
- ✅ No external dependencies

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Manual dispatch

**Artifacts:**
- `unit-coverage/` - Coverage reports (HTML, JSON, LCOV)

### 🔌 API Tests (`test-api.yml`)

**Purpose:** Test API route handlers in isolation.

**Characteristics:**
- ✅ Requires PostgreSQL database
- ✅ Tests route handlers directly (no server needed)
- ✅ Generates coverage reports
- ✅ Runs in parallel with unit tests

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Manual dispatch

**Services:**
- PostgreSQL 15 (for database-dependent routes)

**Artifacts:**
- `api-coverage/` - Coverage reports (HTML, JSON, LCOV)

### 🎭 E2E Tests (`test-e2e.yml`)

**Purpose:** End-to-end tests using Playwright.

**Characteristics:**
- ⏱️ Slower execution (requires running server)
- ✅ Tests full user flows
- ✅ Requires PostgreSQL database
- ✅ Requires running Next.js dev server

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Manual dispatch

**Services:**
- PostgreSQL 15 (for database)

**Steps:**
1. Install Playwright browsers
2. Setup database schema
3. Start Next.js dev server
4. Run Playwright tests

**Artifacts:**
- `playwright-report/` - Playwright HTML test report

## Other Workflows

### 🏗️ Build (`build.yml`)
- Validates and builds the application
- Runs linting checks

### 🫀 Health Test (`health.yml`)
- Runs health/infrastructure tests
- Validates server health and connectivity

### 📡 GitHub Status Test (`github-status.yml`)
- Tests GitHub status API integration
- Validates external API connectivity

## Workflow Execution

All test workflows run **in parallel** when triggered, providing:
- ⚡ Faster CI feedback
- 🔍 Clear visibility into which test suite failed
- 📊 Independent coverage reports
- 🎯 Targeted debugging

## Coverage Reports

Coverage reports are uploaded as artifacts and can be downloaded from workflow runs:

1. Go to the workflow run
2. Scroll to "Artifacts" section
3. Download the coverage artifact
4. Extract and open `index.html` in a browser

## Environment Variables

Test workflows require the following secrets:
- `GH_CLIENT_ID` - GitHub OAuth client ID
- `GH_CLIENT_SECRET` - GitHub OAuth client secret
- `BETTER_AUTH_SECRET` - Auth secret
- `DB_PASSWORD` - PostgreSQL password
- `DB_USER` - PostgreSQL user
- `DB_NAME` - PostgreSQL database name

## Runner

All workflows use `tenki-standard-autoscale` runner for consistent execution environment.

