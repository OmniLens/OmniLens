// External library imports
import { useMemo } from "react";
import { Workflow } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the TotalWorkflowsOverview component
 */
export interface TotalWorkflowsOverviewProps {
  runs: WorkflowRun[];
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * TotalWorkflowsOverview component
 * Displays total workflows metric as of today
 * Calculates and shows the count of unique workflows that have run
 * Used in workflow history to show workflow count statistics
 */
export default function TotalWorkflowsOverview({
  runs
}: TotalWorkflowsOverviewProps) {
  // Filter runs up to today
  const runsAsOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return runs.filter(run => {
      const runDate = new Date(run.run_started_at);
      return runDate <= today;
    });
  }, [runs]);

  // Calculate total unique workflows as of today
  const totalWorkflows = useMemo(() => {
    const uniqueWorkflowIds = new Set(
      runsAsOfToday.map(run => run.workflow_id)
    );
    return uniqueWorkflowIds.size;
  }, [runsAsOfToday]);

  // Calculate total runs for context
  const totalRuns = useMemo(() => {
    return runsAsOfToday.length;
  }, [runsAsOfToday]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-xl">Total Workflows</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3 flex-1 flex flex-col justify-center">
        <div className="w-full">
          <div className="text-3xl font-bold mb-2">{totalWorkflows}</div>
          <div className="text-sm text-muted-foreground">
            {totalRuns} {totalRuns === 1 ? 'run' : 'runs'} total
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
