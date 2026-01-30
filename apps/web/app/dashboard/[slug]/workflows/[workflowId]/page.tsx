"use client";

// External library imports
import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Zap, ChevronRight, Github } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Hook imports
import { useSession } from "@/lib/auth-client";
import { useWorkflowsForRepo, type WorkflowRun } from "@/lib/hooks/use-workflows";

// ============================================================================
// Helper Functions
// ============================================================================

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

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date to day-only string (for grouping)
 */
function formatDateToDay(dateString: string): string {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0];
}

/**
 * Format date to readable day string (without time)
 */
function formatDay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric'
  });
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Workflow detail page for a specific workflow
 * Displays detailed metrics and run history for a selected workflow
 */
export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const repoSlug = params.slug as string;
  const workflowId = parseInt(params.workflowId as string, 10);
  const { data: session, isPending } = useSession();
  
  // Track which days are expanded in the Recent Runs section
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Fetch workflow metrics and runs
  const { 
    data, 
    isLoading, 
    error 
  } = useWorkflowsForRepo(repoSlug, workflowId);

  // ============================================================================
  // Effects
  // ============================================================================

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const selectedWorkflow = data?.selectedWorkflow;
  const selectedWorkflowRuns = useMemo(() => data?.selectedWorkflowRuns || [], [data?.selectedWorkflowRuns]);
  const selectedWorkflowMetrics = data?.selectedWorkflowMetrics;

  // Group workflow runs by day for the Recent Runs section
  const runsByDay = useMemo(() => {
    const grouped = new Map<string, WorkflowRun[]>();
    
    selectedWorkflowRuns.forEach((run) => {
      const dayKey = formatDateToDay(run.run_started_at);
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, []);
      }
      grouped.get(dayKey)!.push(run);
    });
    
    // Sort runs within each day by run_started_at descending (most recent first)
    grouped.forEach((runs) => {
      runs.sort((a, b) => 
        new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
      );
    });
    
    // Sort days in descending order (most recent first)
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [selectedWorkflowRuns]);

  /**
   * Get summary status for a day's runs
   * Returns the status of the most recent run (runs should be sorted by date descending)
   */
  const getDayStatus = (runs: WorkflowRun[]): { status: 'success' | 'failure' | 'mixed' | 'running'; label: string } => {
    if (runs.length === 0) {
      return { status: 'success', label: 'Passed' };
    }
    
    // Get the most recent run (first in the sorted array)
    const latestRun = runs[0];
    
    // Check if the latest run is still running
    const isRunning = (latestRun.status === 'in_progress' || latestRun.status === 'queued') && 
                      (latestRun.conclusion === null || latestRun.conclusion === undefined);
    
    if (isRunning) {
      return { status: 'running', label: 'Running' };
    }
    
    if (latestRun.conclusion === 'success') {
      return { status: 'success', label: 'Passed' };
    }
    
    if (latestRun.conclusion === 'failure') {
      return { status: 'failure', label: 'Failed' };
    }
    
    // Fallback for other statuses (e.g., cancelled, skipped)
    return { status: 'running', label: latestRun.status || 'Unknown' };
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Toggle expansion state for a specific day
   */
  const toggleDayExpansion = (dayKey: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
  };

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  // Show loading state while checking authentication
  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  // Show error state
  if (error || !selectedWorkflow || !selectedWorkflowMetrics) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>Failed to load workflow details. Please try again.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-foreground" />
            <h1 className="text-xl sm:text-2xl font-bold">{selectedWorkflow.name}</h1>
          </div>
        </div>

        {/* Workflow Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Run History Count */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{selectedWorkflowRuns.length}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Total runs this year
              </p>
            </CardContent>
          </Card>

          {/* Average Run Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Average Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatDuration(selectedWorkflowMetrics.avgDuration)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Average across all completed runs
              </p>
            </CardContent>
          </Card>

          {/* Run Durations Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run Durations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatDuration(selectedWorkflowMetrics.durationSum)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Total duration this year
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Run History List */}
        {selectedWorkflowRuns.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {runsByDay.map(([dayKey, runs]) => {
                  const isExpanded = expandedDays.has(dayKey);
                  const dayStatus = getDayStatus(runs);
                  const hasMultipleRuns = runs.length > 1;
                  const firstRun = runs[0]; // Use first run for day display
                  
                  return (
                    <div key={dayKey} className="border rounded-lg overflow-hidden">
                      {/* Day Summary Row */}
                      <div 
                        className="flex gap-2 cursor-pointer"
                        onClick={() => toggleDayExpansion(dayKey)}
                      >
                        <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors flex-1">
                          <Badge
                            variant={
                              dayStatus.status === 'success'
                                ? 'default'
                                : dayStatus.status === 'failure'
                                ? 'destructive'
                                : dayStatus.status === 'running'
                                ? 'secondary'
                                : 'secondary'
                            }
                          >
                            {dayStatus.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDay(firstRun.run_started_at)}
                          </span>
                          {hasMultipleRuns && (
                            <Badge variant="outline">
                              {runs.length} {runs.length === 1 ? 'run' : 'runs'}
                            </Badge>
                          )}
                          <ChevronRight 
                            className={`h-4 w-4 text-muted-foreground transition-transform ml-auto ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </div>
                      
                      {/* Expanded Runs List */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30">
                          <div className="p-2 space-y-2">
                            {runs.map((run) => (
                              <div key={run.id} className="flex gap-2">
                                <div className="flex items-center gap-3 p-2 bg-background rounded border flex-1">
                                  <Badge
                                    variant={
                                      run.conclusion === 'success'
                                        ? 'default'
                                        : run.conclusion === 'failure'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {run.conclusion === 'success'
                                      ? 'Passed'
                                      : run.conclusion === 'failure'
                                      ? 'Failed'
                                      : run.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(run.run_started_at)}
                                  </span>
                                </div>
                                <a
                                  href={run.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View on GitHub"
                                  aria-label="View on GitHub"
                                  className="w-10 p-2 border rounded hover:bg-muted/50 transition-colors flex items-center justify-center flex-shrink-0"
                                >
                                  <Github className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {runsByDay.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    No runs found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>No runs found for this workflow this year.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
