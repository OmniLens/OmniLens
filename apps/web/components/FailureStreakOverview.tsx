// External library imports
import { useMemo } from "react";
import { TrendingDown } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the FailureStreakOverview component
 */
export interface FailureStreakOverviewProps {
  runs: WorkflowRun[];
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * FailureStreakOverview component
 * Displays the longest consecutive failure streak this year (as of today)
 * Only counts completed runs; tracks max streak of conclusion === 'failure'
 */
export default function FailureStreakOverview({
  runs
}: FailureStreakOverviewProps) {
  const runsAsOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return runs.filter(run => {
      const runDate = new Date(run.run_started_at);
      return runDate <= today;
    });
  }, [runs]);

  const longestFailureStreak = useMemo(() => {
    const completed = runsAsOfToday
      .filter(run => run.status === "completed")
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

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base font-medium">Failure Streak</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="text-2xl font-bold">{longestFailureStreak}</div>
      </CardContent>
    </Card>
  );
}
