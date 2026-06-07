import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/github-status/route";

// The handler fetches githubstatus.com directly via global fetch; stub it.
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function statusResponse(components: Array<{ name: string; status: string }>) {
  return new Response(
    JSON.stringify({
      page: { id: "p", name: "GitHub", url: "", time_zone: "", updated_at: "" },
      components: components.map((c, i) => ({
        id: `c${i}`,
        name: c.name,
        status: c.status,
        created_at: "",
        updated_at: "",
        position: i,
        description: null,
        showcase: false,
        start_date: null,
        end_date: null,
        page_id: "p",
        group_id: null,
        components: [],
        only_show_if_degraded: false,
      })),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

afterEach(() => vi.clearAllMocks());

describe("GET /api/github-status", () => {
  it("reports operational and filters down to Actions/Workflows components", async () => {
    fetchMock.mockResolvedValue(
      statusResponse([
        { name: "Git Operations", status: "operational" }, // filtered out
        { name: "Actions", status: "operational" },
        { name: "API Requests", status: "operational" }, // filtered out
      ]),
    );

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.source).toBe("GitHub Status API");
    expect(json.hasIssues).toBe(false);
    expect(json.status).toBe("operational");
    expect(json.components).toHaveLength(1);
    expect(json.components[0].name).toBe("Actions");
  });

  it("flags issues and surfaces the most severe Actions status during an outage", async () => {
    fetchMock.mockResolvedValue(
      statusResponse([
        { name: "Actions", status: "degraded_performance" },
        { name: "GitHub Actions Workflows", status: "partial_outage" },
      ]),
    );

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.hasIssues).toBe(true);
    expect(json.status).toBe("partial_outage"); // most severe wins
    expect(json.message).toMatch(/partial outage/i);
  });

  it("treats degraded-only Actions as operational (not an 'issue')", async () => {
    fetchMock.mockResolvedValue(
      statusResponse([{ name: "Actions", status: "degraded_performance" }]),
    );

    const json = await (await GET()).json();

    expect(json.hasIssues).toBe(false);
    expect(json.status).toBe("operational");
  });

  it("falls back to an operational 200 when the upstream API is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200); // never fails the request
    expect(json.source).toBe("fallback");
    expect(json.hasIssues).toBe(false);
    expect(json.status).toBe("operational");
    expect(json.error).toMatch(/network down/i);
  });

  it("falls back when the upstream API responds non-OK", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

    const json = await (await GET()).json();

    expect(json.source).toBe("fallback");
  });
});
