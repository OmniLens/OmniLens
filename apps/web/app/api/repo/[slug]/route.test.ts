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
  removeUserRepo: vi.fn(),
  deleteWorkflows: vi.fn(),
}));

import { DELETE, GET } from "@/app/api/repo/[slug]/route";
import { deleteWorkflows, getUserRepo, removeUserRepo } from "@/lib/db-storage";

const mockGetUserRepo = vi.mocked(getUserRepo);
const mockRemoveUserRepo = vi.mocked(removeUserRepo);
const mockDeleteWorkflows = vi.mocked(deleteWorkflows);

const URL = "http://localhost/api/repo/owner-repo";
const repo = {
  slug: "owner-repo",
  repoPath: "owner/repo",
  displayName: "Repo",
  htmlUrl: "https://github.com/owner/repo",
  defaultBranch: "main",
};

afterEach(() => vi.clearAllMocks());

describe("GET /api/repo/[slug]", () => {
  it("returns 200 with the repo when found, scoped to the user", async () => {
    mockGetUserRepo.mockResolvedValue(repo);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ success: true, repo: { slug: "owner-repo" } });
    expect(mockGetUserRepo).toHaveBeenCalledWith("owner-repo", TEST_USER_ID);
  });

  it("returns 404 when the repo does not belong to the user", async () => {
    mockGetUserRepo.mockResolvedValue(null);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 for an empty slug", async () => {
    const res = await GET(getRequest(URL), ctx({ slug: "" }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/repo/[slug]", () => {
  it("deletes the repo and its workflows, returning 200", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockDeleteWorkflows.mockResolvedValue(undefined);
    mockRemoveUserRepo.mockResolvedValue(repo);

    const res = await DELETE(jsonRequest(URL, { method: "DELETE" }), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ success: true, deletedRepo: { slug: "owner-repo" } });
    expect(mockDeleteWorkflows).toHaveBeenCalledWith("owner-repo", TEST_USER_ID);
    expect(mockRemoveUserRepo).toHaveBeenCalledWith("owner-repo", TEST_USER_ID);
  });

  it("returns 404 without deleting when the repo is missing", async () => {
    mockGetUserRepo.mockResolvedValue(null);

    const res = await DELETE(jsonRequest(URL, { method: "DELETE" }), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(404);
    expect(mockRemoveUserRepo).not.toHaveBeenCalled();
  });

  it("still deletes the repo when workflow cleanup fails (best effort)", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockDeleteWorkflows.mockRejectedValue(new Error("workflow delete blew up"));
    mockRemoveUserRepo.mockResolvedValue(repo);

    const res = await DELETE(jsonRequest(URL, { method: "DELETE" }), ctx({ slug: "owner-repo" }));

    expect(res.status).toBe(200);
    expect(mockRemoveUserRepo).toHaveBeenCalled();
  });

  it("returns 500 when the repo exists but removal returns nothing", async () => {
    mockGetUserRepo.mockResolvedValue(repo);
    mockDeleteWorkflows.mockResolvedValue(undefined);
    mockRemoveUserRepo.mockResolvedValue(null);

    const res = await DELETE(jsonRequest(URL, { method: "DELETE" }), ctx({ slug: "owner-repo" }));
    expect(res.status).toBe(500);
  });
});
