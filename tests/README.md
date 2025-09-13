# API Test Suite

This directory contains automated tests for the OmniLens Dashboard.

## Test Files

### `test-utils.js`
Shared utilities and configuration for test files:
- Common configuration (URLs, test data)
- Color-coded logging functions
- HTTP request utilities
- Server health checks
- Re-exports test cases from test-cases.js

### `test-cases.js`
Predefined test cases and test data:
- Zod validation test cases (for schema validation)
- Slug generation test cases

### `health.test.js`
Health and infrastructure test suite including:
- Server health check
- Environment variables validation
- Database connectivity testing
- GitHub API connectivity and token validation
- Core API endpoints health
- Zod validation integration
- Slug generation testing

**Run with:** `bun run test:health`

## Prerequisites

1. **Development server running**: `bun run dev`
2. **PostgreSQL database**: Set up and running
3. **GitHub token**: Configured in `.env.local`

## Running Tests

### Local Development

```bash
# Run health tests
bun run test:health

# Run health tests directly
bun tests/health.test.js
```

### Future Test Suites

Additional test suites are planned but not yet implemented:
- API repository tests
- Workflow API tests
- Integration tests

## Test Coverage

### Health Tests Coverage
- ✅ **Server Health**: Basic server connectivity and response
- ✅ **Environment Variables**: Required environment variables validation
- ✅ **Database Connection**: Database connectivity and schema validation
- ✅ **GitHub API**: GitHub token validation and API connectivity
- ✅ **Core API Endpoints**: Basic endpoint health checks
- ✅ **Zod Validation**: Schema validation integration
- ✅ **Slug Generation**: URL slug generation logic

### API Endpoints Health Checked
- ✅ `GET /api/repo` - Repository listing endpoint
- ✅ `POST /api/repo/validate` - Repository validation endpoint

## Test Results

Health tests validate:
- ✅ Server connectivity and basic functionality
- ✅ Database connection and schema access
- ✅ GitHub API token validity and rate limits
- ✅ Environment configuration
- ✅ Core system components working

## Troubleshooting

If health tests fail:
1. Ensure development server is running (`bun run dev`)
2. Check PostgreSQL is running (`brew services list | grep postgresql`)
3. Verify GitHub token is configured in `.env.local`
4. Check all required environment variables are set
5. Verify database connection in `lib/db.ts`
