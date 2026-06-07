import { afterEach, describe, expect, it, vi } from "vitest";

import { ctx, getRequest, githubResponse, jsonRequest, TEST_USER_ID } from "@/lib/test-utils/route-harness";

vi.mock("@/lib/auth-middleware", () => ({
  withAuth:
    (handler: (req: unknown, context: unknown, auth: unknown) => unknown) =>
    (req: unknown, context: unknown) =>
      handler(req, context, { user: { id: "test-user-1" }, session: { id: "s" } }),
}));

vi.mock("@/lib/db-storage", () => ({
  getUserRepo: vi.fn(),
  saveWorkflows: vi.fn(),
  deleteWorkflows: vi.fn(),
  getWorkflows: vi.fn(),
}));
vi.mock("@/lib/github-auth", () => ({ makeGitHubRequest: vi.fn() }));
// Stub the aggregation module so the real one (and its transitive deps) never
// loads; these tests exercise the PUT/DELETE/cache paths that don't call it.
vi.mock("@/lib/github", () => ({
  getWorkflowRunsForDate: vi.fn(),
  getWorkflowRunsForDateGrouped: vi.fn(),
  calculateHourlyBreakdown: vi.fn(),
  calculateHourlyStatistics: vi.fn(),
  calculateMissingWorkflows: vi.fn(),
}));

import { DELETE, GET, PUT } from "@/app/api/workflow/[slug]/route";
import { deleteWorkflows, getUserRepo, getWorkflows, saveWorkflows } from "@/lib/db-storage";
import { makeGitHubRequest } from "@/lib/github-auth";

const mockGetUserRepo = vi.mocked(getUserRepo);
const mockGetWorkflows = vi.mocked(getWorkflows);
const mockSaveWorkflows = vi.mocked(saveWorkflows);
const mockDeleteWorkflows = vi.mocked(deleteWorkflows);
const mockGitHub = vi.mocked(makeGitHubRequest);

const URL = "http://localhost/api/workflow/owner-repo";
const repo = { slug: "owner-repo", repoPath: "owner/repo", displayName: "Repo", htmlUrl: "h", defaultBranch: "main" };

afterEach(() => vi.clearAllMocks());

describe("GET /api/workflow/[slug]", () => {
  it("returns 404 when the repo isn't in the dashboard", async () => {
    mockGetUserRepo.mockResolvedValue(null);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    expect(res.status).toBe(404);
  });

  it("serves cached workflows (X-Cache HIT) without calling GitHub", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGetWorkflows.mockResolvedValue([
      {
        id: 1,
        name: "CI",
        path: "ci.yml",
        state: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), // recent -> cache hit
      },
    ]);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("HIT");
    expect(json.totalCount).toBe(1);
    expect(mockGitHub).not.toHaveBeenCalled();
  });
});

describe("GET /api/workflow/[slug] — cache miss (GitHub sync)", () => {
  // A payload entry from GitHub's /actions/workflows list endpoint.
  function ghWorkflow(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      name: "CI",
      path: ".github/workflows/ci.yml",
      state: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
      ...overrides,
    };
  }

  // A saved row whose updatedAt is well outside the 5-minute cache window, so the
  // route treats the cache as stale and falls through to the GitHub fetch.
  const staleSaved = {
    id: 9,
    name: "Old",
    path: "old.yml",
    state: "active",
    createdAt: "2020-01-01T00:00:00Z",
    updatedAt: "2020-01-01T00:00:00Z",
  };

  // Cache-miss order of makeGitHubRequest calls: (1) repo info, (2) workflows list.
  function mockGitHubOk(workflows: ReturnType<typeof ghWorkflow>[]) {
    mockGitHub
      .mockResolvedValueOnce(githubResponse(200, { id: 1 })) // repo info
      .mockResolvedValueOnce(githubResponse(200, { total_count: workflows.length, workflows }));
  }

  it("fetches from GitHub on a stale cache, filters to active workflows, persists, and returns X-Cache MISS", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGetWorkflows.mockResolvedValue([staleSaved]); // stale -> miss
    mockGitHubOk([
      ghWorkflow({ id: 1, name: "CI" }),
      ghWorkflow({ id: 2, name: "Old", state: "deleted" }), // excluded
    ]);
    mockSaveWorkflows.mockResolvedValue(undefined as never);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    // The deleted workflow is filtered out.
    expect(json.totalCount).toBe(1);
    expect(json.workflows).toHaveLength(1);
    expect(json.workflows[0]).toMatchObject({ id: 1, name: "CI", state: "active" });
    expect(json.repository).toMatchObject({ slug: "owner-repo", repoPath: "owner/repo" });
    // Fresh workflows are persisted, scoped to the authenticated user.
    expect(mockSaveWorkflows).toHaveBeenCalledWith(
      "owner-repo",
      [expect.objectContaining({ id: 1, name: "CI", state: "active" })],
      TEST_USER_ID,
    );
  });

  it("treats an empty workflow cache as a miss and fetches fresh", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGetWorkflows.mockResolvedValue([]); // empty -> miss
    mockGitHubOk([ghWorkflow()]);
    mockSaveWorkflows.mockResolvedValue(undefined as never);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(mockSaveWorkflows).toHaveBeenCalledOnce();
  });

  it("still returns 200 MISS when persisting the fetched workflows fails (best effort)", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGetWorkflows.mockResolvedValue([]);
    mockGitHubOk([ghWorkflow()]);
    mockSaveWorkflows.mockRejectedValue(new Error("db write failed"));

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(json.totalCount).toBe(1);
  });

  it("returns 500 when the repository-info fetch fails, without fetching workflows or saving", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGetWorkflows.mockResolvedValue([]);
    mockGitHub.mockResolvedValueOnce(githubResponse(500)); // repo info fails

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/repository information/i);
    expect(mockGitHub).toHaveBeenCalledOnce(); // never reached the workflows fetch
    expect(mockSaveWorkflows).not.toHaveBeenCalled();
  });

  it("maps a GitHub 404 on the workflows fetch to 404 and does not save", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGetWorkflows.mockResolvedValue([]);
    mockGitHub
      .mockResolvedValueOnce(githubResponse(200, { id: 1 }))
      .mockResolvedValueOnce(githubResponse(404));

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/not found on github/i);
    expect(mockSaveWorkflows).not.toHaveBeenCalled();
  });

  it("maps a GitHub 403 on the workflows fetch to 403", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGetWorkflows.mockResolvedValue([]);
    mockGitHub
      .mockResolvedValueOnce(githubResponse(200, { id: 1 }))
      .mockResolvedValueOnce(githubResponse(403));

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/access denied/i);
  });

  it("maps any other GitHub failure on the workflows fetch to 500", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGetWorkflows.mockResolvedValue([]);
    mockGitHub
      .mockResolvedValueOnce(githubResponse(200, { id: 1 }))
      .mockResolvedValueOnce(githubResponse(502));

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/failed to fetch workflows from github/i);
  });

  it("returns 400 for a repo whose path has no owner/name separator, without calling GitHub", async () => {
    mockGetUserRepo.mockResolvedValue({ ...repo, repoPath: "noslash" });
    mockGetWorkflows.mockResolvedValue([]); // miss -> reaches the path split

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid repository path/i);
    expect(mockGitHub).not.toHaveBeenCalled();
  });
});

describe("PUT /api/workflow/[slug]", () => {
  it("saves a valid workflow list and echoes it back", async () => {
    mockSaveWorkflows.mockResolvedValue(undefined as never);
    const workflows = [{ id: 1, name: "CI", path: "ci.yml", state: "active" }];

    const res = await PUT(jsonRequest(URL, { method: "PUT", body: { workflows } }), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.workflows).toHaveLength(1);
    expect(mockSaveWorkflows).toHaveBeenCalledWith("owner-repo", workflows, TEST_USER_ID);
  });

  it("returns 400 when workflows is not an array", async () => {
    const res = await PUT(
      jsonRequest(URL, { method: "PUT", body: { workflows: "nope" } }),
      ctx({ slug: "owner-repo" }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/must be an array/i);
    expect(mockSaveWorkflows).not.toHaveBeenCalled();
  });

  it("returns 400 when a workflow entry fails schema validation", async () => {
    const res = await PUT(
      jsonRequest(URL, { method: "PUT", body: { workflows: [{ id: "not-a-number", name: "x", path: "y", state: "z" }] } }),
      ctx({ slug: "owner-repo" }),
    );

    expect(res.status).toBe(400);
    expect(mockSaveWorkflows).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/workflow/[slug]", () => {
  it("deletes workflows for an existing repo", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockDeleteWorkflows.mockResolvedValue(undefined);

    const res = await DELETE(jsonRequest(URL, { method: "DELETE" }), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(mockDeleteWorkflows).toHaveBeenCalledWith("owner-repo", TEST_USER_ID);
  });

  it("returns 404 when the repo is missing", async () => {
    mockGetUserRepo.mockResolvedValue(null);

    const res = await DELETE(jsonRequest(URL, { method: "DELETE" }), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(404);
    expect(mockDeleteWorkflows).not.toHaveBeenCalled();
  });
});
