import { afterEach, describe, expect, it, vi } from "vitest";

import { getRequest } from "@/lib/test-utils/route-harness";

// This route is gated by withAdminAuth (admin token). The gate itself is
// unit-tested in lib/admin-auth.test.ts; here we pass it through to exercise
// the handler body.
vi.mock("@/lib/admin-auth", () => ({
  withAdminAuth:
    (handler: (req: unknown) => unknown) =>
    (req: unknown) =>
      handler(req),
}));

vi.mock("@/lib/db-storage", () => ({ getAllUserIds: vi.fn() }));

import { GET } from "@/app/api/admin/user-ids/route";
import { getAllUserIds } from "@/lib/db-storage";

const mockGetAllUserIds = vi.mocked(getAllUserIds);
const URL = "http://localhost/api/admin/user-ids";

afterEach(() => vi.clearAllMocks());

describe("GET /api/admin/user-ids", () => {
  it("returns the user ids with a count and message", async () => {
    mockGetAllUserIds.mockResolvedValue(["u1", "u2", "u3"]);

    const res = await GET(getRequest(URL));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.userIds).toEqual(["u1", "u2", "u3"]);
    expect(json.count).toBe(3);
    expect(json.message).toMatch(/found 3 users/i);
  });

  it("returns 500 when the query fails", async () => {
    mockGetAllUserIds.mockRejectedValue(new Error("db down"));

    const res = await GET(getRequest(URL));
    expect(res.status).toBe(500);
  });
});
