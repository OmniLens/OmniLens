// External library imports
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Internal imports
import { GET } from '@/app/api/workflow/[slug]/overview/route';
import { addUserRepo, type Repository } from '@/lib/db-storage';
import * as authModule from '@/lib/auth';
import * as githubAuthModule from '@/lib/github-auth';
import * as githubModule from '@/lib/github';
import {
  createTestUser,
  createAuthHeaders,
  getSessionByToken,
  cleanupTestUser,
  cleanupTestRepos,
  type TestUser,
} from '../utils/test-auth';
import { createAuthenticatedRequest } from '../utils/test-request';

describe('GET /api/workflow/[slug]/overview', () => {
  let testUser: TestUser;
  let testPrefix: string;
  let authHeaders: { Cookie: string };
  let testRepo: Repository;

  beforeEach(async () => {
    // Always create a unique test user to ensure test isolation
    // This prevents data contamination between tests
    testUser = await createTestUser();
    authHeaders = await createAuthHeaders(testUser.id);
    testPrefix = `test-repo-${Date.now()}`;
    
    // Create test repository
    testRepo = {
      slug: `${testPrefix}/test-repo`,
      repoPath: `${testPrefix}/test-repo`,
      displayName: 'Test Repo',
      htmlUrl: `https://github.com/${testPrefix}/test-repo`,
      defaultBranch: 'main',
      avatarUrl: 'https://github.com/owner.png',
      visibility: 'public',
    };
    await addUserRepo(testRepo, testUser.id);
    
    // Mock auth.api.getSession to use real database lookup
    vi.spyOn(authModule.auth.api, 'getSession').mockImplementation(async ({ headers }) => {
      const cookieHeader = (headers as Headers).get('cookie') || (headers as Headers).get('Cookie') || '';
      const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
      if (!match) {
        return null;
      }
      
      const token = match[1];
      const sessionData = await getSessionByToken(token);
      
      if (!sessionData) {
        return null;
      }
      
      return {
        user: sessionData.user,
        session: sessionData.session,
      };
    });

    // Mock GitHub API calls
    vi.spyOn(githubAuthModule, 'makeGitHubRequest').mockImplementation(async (userId, url) => {
      // Mock repository endpoint
      if (url.includes('/repos/') && !url.includes('/actions/workflows')) {
        return new Response(JSON.stringify({
          full_name: testRepo.repoPath,
          html_url: testRepo.htmlUrl,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Mock workflows endpoint
      if (url.includes('/actions/workflows')) {
        return new Response(JSON.stringify({
          total_count: 2,
          workflows: [
            {
              id: 1,
              name: 'CI',
              path: '.github/workflows/ci.yml',
              state: 'active',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 2,
              name: 'CD',
              path: '.github/workflows/cd.yml',
              state: 'active',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // Mock workflow runs functions
    vi.spyOn(githubModule, 'getWorkflowRunsForDate').mockResolvedValue([]);
  });

  afterEach(async () => {
    // Clean up test repositories
    await cleanupTestRepos(testUser.id, testPrefix);
    
    // Clean up test users we created
    if (testUser.id.startsWith('test-user-')) {
      await cleanupTestUser(testUser.id);
    }
    
    vi.restoreAllMocks();
  });

  it('should return overview metrics for authenticated user', async () => {
    const today = new Date().toISOString().split('T')[0];
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}/overview?date=${today}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('repository');
    expect(data.repository).toMatchObject({
      slug: testRepo.slug,
      displayName: testRepo.displayName,
      repoPath: testRepo.repoPath,
    });
    expect(data).toHaveProperty('overview');
    expect(data.overview).toHaveProperty('completedRuns');
    expect(data.overview).toHaveProperty('inProgressRuns');
    expect(data.overview).toHaveProperty('passedRuns');
    expect(data.overview).toHaveProperty('failedRuns');
    expect(data.overview).toHaveProperty('totalRuntime');
    expect(data.overview).toHaveProperty('didntRunCount');
    expect(data.overview).toHaveProperty('totalWorkflows');
    expect(data.overview).toHaveProperty('missingWorkflows');
    expect(data.overview).toHaveProperty('successRate');
    expect(data.overview).toHaveProperty('passRate');
    expect(data).toHaveProperty('date');
    expect(data).toHaveProperty('generatedAt');
  });

  it('should default to today when date parameter is not provided', async () => {
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}/overview`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('date');
    const today = new Date().toISOString().split('T')[0];
    expect(data.date).toBe(today);
  });

  it('should return overview with workflow runs data', async () => {
    const today = new Date().toISOString().split('T')[0];
    const mockWorkflowRuns = [
      {
        workflow_id: 1,
        run_started_at: `${today}T10:00:00Z`,
        status: 'completed',
        conclusion: 'success',
        updated_at: `${today}T10:05:00Z`,
      },
      {
        workflow_id: 2,
        run_started_at: `${today}T11:00:00Z`,
        status: 'completed',
        conclusion: 'failure',
        updated_at: `${today}T11:10:00Z`,
      },
    ];

    vi.spyOn(githubModule, 'getWorkflowRunsForDate').mockResolvedValue(mockWorkflowRuns as any);

    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}/overview?date=${today}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overview.completedRuns).toBeGreaterThanOrEqual(2);
    expect(data.overview.passedRuns).toBeGreaterThanOrEqual(1);
    expect(data.overview.failedRuns).toBeGreaterThanOrEqual(1);
  });

  it('should return empty overview when workflows cannot be fetched', async () => {
    // Mock GitHub API to return error for workflows
    vi.spyOn(githubAuthModule, 'makeGitHubRequest').mockImplementation(async (userId, url) => {
      if (url.includes('/actions/workflows')) {
        return new Response(JSON.stringify({ message: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const today = new Date().toISOString().split('T')[0];
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}/overview?date=${today}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('repository');
    expect(data).toHaveProperty('overview');
    expect(data.overview.completedRuns).toBe(0);
    expect(data.overview.totalWorkflows).toBe(0);
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('No active workflows found');
  });

  it('should return 400 for invalid date format', async () => {
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}/overview?date=invalid-date`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    // Suppress expected console.error for validation errors
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid request parameters');

    consoleErrorSpy.mockRestore();
  });

  it('should return 404 when repository not found', async () => {
    const nonExistentSlug = `${testPrefix}/non-existent`;
    const today = new Date().toISOString().split('T')[0];
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${nonExistentSlug}/overview?date=${today}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: nonExistentSlug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Repository not found in dashboard');
  });

  it('should return 400 for invalid slug', async () => {
    const today = new Date().toISOString().split('T')[0];
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow//overview?date=${today}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: '' }) };

    // Suppress expected console.error for validation errors
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');

    consoleErrorSpy.mockRestore();
  });

  it('should return 401 when not authenticated', async () => {
    const today = new Date().toISOString().split('T')[0];
    const request = new NextRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}/overview?date=${today}`
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should calculate hourly breakdown and statistics', async () => {
    const today = new Date().toISOString().split('T')[0];
    const mockWorkflowRuns = [
      {
        workflow_id: 1,
        run_started_at: `${today}T10:00:00Z`,
        status: 'completed',
        conclusion: 'success',
        updated_at: `${today}T10:05:00Z`,
      },
      {
        workflow_id: 1,
        run_started_at: `${today}T11:00:00Z`,
        status: 'completed',
        conclusion: 'success',
        updated_at: `${today}T11:05:00Z`,
      },
      {
        workflow_id: 2,
        run_started_at: `${today}T10:30:00Z`,
        status: 'completed',
        conclusion: 'failure',
        updated_at: `${today}T10:35:00Z`,
      },
    ];

    vi.spyOn(githubModule, 'getWorkflowRunsForDate').mockResolvedValue(mockWorkflowRuns as any);

    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}/overview?date=${today}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overview).toHaveProperty('runsByHour');
    expect(data.overview).toHaveProperty('avgRunsPerHour');
    expect(data.overview).toHaveProperty('minRunsPerHour');
    expect(data.overview).toHaveProperty('maxRunsPerHour');
    expect(data.overview).toHaveProperty('totalRuns');
  });

  it('should calculate missing workflows correctly', async () => {
    const today = new Date().toISOString().split('T')[0];
    // Mock workflows but no runs (all workflows are missing)
    vi.spyOn(githubModule, 'getWorkflowRunsForDate').mockResolvedValue([]);

    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}/overview?date=${today}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overview).toHaveProperty('missingWorkflows');
    expect(data.overview).toHaveProperty('didntRunCount');
    expect(data.overview.didntRunCount).toBeGreaterThanOrEqual(0);
  });

  it('should return 500 when repository info fetch fails', async () => {
    // Mock repository endpoint to fail
    vi.spyOn(githubAuthModule, 'makeGitHubRequest').mockImplementation(async (userId, url) => {
      if (url.includes('/repos/') && !url.includes('/actions/workflows')) {
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (url.includes('/actions/workflows')) {
        return new Response(JSON.stringify({
          total_count: 1,
          workflows: [{
            id: 1,
            name: 'CI',
            path: '.github/workflows/ci.yml',
            state: 'active',
          }],
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const today = new Date().toISOString().split('T')[0];
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}/overview?date=${today}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    // Suppress expected console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to fetch repository information');

    consoleErrorSpy.mockRestore();
  });
});

