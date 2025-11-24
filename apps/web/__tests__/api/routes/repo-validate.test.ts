// External library imports
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Internal imports
import { POST } from "@/app/api/repo/validate/route";
import * as authModule from "@/lib/auth";
import * as githubAuthModule from "@/lib/github-auth";
import {
  createTestUser,
  createAuthHeaders,
  getSessionByToken,
  cleanupTestUser,
  type TestUser,
} from "../utils/test-auth";
import { createAuthenticatedRequest } from "../utils/test-request";

describe("POST /api/repo/validate", () => {
  let testUser: TestUser;
  let authHeaders: { Cookie: string };

  beforeEach(async () => {
    // Always create a unique test user to ensure test isolation
    // This prevents data contamination between tests
    testUser = await createTestUser();
    authHeaders = await createAuthHeaders(testUser.id);

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
    // Default mock for repository endpoint
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        // Mock repository endpoint
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              full_name: "owner/repo",
              html_url: "https://github.com/owner/repo",
              default_branch: "main",
              name: "repo",
              owner: {
                login: "owner",
                avatar_url: "https://github.com/owner.png",
              },
              private: false,
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
                },
                {
                  id: 2,
                  name: "CD",
                  path: ".github/workflows/cd.yml",
                  state: "active",
                },
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Default fallback
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    );
  });

  afterEach(async () => {
    // Clean up test users we created (identified by test-user- prefix)
    // This preserves dev users while cleaning up test data
    if (testUser.id.startsWith("test-user-")) {
      await cleanupTestUser(testUser.id);
      // Sessions cascade delete automatically via foreign key
    }

    vi.restoreAllMocks();
  });

  it("should validate repository successfully with full GitHub URL", async () => {
    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "https://github.com/owner/repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty("valid");
    expect(data.valid).toBe(true);
    expect(data).toHaveProperty("repoPath");
    expect(data.repoPath).toBe("owner/repo");
    expect(data).toHaveProperty("htmlUrl");
    expect(data.htmlUrl).toBe("https://github.com/owner/repo");
    expect(data).toHaveProperty("defaultBranch");
    expect(data.defaultBranch).toBe("main");
    expect(data).toHaveProperty("displayName");
    expect(data.displayName).toBe("repo");
    expect(data).toHaveProperty("owner");
    expect(data.owner).toBe("owner");
    expect(data).toHaveProperty("avatarUrl");
    expect(data.avatarUrl).toBe("https://github.com/owner.png");
    expect(data).toHaveProperty("visibility");
    expect(data.visibility).toBe("public");
    expect(data).toHaveProperty("workflowsAccessible");
    expect(data.workflowsAccessible).toBe(true);
    expect(data).toHaveProperty("workflowCount");
    expect(data.workflowCount).toBe(2);
  });

  it("should validate repository successfully with owner/repo format", async () => {
    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.repoPath).toBe("owner/repo");
  });

  it("should normalize repository URL correctly", async () => {
    // Test various URL formats
    const testCases = [
      "https://github.com/owner/repo",
      "https://github.com/owner/repo/",
      "owner/repo",
      "  owner/repo  ", // with whitespace
    ];

    for (const repoUrl of testCases) {
      const request = createAuthenticatedRequest(
        "http://localhost:3000/api/repo/validate",
        authHeaders,
        {
          method: "POST",
          body: {
            repoUrl,
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.repoPath).toBe("owner/repo");
    }
  });

  it("should return 400 for invalid repository URL format", async () => {
    const invalidUrls = [
      "not-a-url",
      "https://gitlab.com/owner/repo", // Wrong host
      "owner", // Missing repo name
      "owner/repo/extra", // Too many parts
      "",
    ];

    for (const repoUrl of invalidUrls) {
      const request = createAuthenticatedRequest(
        "http://localhost:3000/api/repo/validate",
        authHeaders,
        {
          method: "POST",
          body: {
            repoUrl,
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(data.error).toMatch(
        /Invalid.*GitHub.*repository.*URL|Invalid request/i
      );
    }
  });

  it("should return 400 for missing repoUrl", async () => {
    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      { method: "POST", body: {} }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Invalid request");
  });

  it("should return 404 when repository not found", async () => {
    // Mock GitHub API to return 404
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
          return new Response(JSON.stringify({ message: "Not Found" }), {
            status: 404,
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
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/non-existent-repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(404);
    expect(data).toHaveProperty("valid");
    expect(data.valid).toBe(false);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Repository not found");
  });

  it("should return 403 when repository access is denied", async () => {
    // Mock GitHub API to return 403
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
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
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/private-repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(403);
    expect(data).toHaveProperty("valid");
    expect(data.valid).toBe(false);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe(
      "Repository access denied. Check your GitHub permissions."
    );
  });

  it("should return 403 when workflow access is denied", async () => {
    // Mock repository endpoint to succeed, but workflows endpoint to return 403
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              full_name: "owner/repo",
              html_url: "https://github.com/owner/repo",
              default_branch: "main",
              name: "repo",
              owner: {
                login: "owner",
                avatar_url: "https://github.com/owner.png",
              },
              private: false,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

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
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(403);
    expect(data).toHaveProperty("valid");
    expect(data.valid).toBe(false);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Access denied to repository workflows");
  });

  it("should return 404 when workflows are not accessible", async () => {
    // Mock repository endpoint to succeed, but workflows endpoint to return 404
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              full_name: "owner/repo",
              html_url: "https://github.com/owner/repo",
              default_branch: "main",
              name: "repo",
              owner: {
                login: "owner",
                avatar_url: "https://github.com/owner.png",
              },
              private: false,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (url.includes("/actions/workflows")) {
          return new Response(JSON.stringify({ message: "Not Found" }), {
            status: 404,
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
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(404);
    expect(data).toHaveProperty("valid");
    expect(data.valid).toBe(false);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Cannot access repository workflows");
  });

  it("should return 401 when GitHub token is not found", async () => {
    // Mock GitHub API to throw token error
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockRejectedValue(
      new Error("GitHub access token not found")
    );

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/repo",
        },
      }
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

  it("should return 401 when not authenticated", async () => {
    // Create request without authentication headers
    const request = new NextRequest("http://localhost:3000/api/repo/validate", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "owner/repo",
      }),
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

  it("should return 403 when trying to validate private repository (not supported)", async () => {
    // Mock GitHub API to return 403 for private repository (without repo scope)
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
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
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/private-repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response - private repos are not supported without repo scope
    expect(response.status).toBe(403);
    expect(data).toHaveProperty("valid");
    expect(data.valid).toBe(false);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe(
      "Repository access denied. Check your GitHub permissions."
    );
  });

  it("should filter out deleted workflows and only count active ones", async () => {
    // Mock workflows endpoint to return mix of active and deleted workflows
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              full_name: "owner/repo",
              html_url: "https://github.com/owner/repo",
              default_branch: "main",
              name: "repo",
              owner: {
                login: "owner",
                avatar_url: "https://github.com/owner.png",
              },
              private: false,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              total_count: 3,
              workflows: [
                {
                  id: 1,
                  name: "CI",
                  path: ".github/workflows/ci.yml",
                  state: "active",
                },
                {
                  id: 2,
                  name: "CD",
                  path: ".github/workflows/cd.yml",
                  state: "active",
                },
                {
                  id: 3,
                  name: "Old",
                  path: ".github/workflows/old.yml",
                  state: "deleted",
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
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response - should only count active workflows
    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.workflowCount).toBe(2); // Only active workflows
  });

  it("should return 500 for GitHub API errors", async () => {
    // Mock GitHub API to return 500 error
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockResolvedValue(
      new Response(JSON.stringify({ message: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    const request = createAuthenticatedRequest(
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(data).toHaveProperty("valid");
    expect(data.valid).toBe(false);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("GitHub API error");
  });

  it("should return 500 for workflow API errors", async () => {
    // Mock repository endpoint to succeed, but workflows endpoint to return 500
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              full_name: "owner/repo",
              html_url: "https://github.com/owner/repo",
              default_branch: "main",
              name: "repo",
              owner: {
                login: "owner",
                avatar_url: "https://github.com/owner.png",
              },
              private: false,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({ message: "Internal Server Error" }),
            {
              status: 500,
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
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(data).toHaveProperty("valid");
    expect(data.valid).toBe(false);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Cannot access workflows");
  });

  it("should handle repositories with no workflows", async () => {
    // Mock workflows endpoint to return empty workflows
    vi.spyOn(githubAuthModule, "makeGitHubRequest").mockImplementation(
      async (userId, url) => {
        if (url.includes("/repos/") && !url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              full_name: "owner/repo",
              html_url: "https://github.com/owner/repo",
              default_branch: "main",
              name: "repo",
              owner: {
                login: "owner",
                avatar_url: "https://github.com/owner.png",
              },
              private: false,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (url.includes("/actions/workflows")) {
          return new Response(
            JSON.stringify({
              total_count: 0,
              workflows: [],
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
      "http://localhost:3000/api/repo/validate",
      authHeaders,
      {
        method: "POST",
        body: {
          repoUrl: "owner/repo",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.workflowsAccessible).toBe(true);
    expect(data.workflowCount).toBe(0);
  });
});
