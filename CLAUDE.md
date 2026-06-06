# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

OmniLens is an open-source platform for visualizing and tracking GitHub Actions workflow health. Users connect via GitHub OAuth and track workflow performance across their repositories.

## Package Manager & Monorepo

This repo uses **Bun** and **Turborepo**. The only app is `apps/web` (Next.js). All commands should be run from the repo root unless noted.

```bash
bun install           # Install dependencies
bun run dev           # Start Next.js dev server (apps/web)
bun run build         # Build apps/web
bun run lint          # ESLint + TypeScript type check
bun run lint:es       # ESLint only
bun run lint:ts       # TypeScript type check only
bun run setup         # Initialize/migrate PostgreSQL schema (runs apps/web/scripts/setup-db.js)
```

## Testing

There are two test suites:

**API/integration tests** (require a running server at `API_BASE`):
```bash
bun run test                    # All API tests (health + auth basic + github-status)
bun run test:health             # Health check test
bun run test:auth:basic         # Auth basic test
bun run test:github-status      # GitHub status test
```
Test source files live in `/tests/`.

**E2E tests** (Playwright, require running server + real GitHub credentials):
```bash
bun run test:e2e                # All E2E tests
bun run test:e2e:login          # Smoke: login + dashboard
bun run test:e2e:ui             # Interactive Playwright UI
bun run test:e2e:debug          # Debug mode
bun run test:e2e:headed         # Headed (visible browser)
bun run test:e2e:auth-setup     # First-time auth setup (run before other E2E tests)
```
E2E config and tests live in `/e2e/`. Before running E2E tests for the first time, run `bun run test:e2e:auth-setup` to save authenticated state to `e2e/playwright/.auth/`.

## Environment Variables

Create `apps/web/.env` with:
```
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DB_USER=
DB_HOST=
DB_NAME=
DB_PASSWORD=
DB_PORT=5432
ADMIN_TOKEN_HASH=          # SHA-256 hash of your admin API token (for /api/admin/* routes)
MARBLE_API_URL=            # Marble CMS base URL (for /blog)
MARBLE_WORKSPACE_KEY=      # Marble CMS workspace key (for /blog)
```

For E2E tests, also create `e2e/.env`:
```
PLAYWRIGHT_GITHUB_USERNAME=
PLAYWRIGHT_GITHUB_PASSWORD=
PLAYWRIGHT_BASE_URL=http://localhost:3000   # optional
```

## Architecture

### Data Layer

- **Database**: PostgreSQL via the `pg` library — no ORM. Raw SQL queries throughout.
- **Schema**: Defined in `apps/web/lib/schema.sql`. Run `bun run setup` to apply.
- **Core tables**: `user`, `session`, `account`, `verification` (managed by better-auth), plus app-specific `repositories` and `workflows`.
- **DB access layer**: `apps/web/lib/db.ts` (connection pool) and `apps/web/lib/db-storage.ts` (all query functions).
- **Limit**: Max 12 repositories per user, enforced in `addUserRepo`.

### Authentication

- Powered by **better-auth** with GitHub OAuth as the sole social provider.
- Server-side auth instance: `apps/web/lib/auth.ts`.
- Client-side: `apps/web/lib/auth-client.ts`.
- API routes are protected using `withAuth()` HOC from `apps/web/lib/auth-middleware.ts`, or `validateAuth()` for manual checks.
- The user's GitHub access token (stored in the `account` table) is retrieved per-request via `apps/web/lib/github-auth.ts` and used for all GitHub API calls.
- **Admin routes** (`/api/admin/*`) use a separate token-based scheme via `apps/web/lib/admin-auth.ts` — completely isolated from user sessions. The token is compared against `ADMIN_TOKEN_HASH` (SHA-256).

### GitHub API Integration

- All GitHub API calls live in `apps/web/lib/github.ts`.
- Calls are made server-side, using the authenticated user's OAuth token scoped to their repos.
- Two key fetch functions: `getWorkflowRunsForDate` (flat list for metrics) and `getWorkflowRunsForDateGrouped` (deduplicated by workflow for UI cards).
- `apps/web/lib/repo-workflow-fetch.ts` runs a background fetch of workflows + today's metrics immediately after a repository is added.

### API Routes (`apps/web/app/api/`)

| Route | Purpose |
|---|---|
| `auth/[...all]` | better-auth handler |
| `repo/` | List repositories |
| `repo/add` | Add a repository (triggers background `fetchWorkflowDataForNewRepo`) |
| `repo/[slug]` | Delete a repository |
| `repo/validate` | Validate a GitHub repo path before adding |
| `repo/dashboard` | Batch dashboard data for all repos |
| `workflow/[slug]` | Fetch/sync workflows for a repo |
| `health` | Health check endpoint |
| `github-status` | GitHub API status check |
| `admin/` | Admin-only endpoints (user management) |
| `openapi` | OpenAPI spec (served via swagger-ui at `/api-docs`) |

### Frontend

- **Next.js App Router** with all pages under `apps/web/app/`.
- **State**: TanStack Query for server state (client: `apps/web/lib/query-client.tsx`); `nuqs` for URL-synced query params (used for the date picker on dashboard pages).
- **UI components**: shadcn/ui conventions in `apps/web/components/ui/`; page-level components in `apps/web/components/`; dashboard-specific components in `apps/web/components/dashboard/`.
- **Charts**: Recharts.
- The root layout (`apps/web/app/layout.tsx`) wraps the app in `NuqsAdapter`, `QueryProvider`, `AuthProvider`, and `SidebarLayout`.

### Dashboard Routes

All dashboard pages live under `/dashboard/[slug]` where `slug` is the repository slug:

| Route | Purpose |
|---|---|
| `/dashboard/[slug]` | Main workflow run view with date picker, `RunStrip`, and `RunningSpotlight` |
| `/dashboard/[slug]/workflow/[workflowId]` | Per-workflow run history and metrics |
| `/dashboard/[slug]/workflows` | Placeholder page for future workflow management |
| `/dashboard/[slug]/runners` | Runner information (placeholder) |
| `/dashboard/[slug]/usage` | Usage metrics (placeholder) |

### Data Fetching (Hooks Layer)

`apps/web/lib/hooks/` contains all TanStack Query hooks used by dashboard pages:

- `use-repository-dashboard.ts` — core hook file exposing `useDateState`, `useRepositoryWorkflows`, `useWorkflowRuns`, `useWorkflowOverview`, `useYesterdayWorkflowRuns`
- `use-repositories.ts` / `use-dashboard-repositories.ts` / `use-dashboard-repositories-batch.ts` — hooks for the sidebar and main repo list
- `use-workflow-mutations.ts` — mutations for add/delete repo
- `use-github-status.ts` — polls GitHub API status for the banner

### Shared Dashboard UI (`apps/web/components/dashboard/run-ui.tsx`)

This file is the core shared component library for run visualization, used by both the repo dashboard and per-workflow pages:

- `RunStrip` — horizontal strip of colored run segments
- `RunningSpotlight` — highlights currently-in-progress runs
- `OverviewPanel` — summary stats panel
- `useNowTick` — hook that ticks every second when runs are active
- Pure helpers: `getRunLabel`, `getLabelColor`, `shortenTrigger`, `elapsedSeconds`

### Blog

The `/blog` route is powered by **Marble CMS**. All CMS queries are in `apps/web/lib/query.ts` — not TanStack Query hooks; these are plain async functions called during server-side rendering.

### Utilities (`apps/web/lib/utils.ts`)

Key helpers worth knowing: `cn` (Tailwind class merge), `formatDuration` / `duration` (timing display), `getWorkflowDotClass` / `getWorkflowHealthLabel` / `getWorkflowPillClass` (workflow health styling), `isFeatureEnabled` (feature flags via env vars).
