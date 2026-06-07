import { afterEach, describe, expect, it, vi } from "vitest";

import { ctx, getRequest, jsonRequest, TEST_USER_ID } from "@/lib/test-utils/route-harness";

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
