// External library imports
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Internal imports
import { GET } from '@/app/api/workflow/[slug]/exists/route';
import { addUserRepo, saveWorkflows, type Repository } from '@/lib/db-storage';
import * as authModule from '@/lib/auth';
import {
  createTestUser,
  createAuthHeaders,
  getSessionByToken,
  cleanupTestUser,
  cleanupTestRepos,
  type TestUser,
} from '../utils/test-auth';
import { createAuthenticatedRequest } from '../utils/test-request';

describe('GET /api/workflow/[slug]/exists', () => {
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
  });

  afterEach(async () => {
    // Clean up test repositories and workflows
    await cleanupTestRepos(testUser.id, testPrefix);
    
    // Clean up test users we created (identified by test-user- prefix)
    if (testUser.id.startsWith('test-user-')) {
      await cleanupTestUser(testUser.id);
    }
    
    vi.restoreAllMocks();
  });

  it('should return hasWorkflows true when workflows exist', async () => {
    // Save workflows to database
    await saveWorkflows(testRepo.slug, [
      {
        id: 1,
        name: 'CI Workflow',
        path: '.github/workflows/ci.yml',
        state: 'active',
      },
      {
        id: 2,
        name: 'CD Workflow',
        path: '.github/workflows/cd.yml',
        state: 'active',
      },
    ], testUser.id);

    const request = createAuthenticatedRequest(`http://localhost:3000/api/workflow/${testRepo.slug}/exists`, authHeaders);
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('hasWorkflows');
    expect(data.hasWorkflows).toBe(true);
    expect(data).toHaveProperty('workflowCount');
    expect(data.workflowCount).toBe(2);
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Found 2 saved workflows');
  });

  it('should return hasWorkflows false when no workflows exist', async () => {
    const request = createAuthenticatedRequest(`http://localhost:3000/api/workflow/${testRepo.slug}/exists`, authHeaders);
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('hasWorkflows');
    expect(data.hasWorkflows).toBe(false);
    expect(data).toHaveProperty('workflowCount');
    expect(data.workflowCount).toBe(0);
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('No saved workflows found');
  });

  it('should return correct count for single workflow', async () => {
    // Save single workflow
    await saveWorkflows(testRepo.slug, [
      {
        id: 1,
        name: 'CI Workflow',
        path: '.github/workflows/ci.yml',
        state: 'active',
      },
    ], testUser.id);

    const request = createAuthenticatedRequest(`http://localhost:3000/api/workflow/${testRepo.slug}/exists`, authHeaders);
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasWorkflows).toBe(true);
    expect(data.workflowCount).toBe(1);
    expect(data.message).toContain('Found 1 saved workflows');
  });

  it('should return 400 for invalid slug', async () => {
    const request = createAuthenticatedRequest('http://localhost:3000/api/workflow//exists', authHeaders);
    const context = { params: Promise.resolve({ slug: '' }) };

    // Suppress expected console.error for validation errors
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid repository slug');
    expect(data).toHaveProperty('details');

    consoleErrorSpy.mockRestore();
  });

  it('should return 401 when not authenticated', async () => {
    const request = new NextRequest(`http://localhost:3000/api/workflow/${testRepo.slug}/exists`);
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should handle multiple workflows correctly', async () => {
    // Save multiple workflows
    await saveWorkflows(testRepo.slug, [
      {
        id: 1,
        name: 'CI Workflow',
        path: '.github/workflows/ci.yml',
        state: 'active',
      },
      {
        id: 2,
        name: 'CD Workflow',
        path: '.github/workflows/cd.yml',
        state: 'active',
      },
      {
        id: 3,
        name: 'Test Workflow',
        path: '.github/workflows/test.yml',
        state: 'active',
      },
    ], testUser.id);

    const request = createAuthenticatedRequest(`http://localhost:3000/api/workflow/${testRepo.slug}/exists`, authHeaders);
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasWorkflows).toBe(true);
    expect(data.workflowCount).toBe(3);
    expect(data.message).toContain('Found 3 saved workflows');
  });

  it('should return 500 with fallback values on unexpected error', async () => {
    // Mock getWorkflows to throw an error
    const { getWorkflows } = await import('@/lib/db-storage');
    vi.spyOn(await import('@/lib/db-storage'), 'getWorkflows').mockRejectedValue(
      new Error('Database error')
    );

    const request = createAuthenticatedRequest(`http://localhost:3000/api/workflow/${testRepo.slug}/exists`, authHeaders);
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    // Suppress expected console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to check workflows');
    expect(data).toHaveProperty('hasWorkflows');
    expect(data.hasWorkflows).toBe(false);
    expect(data).toHaveProperty('workflowCount');
    expect(data.workflowCount).toBe(0);

    consoleErrorSpy.mockRestore();
  });
});

