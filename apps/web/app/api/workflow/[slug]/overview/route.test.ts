import { afterEach, describe, expect, it, vi } from "vitest";

import { ctx, getRequest, githubResponse } from "@/lib/test-utils/route-harness";
import type { WorkflowRun } from "@/lib/github";

vi.mock("@/lib/auth-middleware", () => ({
  withAuth:
    (handler: (req: unknown, context: unknown, auth: unknown) => unknown) =>
    (req: unknown, context: unknown) =>
      handler(req, context, { user: { id: "test-user-1" }, session: { id: "s" } }),
}));

vi.mock("@/lib/db-storage", () => ({ getUserRepo: vi.fn() }));
vi.mock("@/lib/github-auth", () => ({ makeGitHubRequest: vi.fn() }));
// Partial mock: stub only the network fetch, keep the real (unit-tested) pure
// aggregators so we exercise the route's actual rate/shape composition.
vi.mock("@/lib/github", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/github")>();
  return { ...actual, getWorkflowRunsForDate: vi.fn() };
});

import { GET } from "@/app/api/workflow/[slug]/overview/route";
import { getUserRepo } from "@/lib/db-storage";
import { getWorkflowRunsForDate } from "@/lib/github";
import { makeGitHubRequest } from "@/lib/github-auth";

const mockGetUserRepo = vi.mocked(getUserRepo);
const mockRuns = vi.mocked(getWorkflowRunsForDate);
const mockGitHub = vi.mocked(makeGitHubRequest);

const URL = "http://localhost/api/workflow/owner-repo/overview";
const repo = { slug: "owner-repo", repoPath: "owner/repo", displayName: "Repo", htmlUrl: "h", defaultBranch: "main" };

function run(overrides: Partial<WorkflowRun>): WorkflowRun {
  return {
    id: 1,
    name: "CI",
    workflow_id: 1,
    conclusion: "success",
    status: "completed",
    html_url: "h",
    run_started_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:05:00Z",
    ...overrides,
  };
}

afterEach(() => vi.clearAllMocks());

describe("GET /api/workflow/[slug]/overview", () => {
  it("returns 404 when the repo isn't in the dashboard", async () => {
    mockGetUserRepo.mockResolvedValue(null);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    expect(res.status).toBe(404);
  });

  it("returns an empty overview (200) when GitHub workflows can't be fetched", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGitHub.mockResolvedValueOnce(githubResponse(500)); // workflows fetch fails

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.overview.totalWorkflows).toBe(0);
    expect(json.message).toMatch(/no active workflows/i);
    expect(mockRuns).not.toHaveBeenCalled();
  });

  it("composes overview metrics and computes success/pass rates", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGitHub
      // 1st call: active workflows list
      .mockResolvedValueOnce(
        githubResponse(200, {
          total_count: 2,
          workflows: [
            { id: 1, name: "CI", state: "active" },
            { id: 2, name: "Deploy", state: "active" },
          ],
        }),
      )
      // 2nd call: repo info
      .mockResolvedValueOnce(githubResponse(200, {}));

    // One pass, one fail across two distinct workflows -> 50% success rate.
    mockRuns.mockResolvedValue([
      run({ workflow_id: 1, conclusion: "success" }),
      run({ workflow_id: 2, conclusion: "failure" }),
    ]);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.repository.slug).toBe("owner-repo");
    expect(json.overview.completedRuns).toBe(2);
    expect(json.overview.passedRuns).toBe(1);
    expect(json.overview.failedRuns).toBe(1);
    expect(json.overview.successRate).toBe(50); // passed/completed
    expect(json.overview.passRate).toBe(50); // passed/totalWorkflows
    expect(json.overview.totalWorkflows).toBe(2);
    expect(json.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("aggregates an hourly breakdown alongside the rate metrics", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGitHub
      .mockResolvedValueOnce(
        githubResponse(200, {
          total_count: 1,
          workflows: [{ id: 1, name: "CI", state: "active" }],
        }),
      )
      .mockResolvedValueOnce(githubResponse(200, {}));

    // Two runs in the 10:00 UTC hour (config pins TZ=UTC).
    mockRuns.mockResolvedValue([
      run({ id: 1, workflow_id: 1, run_started_at: "2024-01-01T10:00:00Z" }),
      run({ id: 2, workflow_id: 1, run_started_at: "2024-01-01T10:30:00Z" }),
    ]);

    const json = await (await GET(getRequest(URL), ctx({ slug: "owner-repo" }))).json();

    expect(json.overview.totalRuns).toBe(2);
    expect(Array.isArray(json.overview.runsByHour)).toBe(true);
    expect(json.overview.runsByHour).toHaveLength(24);
    expect(json.overview.runsByHour[10]).toMatchObject({ hour: 10, total: 2, passed: 2 });
    expect(json.overview.maxRunsPerHour).toBe(2);
    expect(typeof json.generatedAt).toBe("string");
  });

  it("returns 400 when the stored repoPath isn't in owner/repo form", async () => {
    mockGetUserRepo.mockResolvedValue({ ...repo, repoPath: "no-slash" });

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/invalid repository path/i);
    expect(mockRuns).not.toHaveBeenCalled();
  });

  it("returns 500 when GitHub repo-info fetch fails after workflows load", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockGitHub
      .mockResolvedValueOnce(
        githubResponse(200, {
          total_count: 1,
          workflows: [{ id: 1, name: "CI", state: "active" }],
        }),
      )
      // 2nd call (repo info) fails -> 500.
      .mockResolvedValueOnce(githubResponse(503));

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toMatch(/failed to fetch repository information/i);
  });

  it("returns 400 for a malformed date query param", async () => {
    mockGetUserRepo.mockResolvedValue(repo);

    const res = await GET(getRequest(`${URL}?date=2024-1-1`), ctx({ slug: "owner-repo" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/invalid request parameters/i);
  });
});
