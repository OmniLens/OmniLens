// External library imports
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Internal imports
import { POST } from "@/app/api/repo/add/route";
import { clearUserRepos, addUserRepo, type Repository } from "@/lib/db-storage";
import * as authModule from "@/lib/auth";
import * as githubAuthModule from "@/lib/github-auth";
import * as repoWorkflowFetchModule from "@/lib/repo-workflow-fetch";
import * as dbStorageModule from "@/lib/db-storage";
import {
  createTestUser,
  createAuthHeaders,
  getSessionByToken,
  cleanupTestUser,
  cleanupTestRepos,
  type TestUser,
} from "../utils/test-auth";
import { createAuthenticatedRequest } from "../utils/test-request";

describe("POST /api/repo/add", () => {
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

    // Mock GitHub API calls to avoid making real requests during tests
    // Use mockImplementation to create a fresh Response for each call (Response bodies can only be read once)
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async () => {
        return new Response(
          JSON.stringify({
            private: false,
            owner: {
              avatar_url: "https://github.com/owner.png",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    );

    // Mock workflow data fetch
    vi.spyOn(
      repoWorkflowFetchModule,
      "fetchWorkflowDataForNewRepo"
    ).mockResolvedValue({
      workflows: [],
      todayMetrics: {
        totalWorkflows: 0,
        passedRuns: 0,
        failedRuns: 0,
        inProgressRuns: 0,
        successRate: 0,
        hasActivity: false,
      },
    });
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

  it("should add repository successfully for authenticated user", async () => {
    const repoData = {
      repoPath: `${testPrefix}/test-repo`,
      displayName: "Test Repo",
      htmlUrl: `https://github.com/${testPrefix}/test-repo`,
      defaultBranch: "main",
      avatarUrl: "https://github.com/owner.png",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("repo");
    expect(data.repo).toMatchObject({
      slug: `${testPrefix}-test-repo`,
      repoPath: repoData.repoPath,
      displayName: repoData.displayName,
      htmlUrl: repoData.htmlUrl,
      defaultBranch: repoData.defaultBranch,
      avatarUrl: repoData.avatarUrl,
      visibility: "public",
    });
    expect(data).toHaveProperty("message");
    expect(githubAuthModule.makeGitHubRequest).toHaveBeenCalledWith(
      testUser.id,
      `https://api.github.com/repos/${repoData.repoPath}`,
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("should add repository with avatarUrl from GitHub API when not provided", async () => {
    const repoData = {
      repoPath: `${testPrefix}/test-repo-no-avatar`,
      displayName: "Test Repo No Avatar",
      htmlUrl: `https://github.com/${testPrefix}/test-repo-no-avatar`,
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.repo.avatarUrl).toBe("https://github.com/owner.png");
  });

  it("should return 400 for invalid request data", async () => {
    const invalidData = {
      repoPath: "", // Empty repoPath should fail validation
      displayName: "Test Repo",
      htmlUrl: "not-a-url", // Invalid URL
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: invalidData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Invalid request data");
    expect(data).toHaveProperty("details");
    expect(Array.isArray(data.details)).toBe(true);
  });

  it("should return 400 for missing required fields", async () => {
    const incompleteData = {
      repoPath: `${testPrefix}/test-repo`,
      // Missing displayName, htmlUrl, defaultBranch
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: incompleteData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Invalid request data");
  });

  it("should return 404 when repository not found on GitHub", async () => {
    // Mock GitHub API to return 404
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async () => {
        return new Response(JSON.stringify({ message: "Not Found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    );

    const repoData = {
      repoPath: `${testPrefix}/non-existent-repo`,
      displayName: "Non Existent Repo",
      htmlUrl: `https://github.com/${testPrefix}/non-existent-repo`,
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Repository not found or does not exist");
    expect(data).toHaveProperty("repoPath");
  });

  it("should return 403 when repository access is denied", async () => {
    // Mock GitHub API to return 403
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async () => {
        return new Response(JSON.stringify({ message: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    );

    const repoData = {
      repoPath: `${testPrefix}/private-repo`,
      displayName: "Private Repo",
      htmlUrl: `https://github.com/${testPrefix}/private-repo`,
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(403);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe(
      "Repository access denied. Check your GitHub permissions."
    );
  });

  it("should return 401 when GitHub token is not found", async () => {
    // Mock GitHub API to throw token error
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockRejectedValue(
      new Error("GitHub access token not found")
    );

    const repoData = {
      repoPath: `${testPrefix}/test-repo`,
      displayName: "Test Repo",
      htmlUrl: `https://github.com/${testPrefix}/test-repo`,
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe(
      "GitHub access token not found. Please ensure you are logged in with GitHub."
    );
  });

  it("should return 409 when repository already exists", async () => {
    // First, add the repository
    const repoData = {
      repoPath: `${testPrefix}/duplicate-repo`,
      displayName: "Duplicate Repo",
      htmlUrl: `https://github.com/${testPrefix}/duplicate-repo`,
      defaultBranch: "main",
    };

    // Mock GitHub API to return a fresh Response for each call
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async () => {
        return new Response(
          JSON.stringify({
            private: false,
            owner: {
              avatar_url: "https://github.com/owner.png",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    );

    const request1 = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );
    const response1 = await POST(request1);
    expect(response1.status).toBe(200);

    // Try to add the same repository again
    const request2 = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );
    const response2 = await POST(request2);
    const data2 = await response2.json();

    // Verify response
    expect(response2.status).toBe(409);
    expect(data2).toHaveProperty("error");
    expect(data2.error).toBe("Repository already exists in dashboard");
    expect(data2).toHaveProperty("slug");
  });

  it("should return 400 when maximum repository limit is reached", async () => {
    // Mock addUserRepo to return limit error
    vi.spyOn(dbStorageModule, "addUserRepo").mockResolvedValue({
      success: false,
      error:
        "Maximum repository limit reached. You can add up to 12 repositories. Please remove some repositories before adding new ones.",
    });

    const repoData = {
      repoPath: `${testPrefix}/limit-repo`,
      displayName: "Limit Repo",
      htmlUrl: `https://github.com/${testPrefix}/limit-repo`,
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Maximum repository limit");
  });

  it("should return 401 when not authenticated", async () => {
    const repoData = {
      repoPath: `${testPrefix}/test-repo`,
      displayName: "Test Repo",
      htmlUrl: `https://github.com/${testPrefix}/test-repo`,
      defaultBranch: "main",
    };

    // Create request without authentication headers
    const request = new NextRequest("http://localhost:3000/api/repo/add", {
      method: "POST",
      body: JSON.stringify(repoData),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("should return 403 when trying to add private repository (not supported)", async () => {
    // Mock GitHub API to return 403 for private repository (without repo scope)
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async () => {
        return new Response(JSON.stringify({ message: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    );

    const repoData = {
      repoPath: `${testPrefix}/private-repo`,
      displayName: "Private Repo",
      htmlUrl: `https://github.com/${testPrefix}/private-repo`,
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response - private repos are not supported without repo scope
    expect(response.status).toBe(403);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe(
      "Repository access denied. Check your GitHub permissions."
    );
  });

  it("should handle workflow data fetch timeout gracefully", async () => {
    // Suppress expected console.log for workflow timeout message
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Mock workflow fetch to timeout (reject after delay)
    vi.spyOn(
      repoWorkflowFetchModule,
      "fetchWorkflowDataForNewRepo"
    ).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 100)
        )
    );

    const repoData = {
      repoPath: `${testPrefix}/timeout-repo`,
      displayName: "Timeout Repo",
      htmlUrl: `https://github.com/${testPrefix}/timeout-repo`,
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response - should still succeed even if workflow fetch times out
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.repo).toBeDefined();
    // Workflow data may be null if timeout occurs

    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  it("should return 500 for GitHub API errors", async () => {
    // Mock GitHub API to return 500 error
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async () => {
        return new Response(
          JSON.stringify({ message: "Internal Server Error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    );

    const repoData = {
      repoPath: `${testPrefix}/error-repo`,
      displayName: "Error Repo",
      htmlUrl: `https://github.com/${testPrefix}/error-repo`,
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("GitHub API error");
  });

  it("should include workflow data in response when available", async () => {
    // Mock workflow fetch to return data quickly
    const mockWorkflowData = {
      workflows: [
        {
          id: 1,
          name: "CI",
          path: ".github/workflows/ci.yml",
          state: "active",
        },
      ],
      todayMetrics: {
        totalWorkflows: 1,
        passedRuns: 5,
        failedRuns: 1,
        inProgressRuns: 0,
        successRate: 83.33,
        hasActivity: true,
      },
    };

    vi.spyOn(
      repoWorkflowFetchModule,
      "fetchWorkflowDataForNewRepo"
    ).mockResolvedValue(mockWorkflowData);

    const repoData = {
      repoPath: `${testPrefix}/workflow-repo`,
      displayName: "Workflow Repo",
      htmlUrl: `https://github.com/${testPrefix}/workflow-repo`,
      defaultBranch: "main",
    };

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/add",
      authHeaders,
      { method: "POST", body: repoData }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("workflowData");
    expect(data.workflowData).toMatchObject(mockWorkflowData);
    expect(data.message).toContain("with workflow data");
  });
});
