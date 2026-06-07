import { afterEach, describe, expect, it, vi } from "vitest";

import { getRequest, TEST_USER_ID } from "@/lib/test-utils/route-harness";

vi.mock("@/lib/auth-middleware", () => ({
  withAuth:
    (handler: (req: unknown, context: unknown, auth: unknown) => unknown) =>
    (req: unknown, context: unknown) =>
      handler(req, context, { user: { id: "test-user-1" }, session: { id: "s" } }),
}));

vi.mock("@/lib/db-storage", () => ({ loadUserAddedRepos: vi.fn() }));

import { GET } from "@/app/api/repo/route";
import { loadUserAddedRepos } from "@/lib/db-storage";

const mockLoad = vi.mocked(loadUserAddedRepos);
const URL = "http://localhost/api/repo";

afterEach(() => vi.clearAllMocks());

describe("GET /api/repo", () => {
  it("returns the user's repos mapped to the API shape", async () => {
    mockLoad.mockResolvedValue([
      {
        slug: "owner-repo",
        repoPath: "owner/repo",
        displayName: "Repo",
        htmlUrl: "https://github.com/owner/repo",
        defaultBranch: "main",
        // avatarUrl omitted -> should normalize to null
      },
    ]);

    const res = await GET(getRequest(URL), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.repositories).toHaveLength(1);
    expect(json.repositories[0]).toEqual({
      slug: "owner-repo",
      repoPath: "owner/repo",
      displayName: "Repo",
      avatarUrl: null,
      htmlUrl: "https://github.com/owner/repo",
    });
    expect(mockLoad).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it("returns an empty list with no-store caching", async () => {
    mockLoad.mockResolvedValue([]);

    const res = await GET(getRequest(URL), undefined as never);

    expect(res.status).toBe(200);
    expect((await res.json()).repositories).toEqual([]);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 500 when the stored data fails response-schema validation", async () => {
    // A repo missing its slug violates the response schema -> 500, not a silent pass.
    mockLoad.mockResolvedValue([
      { repoPath: "owner/repo", displayName: "Repo" } as never,
    ]);

    const res = await GET(getRequest(URL), undefined as never);
    expect(res.status).toBe(500);
  });
});
