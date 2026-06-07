import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

// No auth/db/network seams — the handler is self-contained, so it's called directly.
describe("GET /api/health", () => {
  it("reports a healthy status with uptime, version, and a timestamp", async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("healthy");
    expect(typeof json.uptime).toBe("number");
    expect(typeof json.version).toBe("string");
    expect(json.version.length).toBeGreaterThan(0);
    // A parseable ISO timestamp.
    expect(Number.isNaN(Date.parse(json.timestamp))).toBe(false);
  });

  it("marks the response as non-cacheable", async () => {
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});
