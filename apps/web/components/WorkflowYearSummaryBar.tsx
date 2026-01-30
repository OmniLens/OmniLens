// External library imports
import type { WorkflowRun } from "@/lib/github";
import { Server, Monitor, Cpu } from "lucide-react";

// Internal component imports
import { Card, CardContent } from "@/components/ui/card";

// ============================================================================
// Type Definitions
// ============================================================================

export interface WorkflowYearSummaryBarProps {
  runs: WorkflowRun[];
  /** Total job runs on GitHub-hosted runners (from usage API when wired) */
  totalHostedJobRuns?: number | null;
  /** Total job runs on self-hosted runners (from usage API when wired) */
  totalSelfHostedJobRuns?: number | null;
  /** Majority runtime OS for the period (from usage API when wired) */
  majorityRuntimeOs?: string | null;
  /** When true, show loading placeholder instead of — for usage values */
  isLoading?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowYearSummaryBar component
 * Full-width bar below the three yearly health widgets (Failure Streak, Days Since Failure, Median Duration).
 * Shows: total hosted runners, total self-hosted runners, majority runtime OS.
 * Pass totalHostedJobRuns, totalSelfHostedJobRuns, majorityRuntimeOs from the usage API; shows — when not yet loaded or unavailable.
 */
export default function WorkflowYearSummaryBar({
  runs: _runs,
  totalHostedJobRuns = null,
  totalSelfHostedJobRuns = null,
  majorityRuntimeOs = null,
  isLoading = false,
}: WorkflowYearSummaryBarProps) {
  const placeholder = isLoading ? "Loading…" : "—";
  const hostedLabel = totalHostedJobRuns != null ? totalHostedJobRuns : placeholder;
  const selfHostedLabel = totalSelfHostedJobRuns != null ? totalSelfHostedJobRuns : placeholder;
  const majorityOsLabel = majorityRuntimeOs ?? placeholder;

  return (
    <Card className="w-full flex-1 min-h-0 flex flex-col">
      <CardContent className="px-5 py-5 sm:px-6 sm:py-6 flex-1 flex flex-col justify-center min-h-[4rem]">
        <div className="flex w-full flex-wrap items-center justify-between gap-x-10 gap-y-5 sm:gap-x-14 sm:gap-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15">
              <Server className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Hosted runners</p>
              <p className="text-sm font-semibold">{hostedLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
              <Monitor className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Self-hosted runners</p>
              <p className="text-sm font-semibold">{selfHostedLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15">
              <Cpu className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Majority Runtime OS</p>
              <p className="text-sm font-semibold">{majorityOsLabel}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
