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
 * Full-width bar below the three yearly health widgets (Pass Rate, Days Since Failure, Median Duration).
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
    <Card className="w-full flex-1 min-h-0 flex flex-col min-w-0">
      <CardContent className="px-3 py-3 sm:px-5 sm:py-4 flex-1 flex flex-col justify-center min-h-[4rem] min-w-0">
        <div className="grid grid-cols-3 w-full min-w-0 gap-2 sm:gap-4 items-center">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 sm:h-9 sm:w-9">
              <Server className="h-4 w-4 text-sky-600 dark:text-sky-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Hosted runners</p>
              <p className="text-sm font-semibold truncate tabular-nums">{hostedLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 sm:h-9 sm:w-9">
              <Monitor className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Self-hosted runners</p>
              <p className="text-sm font-semibold truncate tabular-nums">{selfHostedLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 sm:h-9 sm:w-9">
              <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Runtime OS</p>
              <p className="text-sm font-semibold truncate tabular-nums">{majorityOsLabel}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
