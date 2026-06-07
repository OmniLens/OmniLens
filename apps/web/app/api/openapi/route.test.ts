import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/openapi/route";

// No auth/db/network seams — the handler returns a static, self-contained spec.
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/openapi", () => {
  it("returns a valid OpenAPI 3.0 document with API metadata", async () => {
    const res = await GET();
    const spec = await res.json();

    expect(res.status).toBe(200);
    expect(spec.openapi).toBe("3.0.0");
    expect(spec.info.title).toBe("OmniLens API");
    expect(spec.info.version).toBe("1.0.0");
    expect(Array.isArray(spec.tags)).toBe(true);
    expect(spec.tags.map((t: { name: string }) => t.name)).toEqual(
      expect.arrayContaining(["Repositories", "Workflows", "Admin", "Status"]),
    );
  });

  it("documents the core routes and their HTTP methods", async () => {
    const spec = await (await GET()).json();

    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining([
        "/api/repo",
        "/api/repo/add",
        "/api/repo/{slug}",
        "/api/workflow/{slug}",
        "/api/workflow/{slug}/overview",
        "/api/admin/users",
        "/api/health",
      ]),
    );
    // Spot-check that method maps are populated, not just the keys present.
    expect(spec.paths["/api/repo"].get.tags).toContain("Repositories");
    expect(spec.paths["/api/repo/{slug}"]).toHaveProperty("get");
    expect(spec.paths["/api/repo/{slug}"]).toHaveProperty("delete");
    expect(spec.paths["/api/workflow/{slug}"]).toHaveProperty("put");
  });

  it("declares the cookie and admin-token security schemes", async () => {
    const spec = await (await GET()).json();

    expect(spec.components.securitySchemes.cookieAuth).toMatchObject({
      type: "apiKey",
      in: "cookie",
    });
    expect(spec.components.securitySchemes.adminTokenAuth).toMatchObject({
      type: "apiKey",
      in: "header",
    });
  });

  it("uses NEXT_PUBLIC_APP_URL for the server URL when set, else localhost", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://omnilens.example");
    let spec = await (await GET()).json();
    expect(spec.servers[0].url).toBe("https://omnilens.example");

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    spec = await (await GET()).json();
    expect(spec.servers[0].url).toBe("http://localhost:3000");
  });

  it("marks the spec as cacheable for an hour", async () => {
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(res.headers.get("Content-Type")).toContain("application/json");
  });
});
