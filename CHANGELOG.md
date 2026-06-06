# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.1] — 2026-06-06

### Added
- Vitest-based unit test suite (89 tests) covering string/time/feature-flag utilities, GitHub workflow metric aggregators, dashboard run helpers, and admin token logic, with new `test:unit`, `test:unit:watch`, and `test:unit:cov` scripts.
- "🤏 Unit Tests" GitHub Actions workflow that runs the unit suite with coverage reports on pushes and pull requests to `main`.

### Changed
- The default `test` script now runs the unit tests before the API/integration checks.
- Extracted the repository slug logic into a reusable `slugFromRepoPath` helper shared by the add-repository route.

### Removed
- Removed the self-referential fake slug check from the health test script, now replaced by a real unit test that imports the actual implementation.

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
