// External library imports
import { Clock, Eye, CheckCircle, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import Link from "next/link";

// Type imports
import type { WorkflowRun } from "@/lib/github";
import type { Workflow } from "@/lib/hooks/use-repository-dashboard";

// Internal component imports
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Utility imports
import { duration, formatRunTime } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the WorkflowCard component
 */
interface WorkflowCardProps {
  run: WorkflowRun;
  isHighlighted?: boolean;
  highlightColor?: string;
  rightAction?: React.ReactNode; // Optional right-side action button (e.g., delete)
  healthStatus?: 'consistent' | 'improved' | 'regressed' | 'still_failing' | 'no_runs_today';
}

// ============================================================================
// Component-Specific Utilities
// ============================================================================

/**
 * Helper function to create a mock WorkflowRun from a Workflow definition
 * Used when a workflow exists but has no runs yet
 * This is component-specific and tightly coupled to WorkflowCard logic
 */
function createMockRunFromWorkflow(workflow: Workflow): WorkflowRun {
  return {
    id: workflow.id,
    workflow_id: workflow.id,
    name: workflow.name,
    path: workflow.path,
    conclusion: null,
    status: 'no_runs',
    html_url: '',
    run_started_at: '',
    updated_at: '',
  };
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Main WorkflowCard component
 * Displays a workflow run with status badge, health indicators, and action buttons
 * Supports highlighting, custom actions, and various health statuses
 */
export default function WorkflowCard({
  run,
  isHighlighted = false,
  highlightColor = '',
  rightAction,
  healthStatus
}: WorkflowCardProps) {
  // Determine workflow run status - use conclusion if available, otherwise fall back to status
  const status = run.conclusion ?? run.status;
  const isSuccess = status === "success";
  const isInProgress = status === "in_progress" || status === 'queued';
  const hasNoRuns = status === 'no_runs';

  // Determine border classes
  const getBorderClass = () => {
    if (isHighlighted && highlightColor) {
      return `${highlightColor} border-2 shadow-lg`;
    }
    return 'border-2 border-border'; // Use the default border color with consistent width
  };

  // Determine card height - use natural sizing
  const cardHeightClass = 'h-auto';

  // Use workflow name directly, preserving emojis
  const getDisplayName = (): string => {
    // Use the workflow name directly from the API (preserve emojis)
    if (run.name) {
      return run.name;
    }
    
    // Fallback to workflow_name if available
    if ('workflow_name' in run && typeof (run as { workflow_name: string }).workflow_name === 'string') {
      return (run as { workflow_name: string }).workflow_name;
    }
    
    // Last resort: extract from path
    if (run.path) {
      const last = run.path.split('/').pop() || run.path;
      const noExt = last.replace(/\.ya?ml$/i, '');
      const cleaned = noExt.replace(/[-_]/g, ' ').trim();
      return cleaned.replace(/\b\w/g, (l) => l.toUpperCase());
    }
    
    return 'Unknown Workflow';
  };

  return (
    <Card className={`${cardHeightClass} ${getBorderClass()}`}>
      {/* Card Header - Contains workflow name and status badges */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Workflow name - Preserves emojis and special characters */}
          <h3 className="font-semibold text-sm leading-tight truncate pr-2">
            {getDisplayName()}
          </h3>
          <div className="flex items-center gap-2">
            {/* Run Count Badge - Shows popover with all runs if workflow ran multiple times */}
            {(() => {
              return run.run_count && run.run_count > 1 ? (
                <Popover>
                <PopoverTrigger asChild>
                  <Badge variant="secondary" className="shrink-0 text-xs cursor-pointer hover:opacity-80">
                    {run.run_count}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-80" side="bottom" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">All Runs</h4>
                    <div className="space-y-1">
                      {run.all_runs && run.all_runs.length > 0 ? (
                        // List all runs for this workflow with time, ID, status badge, and view link
                        run.all_runs.map((runDetail) => (
                          <div key={runDetail.id} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 text-xs">
                            {/* Run time */}
                            <span className="text-muted-foreground w-16">
                              {formatRunTime(runDetail.run_started_at)}
                            </span>
                            {/* Run ID */}
                            <span className="font-mono w-24">
                              #{runDetail.id}
                            </span>
                            {/* Status badge for individual run */}
                            {(() => {
                              const isDetailRunning = (runDetail.status === 'in_progress' || runDetail.status === 'queued') && (runDetail.conclusion === null || runDetail.conclusion === undefined);
                              const isDetailSuccess = runDetail.conclusion === 'success';
                              const label = isDetailSuccess ? 'Pass' : isDetailRunning ? 'Running' : 'Fail';
                              const variant = isDetailSuccess ? 'success' : 'destructive';
                              const runningClass = isDetailRunning ? 'bg-blue-500 hover:bg-blue-600 text-white' : '';
                              return (
                                <Badge variant={variant} className={`text-xs justify-self-start ${runningClass}`}>
                                  {label}
                                </Badge>
                              );
                            })()}
                            {/* View link for individual run */}
                            <Button variant="ghost" size="sm" asChild className="h-6 px-1">
                              <Link href={runDetail.html_url} target="_blank">
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">No run details available</div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : null;
            })()}
            {/* Status Badge - Shows Idle, Pass, Running, or Fail based on workflow state */}
            <Badge
              variant={
                hasNoRuns ? "secondary" :
                isSuccess ? "success" : 
                isInProgress ? "destructive" : 
                "destructive"
              }
              className={`shrink-0 ${isInProgress ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}`}
            >
              {hasNoRuns ? "Idle" :
               isSuccess ? "Pass" : 
               isInProgress ? "Running" : 
               "Fail"}
            </Badge>
            {/* Optional right-side action button (e.g., delete button) */}
            {rightAction}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Health Status Section - Show placeholder when running to maintain spacing */}
        {healthStatus && (
          <div className="flex items-center gap-2">
            {isInProgress ? (
              /* Placeholder content for running workflows to maintain spacing */
              <>
                <div className="h-4 w-4" /> {/* Invisible icon spacer */}
                <span className="text-sm font-medium text-transparent select-none">
                  Placeholder
                </span>
              </>
            ) : (
              (() => {
                // Helper function to get the appropriate icon for each health status
                const getHealthIcon = () => {
                  switch (healthStatus) {
                    case 'consistent':
                      return <CheckCircle className="h-4 w-4 text-green-500" />;
                    case 'improved':
                      return <TrendingUp className="h-4 w-4 text-blue-500" />;
                    case 'regressed':
                      return <TrendingDown className="h-4 w-4 text-orange-500" />;
                    case 'still_failing':
                      return <AlertTriangle className="h-4 w-4 text-red-500" />;
                    case 'no_runs_today':
                      return <Clock className="h-4 w-4 text-muted-foreground" />;
                    default:
                      return null;
                  }
                };

                // Helper function to get the text label for each health status
                const getHealthLabel = () => {
                  switch (healthStatus) {
                    case 'consistent':
                      return 'Consistent';
                    case 'improved':
                      return 'Improved';
                    case 'regressed':
                      return 'Regressed';
                    case 'still_failing':
                      return 'Still Failing';
                    case 'no_runs_today':
                      return 'No Runs Today';
                    default:
                      return '';
                  }
                };

                // Helper function to get the text color class for each health status
                const getHealthColor = () => {
                  switch (healthStatus) {
                    case 'consistent':
                      return 'text-green-500';
                    case 'improved':
                      return 'text-blue-500';
                    case 'regressed':
                      return 'text-orange-500';
                    case 'still_failing':
                      return 'text-red-500';
                    case 'no_runs_today':
                      return 'text-muted-foreground';
                    default:
                      return 'text-muted-foreground';
                  }
                };

                return (
                  <>
                    {getHealthIcon()}
                    <span className={`text-sm font-medium ${getHealthColor()}`}>
                      {getHealthLabel()}
                    </span>
                  </>
                );
              })()
            )}
          </div>
        )}
        
        {/* Duration and View Button Section - Only shown for workflows with runs */}
        {healthStatus !== 'no_runs_today' && !hasNoRuns && (
          <div className="flex items-center justify-between">
            {/* Duration display - Shows "Running" for in-progress workflows, or calculated duration */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {isInProgress ? "Running" : 
                 (run.run_started_at && run.updated_at ? duration(run.run_started_at, run.updated_at) : "No duration")}
              </span>
            </div>
            {/* View button - Links to GitHub Actions run page */}
            <div className="flex items-center gap-2">
              {run.html_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={run.html_url} target="_blank">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Exported Helper Components
// ============================================================================

/**
 * Component for displaying workflows that exist but have no runs yet
 * Uses WorkflowCard with mock data to show an "Idle" state
 */
export function IdleWorkflowCard({ workflow }: { workflow: Workflow }) {
  const mockRun = createMockRunFromWorkflow(workflow);

  return (
    <WorkflowCard
      run={mockRun}
      healthStatus="no_runs_today"
    />
  );
}
