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
 * Props for the TotalDurationOverview component
 */
export interface TotalDurationOverviewProps {
  runs: WorkflowRun[];
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * TotalDurationOverview component
 * Displays total duration metric as of today
 * Calculates and shows the cumulative duration of all workflow runs
 * Used in workflow history to show time-based statistics
 */
export default function TotalDurationOverview({
  runs
}: TotalDurationOverviewProps) {
  // Filter runs up to today
  const runsAsOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return runs.filter(run => {
      const runDate = new Date(run.run_started_at);
      return runDate <= today;
    });
  }, [runs]);

  // Calculate total duration as of today
  const totalDuration = useMemo(() => {
    return runsAsOfToday.reduce((total, run) => {
      if (run.status === 'completed' && run.run_started_at && run.updated_at) {
        const start = new Date(run.run_started_at).getTime();
        const end = new Date(run.updated_at).getTime();
        return total + Math.floor((end - start) / 1000);
      }
      return total;
    }, 0);
  }, [runsAsOfToday]);

  // Calculate average duration per run
  const completedRuns = useMemo(() => {
    return runsAsOfToday.filter(run => run.status === 'completed').length;
  }, [runsAsOfToday]);

  const averageDuration = useMemo(() => {
    if (completedRuns === 0) return 0;
    return Math.floor(totalDuration / completedRuns);
  }, [totalDuration, completedRuns]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-xl">Total Duration</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3 flex-1 flex flex-col justify-center">
        <div className="w-full">
          <div className="text-3xl font-bold mb-2">{formatDurationSeconds(totalDuration)}</div>
          <div className="text-sm text-muted-foreground">
            {completedRuns > 0 ? `~${formatDurationSeconds(averageDuration)} avg per run` : 'No completed runs'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
