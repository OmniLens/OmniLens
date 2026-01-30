// External library imports
import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the SuccessRateOverview component
 */
export interface SuccessRateOverviewProps {
  runs: WorkflowRun[];
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SuccessRateOverview component
 * Displays success rate metric as of today
 * Calculates and shows the percentage of successful workflow runs
 * Used in workflow history to show success rate statistics
 */
export default function SuccessRateOverview({
  runs
}: SuccessRateOverviewProps) {
  // Filter runs up to today
  const runsAsOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return runs.filter(run => {
      const runDate = new Date(run.run_started_at);
      return runDate <= today;
    });
  }, [runs]);

  // Calculate success rate as of today
  const successRate = useMemo(() => {
    if (runsAsOfToday.length === 0) return 0;
    
    const completedRuns = runsAsOfToday.filter(
      run => run.status === 'completed'
    );
    
    if (completedRuns.length === 0) return 0;
    
    const successfulRuns = completedRuns.filter(
      run => run.conclusion === 'success'
    );
    
    return Math.round((successfulRuns.length / completedRuns.length) * 100);
  }, [runsAsOfToday]);

  // Calculate passed and failed counts for context
  const { passedRuns, failedRuns } = useMemo(() => {
    const completedRuns = runsAsOfToday.filter(
      run => run.status === 'completed'
    );
    const passed = completedRuns.filter(run => run.conclusion === 'success').length;
    const failed = completedRuns.filter(run => run.conclusion === 'failure').length;
    return { passedRuns: passed, failedRuns: failed };
  }, [runsAsOfToday]);

  // Determine color based on success rate
  const successColor = successRate >= 80 ? 'text-green-500' : successRate >= 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <CardTitle className="text-xl">Success Rate</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3 flex-1 flex flex-col justify-center">
        <div className="w-full">
          <div className={`text-3xl font-bold mb-2 ${successColor}`}>{successRate}%</div>
          <div className="text-sm text-muted-foreground">
            {passedRuns} passed, {failedRuns} failed
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
