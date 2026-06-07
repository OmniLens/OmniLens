import { describe, expect, it } from "vitest";

import {
  elapsedSeconds,
  getLabelColor,
  getRunLabel,
  getRunSegmentClass,
  shortenTrigger,
  type RunLabel,
} from "@/components/dashboard/run-ui";
import type { WorkflowRun } from "@/lib/hooks/use-repository-dashboard";

function run(overrides: Partial<WorkflowRun>): WorkflowRun {
  return {
    id: 1,
    name: "wf",
    workflow_id: 1,
    conclusion: null,
    status: "completed",
    html_url: "https://example.com",
    run_started_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:05:00Z",
    ...overrides,
  } as WorkflowRun;
}

describe("getRunLabel", () => {
  it("returns RUN for in-progress and queued runs", () => {
    expect(getRunLabel(run({ status: "in_progress" }))).toBe("RUN");
    expect(getRunLabel(run({ status: "queued" }))).toBe("RUN");
  });

  it("returns PASS for a successful run", () => {
    expect(getRunLabel(run({ status: "completed", conclusion: "success" }))).toBe("PASS");
  });

  it("returns SKIP for cancelled and skipped runs", () => {
    expect(getRunLabel(run({ status: "completed", conclusion: "cancelled" }))).toBe("SKIP");
    expect(getRunLabel(run({ status: "completed", conclusion: "skipped" }))).toBe("SKIP");
  });

  it("returns FAIL for failures and any other conclusion", () => {
    expect(getRunLabel(run({ status: "completed", conclusion: "failure" }))).toBe("FAIL");
    expect(getRunLabel(run({ status: "completed", conclusion: null }))).toBe("FAIL");
    expect(getRunLabel(run({ status: "completed", conclusion: "timed_out" }))).toBe("FAIL");
  });
});

describe("getLabelColor", () => {
  const labels: RunLabel[] = ["PASS", "FAIL", "RUN", "SKIP"];
  const expected: Record<RunLabel, string> = {
    PASS: "text-[#00e5a0]",
    FAIL: "text-red-500",
    RUN: "text-[#4d9fff]",
    SKIP: "text-amber-400",
  };

  it("returns the text color class for every label", () => {
    for (const label of labels) expect(getLabelColor(label)).toBe(expected[label]);
  });
});

describe("getRunSegmentClass", () => {
  const labels: RunLabel[] = ["PASS", "FAIL", "RUN", "SKIP"];

  it("returns a non-empty background class for every label", () => {
    for (const label of labels) expect(getRunSegmentClass(label).length).toBeGreaterThan(0);
  });

  it("marks the RUN segment as animated", () => {
    expect(getRunSegmentClass("RUN")).toContain("animate-pulse");
  });
});

describe("shortenTrigger", () => {
  it("maps known GitHub events to short labels", () => {
    expect(shortenTrigger("pull_request")).toBe("PR");
    expect(shortenTrigger("schedule")).toBe("cron");
    expect(shortenTrigger("workflow_dispatch")).toBe("manual");
    expect(shortenTrigger("push")).toBe("push");
  });

  it("passes through unknown events unchanged", () => {
    expect(shortenTrigger("release")).toBe("release");
  });
});

describe("elapsedSeconds", () => {
  it("computes whole seconds elapsed since the start", () => {
    const start = "2024-01-01T10:00:00Z";
    const now = new Date("2024-01-01T10:00:30Z").getTime();
    expect(elapsedSeconds(start, now)).toBe(30);
  });

  it("floors fractional seconds", () => {
    const start = "2024-01-01T10:00:00Z";
    const now = new Date("2024-01-01T10:00:00.900Z").getTime();
    expect(elapsedSeconds(start, now)).toBe(0);
  });

  it("clamps to 0 when now is before the start time", () => {
    const start = "2024-01-01T10:00:00Z";
    const now = new Date("2024-01-01T09:59:00Z").getTime();
    expect(elapsedSeconds(start, now)).toBe(0);
  });
});
