// External library imports
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Internal imports
import { GET } from '@/app/api/repo/dashboard/route';
import { addUserRepo, clearUserRepos, type Repository } from '@/lib/db-storage';
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

describe('GET /api/repo/dashboard', () => {
  let testUser: TestUser;
  let testPrefix: string;
  let authHeaders: { Cookie: string };

  beforeEach(async () => {
    // Always create a unique test user to ensure test isolation
    // This prevents data contamination between tests
    testUser = await createTestUser();
    authHeaders = await createAuthHeaders(testUser.id);
    testPrefix = `test-repo-${Date.now()}`;
    
    // Mock auth.api.getSession to use real database lookup
    // This bypasses Better Auth's token validation but uses real database operations
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

    // Mock GitHub API calls to avoid making real requests during tests
    vi.spyOn(githubAuthModule, 'makeGitHubRequest').mockResolvedValue(
      new Response(JSON.stringify({
        total_count: 0,
        workflows: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    vi.spyOn(githubModule, 'getWorkflowRunsForDate').mockResolvedValue([]);
  });

  afterEach(async () => {
    // Clean up test repositories
    await cleanupTestRepos(testUser.id, testPrefix);
    
    // Clean up test users we created (identified by test-user- prefix)
    // This preserves dev users while cleaning up test data
    if (testUser.id.startsWith('test-user-')) {
      await cleanupTestUser(testUser.id);
      // Sessions cascade delete automatically via foreign key
    }
    
    vi.restoreAllMocks();
  });

  it('should return repositories with metrics for authenticated user', async () => {
    // Clear any existing repositories for this user to ensure clean test state
    await clearUserRepos(testUser.id);

    // Create test repositories in the database
    const testRepos: Repository[] = [
      {
        slug: `${testPrefix}/repo-1`,
        repoPath: `${testPrefix}/repo-1`,
        displayName: 'Repo 1',
        htmlUrl: `https://github.com/${testPrefix}/repo-1`,
        defaultBranch: 'main',
        avatarUrl: 'https://github.com/owner.png',
        visibility: 'public',
      },
      {
        slug: `${testPrefix}/repo-2`,
        repoPath: `${testPrefix}/repo-2`,
        displayName: 'Repo 2',
        htmlUrl: `https://github.com/${testPrefix}/repo-2`,
        defaultBranch: 'main',
        visibility: 'public',
      },
    ];

    // Add repositories to database
    for (const repo of testRepos) {
      await addUserRepo(repo, testUser.id);
    }

    // Create authenticated request with cookies
    const request = createAuthenticatedRequest('http://localhost:3000/api/repo/dashboard', authHeaders);

    // Make request
    const response = await GET(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('repositories');
    expect(data).toHaveProperty('totalCount');
    expect(data).toHaveProperty('loadedAt');
    expect(Array.isArray(data.repositories)).toBe(true);
    
    // Filter to only our test repos
    const testReposInResponse = data.repositories.filter((r: { slug: string }) =>
      r.slug.startsWith(testPrefix)
    );
    
    // Use greaterThanOrEqual to handle leftover test repos from previous runs
    expect(testReposInResponse.length).toBeGreaterThanOrEqual(2);
    expect(data.totalCount).toBeGreaterThanOrEqual(2);
    
    // Verify the specific test repositories we created are present
    const repo1 = testReposInResponse.find((r: { slug: string }) => r.slug === `${testPrefix}/repo-1`);
    const repo2 = testReposInResponse.find((r: { slug: string }) => r.slug === `${testPrefix}/repo-2`);
    expect(repo1).toBeDefined();
    expect(repo2).toBeDefined();
    
    // Verify repository structure with metrics
    expect(repo1).toMatchObject({
      slug: `${testPrefix}/repo-1`,
      displayName: 'Repo 1',
      avatarUrl: 'https://github.com/owner.png',
      htmlUrl: `https://github.com/${testPrefix}/repo-1`,
    });
    expect(repo1).toHaveProperty('hasWorkflows');
    expect(repo1).toHaveProperty('metrics');
    expect(repo1).toHaveProperty('hasError');
    expect(repo1.metrics).toHaveProperty('totalWorkflows');
    expect(repo1.metrics).toHaveProperty('passedRuns');
    expect(repo1.metrics).toHaveProperty('failedRuns');
    expect(repo1.metrics).toHaveProperty('inProgressRuns');
    expect(repo1.metrics).toHaveProperty('successRate');
    expect(repo1.metrics).toHaveProperty('hasActivity');
  });

  it('should return empty array when user has no repositories', async () => {
    // Ensure user has no repositories (clean up first)
    await clearUserRepos(testUser.id);

    // Create authenticated request with cookies
    const request = createAuthenticatedRequest('http://localhost:3000/api/repo/dashboard', authHeaders);

    // Make request
    const response = await GET(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('repositories');
    expect(data).toHaveProperty('totalCount');
    expect(Array.isArray(data.repositories)).toBe(true);
    expect(data.repositories).toHaveLength(0);
    expect(data.totalCount).toBe(0);
  });

  it('should return 401 when not authenticated', async () => {
    // Create request without authentication headers
    const request = new NextRequest('http://localhost:3000/api/repo/dashboard');

    // Make request
    const response = await GET(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return repositories with null avatarUrl when not provided', async () => {
    // Create test repository without avatarUrl
    const repoWithoutAvatar: Repository = {
      slug: `${testPrefix}/repo-no-avatar`,
      repoPath: `${testPrefix}/repo-no-avatar`,
      displayName: 'Repo No Avatar',
      htmlUrl: `https://github.com/${testPrefix}/repo-no-avatar`,
      defaultBranch: 'main',
      visibility: 'public',
    };

    // Add repository to database
    await addUserRepo(repoWithoutAvatar, testUser.id);

    // Create authenticated request with cookies
    const request = createAuthenticatedRequest('http://localhost:3000/api/repo/dashboard', authHeaders);

    // Make request
    const response = await GET(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    
    // Find our test repo
    const testRepo = data.repositories.find((r: { slug: string }) =>
      r.slug === `${testPrefix}/repo-no-avatar`
    );
    
    expect(testRepo).toBeDefined();
    expect(testRepo.avatarUrl).toBe(null);
    expect(testRepo).toHaveProperty('metrics');
    expect(testRepo).toHaveProperty('hasWorkflows');
  });
});
