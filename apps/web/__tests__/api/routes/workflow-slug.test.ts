// External library imports
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Internal imports
import { GET, PUT } from "@/app/api/workflow/[slug]/route";
import { addUserRepo, saveWorkflows, type Repository } from "@/lib/db-storage";
import * as authModule from "@/lib/auth";
import * as githubAuthModule from "@/lib/github-auth";
import * as githubModule from "@/lib/github";
import {
  createTestUser,
  createAuthHeaders,
  getSessionByToken,
  cleanupTestUser,
  cleanupTestRepos,
  type TestUser,
} from "../utils/test-auth";
import { createAuthenticatedRequest } from "../utils/test-request";

describe("GET /api/workflow/[slug]", () => {
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
      displayName: "Test Repo",
      htmlUrl: `https://github.com/${testPrefix}/test-repo`,
      defaultBranch: "main",
      avatarUrl: "https://github.com/owner.png",
      visibility: "public",
    };
    await addUserRepo(testRepo, testUser.id);

    // Mock auth.api.getSession to use real database lookup
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

    // Mock GitHub API calls
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        // Mock repository endpoint
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              full_name: testRepo.repoPath,
              html_url: testRepo.htmlUrl,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Mock workflows endpoint
        if (url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              total_count: 2,
              workflows: [
                {
                  id: 1,
                  name: "CI",
                  path: ".github/workflows/ci.yml",
                  state: "active",
                  created_at: "2024-01-01T00:00:00Z",
                  updated_at: "2024-01-01T00:00:00Z",
                },
                {
                  id: 2,
                  name: "CD",
                  path: ".github/workflows/cd.yml",
                  state: "active",
                  created_at: "2024-01-01T00:00:00Z",
                  updated_at: "2024-01-01T00:00:00Z",
                },
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    );

    // Mock workflow runs functions
    vi.spyOn(githubModule, "getWorkflowRunsForDate").mockResolvedValue([]);
    vi.spyOn(githubModule, "getWorkflowRunsForDateGrouped").mockResolvedValue(
      []
    );
  });

  afterEach(async () => {
    // Clean up test repositories and workflows
    await cleanupTestRepos(testUser.id, testPrefix);

    // Clean up test users we created
    if (testUser.id.startsWith("test-user-")) {
      await cleanupTestUser(testUser.id);
    }

    vi.restoreAllMocks();
  });

  it("should return workflows for authenticated user", async () => {
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("repository");
    expect(data.repository).toMatchObject({
      slug: testRepo.slug,
      displayName: testRepo.displayName,
      repoPath: testRepo.repoPath,
    });
    expect(data).toHaveProperty("workflows");
    expect(Array.isArray(data.workflows)).toBe(true);
    expect(data.workflows.length).toBe(2);
    expect(data).toHaveProperty("totalCount");
    expect(data.totalCount).toBe(2);
    expect(data.workflows[0]).toHaveProperty("id");
    expect(data.workflows[0]).toHaveProperty("name");
    expect(data.workflows[0]).toHaveProperty("path");
    expect(data.workflows[0]).toHaveProperty("state");
  });

  it("should return cached workflows if recent data exists", async () => {
    // Save workflows to database first (simulating recent cache)
    await saveWorkflows(
      testRepo.slug,
      [
        {
          id: 1,
          name: "Cached CI",
          path: ".github/workflows/ci.yml",
          state: "active",
        },
      ],
      testUser.id
    );

    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workflows.length).toBeGreaterThanOrEqual(1);
    expect(response.headers.get("X-Cache")).toBe("HIT");
  });

  it("should return workflow runs when date parameter is provided", async () => {
    const today = new Date().toISOString().split("T")[0];
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}?date=${today}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("workflowRuns");
    expect(data).toHaveProperty("overviewData");
    expect(Array.isArray(data.workflowRuns)).toBe(true);
    expect(data.overviewData).toHaveProperty("completedRuns");
    expect(data.overviewData).toHaveProperty("passedRuns");
    expect(data.overviewData).toHaveProperty("failedRuns");
  });

  it("should return grouped workflow runs when grouped=true", async () => {
    const today = new Date().toISOString().split("T")[0];
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}?date=${today}&grouped=true`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("workflowRuns");
    expect(data).toHaveProperty("overviewData");
  });

  it("should return 400 for invalid date format", async () => {
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}?date=invalid-date`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Invalid date format");
  });

  it("should return 404 when repository not found", async () => {
    const nonExistentSlug = `${testPrefix}/non-existent`;
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${nonExistentSlug}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: nonExistentSlug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Repository not found in dashboard");
  });

  it("should return 400 for invalid slug", async () => {
    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/workflow/",
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: "" }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
  });

  it("should return 401 when not authenticated", async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("should return 403 when GitHub workflow access is denied", async () => {
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/actions/workflows")) {
          return new Response(JSON.stringify({ message: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    );

    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Access denied to repository workflows");
  });

  it("should filter out deleted workflows and only return active ones", async () => {
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              total_count: 3,
              workflows: [
                {
                  id: 1,
                  name: "Active CI",
                  path: ".github/workflows/ci.yml",
                  state: "active",
                  created_at: "2024-01-01T00:00:00Z",
                  updated_at: "2024-01-01T00:00:00Z",
                },
                {
                  id: 2,
                  name: "Deleted Workflow",
                  path: ".github/workflows/deleted.yml",
                  state: "deleted",
                  created_at: "2024-01-01T00:00:00Z",
                  updated_at: "2024-01-01T00:00:00Z",
                },
                {
                  id: 3,
                  name: "Active CD",
                  path: ".github/workflows/cd.yml",
                  state: "active",
                  created_at: "2024-01-01T00:00:00Z",
                  updated_at: "2024-01-01T00:00:00Z",
                },
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    );

    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      authHeaders
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workflows.length).toBe(2); // Only active workflows
    expect(
      data.workflows.every((w: { state: string }) => w.state === "active")
    ).toBe(true);
  });
});

describe("PUT /api/workflow/[slug]", () => {
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
      displayName: "Test Repo",
      htmlUrl: `https://github.com/${testPrefix}/test-repo`,
      defaultBranch: "main",
      visibility: "public",
    };
    await addUserRepo(testRepo, testUser.id);

    // Mock auth.api.getSession
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
    await cleanupTestRepos(testUser.id, testPrefix);

    if (testUser.id.startsWith("test-user-")) {
      await cleanupTestUser(testUser.id);
    }

    vi.restoreAllMocks();
  });

  it("should save workflows successfully", async () => {
    const workflows = [
      {
        id: 1,
        name: "CI Workflow",
        path: ".github/workflows/ci.yml",
        state: "active",
      },
      {
        id: 2,
        name: "CD Workflow",
        path: ".github/workflows/cd.yml",
        state: "active",
      },
    ];

    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      authHeaders,
      { method: "PUT", body: { workflows } }
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("message");
    expect(data.message).toContain("Successfully saved");
    expect(data).toHaveProperty("workflows");
    expect(data.workflows).toHaveLength(2);
    expect(data.workflows[0]).toMatchObject({
      id: 1,
      name: "CI Workflow",
      path: ".github/workflows/ci.yml",
      state: "active",
    });
  });

  it("should return 400 when workflows is not an array", async () => {
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      authHeaders,
      { method: "PUT", body: { workflows: "not-an-array" } }
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Workflows must be an array");
  });

  it("should return 400 for invalid workflow data", async () => {
    const workflows = [
      {
        id: "not-a-number", // Invalid
        name: "CI Workflow",
        path: ".github/workflows/ci.yml",
        state: "active",
      },
    ];

    // Suppress expected console.error for validation errors
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      authHeaders,
      { method: "PUT", body: { workflows } }
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Invalid workflow data");
    expect(data).toHaveProperty("details");

    consoleErrorSpy.mockRestore();
  });

  it("should return 400 for missing required workflow fields", async () => {
    const workflows = [
      {
        id: 1,
        name: "CI Workflow",
        // Missing path and state
      },
    ];

    // Suppress expected console.error for validation errors
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      authHeaders,
      { method: "PUT", body: { workflows } }
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Invalid workflow data");

    consoleErrorSpy.mockRestore();
  });

  it("should return 400 for invalid slug", async () => {
    const workflows = [
      {
        id: 1,
        name: "CI Workflow",
        path: ".github/workflows/ci.yml",
        state: "active",
      },
    ];

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/workflow/",
      authHeaders,
      { method: "PUT", body: { workflows } }
    );
    const context = { params: Promise.resolve({ slug: "" }) };

    // Suppress expected console.error for validation errors
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");

    consoleErrorSpy.mockRestore();
  });

  it("should return 401 when not authenticated", async () => {
    const workflows = [
      {
        id: 1,
        name: "CI Workflow",
        path: ".github/workflows/ci.yml",
        state: "active",
      },
    ];

    const request = new NextRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      {
        method: "PUT",
        body: JSON.stringify({ workflows }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("should handle empty workflows array", async () => {
    const request = createAuthenticatedRequest(
      `http://localhost:3000/api/workflow/${testRepo.slug}`,
      authHeaders,
      { method: "PUT", body: { workflows: [] } }
    );
    const context = { params: Promise.resolve({ slug: testRepo.slug }) };

    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.workflows).toHaveLength(0);
    expect(data.message).toContain("Successfully saved 0 workflows");
  });
});
