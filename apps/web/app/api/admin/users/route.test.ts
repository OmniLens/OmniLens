import { afterEach, describe, expect, it, vi } from "vitest";

import { getRequest } from "@/lib/test-utils/route-harness";

// The gate itself (withAdminAuth/validateAdminToken) is unit-tested in
// lib/admin-auth.test.ts. Here we pass auth through to test the handler body.
vi.mock("@/lib/admin-auth", () => ({
  withAdminAuth:
    (handler: (req: unknown) => unknown) =>
    (req: unknown) =>
      handler(req),
}));

vi.mock("@/lib/db-storage", () => ({
  getAllUsers: vi.fn(),
  getAllUsersWithStats: vi.fn(),
  getUserById: vi.fn(),
}));

import { GET } from "@/app/api/admin/users/route";
import { getAllUsers, getAllUsersWithStats, getUserById } from "@/lib/db-storage";

const mockGetAllUsers = vi.mocked(getAllUsers);
const mockGetAllUsersWithStats = vi.mocked(getAllUsersWithStats);
const mockGetUserById = vi.mocked(getUserById);

const URL = "http://localhost/api/admin/users";
const user = {
  id: "u1",
  name: "Alice",
  email: "a@example.com",
  emailVerified: true,
  image: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  githubId: "123",
  avatarUrl: null,
};
const userWithStats = { ...user, repositoryCount: 2, workflowCount: 5, lastActivity: null };

afterEach(() => vi.clearAllMocks());

describe("GET /api/admin/users", () => {
  it("returns all users (no stats) by default", async () => {
    mockGetAllUsers.mockResolvedValue([user]);

    const res = await GET(getRequest(URL));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.users).toHaveLength(1);
    expect(json.users[0].id).toBe("u1");
    expect(mockGetAllUsersWithStats).not.toHaveBeenCalled();
  });

  it("returns users with statistics when includeStats=true", async () => {
    mockGetAllUsersWithStats.mockResolvedValue([userWithStats]);

    const res = await GET(getRequest(`${URL}?includeStats=true`));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.users[0]).toMatchObject({ repositoryCount: 2, workflowCount: 5 });
    expect(mockGetAllUsers).not.toHaveBeenCalled();
  });

  it("returns a single user when userId matches", async () => {
    mockGetUserById.mockResolvedValue(user);

    const res = await GET(getRequest(`${URL}?userId=u1`));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.id).toBe("u1");
    expect(mockGetUserById).toHaveBeenCalledWith("u1");
  });

  it("returns 404 when the requested userId is not found", async () => {
    mockGetUserById.mockResolvedValue(null);

    const res = await GET(getRequest(`${URL}?userId=ghost`));
    expect(res.status).toBe(404);
  });

  it("returns 500 when stored users fail response-schema validation", async () => {
    mockGetAllUsers.mockResolvedValue([{ id: 1 } as never]);

    const res = await GET(getRequest(URL));
    expect(res.status).toBe(500);
  });
});
