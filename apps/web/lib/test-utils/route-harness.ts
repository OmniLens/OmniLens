import { NextRequest } from "next/server";

// Shared helpers for direct-handler API route tests. These invoke the exported
// route handlers in-process with mocked auth/db/github seams — no server, no DB.

// The user id the mocked withAuth injects. Route tests assert that db/github
// calls are scoped to this id. Keep in sync with the withAuth mock factories,
// which (being hoisted) must inline the literal rather than import this.
export const TEST_USER_ID = "test-user-1";

/** A JSON-body request (POST/PUT/DELETE). */
export function jsonRequest(
  url: string,
  { method = "POST", body }: { method?: string; body?: unknown } = {},
): NextRequest {
  return new NextRequest(new URL(url), {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** A bodyless GET request. */
export function getRequest(url: string): NextRequest {
  return new NextRequest(new URL(url), { method: "GET" });
}

/** A request with explicit headers (e.g. an admin Authorization bearer). */
export function requestWithHeaders(
  url: string,
  headers: Record<string, string>,
  method = "GET",
): NextRequest {
  return new NextRequest(new URL(url), { method, headers });
}

/** Route context with awaitable params, matching Next's RouteContext shape. */
export function ctx(params: Record<string, string> = {}) {
  return { params: Promise.resolve(params) };
}

/** Build a fetch Response standing in for a GitHub API reply. */
export function githubResponse(status: number, body: unknown = null): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
