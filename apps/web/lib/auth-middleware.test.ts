import { NextResponse } from "next/server";
import { APIError } from "better-auth/api";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ctx, getRequest } from "@/lib/test-utils/route-harness";

// Mock only the auth instance so we drive getSession's outcome. APIError is the
// REAL class (imported from the same 'better-auth/api' the source uses) so the
// `instanceof APIError` branch in validateAuth is genuinely exercised.
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

import { validateAuth, withAuth } from "@/lib/auth-middleware";
import { auth } from "@/lib/auth";

const mockGetSession = vi.mocked(auth.api.getSession);

const URL = "http://localhost/api/repo";

// Minimal session payload matching what validateAuth reads off getSession. The
// real User/Session shapes have more fields, but the middleware only passes them
// through, so a structural stub (cast) is sufficient.
const sessionPayload = {
  user: { id: "user-1", name: "Alice", email: "a@example.com" },
  session: { id: "sess-1", userId: "user-1", token: "tok" },
} as unknown as Awaited<ReturnType<typeof auth.api.getSession>>;

afterEach(() => vi.clearAllMocks());

describe("validateAuth", () => {
  it("returns the user and session when a valid session exists", async () => {
    mockGetSession.mockResolvedValue(sessionPayload);

    const result = await validateAuth(getRequest(URL));

    expect(result).toMatchObject({
      authenticated: true,
      user: { id: "user-1" },
      session: { id: "sess-1" },
    });
    // The request headers are forwarded to better-auth for session lookup.
    expect(mockGetSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });

  it("rejects (401) when getSession returns null", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await validateAuth(getRequest(URL));

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error("unreachable");
    expect(result.error).toBe("Authentication required");
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({ error: "Authentication required" });
  });

  it("rejects (401) when the session has no user", async () => {
    mockGetSession.mockResolvedValue({ session: { id: "sess-1" } } as never);

    const result = await validateAuth(getRequest(URL));

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error("unreachable");
    expect(result.response.status).toBe(401);
  });

  it("rejects (401) when the user is present but the session object is missing", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } } as never);

    const result = await validateAuth(getRequest(URL));

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error("unreachable");
    expect(result.response.status).toBe(401);
  });

  it("maps a better-auth APIError to a 401 'Invalid session'", async () => {
    const apiErr = new APIError("UNAUTHORIZED", { message: "Session expired" });
    mockGetSession.mockRejectedValue(apiErr);

    const result = await validateAuth(getRequest(URL));

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error("unreachable");
    expect(result.error).toBe(apiErr.message);
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({ error: "Invalid session" });
  });

  it("maps an unexpected (non-APIError) failure to a 500", async () => {
    mockGetSession.mockRejectedValue(new Error("database unreachable"));

    const result = await validateAuth(getRequest(URL));

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error("unreachable");
    expect(result.error).toBe("Authentication failed");
    expect(result.response.status).toBe(500);
    expect(await result.response.json()).toEqual({ error: "Authentication failed" });
  });
});

describe("withAuth", () => {
  it("invokes the handler with the request, context, and resolved authData", async () => {
    mockGetSession.mockResolvedValue(sessionPayload);
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const request = getRequest(URL);
    const context = ctx({ slug: "owner-repo" });

    const res = await withAuth(handler)(request, context);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(request, context, {
      user: sessionPayload!.user,
      session: sessionPayload!.session,
    });
  });

  it("short-circuits with the 401 response and never calls the handler when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const res = await withAuth(handler)(getRequest(URL), ctx());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns the 500 response (handler not called) when auth validation throws unexpectedly", async () => {
    mockGetSession.mockRejectedValue(new Error("boom"));
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const res = await withAuth(handler)(getRequest(URL), ctx());

    expect(res.status).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });
});
