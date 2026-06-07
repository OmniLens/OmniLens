# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.4] — 2026-06-07

### Added
- Handler tests for the OpenAPI specification endpoint and the Better Auth catch-all route, bringing API route coverage to all 14 routes.
- Expanded workflow-overview endpoint tests covering the hourly run breakdown, the repository-not-found and malformed-path cases, and the GitHub repository-info failure path.
- Cache-miss tests for the workflow endpoint that exercise the live GitHub sync, active-workflow filtering, best-effort persistence, and GitHub error mapping.
- Tests for the GitHub run-fetching layer, covering date-windowed pagination, the page-count safety cap, deduplicated grouping, and the not-modified, not-found, and forbidden responses.
- Unit tests for the authentication middleware.

### Changed
- Test coverage reporting now includes the authentication middleware module.

## [3.1.3] — 2026-06-07

### Added
- Handler tests for the dashboard batch endpoint, the workflow-existence check, the health endpoint, and the GitHub status endpoint, raising API route coverage to 12 of 14 routes.
- Integration tests for the remaining database query functions — admin user listing and lookup, per-user statistics, combined users-with-stats, and the clear-all-repositories helper — bringing the storage layer to full query-function coverage.

### Changed
- The dashboard batch endpoint now loads workflow records through a static import instead of a per-repository dynamic import, making its parallel repository processing deterministic.

## [3.1.2] — 2026-06-07

### Added
- Database integration test suite for the repository and workflow storage layer (16 tests) covering the 12-repository limit, per-user scoping, duplicate handling, and workflow persistence, with new `test:integration` and `test:integration:cov` scripts and a dedicated Vitest config.
- Direct-handler API route tests (37 tests) for the repository, workflow, and admin endpoints, asserting request validation, status-code branching, GitHub error mapping, and response shapes.
- Unit tests for the admin authentication gate (`validateAdminToken` and `withAdminAuth`), covering missing, malformed, invalid, and invalidated tokens as well as an unconfigured admin token.

### Changed
- The previously disabled API Tests GitHub Actions workflow now runs the database integration suite with coverage on pushes and pull requests to `main`.
- Unit-test coverage now includes the API route handlers, and integration tests are kept out of the fast, database-free unit run.

### Security
- `GET /api/admin/user-ids` now requires an admin API token instead of an ordinary user session, preventing any signed-in user from enumerating every user ID; its OpenAPI documentation was updated to match.

## [3.1.1] — 2026-06-06

### Added
- Vitest-based unit test suite (89 tests) covering string/time/feature-flag utilities, GitHub workflow metric aggregators, dashboard run helpers, and admin token logic, with new `test:unit`, `test:unit:watch`, and `test:unit:cov` scripts.
- "🤏 Unit Tests" GitHub Actions workflow that runs the unit suite with coverage reports on pushes and pull requests to `main`.

### Changed
- The default `test` script now runs the unit tests before the API/integration checks.
- Extracted the repository slug logic into a reusable `slugFromRepoPath` helper shared by the add-repository route.

### Removed
- Removed the self-referential fake slug check from the health test script, now replaced by a real unit test that imports the actual implementation.
- Removed the redundant `api-health` E2E spec that duplicated the API-layer health check; its `status === 'healthy'` assertion is now part of the health test script.

## [3.1.0] — 2026-06-06

### Added
- Private repository support: the GitHub OAuth flow now requests the `repo` scope, and private repositories are marked with a distinct amber "Private" badge on repository cards.
- Redesigned the per-workflow detail page into a triage-style layout with a Latest Run card, running spotlight, overview ribbon, branch breakdown, and live feed.

### Changed
- Standardized workflow health labels to uppercase (`HEALTHY`, `IMPROVED`, `REGRESSED`, `FAILING`, `IDLE`) across the workflow cards, status list, and dashboards.
- Repository cards now use an amber accent border for private repositories.
- Compact metrics overview now renders a muted style for a 0% success rate instead of the failing-state styling.

### Removed
- Removed the Mintlify documentation site (`docs/`), the standalone `index.html`, the lifecycle PRD, and legacy `.cursor` editor configuration.

## [3.0.2] — 2026-06-06

### Fixed
- Fixed the workflow dashboard overflowing past the viewport when the sidebar was expanded; the content area now shrinks to the available width and the Signal Feed table scrolls horizontally within its own card on narrow screens.
