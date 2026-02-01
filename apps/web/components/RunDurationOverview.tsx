// External library imports
import { Clock } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Utility imports
import { formatDurationSeconds } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the RunDurationOverview component
 */
export interface RunDurationOverviewProps {
  totalDurationSeconds: number;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RunDurationOverview component
 * Displays total duration of all workflow runs
 * Shows formatted duration (e.g., "2h 30m", "45m 30s")
 * Used in workflow summary to show cumulative run time
 */
export default function RunDurationOverview({
  totalDurationSeconds
}: RunDurationOverviewProps) {
  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-1.5 shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="h-4 w-4 text-purple-500 shrink-0" />
          <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap truncate min-w-0">
            Total Duration
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="text-base font-semibold tabular-nums">
          {totalDurationSeconds > 0 ? formatDurationSeconds(totalDurationSeconds) : "—"}
        </div>
      </CardContent>
    </Card>
  );
}
