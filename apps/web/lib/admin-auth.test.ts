import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearInvalidatedTokens,
  generateAdminToken,
  hashToken,
  invalidateToken,
  isTokenInvalidated,
  verifyToken,
} from "@/lib/admin-auth";

// The invalidated-token store is module-level state shared across tests.
beforeEach(() => clearInvalidatedTokens());
afterEach(() => clearInvalidatedTokens());

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
