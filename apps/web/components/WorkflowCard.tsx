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
// Helper Functions
// ============================================================================

/**
 * Format date to YYYY-MM-DD string using local time (not UTC)
 * This prevents timezone issues where dates can appear one day ahead
 */
function formatDateToDay(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date key (YYYY-MM-DD) for filtering current-day runs
 */
function getTodayKey(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Filter runs to only include today's runs
 * Preserves the full run object structure
 */
function filterTodayRuns<T extends { run_started_at: string }>(runs: T[]): T[] {
  const todayKey = getTodayKey();
  return runs.filter(run => formatDateToDay(run.run_started_at) === todayKey);
}

/**
 * Get the latest run status for today only
 * Returns the status from the most recent run today, or null if no runs today
 */
function getTodayLatestRunStatus<T extends { conclusion: string | null; status: string; run_started_at: string }>(runs: T[]): T | null {
  const todayRuns = filterTodayRuns(runs);
  if (todayRuns.length === 0) {
    return null;
  }
  
  // Sort by run_started_at descending to get the most recent run
  const sortedRuns = [...todayRuns].sort((a, b) => 
    new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
  );
  
  return sortedRuns[0] || null;
}

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
  repoSlug?: string; // Repository slug for linking to workflows page
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
  healthStatus,
  repoSlug
}: WorkflowCardProps) {
  // Filter to today's runs only for status and badge display
  const todayRuns = run.all_runs ? filterTodayRuns(run.all_runs) : [];
  const todayLatestRun = getTodayLatestRunStatus(run.all_runs || []);
  
  // Determine workflow run status from today's latest run only
  // If no runs today, status is 'no_runs' (will show as Idle)
  const status = todayLatestRun 
    ? (todayLatestRun.conclusion ?? todayLatestRun.status)
    : 'no_runs';
  const isSuccess = status === "success";
  const isInProgress = status === "in_progress" || status === 'queued';
  const hasNoRuns = status === 'no_runs' || todayRuns.length === 0;
  
  // Today's run count
  const todayRunCount = todayRuns.length;

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
            {/* Run Count Badge - Shows popover with today's runs if workflow ran multiple times today */}
            {(() => {
              return todayRunCount > 1 ? (
                <Popover>
                <PopoverTrigger asChild>
                  <Badge variant="secondary" className="shrink-0 text-xs cursor-pointer hover:opacity-80">
                    {todayRunCount}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-80" side="bottom" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Today&apos;s Runs</h4>
                    <div className="space-y-1">
                      {todayRuns.length > 0 ? (
                        // List all today's runs for this workflow with time, ID, status badge, and view link
                        todayRuns.map((runDetail) => (
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
        
        {/* Duration and Action Buttons Section */}
        <div className="flex items-center justify-between">
          {/* Duration display - Shown for workflows with runs today or idle workflows with last available run */}
          {(() => {
            // Show duration if:
            // 1. Has runs today (not idle) - show today's run duration
            // 2. Is idle but has a last available run with duration data - show last run duration
            const hasRunsToday = !hasNoRuns && todayLatestRun;
            const isIdleWithLastRun = hasNoRuns && run.run_started_at && run.updated_at;
            const shouldShowDuration = hasRunsToday || isIdleWithLastRun;
            
            if (!shouldShowDuration) return null;
            
            // For idle workflows, use the last available run's duration
            // For active workflows, use today's run duration
            const durationStart = run.run_started_at;
            const durationEnd = run.updated_at;
            
            return (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {isInProgress ? "Running" : 
                   (durationStart && durationEnd
                     ? duration(durationStart, durationEnd)
                     : "No duration")}
                </span>
              </div>
            );
          })()}
          {/* Action buttons - View button always shown */}
          <div className="flex items-center gap-2 ml-auto">
            {repoSlug && run.workflow_id && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/${repoSlug}/workflows/${run.workflow_id}`}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Link>
              </Button>
            )}
          </div>
        </div>
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
 * @param workflow - The workflow to display
 * @param repoSlug - Optional repository slug for linking
 * @param healthStatus - Optional health status to display (from last available run)
 * @param lastAvailableRun - Optional last available run to show duration
 */
export function IdleWorkflowCard({ 
  workflow, 
  repoSlug,
  healthStatus,
  lastAvailableRun
}: { 
  workflow: Workflow; 
  repoSlug?: string;
  healthStatus?: 'consistent' | 'improved' | 'regressed' | 'still_failing' | 'no_runs_today';
  lastAvailableRun?: { run_started_at: string; updated_at: string } | null;
}) {
  const mockRun = createMockRunFromWorkflow(workflow);
  
  // Enhance the mock run with last available run data if available
  const enhancedRun = lastAvailableRun ? {
    ...mockRun,
    run_started_at: lastAvailableRun.run_started_at,
    updated_at: lastAvailableRun.updated_at,
    all_runs: [lastAvailableRun]
  } : mockRun;

  return (
    <WorkflowCard
      run={enhancedRun}
      healthStatus={healthStatus || 'no_runs_today'}
      repoSlug={repoSlug}
    />
  );
}
