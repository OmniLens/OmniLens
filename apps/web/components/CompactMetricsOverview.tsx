// External library imports
import { CheckCircle, Loader, Workflow } from "lucide-react";

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
}

// ============================================================================
// Helper - Progress bar class and percentage color from success rate
// ============================================================================

function getRateStyles(successRate: number): {
  barClass: string;
  barStyle: React.CSSProperties;
  percentClass: string;
  percentStyle: React.CSSProperties;
} {
  if (successRate >= 90) {
    return {
      barClass: 'full',
      barStyle: { background: 'linear-gradient(90deg, #00e5a0, #00ff99)' },
      percentClass: 'high',
      percentStyle: { color: '#00e5a0', fontWeight: 600 },
    };
  }
  if (successRate >= 60) {
    return {
      barClass: 'med',
      barStyle: { background: 'linear-gradient(90deg, #f59e0b, #fcd34d)' },
      percentClass: '',
      percentStyle: { color: '#f59e0b', fontWeight: 600 },
    };
  }
  return {
    barClass: 'low',
    barStyle: { background: 'linear-gradient(90deg, #ef4444, #f87171)' },
    percentClass: '',
    percentStyle: { color: '#ef4444', fontWeight: 600 },
  };
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CompactMetricsOverview component
 * Displays a compact overview of repository workflow metrics in mockup style
 * Shows success rate progress bar with coloured percentage and workflow/runs footer
 */
export default function CompactMetricsOverview({
  totalWorkflows,
  passedRuns,
  failedRuns,
  inProgressRuns,
  successRate,
}: CompactMetricsProps) {
  const totalRuns = passedRuns + failedRuns + inProgressRuns;
  const { barStyle, percentClass, percentStyle } = getRateStyles(successRate);

  return (
    <div className="space-y-3">
      {/* Daily Success Rate - Mockup style row + progress bar */}
      <div className="space-y-2">
        <div className="drc-rate-row flex items-center justify-between text-sm text-muted-foreground">
          <span>Daily Success Rate</span>
          <span
            className={`drc-rate-val ${percentClass}`}
            style={percentStyle}
          >
            {successRate}%
          </span>
        </div>
        <div className="drc-bar-wrap h-[3px] overflow-hidden rounded-[2px] bg-[rgba(255,255,255,0.05)]">
          <div
            className="drc-bar h-full rounded-[2px] transition-all duration-300"
            style={{ width: `${successRate}%`, ...barStyle }}
          />
        </div>
      </div>

      {/* Footer - X workflows + X runs, preserve check logic */}
      <div className="drc-footer flex items-center gap-2 text-sm text-muted-foreground">
        <span className="drc-meta-item flex items-center gap-1.5">
          <Workflow className="h-4 w-4 flex-shrink-0" />
          {totalWorkflows} workflows
        </span>
        <span className="drc-meta-item flex items-center gap-1.5">
          {inProgressRuns > 0 ? (
            <Loader className="h-4 w-4 flex-shrink-0 animate-spin text-blue-500" />
          ) : (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {totalRuns} runs
        </span>
      </div>
    </div>
  );
}
