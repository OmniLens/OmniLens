import { afterEach, describe, expect, it, vi } from "vitest";

import { ctx, getRequest, TEST_USER_ID } from "@/lib/test-utils/route-harness";

vi.mock("@/lib/auth-middleware", () => ({
  withAuth:
    (handler: (req: unknown, context: unknown, auth: unknown) => unknown) =>
    (req: unknown, context: unknown) =>
      handler(req, context, { user: { id: "test-user-1" }, session: { id: "s" } }),
}));

vi.mock("@/lib/db-storage", () => ({ getWorkflows: vi.fn() }));

import { GET } from "@/app/api/workflow/[slug]/exists/route";
import { getWorkflows } from "@/lib/db-storage";

const mockGetWorkflows = vi.mocked(getWorkflows);
const URL = "http://localhost/api/workflow/owner-repo/exists";

const workflow = { id: 1, name: "CI", path: "ci.yml", state: "active", createdAt: "", updatedAt: "" };

afterEach(() => vi.clearAllMocks());

describe("GET /api/workflow/[slug]/exists", () => {
  it("reports existing workflows with a count, scoped to the user", async () => {
    mockGetWorkflows.mockResolvedValue([workflow, { ...workflow, id: 2, name: "Deploy" }]);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ hasWorkflows: true, workflowCount: 2 });
    expect(json.message).toMatch(/found 2 saved workflows/i);
    expect(mockGetWorkflows).toHaveBeenCalledWith("owner-repo", TEST_USER_ID);
  });

  it("reports no workflows when none are saved", async () => {
    mockGetWorkflows.mockResolvedValue([]);

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ hasWorkflows: false, workflowCount: 0 });
    expect(json.message).toMatch(/no saved workflows/i);
  });

  it("returns 400 for an empty slug without touching the database", async () => {
    const res = await GET(getRequest(URL), ctx({ slug: "" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid repository slug/i);
    expect(mockGetWorkflows).not.toHaveBeenCalled();
  });

  it("returns 500 with a safe default payload when the query fails", async () => {
    mockGetWorkflows.mockRejectedValue(new Error("db down"));

    const res = await GET(getRequest(URL), ctx({ slug: "owner-repo" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toMatchObject({ hasWorkflows: false, workflowCount: 0 });
  });
});
