// External library imports
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Internal imports
import { GET, DELETE } from "@/app/api/repo/[slug]/route";
import { addUserRepo, type Repository } from "@/lib/db-storage";
import * as authModule from "@/lib/auth";
import {
  createTestUser,
  createAuthHeaders,
  getSessionByToken,
  cleanupTestUser,
  cleanupTestRepos,
  type TestUser,
} from "../utils/test-auth";
import { createAuthenticatedRequest } from "../utils/test-request";

describe("GET /api/repo/[slug]", () => {
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
    vi.spyOn(authModule.auth.api, "getSession").mockImplementation(
      async ({ headers }) => {
        const cookieHeader =
          (headers as Headers).get("cookie") ||
          (headers as Headers).get("Cookie") ||
          "";
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
      }
    );
  });

  afterEach(async () => {
    // Clean up test repositories
    await cleanupTestRepos(testUser.id, testPrefix);

    // Clean up test users we created (identified by test-user- prefix)
    // This preserves dev users while cleaning up test data
    if (testUser.id.startsWith("test-user-")) {
      await cleanupTestUser(testUser.id);
      // Sessions cascade delete automatically via foreign key
    }

    vi.restoreAllMocks();
  });

  it("should return repository for authenticated user", async () => {
    // Create test repository in the database
    const testRepo: Repository = {
      slug: `${testPrefix}/repo-1`,
      repoPath: `${testPrefix}/repo-1`,
      displayName: "Repo 1",
      htmlUrl: `https://github.com/${testPrefix}/repo-1`,
      defaultBranch: "main",
      avatarUrl: "https://github.com/owner.png",
      visibility: "public",
    };

    // Add repository to database
    await addUserRepo(testRepo, testUser.id);

    // Create authenticated request with cookies
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/repo/${testRepo.slug}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    // Make request
    const response = await GET(request, context);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("repo");
    expect(data.repo).toMatchObject({
      slug: testRepo.slug,
      displayName: "Repo 1",
      avatarUrl: "https://github.com/owner.png",
      htmlUrl: `https://github.com/${testPrefix}/repo-1`,
      repoPath: `${testPrefix}/repo-1`,
      defaultBranch: "main",
    });
  });

  it("should return 404 when repository not found", async () => {
    // Create authenticated request with cookies for non-existent repo
    const nonExistentSlug = `${testPrefix}/non-existent-repo`;
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/repo/${nonExistentSlug}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: nonExistentSlug }) };

    // Make request
    const response = await GET(request, context);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(404);
    expect(data.error).toBe("Repository not found");
  });

  it("should return 401 when not authenticated", async () => {
    // Create request without authentication headers
    const request = new NextRequest(
      `http://localhost:3000/api/repo/${testPrefix}/repo-1`
    );
    const context = {
      params: Promise.resolve({ slug: `${testPrefix}/repo-1` }),
    };

    // Make request
    const response = await GET(request, context);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("should return 400 for invalid slug", async () => {
    // Suppress expected console.error for Zod validation errors
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Create authenticated request with empty slug
    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/",
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: "" }) };

    // Make request
    const response = await GET(request, context);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid repository slug");

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it("should return repository with null avatarUrl when not provided", async () => {
    // Create test repository without avatarUrl
    const repoWithoutAvatar: Repository = {
      slug: `${testPrefix}/repo-no-avatar`,
      repoPath: `${testPrefix}/repo-no-avatar`,
      displayName: "Repo No Avatar",
      htmlUrl: `https://github.com/${testPrefix}/repo-no-avatar`,
      defaultBranch: "main",
      visibility: "public",
    };

    // Add repository to database
    await addUserRepo(repoWithoutAvatar, testUser.id);

    // Create authenticated request with cookies
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/repo/${repoWithoutAvatar.slug}`,
      authHeaders
    );
    const context = {
      params: Promise.resolve({ slug: repoWithoutAvatar.slug }),
    };

    // Make request
    const response = await GET(request, context);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.repo.avatarUrl).toBe(null);
  });
});

describe("DELETE /api/repo/[slug]", () => {
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
    vi.spyOn(authModule.auth.api, "getSession").mockImplementation(
      async ({ headers }) => {
        const cookieHeader =
          (headers as Headers).get("cookie") ||
          (headers as Headers).get("Cookie") ||
          "";
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
      }
    );
  });

  afterEach(async () => {
    // Clean up test repositories
    await cleanupTestRepos(testUser.id, testPrefix);

    // Clean up test users we created (identified by test-user- prefix)
    // This preserves dev users while cleaning up test data
    if (testUser.id.startsWith("test-user-")) {
      await cleanupTestUser(testUser.id);
      // Sessions cascade delete automatically via foreign key
    }

    vi.restoreAllMocks();
  });

  it("should delete repository for authenticated user", async () => {
    // Create test repository in the database
    const testRepo: Repository = {
      slug: `${testPrefix}/repo-to-delete`,
      repoPath: `${testPrefix}/repo-to-delete`,
      displayName: "Repo To Delete",
      htmlUrl: `https://github.com/${testPrefix}/repo-to-delete`,
      defaultBranch: "main",
      avatarUrl: "https://github.com/owner.png",
      visibility: "public",
    };

    // Add repository to database
    await addUserRepo(testRepo, testUser.id);

    // Create authenticated DELETE request with cookies
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/repo/${testRepo.slug}`,
      authHeaders,
      { method: "DELETE" }
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    // Make request
    const response = await DELETE(request, context);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("message");
    expect(data.message).toBe("Repository removed from dashboard successfully");
    expect(data).toHaveProperty("deletedRepo");
    expect(data.deletedRepo).toMatchObject({
      slug: testRepo.slug,
      displayName: "Repo To Delete",
      htmlUrl: `https://github.com/${testPrefix}/repo-to-delete`,
    });

    // Verify repository was actually deleted
    const request2 = createAuthenticatedRequest(
      `http://localhost:3000/api/repo/${testRepo.slug}`,
      authHeaders
    );
    const response2 = await GET(request2, context);
    expect(response2.status).toBe(404);
  });

  it("should return 404 when repository not found", async () => {
    // Create authenticated DELETE request for non-existent repo
    const nonExistentSlug = `${testPrefix}/non-existent-repo`;
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/repo/${nonExistentSlug}`,
      authHeaders,
      { method: "DELETE" }
    );
    const context = { params: Promise.resolve({ slug: nonExistentSlug }) };

    // Make request
    const response = await DELETE(request, context);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(404);
    expect(data.error).toBe("Repository not found");
  });

  it("should return 401 when not authenticated", async () => {
    // Create DELETE request without authentication headers
    const request = new NextRequest(
      `http://localhost:3000/api/repo/${testPrefix}/repo-1`,
      { method: "DELETE" }
    );
    const context = {
      params: Promise.resolve({ slug: `${testPrefix}/repo-1` }),
    };

    // Make request
    const response = await DELETE(request, context);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("should return 400 for invalid slug", async () => {
    // Suppress expected console.error for Zod validation errors
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Create authenticated DELETE request with empty slug
    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/",
      authHeaders,
      { method: "DELETE" }
    );
    const context = { params: Promise.resolve({ slug: "" }) };

    // Make request
    const response = await DELETE(request, context);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid repository slug");

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
