import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// getWorkflowRunsForDate/Grouped (and the today/yesterday wrappers) reach
// GitHub over fetch after resolving the repo + token through getRepoInfo,
// which dynamically imports these two modules. Mock both seams + global fetch
// so the pagination / date-window / dedup logic runs for real without a network
// or DB. The pure aggregators below need none of this.
vi.mock("@/lib/db-storage", () => ({ getUserRepo: vi.fn() }));
vi.mock("@/lib/github-auth", () => ({ getUserGitHubToken: vi.fn() }));

import {
  calculateHourlyBreakdown,
  calculateHourlyStatistics,
  calculateMissingWorkflows,
  calculateOverviewData,
  getLatestWorkflowRuns,
  getTodayOverviewData,
  getTodayWorkflowRuns,
  getWorkflowRunsForDate,
  getWorkflowRunsForDateGrouped,
  getYesterdayOverviewData,
  getYesterdayWorkflowRuns,
  type HourlyBreakdown,
  type WorkflowRun,
} from "@/lib/github";
import { getUserRepo } from "@/lib/db-storage";
import { getUserGitHubToken } from "@/lib/github-auth";

const mockGetUserRepo = vi.mocked(getUserRepo);
const mockGetToken = vi.mocked(getUserGitHubToken);

// Minimal WorkflowRun factory — only the fields the pure aggregators read.
// TZ is pinned to UTC in vitest.config.ts, so timestamps map to known local hours.
let nextId = 1;
function makeRun(overrides: Partial<WorkflowRun> = {}): WorkflowRun {
  const id = overrides.id ?? nextId++;
  return {
    id,
    name: overrides.name ?? `run-${id}`,
    workflow_id: overrides.workflow_id ?? 100,
    conclusion: overrides.conclusion ?? "success",
    status: overrides.status ?? "completed",
    html_url: overrides.html_url ?? `https://example.com/${id}`,
    run_started_at: overrides.run_started_at ?? "2024-01-01T10:00:00Z",
    updated_at: overrides.updated_at ?? "2024-01-01T10:05:00Z",
    ...overrides,
  };
}

describe("getLatestWorkflowRuns", () => {
  it("returns an empty array for no runs", () => {
    expect(getLatestWorkflowRuns([])).toEqual([]);
  });

  it("dedupes by workflow_id, keeping the most recent run as the card", () => {
    const older = makeRun({ id: 1, workflow_id: 100, run_started_at: "2024-01-01T08:00:00Z" });
    const newer = makeRun({ id: 2, workflow_id: 100, run_started_at: "2024-01-01T12:00:00Z" });

    const result = getLatestWorkflowRuns([older, newer]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("sets run_count to the number of runs for that workflow", () => {
    const runs = [
      makeRun({ id: 1, workflow_id: 100, run_started_at: "2024-01-01T08:00:00Z" }),
      makeRun({ id: 2, workflow_id: 100, run_started_at: "2024-01-01T09:00:00Z" }),
      makeRun({ id: 3, workflow_id: 100, run_started_at: "2024-01-01T10:00:00Z" }),
    ];

    const result = getLatestWorkflowRuns(runs);

    expect(result[0].run_count).toBe(3);
  });

  it("collects every run into all_runs", () => {
    const runs = [
      makeRun({ id: 1, workflow_id: 100, run_started_at: "2024-01-01T08:00:00Z" }),
      makeRun({ id: 2, workflow_id: 100, run_started_at: "2024-01-01T09:00:00Z" }),
    ];

    const result = getLatestWorkflowRuns(runs);

    expect(result[0].all_runs).toHaveLength(2);
    expect(result[0].all_runs?.map((r) => r.id).sort()).toEqual([1, 2]);
  });

  it("sets run_count to 1 for a single run", () => {
    const result = getLatestWorkflowRuns([makeRun({ id: 1, workflow_id: 100 })]);
    expect(result[0].run_count).toBe(1);
    expect(result[0].all_runs).toHaveLength(1);
  });

  it("keeps workflows with the same name but different ids separate", () => {
    const a = makeRun({ id: 1, workflow_id: 100, name: "CI" });
    const b = makeRun({ id: 2, workflow_id: 200, name: "CI" });

    const result = getLatestWorkflowRuns([a, b]);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.workflow_id).sort()).toEqual([100, 200]);
  });
});

describe("calculateHourlyBreakdown", () => {
  it("always returns 24 entries indexed 0..23", () => {
    const result = calculateHourlyBreakdown([]);
    expect(result).toHaveLength(24);
    expect(result.map((h) => h.hour)).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });

  it("returns all-zero buckets for no runs", () => {
    const result = calculateHourlyBreakdown([]);
    expect(result.every((h) => h.passed === 0 && h.failed === 0 && h.total === 0)).toBe(true);
  });

  it("buckets runs by hour and counts passed vs failed", () => {
    const runs = [
      makeRun({ run_started_at: "2024-01-01T10:15:00Z", conclusion: "success" }),
      makeRun({ run_started_at: "2024-01-01T10:45:00Z", conclusion: "failure" }),
      makeRun({ run_started_at: "2024-01-01T14:00:00Z", conclusion: "success" }),
    ];

    const result = calculateHourlyBreakdown(runs);

    expect(result[10]).toEqual({ hour: 10, passed: 1, failed: 1, total: 2 });
    expect(result[14]).toEqual({ hour: 14, passed: 1, failed: 0, total: 1 });
  });

  it("excludes non-success/non-failure conclusions from passed, failed, and total", () => {
    const runs = [
      makeRun({ run_started_at: "2024-01-01T03:00:00Z", conclusion: "cancelled" }),
      makeRun({ run_started_at: "2024-01-01T03:30:00Z", conclusion: null, status: "in_progress" }),
    ];

    const result = calculateHourlyBreakdown(runs);

    expect(result[3]).toEqual({ hour: 3, passed: 0, failed: 0, total: 0 });
  });
});

describe("calculateHourlyStatistics", () => {
  function breakdownWith(totals: Record<number, number>): HourlyBreakdown[] {
    return Array.from({ length: 24 }, (_, hour) => {
      const total = totals[hour] ?? 0;
      return { hour, passed: total, failed: 0, total };
    });
  }

  it("returns all zeros for an empty (all-zero) day", () => {
    const stats = calculateHourlyStatistics(breakdownWith({}));
    expect(stats).toEqual({
      avgRunsPerHour: 0,
      minRunsPerHour: 0,
      maxRunsPerHour: 0,
      totalRuns: 0,
    });
  });

  it("sums totalRuns and computes min/max across the 24 buckets", () => {
    const stats = calculateHourlyStatistics(breakdownWith({ 9: 5, 13: 1, 17: 6 }));
    expect(stats.totalRuns).toBe(12);
    expect(stats.minRunsPerHour).toBe(0); // the 21 empty hours
    expect(stats.maxRunsPerHour).toBe(6);
  });

  it("rounds avgRunsPerHour to one decimal over 24 hours", () => {
    // 12 total / 24 = 0.5
    const stats = calculateHourlyStatistics(breakdownWith({ 9: 5, 13: 1, 17: 6 }));
    expect(stats.avgRunsPerHour).toBe(0.5);
  });
});

describe("calculateMissingWorkflows", () => {
  const active = [
    { id: 1, name: "CI" },
    { id: 2, name: "Deploy" },
    { id: 3, name: "Nightly" },
  ];

  it("returns names of active workflows with no matching run", () => {
    const runs = [makeRun({ workflow_id: 1 })];
    expect(calculateMissingWorkflows(active, runs)).toEqual(["Deploy", "Nightly"]);
  });

  it("returns an empty array when every workflow ran", () => {
    const runs = [makeRun({ workflow_id: 1 }), makeRun({ workflow_id: 2 }), makeRun({ workflow_id: 3 })];
    expect(calculateMissingWorkflows(active, runs)).toEqual([]);
  });

  it("returns every name when nothing ran", () => {
    expect(calculateMissingWorkflows(active, [])).toEqual(["CI", "Deploy", "Nightly"]);
  });

  it("matches on workflow_id, not name", () => {
    // A run whose workflow_id doesn't match any active id leaves all active workflows missing.
    const runs = [makeRun({ workflow_id: 999, name: "CI" })];
    expect(calculateMissingWorkflows(active, runs)).toEqual(["CI", "Deploy", "Nightly"]);
  });
});

describe("calculateOverviewData", () => {
  it("returns all zeros for no runs", () => {
    expect(calculateOverviewData([])).toEqual({
      completedRuns: 0,
      inProgressRuns: 0,
      passedRuns: 0,
      failedRuns: 0,
      totalRuntime: 0,
      didntRunCount: 0,
      totalWorkflows: 0,
      missingWorkflows: [],
    });
  });

  it("counts completed, in-progress, and queued runs", () => {
    const runs = [
      makeRun({ status: "completed", conclusion: "success" }),
      makeRun({ status: "in_progress", conclusion: null }),
      makeRun({ status: "queued", conclusion: null }),
    ];

    const data = calculateOverviewData(runs);

    expect(data.completedRuns).toBe(1);
    expect(data.inProgressRuns).toBe(2);
  });

  it("counts passed and failed runs by conclusion", () => {
    const runs = [
      makeRun({ conclusion: "success" }),
      makeRun({ conclusion: "failure" }),
      makeRun({ conclusion: "failure" }),
      makeRun({ conclusion: "cancelled" }),
    ];

    const data = calculateOverviewData(runs);

    expect(data.passedRuns).toBe(1);
    expect(data.failedRuns).toBe(2);
  });

  it("sums runtime in seconds for completed runs only", () => {
    const runs = [
      // completed: 5 minutes = 300s
      makeRun({
        status: "completed",
        run_started_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:05:00Z",
      }),
      // in_progress: excluded from runtime even though it has timestamps
      makeRun({
        status: "in_progress",
        conclusion: null,
        run_started_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:30:00Z",
      }),
    ];

    const data = calculateOverviewData(runs);

    expect(data.totalRuntime).toBe(300);
  });

  it("sets totalWorkflows to the run count and leaves didntRun/missing as fixed defaults", () => {
    const runs = [makeRun(), makeRun(), makeRun()];
    const data = calculateOverviewData(runs);

    expect(data.totalWorkflows).toBe(3);
    expect(data.didntRunCount).toBe(0);
    expect(data.missingWorkflows).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Network-backed fetchers: pagination, date-window filtering, dedup, errors.
// fetch and the repo/token seams are mocked; everything else runs for real.
// ---------------------------------------------------------------------------

/** A stubbed GitHub `/actions/runs` response (the shape fetch().json() yields). */
function ghResponse(runs: WorkflowRun[], status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : `HTTP ${status}`,
    json: async () => ({ workflow_runs: runs }),
  } as unknown as Response;
}

/** N runs all started at the same instant (defaults to one shared workflow). */
function manyRuns(n: number, startedAt: string): WorkflowRun[] {
  return Array.from({ length: n }, (_, i) =>
    makeRun({ id: 10_000 + i, workflow_id: 100, run_started_at: startedAt }),
  );
}

// A fixed, definitely-not-today target date used by most cases.
const DATE_STR = "2024-03-15";
const TARGET_DATE = new Date("2024-03-15T12:00:00Z");
const ON_DATE = "2024-03-15T10:00:00Z";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGetUserRepo.mockResolvedValue({ repoPath: "owner/repo" } as never);
  mockGetToken.mockResolvedValue("test-token");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("getRepoInfo (via getWorkflowRunsForDate)", () => {
  it("throws when userId is missing", async () => {
    await expect(getWorkflowRunsForDate(TARGET_DATE, "repo", "")).rejects.toThrow(
      /User ID is required/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the repo is not found for the user", async () => {
    mockGetUserRepo.mockResolvedValue(null as never);
    await expect(getWorkflowRunsForDate(TARGET_DATE, "missing", "u1")).rejects.toThrow(
      /Repository not found: missing/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the user has no GitHub token", async () => {
    mockGetToken.mockResolvedValue(null as never);
    await expect(getWorkflowRunsForDate(TARGET_DATE, "repo", "u1")).rejects.toThrow(
      /access token not found/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getWorkflowRunsForDate", () => {
  it("requests the repo's runs for the full target day with auth headers", async () => {
    fetchMock.mockResolvedValue(ghResponse([]));

    await getWorkflowRunsForDate(TARGET_DATE, "repo", "u1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain(
      `repos/owner/repo/actions/runs?created=${DATE_STR}T00:00:00Z..${DATE_STR}T23:59:59Z`,
    );
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer test-token",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    });
  });

  it("returns every run started on the target date WITHOUT deduping by workflow", async () => {
    const runs = [
      makeRun({ id: 1, workflow_id: 100, run_started_at: "2024-03-15T08:00:00Z" }),
      makeRun({ id: 2, workflow_id: 100, run_started_at: "2024-03-15T09:00:00Z" }),
      makeRun({ id: 3, workflow_id: 200, run_started_at: "2024-03-15T10:00:00Z" }),
    ];
    fetchMock.mockResolvedValue(ghResponse(runs));

    const result = await getWorkflowRunsForDate(TARGET_DATE, "repo", "u1");

    expect(result.map((r) => r.id).sort()).toEqual([1, 2, 3]);
    // No grouping: run_count is never assigned here.
    expect(result.every((r) => r.run_count === undefined)).toBe(true);
  });

  it("drops runs that started on a different day", async () => {
    const runs = [
      makeRun({ id: 1, run_started_at: "2024-03-14T23:59:59Z" }), // day before
      makeRun({ id: 2, run_started_at: ON_DATE }), // on date
      makeRun({ id: 3, run_started_at: "2024-03-16T00:00:01Z" }), // day after
    ];
    fetchMock.mockResolvedValue(ghResponse(runs));

    const result = await getWorkflowRunsForDate(TARGET_DATE, "repo", "u1");

    expect(result.map((r) => r.id)).toEqual([2]);
  });

  it("excludes off-date in-progress runs when the target date is NOT today", async () => {
    const running = makeRun({
      id: 9,
      status: "in_progress",
      conclusion: null,
      run_started_at: "2024-03-10T10:00:00Z", // off the target date
    });
    fetchMock.mockResolvedValue(ghResponse([running]));

    const result = await getWorkflowRunsForDate(TARGET_DATE, "repo", "u1");

    expect(result).toEqual([]);
  });

  it("includes off-date in-progress/queued runs when the target date IS today", async () => {
    const running = makeRun({
      id: 9,
      status: "in_progress",
      conclusion: null,
      run_started_at: "2020-01-01T00:00:00Z", // clearly not today
    });
    const queued = makeRun({
      id: 10,
      status: "queued",
      conclusion: null,
      run_started_at: "2020-01-01T00:00:00Z",
    });
    fetchMock.mockResolvedValue(ghResponse([running, queued]));

    const result = await getWorkflowRunsForDate(new Date(), "repo", "u1");

    expect(result.map((r) => r.id).sort((a, b) => a - b)).toEqual([9, 10]);
  });

  it("paginates: follows to the next page while a page is full (100)", async () => {
    fetchMock
      .mockResolvedValueOnce(ghResponse(manyRuns(100, ON_DATE)))
      .mockResolvedValueOnce(ghResponse(manyRuns(5, ON_DATE)));

    const result = await getWorkflowRunsForDate(TARGET_DATE, "repo", "u1");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("&page=1");
    expect(fetchMock.mock.calls[1][0]).toContain("&page=2");
    expect(result).toHaveLength(105);
  });

  it("stops paginating once a page is not full", async () => {
    fetchMock.mockResolvedValue(ghResponse(manyRuns(3, ON_DATE)));

    await getWorkflowRunsForDate(TARGET_DATE, "repo", "u1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("safety-caps pagination at 10 pages even if every page stays full", async () => {
    fetchMock.mockResolvedValue(ghResponse(manyRuns(100, ON_DATE)));

    const result = await getWorkflowRunsForDate(TARGET_DATE, "repo", "u1");

    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(result).toHaveLength(1000);
  });

  it("stops on a 304 Not Modified without erroring", async () => {
    fetchMock.mockResolvedValue(ghResponse([], 304));

    const result = await getWorkflowRunsForDate(TARGET_DATE, "repo", "u1");

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns [] for a 404 (repo has no workflows)", async () => {
    fetchMock.mockResolvedValue(ghResponse([], 404));

    const result = await getWorkflowRunsForDate(TARGET_DATE, "repo", "u1");

    expect(result).toEqual([]);
  });

  it("throws an access-denied error on 403", async () => {
    fetchMock.mockResolvedValue(ghResponse([], 403));

    await expect(getWorkflowRunsForDate(TARGET_DATE, "repo", "u1")).rejects.toThrow(
      /403.*Repository access denied/,
    );
  });

  it("throws a generic error on other non-OK statuses", async () => {
    fetchMock.mockResolvedValue(ghResponse([], 500));

    await expect(getWorkflowRunsForDate(TARGET_DATE, "repo", "u1")).rejects.toThrow(
      /GitHub API error: 500/,
    );
  });
});

describe("getWorkflowRunsForDateGrouped", () => {
  it("requests a 12h-before / 36h-after window around the target date", async () => {
    fetchMock.mockResolvedValue(ghResponse([]));

    await getWorkflowRunsForDateGrouped(TARGET_DATE, "repo", "u1");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain(
      "repos/owner/repo/actions/runs?created=2024-03-14T12:00:00.000Z..2024-03-16T12:00:00.000Z",
    );
  });

  it("dedupes by workflow_id into one card carrying run_count and all_runs", async () => {
    const runs = [
      makeRun({ id: 1, workflow_id: 100, run_started_at: "2024-03-15T08:00:00Z" }),
      makeRun({ id: 2, workflow_id: 100, run_started_at: "2024-03-15T12:00:00Z" }),
      makeRun({ id: 3, workflow_id: 200, run_started_at: "2024-03-15T09:00:00Z" }),
    ];
    fetchMock.mockResolvedValue(ghResponse(runs));

    const result = await getWorkflowRunsForDateGrouped(TARGET_DATE, "repo", "u1");

    expect(result).toHaveLength(2);
    const wf100 = result.find((r) => r.workflow_id === 100)!;
    expect(wf100.id).toBe(2); // latest run is the card
    expect(wf100.run_count).toBe(2);
    expect(wf100.all_runs?.map((r) => r.id).sort()).toEqual([1, 2]);
    const wf200 = result.find((r) => r.workflow_id === 200)!;
    expect(wf200.run_count).toBe(1);
  });

  it("applies the same off-date filter before grouping", async () => {
    const runs = [
      makeRun({ id: 1, workflow_id: 100, run_started_at: ON_DATE }),
      makeRun({ id: 2, workflow_id: 100, run_started_at: "2024-03-13T10:00:00Z" }), // inside the
      // fetch window (12h buffer reaches back a day+) but off the target date -> filtered out
    ];
    fetchMock.mockResolvedValue(ghResponse(runs));

    const result = await getWorkflowRunsForDateGrouped(TARGET_DATE, "repo", "u1");

    expect(result).toHaveLength(1);
    expect(result[0].run_count).toBe(1);
    expect(result[0].all_runs?.map((r) => r.id)).toEqual([1]);
  });

  it("returns [] for a 404", async () => {
    fetchMock.mockResolvedValue(ghResponse([], 404));
    expect(await getWorkflowRunsForDateGrouped(TARGET_DATE, "repo", "u1")).toEqual([]);
  });
});

describe("today/yesterday convenience wrappers", () => {
  function todayStr() {
    return new Date().toISOString().slice(0, 10); // TZ pinned to UTC
  }
  function yesterdayStr() {
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  it("getTodayWorkflowRuns queries today's window and returns its runs", async () => {
    const run = makeRun({ id: 1, run_started_at: new Date().toISOString() });
    fetchMock.mockResolvedValue(ghResponse([run]));

    const result = await getTodayWorkflowRuns("repo", "u1");

    expect(fetchMock.mock.calls[0][0]).toContain(`created=${todayStr()}T00:00:00Z`);
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it("getYesterdayWorkflowRuns queries yesterday's window", async () => {
    fetchMock.mockResolvedValue(ghResponse([]));

    await getYesterdayWorkflowRuns("repo", "u1");

    expect(fetchMock.mock.calls[0][0]).toContain(`created=${yesterdayStr()}T00:00:00Z`);
  });

  it("getTodayOverviewData aggregates today's runs into overview counts", async () => {
    const now = new Date().toISOString();
    fetchMock.mockResolvedValue(
      ghResponse([
        makeRun({ id: 1, status: "completed", conclusion: "success", run_started_at: now }),
        makeRun({ id: 2, status: "completed", conclusion: "success", run_started_at: now }),
        makeRun({ id: 3, status: "completed", conclusion: "failure", run_started_at: now }),
      ]),
    );

    const overview = await getTodayOverviewData("repo", "u1");

    expect(overview.completedRuns).toBe(3);
    expect(overview.passedRuns).toBe(2);
    expect(overview.failedRuns).toBe(1);
    expect(overview.totalWorkflows).toBe(3);
  });

  it("getYesterdayOverviewData returns zeroed overview when no runs come back", async () => {
    fetchMock.mockResolvedValue(ghResponse([]));

    const overview = await getYesterdayOverviewData("repo", "u1");

    expect(overview).toEqual({
      completedRuns: 0,
      inProgressRuns: 0,
      passedRuns: 0,
      failedRuns: 0,
      totalRuntime: 0,
      didntRunCount: 0,
      totalWorkflows: 0,
      missingWorkflows: [],
    });
  });
});
