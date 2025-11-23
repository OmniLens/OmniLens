# Test Coverage Baseline Report

Generated: 2024-11-17

## Overview

This document establishes the baseline test coverage for OmniLens before implementing comprehensive test suites. Coverage is measured at three levels:

1. **Unit Tests** - Components, utilities, hooks, and lib functions
2. **API Tests** - Route handlers and API middleware
3. **E2E Tests** - End-to-end user flows (coverage optional)

## Current Coverage Status

### Overall Coverage Metrics

Based on initial test run with sample tests:

- **Statements**: 0.71%
- **Branches**: 21.91%
- **Functions**: 11.47%
- **Lines**: 0.71%

### Coverage by Category

#### Unit Tests (Components, Utils, Hooks)

**lib/utils.ts**: ✅ 100% coverage
- All utility functions tested
- Functions covered: `cn`, `removeEmojiFromWorkflowName`, `formatRepoDisplayName`, `duration`, `formatRunTime`

**Components**: ❌ 0% coverage
- No component tests yet
- Files needing coverage:
  - `components/RepositoryCard.tsx`
  - `components/WorkflowCard.tsx`
  - `components/Header.tsx`
  - `components/DailyMetrics.tsx`
  - `components/GitHubStatusBanner.tsx`
  - And 10+ other component files

**Hooks**: ❌ 0% coverage
- No hook tests yet
- Files needing coverage:
  - `lib/hooks/use-dashboard-repositories.ts`
  - `lib/hooks/use-repositories.ts`
  - `lib/hooks/use-repository-dashboard.ts`
  - `lib/hooks/use-workflow-mutations.ts`
  - `lib/hooks/use-github-status.ts`
  - `lib/hooks/use-dashboard-repositories-batch.ts`

**Lib Functions**: ❌ 0% coverage (except utils.ts)
- Files needing coverage:
  - `lib/github.ts`
  - `lib/db-storage.ts`
  - `lib/auth-middleware.ts`
  - `lib/auth.ts`
  - `lib/admin-auth.ts`
  - `lib/github-auth.ts`
  - `lib/repo-workflow-fetch.ts`

#### API Tests (Route Handlers)

**app/api/health/route.ts**: ✅ 72% coverage
- Happy path tested
- Error handling not yet tested (lines 84-90 uncovered)

**All Other API Routes**: ❌ 0% coverage
- `app/api/repo/route.ts`
- `app/api/repo/add/route.ts`
- `app/api/repo/validate/route.ts`
- `app/api/repo/dashboard/route.ts`
- `app/api/repo/[slug]/route.ts`
- `app/api/workflow/[slug]/route.ts`
- `app/api/workflow/[slug]/exists/route.ts`
- `app/api/workflow/[slug]/overview/route.ts`
- `app/api/github-status/route.ts`
- `app/api/auth/[...auth]/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/user-ids/route.ts`
- `app/api/openapi/route.ts`

#### E2E Tests

**Status**: Not yet implemented
- No E2E tests created yet
- Critical paths to test:
  - User login flow
  - Add repository flow
  - View dashboard flow
  - View repository details flow
  - Workflow metrics display

## Test Infrastructure

### Tools Installed

- ✅ **Vitest** v2.1.9 - Unit/API test framework
- ✅ **@vitest/coverage-v8** v2.1.9 - Coverage provider
- ✅ **@vitest/ui** v2.1.9 - Test UI
- ✅ **@playwright/test** v1.56.1 - E2E framework
- ✅ **@testing-library/react** v16.3.0 - React component testing
- ✅ **@testing-library/jest-dom** v6.9.1 - DOM matchers
- ✅ **jsdom** v25.0.1 - DOM environment

### Configuration Files

- ✅ `vitest.config.ts` - Configured with Next.js path aliases, coverage v8, environment matching
- ✅ `playwright.config.ts` - Configured with Next.js dev server
- ✅ `__tests__/setup.ts` - Test setup file

### Test Structure

```
apps/web/
├── __tests__/
│   ├── unit/          # Unit tests
│   │   ├── components/
│   │   ├── lib/
│   │   └── hooks/
│   └── api/           # API route tests
│       └── routes/
└── e2e/               # E2E tests
    └── *.spec.ts
```

## Coverage Reports

Coverage reports are generated in `apps/web/coverage/`:

- **HTML Report**: `coverage/index.html` - Interactive coverage report
- **JSON Report**: `coverage/coverage-final.json` - Machine-readable coverage data
- **LCOV Report**: `coverage/lcov.info` - LCOV format for CI/CD integration

## Running Tests

```bash
# Run all tests with coverage
bun run test:coverage

# Run unit tests only
bun run test:coverage:unit

# Run API tests only
bun run test:coverage:api

# Run E2E tests
bun run test:e2e

# Watch mode
bun run test:watch

# Test UI
bun run test:ui
```

## Next Steps

1. **Prioritize Critical Paths**
   - Focus on API routes first (core functionality)
   - Add component tests for frequently used components
   - Test authentication flows

2. **Set Coverage Thresholds**
   - Establish minimum coverage percentages for CI/CD
   - Set incremental goals (e.g., 50% → 70% → 85%)

3. **Create Test Templates**
   - Component test template
   - API route test template
   - Hook test template

4. **Expand Test Coverage**
   - Add tests for all API routes
   - Add tests for critical components
   - Add E2E tests for user flows

## Notes

- Root `/tests` directory contains integration tests that hit running server (not included in coverage)
- Coverage excludes: config files, types, build outputs, UI component library
- Current thresholds are set to 0% to establish baseline without blocking

