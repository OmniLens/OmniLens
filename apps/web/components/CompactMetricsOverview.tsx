// External library imports
import { CheckCircle, XCircle, Loader, Folder } from "lucide-react";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the CompactMetricsOverview component
 */
interface CompactMetricsProps {
  totalWorkflows: number;
  passedRuns: number;
  failedRuns: number;
  inProgressRuns: number;
  successRate: number;
  hasActivity: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CompactMetricsOverview component
 * Displays a compact overview of repository workflow metrics
 * Shows success rate progress bar, run counts, and activity status
 * Used in repository cards for quick metric visualization
 */
export default function CompactMetricsOverview({
  totalWorkflows,
  passedRuns,
  failedRuns,
  inProgressRuns,
  successRate,
  hasActivity
}: CompactMetricsProps) {
  return (
    <div className="space-y-3">
      {/* Success Rate Section - Progress bar with percentage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Daily Success Rate</span>
          <span className="text-xs font-medium">{successRate}%</span>
        </div>
        {/* Progress bar with color coding based on success rate */}
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              successRate >= 80 ? 'bg-green-500' : 
              successRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Metrics Row - Run counts and activity indicator */}
      <div className="flex items-center justify-between text-xs">
        {/* Run Counts - Total workflows, passed, failed, in progress */}
        <div className="flex items-center gap-3">
          {/* Total Workflows */}
          <div className="flex items-center gap-1">
            <Folder className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">{totalWorkflows}</span>
          </div>
          
          {/* Passed Runs - Only shown if > 0 */}
          {passedRuns > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-500">{passedRuns}</span>
            </div>
          )}
          
          {/* Failed Runs - Only shown if > 0 */}
          {failedRuns > 0 && (
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              <span className="text-red-500">{failedRuns}</span>
            </div>
          )}
          
          {/* In Progress Runs - Only shown if > 0 */}
          {inProgressRuns > 0 && (
            <div className="flex items-center gap-1">
              <Loader className="h-3 w-3 text-blue-500 animate-spin" />
              <span className="text-blue-500">{inProgressRuns}</span>
            </div>
          )}
        </div>

        {/* Activity Indicator - Shows if repository has recent activity */}
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            hasActivity ? 'bg-green-500' : 'bg-muted'
          }`} />
          <span className="text-muted-foreground">
            {hasActivity ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>
    </div>
  );
}