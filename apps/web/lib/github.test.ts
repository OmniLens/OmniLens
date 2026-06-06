import { describe, expect, it } from "vitest";

import {
  calculateHourlyBreakdown,
  calculateHourlyStatistics,
  calculateMissingWorkflows,
  calculateOverviewData,
  getLatestWorkflowRuns,
  type HourlyBreakdown,
  type WorkflowRun,
} from "@/lib/github";

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
