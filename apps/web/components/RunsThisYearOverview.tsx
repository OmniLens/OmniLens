// External library imports
import { useMemo } from "react";
import { Activity } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the RunsThisYearOverview component
 */
export interface RunsThisYearOverviewProps {
  runs: WorkflowRun[];
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RunsThisYearOverview component
 * Displays the count of workflow runs this year (as of today)
 * Uses the same "runs this year" date filter as other overview widgets
 */
export default function RunsThisYearOverview({
  runs
}: RunsThisYearOverviewProps) {
  const runsAsOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return runs.filter(run => {
      const runDate = new Date(run.run_started_at);
      return runDate <= today;
    });
  }, [runs]);

  return (
    <Card className="w-full min-w-0 flex flex-col">
      <CardHeader className="pb-2 shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-4 w-4 text-blue-500 shrink-0" />
          <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap truncate min-w-0">
            Runs This Year
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="text-base font-semibold tabular-nums">
          {runsAsOfToday.length}
        </div>
      </CardContent>
    </Card>
  );
}
