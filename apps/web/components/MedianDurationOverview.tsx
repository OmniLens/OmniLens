// External library imports
import { useMemo } from "react";
import { Clock } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Utility imports
import { formatDurationSeconds } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the MedianDurationOverview component
 */
export interface MedianDurationOverviewProps {
  runs: WorkflowRun[];
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MedianDurationOverview component
 * Displays median run duration this year (as of today) for completed runs
 * Median is more robust than average when there are outlier runs
 */
export default function MedianDurationOverview({
  runs
}: MedianDurationOverviewProps) {
  const runsAsOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return runs.filter(run => {
      const runDate = new Date(run.run_started_at);
      return runDate <= today;
    });
  }, [runs]);

  const medianDurationSeconds = useMemo(() => {
    const durations = runsAsOfToday
      .filter(
        run =>
          run.status === "completed" &&
          run.run_started_at &&
          run.updated_at
      )
      .map(run => {
        const start = new Date(run.run_started_at).getTime();
        const end = new Date(run.updated_at).getTime();
        return Math.floor((end - start) / 1000);
      })
      .filter(s => s >= 0)
      .sort((a, b) => a - b);
    if (durations.length === 0) return null;
    const mid = Math.floor(durations.length / 2);
    return durations.length % 2 === 0
      ? Math.floor((durations[mid - 1]! + durations[mid]!) / 2)
      : durations[mid]!;
  }, [runsAsOfToday]);

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="h-4 w-4 text-purple-500 shrink-0" />
          <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap truncate min-w-0">Median Time</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="text-base font-semibold tabular-nums">
          {medianDurationSeconds === null
            ? "—"
            : formatDurationSeconds(medianDurationSeconds)}
        </div>
      </CardContent>
    </Card>
  );
}
