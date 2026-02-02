// External library imports
import { useMemo } from "react";
import { CalendarCheck, Clock, TrendingDown } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import { Card, CardContent } from "@/components/ui/card";

// Utility imports
import { formatDurationSeconds } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the WorkflowHealthOverview component
 */
export interface WorkflowHealthOverviewProps {
  runs: WorkflowRun[];
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowHealthOverview component
 * Single card with three health stats in one row (same layout as WorkflowYearSummaryBar):
 * Failure Streak, Since Last Fail, Median Time.
 * Used on the workflow overview next to "Runs This Year" heatmap.
 */
export default function WorkflowHealthOverview({
  runs,
}: WorkflowHealthOverviewProps) {
  const runsAsOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return runs.filter((run) => {
      const runDate = new Date(run.run_started_at);
      return runDate <= today;
    });
  }, [runs]);

  const longestFailureStreak = useMemo(() => {
    const completed = runsAsOfToday
      .filter((run) => run.status === "completed")
      .sort(
        (a, b) =>
          new Date(a.run_started_at).getTime() -
          new Date(b.run_started_at).getTime()
      );
    let maxStreak = 0;
    let currentStreak = 0;
    for (const run of completed) {
      if (run.conclusion === "failure") {
        currentStreak += 1;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }, [runsAsOfToday]);

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

  const sinceLastFailValue =
    daysSinceLastFailure === null
      ? "—"
      : `${daysSinceLastFailure} day${daysSinceLastFailure === 1 ? "" : "s"}`;
  const medianTimeValue =
    medianDurationSeconds === null
      ? "—"
      : formatDurationSeconds(medianDurationSeconds);

  return (
    <Card className="w-full min-w-0 flex flex-col shrink-0">
      <CardContent className="px-3 py-3 sm:px-5 sm:py-4 flex flex-col justify-center min-h-[4rem] min-w-0">
        <div className="grid grid-cols-3 w-full min-w-0 gap-2 sm:gap-4 items-center">
          {/* Failure Streak */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 sm:h-9 sm:w-9">
              <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">
                Failure Streak
              </p>
              <p className="text-sm font-semibold truncate tabular-nums">
                {longestFailureStreak}
              </p>
            </div>
          </div>
          {/* Since Last Fail */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/15 sm:h-9 sm:w-9">
              <CalendarCheck className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">
                Since Last Fail
              </p>
              <p className="text-sm font-semibold truncate tabular-nums">
                {sinceLastFailValue}
              </p>
            </div>
          </div>
          {/* Median Time */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 sm:h-9 sm:w-9">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">
                Median Time
              </p>
              <p className="text-sm font-semibold truncate tabular-nums">
                {medianTimeValue}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
