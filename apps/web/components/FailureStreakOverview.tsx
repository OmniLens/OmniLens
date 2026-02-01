// External library imports
import { useMemo } from "react";
import { TrendingDown } from "lucide-react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import OverviewStatCard from "@/components/OverviewStatCard";

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
    <OverviewStatCard
      icon={TrendingDown}
      iconBgClass="bg-rose-500/15"
      iconColorClass="text-rose-600 dark:text-rose-400"
      title="Failure Streak"
      value={longestFailureStreak}
    />
  );
}
