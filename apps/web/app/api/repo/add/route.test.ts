import { afterEach, describe, expect, it, vi } from "vitest";

import { ctx, githubResponse, jsonRequest, TEST_USER_ID } from "@/lib/test-utils/route-harness";

// withAuth becomes a pass-through that injects a fixed authenticated user, so the
// real handler body runs without a session. (Hoisted — id is inlined by necessity.)
vi.mock("@/lib/auth-middleware", () => ({
  withAuth:
    (handler: (req: unknown, context: unknown, auth: unknown) => unknown) =>
    (req: unknown, context: unknown) =>
      handler(req, context, { user: { id: "test-user-1" }, session: { id: "s" } }),
}));

vi.mock("@/lib/db-storage", () => ({ addUserRepo: vi.fn() }));
vi.mock("@/lib/github-auth", () => ({ makeGitHubRequest: vi.fn() }));
vi.mock("@/lib/repo-workflow-fetch", () => ({ fetchWorkflowDataForNewRepo: vi.fn() }));

import { POST } from "@/app/api/repo/add/route";
import { addUserRepo } from "@/lib/db-storage";
import { makeGitHubRequest } from "@/lib/github-auth";
import { fetchWorkflowDataForNewRepo } from "@/lib/repo-workflow-fetch";

const mockAddUserRepo = vi.mocked(addUserRepo);
const mockGitHub = vi.mocked(makeGitHubRequest);
const mockFetchWorkflows = vi.mocked(fetchWorkflowDataForNewRepo);

const URL = "http://localhost/api/repo/add";
const validBody = {
  repoPath: "owner/repo",
  displayName: "Repo",
  htmlUrl: "https://github.com/owner/repo",
  defaultBranch: "main",
};

afterEach(() => vi.clearAllMocks());

describe("POST /api/repo/add", () => {
  it("adds a repo and returns 200 with the created repo", async () => {
    mockGitHub.mockResolvedValue(githubResponse(200, { private: false, owner: { avatar_url: "a.png" } }));
    mockAddUserRepo.mockResolvedValue({ success: true });
    mockFetchWorkflows.mockResolvedValue(null);

    const res = await POST(jsonRequest(URL, { body: validBody }), ctx());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.repo.slug).toBe("owner-repo");
    // db write is scoped to the authenticated user, with visibility derived from GitHub.
    expect(mockAddUserRepo).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "owner-repo", visibility: "public" }),
      TEST_USER_ID,
    );
  });

  it("marks the repo private when GitHub reports it private", async () => {
    mockGitHub.mockResolvedValue(githubResponse(200, { private: true, owner: { avatar_url: "a.png" } }));
    mockAddUserRepo.mockResolvedValue({ success: true });
    mockFetchWorkflows.mockResolvedValue(null);

    await POST(jsonRequest(URL, { body: validBody }), ctx());

    expect(mockAddUserRepo).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: "private" }),
      TEST_USER_ID,
    );
  });

  it("returns 400 when the repo limit is reached", async () => {
    mockGitHub.mockResolvedValue(githubResponse(200, { private: false, owner: { avatar_url: "a.png" } }));
    mockAddUserRepo.mockResolvedValue({ success: false, error: "Maximum repository limit reached. You can add up to 12." });

    const res = await POST(jsonRequest(URL, { body: validBody }), ctx());

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/maximum repository limit/i);
  });

  it("returns 409 when the repo already exists", async () => {
    mockGitHub.mockResolvedValue(githubResponse(200, { private: false, owner: { avatar_url: "a.png" } }));
    mockAddUserRepo.mockResolvedValue({ success: false, error: "Repository already exists" });

    const res = await POST(jsonRequest(URL, { body: validBody }), ctx());

    expect(res.status).toBe(409);
  });

  it("maps a GitHub 404 to a 404 and never touches the database", async () => {
    mockGitHub.mockResolvedValue(githubResponse(404));

    const res = await POST(jsonRequest(URL, { body: validBody }), ctx());

    expect(res.status).toBe(404);
    expect(mockAddUserRepo).not.toHaveBeenCalled();
  });

  it("maps a GitHub 403 to a 403", async () => {
    mockGitHub.mockResolvedValue(githubResponse(403));

    const res = await POST(jsonRequest(URL, { body: validBody }), ctx());

    expect(res.status).toBe(403);
  });

  it("returns 401 when the GitHub token is missing", async () => {
    mockGitHub.mockRejectedValue(new Error("GitHub access token not found. Please log in."));

    const res = await POST(jsonRequest(URL, { body: validBody }), ctx());

    expect(res.status).toBe(401);
  });

  it("returns 400 for a body that fails schema validation", async () => {
    const res = await POST(jsonRequest(URL, { body: { repoPath: "owner/repo" } }), ctx());

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid request data/i);
    expect(mockGitHub).not.toHaveBeenCalled();
  });
});
