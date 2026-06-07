import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearInvalidatedTokens,
  generateAdminToken,
  hashToken,
  invalidateToken,
  isTokenInvalidated,
  validateAdminToken,
  verifyToken,
  withAdminAuth,
} from "@/lib/admin-auth";
import { requestWithHeaders } from "@/lib/test-utils/route-harness";

// The invalidated-token store is module-level state shared across tests.
beforeEach(() => clearInvalidatedTokens());
afterEach(() => {
  clearInvalidatedTokens();
  vi.unstubAllEnvs();
});

// verifyToken compares hashToken(token) against ADMIN_API_TOKEN via
// timingSafeEqual, so the env var must hold the SHA-256 *hash* of the real token.
const ADMIN_TOKEN = "super-secret-admin-token";
const ADMIN_TOKEN_HASH = hashToken(ADMIN_TOKEN);
const ADMIN_URL = "http://localhost/api/admin/users";

function bearer(token: string) {
  return requestWithHeaders(ADMIN_URL, { authorization: `Bearer ${token}` });
}

describe("hashToken", () => {
  it("produces a stable 64-char hex SHA-256 digest", () => {
    const hash = hashToken("my-token");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("my-token")).toBe(hash);
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});

describe("generateAdminToken", () => {
  it("returns a non-empty 64-char hex string (32 random bytes)", () => {
    expect(generateAdminToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns a distinct value on each call", () => {
    expect(generateAdminToken()).not.toBe(generateAdminToken());
  });
});

describe("verifyToken", () => {
  it("returns true for a token matching its hash", () => {
    const token = "correct-horse-battery-staple";
    expect(verifyToken(token, hashToken(token))).toBe(true);
  });

  it("returns false for a token that does not match the hash", () => {
    expect(verifyToken("wrong-token", hashToken("real-token"))).toBe(false);
  });
});

describe("token invalidation", () => {
  it("reports a token as invalidated after invalidateToken", () => {
    const token = "session-token";
    expect(isTokenInvalidated(token)).toBe(false);
    invalidateToken(token);
    expect(isTokenInvalidated(token)).toBe(true);
  });

  it("does not report unrelated tokens as invalidated", () => {
    invalidateToken("token-one");
    expect(isTokenInvalidated("token-two")).toBe(false);
  });

  it("clearInvalidatedTokens resets the store", () => {
    invalidateToken("token-one");
    clearInvalidatedTokens();
    expect(isTokenInvalidated("token-one")).toBe(false);
  });
});

describe("validateAdminToken", () => {
  it("rejects a request with no Authorization header (401)", async () => {
    vi.stubEnv("ADMIN_API_TOKEN", ADMIN_TOKEN_HASH);

    const result = await validateAdminToken(requestWithHeaders(ADMIN_URL, {}));

    expect(result.authenticated).toBe(false);
    expect(result.response?.status).toBe(401);
  });

  it("rejects an Authorization header that isn't a Bearer token (401)", async () => {
    vi.stubEnv("ADMIN_API_TOKEN", ADMIN_TOKEN_HASH);

    const result = await validateAdminToken(
      requestWithHeaders(ADMIN_URL, { authorization: "Basic abc123" }),
    );

    expect(result.authenticated).toBe(false);
    expect(result.response?.status).toBe(401);
  });

  it("returns 500 when ADMIN_API_TOKEN is not configured", async () => {
    vi.stubEnv("ADMIN_API_TOKEN", undefined);

    const result = await validateAdminToken(bearer(ADMIN_TOKEN));

    expect(result.authenticated).toBe(false);
    expect(result.response?.status).toBe(500);
  });

  it("authenticates a correct token", async () => {
    vi.stubEnv("ADMIN_API_TOKEN", ADMIN_TOKEN_HASH);

    const result = await validateAdminToken(bearer(ADMIN_TOKEN));

    expect(result.authenticated).toBe(true);
  });

  it("rejects an incorrect token (403)", async () => {
    vi.stubEnv("ADMIN_API_TOKEN", ADMIN_TOKEN_HASH);

    const result = await validateAdminToken(bearer("wrong-token"));

    expect(result.authenticated).toBe(false);
    expect(result.response?.status).toBe(403);
    expect(await result.response?.json()).toMatchObject({ error: "Invalid admin token" });
  });

  it("rejects a token that has been invalidated (403)", async () => {
    vi.stubEnv("ADMIN_API_TOKEN", ADMIN_TOKEN_HASH);
    invalidateToken(ADMIN_TOKEN);

    const result = await validateAdminToken(bearer(ADMIN_TOKEN));

    expect(result.authenticated).toBe(false);
    expect(result.response?.status).toBe(403);
    expect(await result.response?.json()).toMatchObject({ error: "Token has been invalidated" });
  });
});

describe("withAdminAuth", () => {
  it("invokes the handler when the token is valid", async () => {
    vi.stubEnv("ADMIN_API_TOKEN", ADMIN_TOKEN_HASH);
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const res = await withAdminAuth(handler)(bearer(ADMIN_TOKEN));

    expect(handler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("short-circuits with the auth error and never calls the handler when unauthorized", async () => {
    vi.stubEnv("ADMIN_API_TOKEN", ADMIN_TOKEN_HASH);
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const res = await withAdminAuth(handler)(bearer("wrong-token"));

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
  });
});
