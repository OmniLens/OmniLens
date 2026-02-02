// External library imports
import { useMemo } from "react";
import { CalendarCheck, Clock, CheckCircle } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import WorkflowHealthStats, { type StatConfig } from "@/components/WorkflowHealthStats";
import WorkflowYearSummaryBar from "@/components/WorkflowYearSummaryBar";

// Utility imports
import { formatDurationSeconds } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

export interface UsageSummaryForBar {
  totalHostedJobRuns: number | null;
  totalSelfHostedJobRuns: number | null;
  majorityRuntimeOs: string | null;
}

interface WorkflowRunsHistoryMonthProps {
  runs: WorkflowRun[];
  /** Usage summary for the long widget (from usage API); when not provided, bar shows — for each value */
  usageSummary?: UsageSummaryForBar | null;
  /** When true, bar shows loading placeholder for usage values */
  usageLoading?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowRunsHistoryMonth component
 * Top row: one card with three health stats displayed horizontally (Pass Rate, Days Since Failure, Median Duration).
 * Bottom row: one full-width component spanning the width of the three widgets.
 * Used in workflow history page next to "Runs This Year" heatmap.
 */
export default function WorkflowRunsHistoryMonth({
  runs,
  usageSummary = null,
  usageLoading = false,
}: WorkflowRunsHistoryMonthProps) {
  // Filter runs to only include those up to today
  const runsAsOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return runs.filter((run) => {
      const runDate = new Date(run.run_started_at);
      return runDate <= today;
    });
  }, [runs]);

  // Calculate pass rate (success rate percentage)
  const passRate = useMemo(() => {
    const completedRuns = runsAsOfToday.filter(
      (run) => run.status === "completed"
    );
    if (completedRuns.length === 0) return null;
    const passedRuns = completedRuns.filter(
      (run) => run.conclusion === "success"
    ).length;
    return Math.round((passedRuns / completedRuns.length) * 100);
  }, [runsAsOfToday]);

  // Calculate days since last failure
  const daysSinceLastFailure = useMemo(() => {
    const failedRuns = runsAsOfToday.filter(
      (run) => run.status === "completed" && run.conclusion === "failure"
    );
    if (failedRuns.length === 0) return null;
    const latest = failedRuns.reduce((latestRun, run) => {
      const runTime = new Date(run.run_started_at).getTime();
      const latestTime = new Date(latestRun.run_started_at).getTime();
      return runTime > latestTime ? run : latestRun;
    });
    const lastDate = new Date(latest.run_started_at);
    lastDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [runsAsOfToday]);

  // Calculate median duration
  const medianDurationSeconds = useMemo(() => {
    const durations = runsAsOfToday
      .filter(
        (run) =>
          run.status === "completed" &&
          run.run_started_at &&
          run.updated_at
      )
      .map((run) => {
        const start = new Date(run.run_started_at).getTime();
        const end = new Date(run.updated_at).getTime();
        return Math.floor((end - start) / 1000);
      })
      .filter((s) => s >= 0)
      .sort((a, b) => a - b);
    if (durations.length === 0) return null;
    const mid = Math.floor(durations.length / 2);
    return durations.length % 2 === 0
      ? Math.floor((durations[mid - 1]! + durations[mid]!) / 2)
      : durations[mid]!;
  }, [runsAsOfToday]);

  // Format values
  const passRateValue =
    passRate === null ? "—" : `${passRate}%`;
  const sinceLastFailValue =
    daysSinceLastFailure === null
      ? "—"
      : `${daysSinceLastFailure} day${daysSinceLastFailure === 1 ? "" : "s"}`;
  const medianTimeValue =
    medianDurationSeconds === null
      ? "—"
      : formatDurationSeconds(medianDurationSeconds);

  // Create stats array for WorkflowHealthStats component
  const stats: StatConfig[] = useMemo(
    () => [
      {
        icon: CheckCircle,
        iconBgClass: "bg-green-500/15",
        iconColorClass: "text-green-600 dark:text-green-400",
        title: "Pass Rate",
        value: passRateValue,
      },
      {
        icon: CalendarCheck,
        iconBgClass: "bg-blue-500/15",
        iconColorClass: "text-blue-600 dark:text-blue-400",
        title: "Since Last Fail",
        value: sinceLastFailValue,
      },
      {
        icon: Clock,
        iconBgClass: "bg-orange-500/15",
        iconColorClass: "text-orange-600 dark:text-orange-400",
        title: "Median Time",
        value: medianTimeValue,
      },
    ],
    [passRateValue, sinceLastFailValue, medianTimeValue]
  );

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-0">
      {/* Health stats: Pass Rate, Since Last Fail, Median Time (one card with three stats horizontally) */}
      <div className="w-full flex-1 min-h-0 flex">
        <WorkflowHealthStats stats={stats} />
      </div>

      {/* Full-width bar: Hosted runners, Self-hosted, Runtime OS */}
      <div className="w-full flex-1 min-h-0 flex">
        <WorkflowYearSummaryBar
          runs={runs}
          totalHostedJobRuns={usageSummary?.totalHostedJobRuns ?? null}
          totalSelfHostedJobRuns={usageSummary?.totalSelfHostedJobRuns ?? null}
          majorityRuntimeOs={usageSummary?.majorityRuntimeOs ?? null}
          isLoading={usageLoading}
        />
      </div>
    </div>
  );
}
