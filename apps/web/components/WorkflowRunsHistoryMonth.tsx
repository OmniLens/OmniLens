// External library imports
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import DaysSinceLastFailureOverview from "@/components/DaysSinceLastFailureOverview";
import FailureStreakOverview from "@/components/FailureStreakOverview";
import MedianDurationOverview from "@/components/MedianDurationOverview";
import WorkflowYearSummaryBar from "@/components/WorkflowYearSummaryBar";

// ============================================================================
// Type Definitions
// ============================================================================

export interface UsageSummaryForBar {
  totalHostedJobRuns: number | null;
  totalSelfHostedJobRuns: number | null;
  majorityRuntimeOs: string | null;
}

interface WorkflowRunsHistoryMonthProps {
  runs: WorkflowRun[];
  /** Usage summary for the long widget (from usage API); when not provided, bar shows — for each value */
  usageSummary?: UsageSummaryForBar | null;
  /** When true, bar shows loading placeholder for usage values */
  usageLoading?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowRunsHistoryMonth component
 * Top row: three compact health widgets (Failure Streak, Days Since Failure, Median Duration).
 * Bottom row: one full-width component spanning the width of the three widgets.
 * Used in workflow history page next to "Runs This Year" heatmap.
 */
export default function WorkflowRunsHistoryMonth({
  runs,
  usageSummary = null,
  usageLoading = false,
}: WorkflowRunsHistoryMonthProps) {
  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-0">
      {/* Three widgets – content height, no stretch */}
      <div className="flex gap-6 w-full items-start shrink-0">
        <div className="flex-1 min-w-0">
          <FailureStreakOverview runs={runs} />
        </div>
        <div className="flex-1 min-w-0">
          <DaysSinceLastFailureOverview runs={runs} />
        </div>
        <div className="flex-1 min-w-0">
          <MedianDurationOverview runs={runs} />
        </div>
      </div>

      {/* Full-width bar under the three widgets */}
      <div className="w-full min-h-0 flex-1 flex">
        <WorkflowYearSummaryBar
          runs={runs}
          totalHostedJobRuns={usageSummary?.totalHostedJobRuns ?? null}
          totalSelfHostedJobRuns={usageSummary?.totalSelfHostedJobRuns ?? null}
          majorityRuntimeOs={usageSummary?.majorityRuntimeOs ?? null}
          isLoading={usageLoading}
        />
      </div>
    </div>
  );
}
