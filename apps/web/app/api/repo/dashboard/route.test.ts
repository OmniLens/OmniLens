import { afterEach, describe, expect, it, vi } from "vitest";

import { getRequest, githubResponse, TEST_USER_ID } from "@/lib/test-utils/route-harness";
import type { WorkflowRun } from "@/lib/github";

vi.mock("@/lib/auth-middleware", () => ({
  withAuth:
    (handler: (req: unknown, context: unknown, auth: unknown) => unknown) =>
    (req: unknown, context: unknown) =>
      handler(req, context, { user: { id: "test-user-1" }, session: { id: "s" } }),
}));

// The route reads loadUserAddedRepos up front and getWorkflows via a dynamic
// import() per repo — both resolve to this same mocked module.
vi.mock("@/lib/db-storage", () => ({
  loadUserAddedRepos: vi.fn(),
  getWorkflows: vi.fn(),
}));
vi.mock("@/lib/github-auth", () => ({ makeGitHubRequest: vi.fn() }));
vi.mock("@/lib/github", () => ({ getWorkflowRunsForDate: vi.fn() }));

import { GET } from "@/app/api/repo/dashboard/route";
import { getWorkflows, loadUserAddedRepos } from "@/lib/db-storage";
import { getWorkflowRunsForDate } from "@/lib/github";
import { makeGitHubRequest } from "@/lib/github-auth";

const mockLoad = vi.mocked(loadUserAddedRepos);
const mockGetWorkflows = vi.mocked(getWorkflows);
const mockRuns = vi.mocked(getWorkflowRunsForDate);
const mockGitHub = vi.mocked(makeGitHubRequest);

const URL = "http://localhost/api/repo/dashboard";
const todayStr = new Date().toISOString().slice(0, 10);

function repo(slug: string, overrides: Record<string, unknown> = {}) {
  return {
    slug,
    repoPath: `owner/${slug}`,
    displayName: slug,
    htmlUrl: `https://github.com/owner/${slug}`,
    defaultBranch: "main",
    ...overrides,
  };
}

function run(overrides: Partial<WorkflowRun>): WorkflowRun {
  return {
    id: 1,
    name: "CI",
    workflow_id: 1,
    conclusion: "success",
    status: "completed",
    html_url: "h",
    run_started_at: `${todayStr}T12:00:00Z`,
    updated_at: `${todayStr}T12:05:00Z`,
    ...overrides,
  };
}

afterEach(() => vi.clearAllMocks());

describe("GET /api/repo/dashboard", () => {
  it("short-circuits with an empty payload when the user has no repos", async () => {
    mockLoad.mockResolvedValue([]);

    const res = await GET(getRequest(URL), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ repositories: [], totalCount: 0 });
    expect(mockGitHub).not.toHaveBeenCalled();
  });

  it("returns default metrics and skips GitHub when a repo has no saved workflows", async () => {
    mockLoad.mockResolvedValue([repo("no-wf")]);
    mockGetWorkflows.mockResolvedValue([]);

    const res = await GET(getRequest(URL), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.totalCount).toBe(1);
    expect(json.repositories[0]).toMatchObject({
      slug: "no-wf",
      hasWorkflows: false,
      hasError: false,
      metrics: { totalWorkflows: 0, passedRuns: 0, failedRuns: 0, inProgressRuns: 0, successRate: 0 },
    });
    expect(mockGitHub).not.toHaveBeenCalled();
    // db reads are scoped to the authenticated user.
    expect(mockLoad).toHaveBeenCalledWith(TEST_USER_ID);
    expect(mockGetWorkflows).toHaveBeenCalledWith("no-wf", TEST_USER_ID);
  });

  it("composes today's metrics from active workflows and runs", async () => {
    mockLoad.mockResolvedValue([repo("with-wf")]);
    mockGetWorkflows.mockResolvedValue([
      { id: 1, name: "CI", path: "ci.yml", state: "active", createdAt: "", updatedAt: "" },
    ]);
    // active workflows list: 2 active + 1 deleted -> totalWorkflows 2
    mockGitHub.mockResolvedValue(
      githubResponse(200, {
        total_count: 3,
        workflows: [
          { id: 1, name: "CI", state: "active" },
          { id: 2, name: "Deploy", state: "active" },
          { id: 3, name: "Old", state: "deleted" },
        ],
      }),
    );
    // 2 passed (completed), 1 failed (completed), 1 in-progress
    mockRuns.mockResolvedValue([
      run({ id: 1, status: "completed", conclusion: "success" }),
      run({ id: 2, status: "completed", conclusion: "success" }),
      run({ id: 3, status: "completed", conclusion: "failure" }),
      run({ id: 4, status: "in_progress", conclusion: null }),
    ]);

    const res = await GET(getRequest(URL), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.repositories[0]).toMatchObject({
      slug: "with-wf",
      hasWorkflows: true,
      hasError: false,
      metrics: {
        totalWorkflows: 2, // deleted workflow excluded
        passedRuns: 2,
        failedRuns: 1,
        inProgressRuns: 1,
        successRate: 67, // round(2/3 completed * 100)
      },
    });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("excludes runs that did not start today", async () => {
    mockLoad.mockResolvedValue([repo("with-wf")]);
    mockGetWorkflows.mockResolvedValue([
      { id: 1, name: "CI", path: "ci.yml", state: "active", createdAt: "", updatedAt: "" },
    ]);
    mockGitHub.mockResolvedValue(
      githubResponse(200, { total_count: 1, workflows: [{ id: 1, name: "CI", state: "active" }] }),
    );
    mockRuns.mockResolvedValue([
      run({ id: 1, status: "completed", conclusion: "success", run_started_at: "2000-01-01T12:00:00Z" }),
    ]);

    const res = await GET(getRequest(URL), undefined as never);
    const json = await res.json();

    // The stale run is filtered out -> no passes counted.
    expect(json.repositories[0].metrics.passedRuns).toBe(0);
  });

  it("keeps default metrics (no error) when the GitHub workflows fetch fails", async () => {
    mockLoad.mockResolvedValue([repo("gh-down")]);
    mockGetWorkflows.mockResolvedValue([
      { id: 1, name: "CI", path: "ci.yml", state: "active", createdAt: "", updatedAt: "" },
    ]);
    mockGitHub.mockResolvedValue(githubResponse(500));

    const res = await GET(getRequest(URL), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.repositories[0]).toMatchObject({
      hasWorkflows: true,
      hasError: false,
      metrics: { totalWorkflows: 0, passedRuns: 0 },
    });
    expect(mockRuns).not.toHaveBeenCalled();
  });

  it("isolates a per-repo failure: one repo errors as a graceful entry, the other still loads", async () => {
    mockLoad.mockResolvedValue([repo("good"), repo("bad")]);
    mockGetWorkflows.mockImplementation(async (slug: string) => {
      if (slug === "bad") throw new Error("db blew up for this repo");
      return [];
    });

    const res = await GET(getRequest(URL), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.totalCount).toBe(2);
    const bySlug = Object.fromEntries(json.repositories.map((r: { slug: string }) => [r.slug, r]));
    expect(bySlug.good.hasError).toBe(false);
    expect(bySlug.bad).toMatchObject({
      hasError: true,
      errorMessage: "Failed to load repository data",
      metrics: { totalWorkflows: 0, passedRuns: 0, failedRuns: 0, inProgressRuns: 0, successRate: 0 },
    });
  });

  it("returns 500 when the repo list itself can't be loaded", async () => {
    mockLoad.mockRejectedValue(new Error("db down"));

    const res = await GET(getRequest(URL), undefined as never);

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/failed to fetch dashboard data/i);
  });
});
