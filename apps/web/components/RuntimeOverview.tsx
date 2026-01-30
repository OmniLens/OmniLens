// External library imports
import { Clock } from 'lucide-react';

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the RuntimeOverview component
 */
export interface RuntimeOverviewProps {
  totalRuntime: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format duration from seconds to human-readable format
 * Converts total seconds to hours, minutes, and seconds display
 * @param seconds - Total duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m", "45m 30s", "30s")
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RuntimeOverview component
 * Displays total runtime statistics for workflow runs
 * Shows formatted duration of all workflow executions
 * Used in daily metrics dashboard to show time-based workflow statistics
 */
export default function RuntimeOverview({
  totalRuntime
}: RuntimeOverviewProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Runtime</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Runtime - Formatted duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Total Runtime</span>
            </div>
            <span className="text-sm font-medium">{formatDuration(totalRuntime)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
