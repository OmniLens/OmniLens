// External library imports
import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import OverviewStatCard from "@/components/OverviewStatCard";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the DaysSinceLastFailureOverview component
 */
export interface DaysSinceLastFailureOverviewProps {
  runs: WorkflowRun[];
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * DaysSinceLastFailureOverview component
 * Displays days since the last failed run this year (as of today)
 * Shows "—" when there are no completed failures
 */
export default function DaysSinceLastFailureOverview({
  runs
}: DaysSinceLastFailureOverviewProps) {
  const runsAsOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return runs.filter(run => {
      const runDate = new Date(run.run_started_at);
      return runDate <= today;
    });
  }, [runs]);

  const { daysSinceLastFailure } = useMemo(() => {
    const failedRuns = runsAsOfToday.filter(
      run => run.status === "completed" && run.conclusion === "failure"
    );
    if (failedRuns.length === 0) {
      return { daysSinceLastFailure: null, lastFailureDate: null };
    }
    const latest = failedRuns.reduce((latestRun, run) => {
      const runTime = new Date(run.run_started_at).getTime();
      const latestTime = new Date(latestRun.run_started_at).getTime();
      return runTime > latestTime ? run : latestRun;
    });
    const lastDate = new Date(latest.run_started_at);
    lastDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { daysSinceLastFailure: days };
  }, [runsAsOfToday]);

  const value =
    daysSinceLastFailure === null
      ? "—"
      : `${daysSinceLastFailure} day${daysSinceLastFailure === 1 ? "" : "s"}`;

  return (
    <OverviewStatCard
      icon={CalendarCheck}
      iconBgClass="bg-green-500/15"
      iconColorClass="text-green-600 dark:text-green-400"
      title="Since Last Fail"
      value={value}
    />
  );
}
