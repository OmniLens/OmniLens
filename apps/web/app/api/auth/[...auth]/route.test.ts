import { afterEach, describe, expect, it, vi } from "vitest";

// The route builds its handler at import time via `toNextJsHandler(auth)`. We
// stub `@/lib/auth` (so no real better-auth/pg init runs) and `toNextJsHandler`
// so it hands back GET/POST fns we control per-test. The route is a thin
// wrapper, so what matters is that it (a) delegates to the better-auth handler
// and returns its response untouched, and (b) converts a thrown error into a
// 500 JSON envelope instead of propagating.
// Hoisted so the (hoisted) vi.mock factory below can close over them.
const { betterAuthGet, betterAuthPost } = vi.hoisted(() => ({
  betterAuthGet: vi.fn(),
  betterAuthPost: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { __brand: "auth-instance" } }));
vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: vi.fn(() => ({ GET: betterAuthGet, POST: betterAuthPost })),
}));

import { GET, POST } from "@/app/api/auth/[...auth]/route";

afterEach(() => vi.clearAllMocks());

function authRequest(method: string): Request {
  return new Request("http://localhost/api/auth/session", { method });
}

describe("POST /api/auth/[...auth]", () => {
  it("delegates to the better-auth handler and returns its response verbatim", async () => {
    const upstream = new Response(JSON.stringify({ ok: true }), { status: 200 });
    betterAuthPost.mockResolvedValueOnce(upstream);

    const req = authRequest("POST");
    const res = await POST(req);

    expect(betterAuthPost).toHaveBeenCalledWith(req);
    expect(res).toBe(upstream);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("converts a thrown handler error into a 500 JSON envelope", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    betterAuthPost.mockRejectedValueOnce(new Error("boom"));

    const res = await POST(authRequest("POST"));

    expect(res.status).toBe(500);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.json()).toEqual({ error: "Authentication failed" });
    errSpy.mockRestore();
  });
});

describe("GET /api/auth/[...auth]", () => {
  it("delegates to the better-auth handler and returns its response verbatim", async () => {
    const upstream = new Response(JSON.stringify({ session: null }), { status: 200 });
    betterAuthGet.mockResolvedValueOnce(upstream);

    const req = authRequest("GET");
    const res = await GET(req);

    expect(betterAuthGet).toHaveBeenCalledWith(req);
    expect(res).toBe(upstream);
    expect(await res.json()).toEqual({ session: null });
  });

  it("converts a thrown handler error into a 500 JSON envelope", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    betterAuthGet.mockRejectedValueOnce(new Error("boom"));

    const res = await GET(authRequest("GET"));

    expect(res.status).toBe(500);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.json()).toEqual({ error: "Authentication failed" });
    errSpy.mockRestore();
  });
});
