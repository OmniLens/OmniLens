// External library imports
import { Eye } from "lucide-react";

// Type imports
import type { Workflow } from "@/lib/hooks/use-repository-dashboard";
import type { WorkflowRun } from "@/lib/hooks/use-workflows";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Utility imports
import { cn } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

interface YearlyWorkflowCardProps {
  workflow: Workflow;
  runs: WorkflowRun[];
  repoSlug: string;
}

interface WorkflowYearlyMetrics {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  successRate: number;
  avgDuration: number;
  totalDuration: number;
  mostRecentStatus: 'success' | 'failure' | 'running' | 'unknown';
  runsByMonth: number[];
}

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
 * Get the latest run status for today only
 * Returns 'success', 'failure', 'running', or null if no runs today
 */
function getTodayLatestRunStatus(runs: WorkflowRun[]): 'success' | 'failure' | 'running' | null {
  const todayKey = getTodayKey();
  
  // Filter runs to only include today's runs
  const todayRuns = runs.filter(run => formatDateToDay(run.run_started_at) === todayKey);
  
  // If no runs today, return null (will show as Idle)
  if (todayRuns.length === 0) {
    return null;
  }
  
  // Sort by run_started_at descending to get the most recent run
  const sortedRuns = [...todayRuns].sort((a, b) => 
    new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
  );
  
  const mostRecent = sortedRuns[0];
  if (!mostRecent) {
    return null;
  }
  
  // Check if currently running
  if (mostRecent.status === 'in_progress' || mostRecent.status === 'queued') {
    return 'running';
  }
  
  // Check conclusion
  if (mostRecent.conclusion === 'success') {
    return 'success';
  }
  
  if (mostRecent.conclusion === 'failure') {
    return 'failure';
  }
  
  // Default to null if status is unclear
  return null;
}

/**
 * Calculate yearly metrics for a workflow
 */
function calculateYearlyMetrics(runs: WorkflowRun[]): WorkflowYearlyMetrics {
  const totalRuns = runs.length;
  const passedRuns = runs.filter(r => r.conclusion === 'success').length;
  const failedRuns = runs.filter(r => r.conclusion === 'failure').length;
  const successRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;
  
  // Calculate durations
  const completedRuns = runs.filter(r => r.status === 'completed' && r.run_started_at && r.updated_at);
  const totalDuration = completedRuns.reduce((sum, run) => {
    const start = new Date(run.run_started_at).getTime();
    const end = new Date(run.updated_at).getTime();
    return sum + (end - start) / 1000; // seconds
  }, 0);
  const avgDuration = completedRuns.length > 0 ? totalDuration / completedRuns.length : 0;
  
  // Most recent status
  const sortedRuns = [...runs].sort((a, b) => 
    new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
  );
  const mostRecent = sortedRuns[0];
  let mostRecentStatus: 'success' | 'failure' | 'running' | 'unknown' = 'unknown';
  if (mostRecent) {
    if (mostRecent.status === 'in_progress' || mostRecent.status === 'queued') {
      mostRecentStatus = 'running';
    } else if (mostRecent.conclusion === 'success') {
      mostRecentStatus = 'success';
    } else if (mostRecent.conclusion === 'failure') {
      mostRecentStatus = 'failure';
    }
  }
  
  // Runs by month (0-11 for Jan-Dec)
  const runsByMonth = new Array(12).fill(0);
  runs.forEach(run => {
    const month = new Date(run.run_started_at).getMonth();
    runsByMonth[month]++;
  });
  
  return {
    totalRuns,
    passedRuns,
    failedRuns,
    successRate,
    avgDuration: Math.round(avgDuration),
    totalDuration: Math.round(totalDuration),
    mostRecentStatus,
    runsByMonth
  };
}

/**
 * Format duration from seconds to human-readable format
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
 * Yearly Workflow Card Component
 * Displays a workflow's year-to-date metrics in a health score card format
 * Shows health score, success rate, total runs, and average duration
 */
export default function YearlyWorkflowCard({ workflow, runs, repoSlug }: YearlyWorkflowCardProps) {
  const metrics = calculateYearlyMetrics(runs);
  const healthScore = metrics.successRate;
  
  // Get today's latest run status (only for today's runs)
  const todayLatestStatus = getTodayLatestRunStatus(runs);
  
  const getHealthColor = () => {
    if (healthScore >= 90) return 'text-green-500';
    if (healthScore >= 70) return 'text-yellow-500';
    if (healthScore >= 50) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getHealthLabel = () => {
    if (healthScore >= 90) return 'Excellent';
    if (healthScore >= 70) return 'Good';
    if (healthScore >= 50) return 'Fair';
    return 'Poor';
  };
  
  /**
   * Get the progress bar fill color based on health score
   */
  const getProgressBarColor = () => {
    if (healthScore >= 90) return 'bg-green-500';
    if (healthScore >= 70) return 'bg-yellow-500';
    if (healthScore >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  /**
   * Get the progress bar background color
   */
  const getProgressBarBgColor = () => {
    return 'bg-secondary';
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold truncate flex-1">
            {workflow.name}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {/* Latest Run Result Badge - Shows Pass, Fail, Running (for today only), or Idle if no runs today */}
            <Badge
              variant={
                todayLatestStatus === 'success' ? 'success' :
                todayLatestStatus === 'failure' ? 'destructive' :
                todayLatestStatus === 'running' ? 'destructive' :
                'secondary'
              }
              className={todayLatestStatus === 'running' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
            >
              {todayLatestStatus === 'success' ? 'Pass' :
               todayLatestStatus === 'failure' ? 'Fail' :
               todayLatestStatus === 'running' ? 'Running' :
               'Idle'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="shrink-0 h-8 w-8 p-0"
              aria-label="View workflow details"
            >
              <a href={`/dashboard/${repoSlug}/workflows/${workflow.id}`}>
                <Eye className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {getHealthLabel()} Health
            </span>
            <span className={`text-sm font-semibold ${getHealthColor()}`}>
              {healthScore}%
            </span>
          </div>
          <div className={cn("relative h-2 w-full overflow-hidden rounded-full", getProgressBarBgColor())}>
            {healthScore > 0 && (
              <div
                className={cn("h-full transition-all", getProgressBarColor())}
                style={{ width: `${healthScore}%` }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Idle Workflow Card Component
// ============================================================================

/**
 * Props for the IdleYearlyWorkflowCard component
 */
interface IdleYearlyWorkflowCardProps {
  workflow: Workflow;
  repoSlug: string;
}

/**
 * Idle Yearly Workflow Card Component
 * Displays a mock yearly workflow card for workflows with no runs this year
 * Shows idle state with 0 runs, 0% success rate, and N/A for duration
 */
export function IdleYearlyWorkflowCard({ workflow, repoSlug }: IdleYearlyWorkflowCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold truncate flex-1">
            {workflow.name}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {/* Latest Run Result Badge - Shows Idle for workflows with no runs */}
            <Badge variant="secondary">
              Idle
            </Badge>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="shrink-0 h-8 w-8 p-0"
              aria-label="View workflow details"
            >
              <a href={`/dashboard/${repoSlug}/workflows/${workflow.id}`}>
                <Eye className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Idle
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              -
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
