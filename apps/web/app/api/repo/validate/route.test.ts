import { afterEach, describe, expect, it, vi } from "vitest";

import { ctx, githubResponse, jsonRequest } from "@/lib/test-utils/route-harness";

vi.mock("@/lib/auth-middleware", () => ({
  withAuth:
    (handler: (req: unknown, context: unknown, auth: unknown) => unknown) =>
    (req: unknown, context: unknown) =>
      handler(req, context, { user: { id: "test-user-1" }, session: { id: "s" } }),
}));

vi.mock("@/lib/github-auth", () => ({ makeGitHubRequest: vi.fn() }));

import { POST } from "@/app/api/repo/validate/route";
import { makeGitHubRequest } from "@/lib/github-auth";

const mockGitHub = vi.mocked(makeGitHubRequest);
const URL = "http://localhost/api/repo/validate";

const repoJson = {
  full_name: "owner/repo",
  html_url: "https://github.com/owner/repo",
  default_branch: "main",
  name: "repo",
  owner: { login: "owner", avatar_url: "a.png" },
  private: false,
};

afterEach(() => vi.clearAllMocks());

describe("POST /api/repo/validate", () => {
  it("validates an accessible repo and counts only active workflows", async () => {
    mockGitHub
      .mockResolvedValueOnce(githubResponse(200, repoJson))
      .mockResolvedValueOnce(
        githubResponse(200, {
          total_count: 3,
          workflows: [{ state: "active" }, { state: "active" }, { state: "deleted" }],
        }),
      );

    const res = await POST(jsonRequest(URL, { body: { repoUrl: "owner/repo" } }), ctx());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      valid: true,
      repoPath: "owner/repo",
      defaultBranch: "main",
      visibility: "public",
      workflowsAccessible: true,
      workflowCount: 2, // the deleted workflow is excluded
    });
  });

  it("returns 400 for an unparseable repo reference without calling GitHub", async () => {
    const res = await POST(jsonRequest(URL, { body: { repoUrl: "not-a-repo" } }), ctx());

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid github repository/i);
    expect(mockGitHub).not.toHaveBeenCalled();
  });

  it("returns 400 when repoUrl is missing (schema validation)", async () => {
    const res = await POST(jsonRequest(URL, { body: {} }), ctx());
    expect(res.status).toBe(400);
  });

  it("maps a repo 404 to a 404 valid:false", async () => {
    mockGitHub.mockResolvedValueOnce(githubResponse(404));

    const res = await POST(jsonRequest(URL, { body: { repoUrl: "owner/repo" } }), ctx());

    expect(res.status).toBe(404);
    expect((await res.json()).valid).toBe(false);
  });

  it("maps a repo 403 to a 403", async () => {
    mockGitHub.mockResolvedValueOnce(githubResponse(403));

    const res = await POST(jsonRequest(URL, { body: { repoUrl: "owner/repo" } }), ctx());
    expect(res.status).toBe(403);
  });

  it("returns 403 when the repo is readable but its workflows are not", async () => {
    mockGitHub
      .mockResolvedValueOnce(githubResponse(200, repoJson))
      .mockResolvedValueOnce(githubResponse(403));

    const res = await POST(jsonRequest(URL, { body: { repoUrl: "owner/repo" } }), ctx());

    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/workflows/i);
  });

  it("returns 404 when the workflows endpoint 404s", async () => {
    mockGitHub
      .mockResolvedValueOnce(githubResponse(200, repoJson))
      .mockResolvedValueOnce(githubResponse(404));

    const res = await POST(jsonRequest(URL, { body: { repoUrl: "owner/repo" } }), ctx());
    expect(res.status).toBe(404);
  });

  it("returns 401 when the GitHub token is missing", async () => {
    mockGitHub.mockRejectedValue(new Error("GitHub access token not found."));

    const res = await POST(jsonRequest(URL, { body: { repoUrl: "owner/repo" } }), ctx());
    expect(res.status).toBe(401);
  });
});
