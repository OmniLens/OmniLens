// External library imports
import { Timer } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Utility imports
import { formatDurationSeconds } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the AverageDurationOverview component
 */
export interface AverageDurationOverviewProps {
  avgDurationSeconds: number;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AverageDurationOverview component
 * Displays average duration of workflow runs
 * Shows formatted duration (e.g., "2h 30m", "45m 30s")
 * Used in workflow summary to show average run time
 */
export default function AverageDurationOverview({
  avgDurationSeconds
}: AverageDurationOverviewProps) {
  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-1.5 shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Timer className="h-4 w-4 text-blue-500 shrink-0" />
          <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap truncate min-w-0">
            Avg Duration
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="text-base font-semibold tabular-nums">
          {avgDurationSeconds > 0 ? formatDurationSeconds(avgDurationSeconds) : "—"}
        </div>
      </CardContent>
    </Card>
  );
}
