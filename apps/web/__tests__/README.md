# Test Suite Documentation

This directory contains unit and API tests for OmniLens.

## Structure

```
__tests__/
├── unit/              # Unit tests for components, utilities, hooks
│   ├── components/    # React component tests
│   ├── lib/           # Utility function tests
│   └── hooks/         # React hook tests
├── api/               # API route handler tests
│   └── routes/        # Individual route tests
└── setup.ts           # Test setup file
```

## Running Tests

```bash
# Run all tests with coverage
bun run test:coverage

# Run unit tests only
bun run test:unit

# Run API tests only
bun run test:api

# Watch mode (re-run on file changes)
bun run test:watch

# Open test UI
bun run test:ui
```

## Writing Tests

### Unit Tests

Unit tests should be placed in `__tests__/unit/` mirroring the source structure.

**Example - Utility Test:**
```typescript
import { describe, it, expect } from 'vitest';
import { formatRepoDisplayName } from '@/lib/utils';

describe('formatRepoDisplayName', () => {
  it('should format repository name', () => {
    expect(formatRepoDisplayName('owner/my-repo')).toBe('My Repo');
  });
});
```

**Example - Component Test:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RepositoryCard } from '@/components/RepositoryCard';

describe('RepositoryCard', () => {
  it('should render repository name', () => {
    render(<RepositoryCard repo={mockRepo} />);
    expect(screen.getByText('My Repo')).toBeInTheDocument();
  });
});
```

### API Tests

API tests should be placed in `__tests__/api/routes/` mirroring the route structure.

**Example - Route Handler Test:**
```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('should return healthy status', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});
```

## Test Environment

- **Unit Tests**: Run in `jsdom` environment (browser-like)
- **API Tests**: Run in `node` environment (server-side)

The test environment is automatically selected based on the test file location:
- `__tests__/unit/**` → jsdom
- `__tests__/api/**` → node

## Coverage

Coverage reports are generated in `coverage/`:
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`
- LCOV: `coverage/lcov.info`

See [COVERAGE_BASELINE.md](../COVERAGE_BASELINE.md) for current coverage status.

