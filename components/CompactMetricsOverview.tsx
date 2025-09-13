import { CheckCircle, XCircle, Loader, Folder } from "lucide-react";

interface CompactMetricsProps {
  totalWorkflows: number;
  passedRuns: number;
  failedRuns: number;
  inProgressRuns: number;
  successRate: number;
  hasActivity: boolean;
}

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
      {/* Success Rate with Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Daily Success Rate</span>
          <span className="text-xs font-medium">{successRate}%</span>
        </div>
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

      {/* Metrics Row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {/* Total Workflows */}
          <div className="flex items-center gap-1">
            <Folder className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">{totalWorkflows}</span>
          </div>
          
          {/* Passed */}
          {passedRuns > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-500">{passedRuns}</span>
            </div>
          )}
          
          {/* Failed */}
          {failedRuns > 0 && (
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              <span className="text-red-500">{failedRuns}</span>
            </div>
          )}
          
          {/* In Progress */}
          {inProgressRuns > 0 && (
            <div className="flex items-center gap-1">
              <Loader className="h-3 w-3 text-orange-500 animate-spin" />
              <span className="text-orange-500">{inProgressRuns}</span>
            </div>
          )}
        </div>

        {/* Activity Indicator */}
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            hasActivity ? 'bg-green-500' : 'bg-gray-500'
          }`} />
          <span className="text-muted-foreground">
            {hasActivity ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>
    </div>
  );
}