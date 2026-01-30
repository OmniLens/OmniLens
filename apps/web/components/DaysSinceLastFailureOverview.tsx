// External library imports
import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
 * Shows "No failures this year" when there are no completed failures
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

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-green-500" />
          <CardTitle className="text-base font-medium">Days Since Failure</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="text-2xl font-bold">
          {daysSinceLastFailure === null
            ? "—"
            : `${daysSinceLastFailure} day${daysSinceLastFailure === 1 ? "" : "s"}`}
        </div>
      </CardContent>
    </Card>
  );
}
