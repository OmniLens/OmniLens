"use client";

// External library imports
import { useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { BarChart3, Zap, MoonStar } from "lucide-react";

// Internal component imports
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WorkflowCard, { IdleWorkflowCard } from "@/components/WorkflowCard";

// Hook imports
import { useSession } from "@/lib/auth-client";
import { useRepositoryWorkflows, useWorkflowRuns, type WorkflowRun as RepoWorkflowRun } from "@/lib/hooks/use-repository-dashboard";
import { useWorkflowsForRepo, type WorkflowRun } from "@/lib/hooks/use-workflows";
import { useUsageMetrics } from "@/lib/hooks/use-usage-metrics";

// Component imports
import WorkflowRunsHistory from "@/components/WorkflowRunsHistory";
import WorkflowRunsHistoryMonth from "@/components/WorkflowRunsHistoryMonth";

// ============================================================================
// Main Component
// ============================================================================

/**
 * Workflows page for a specific repository
 * Displays year-view metrics for workflows in this repository
 */
export default function RepoWorkflowsPage() {
  const router = useRouter();
  const params = useParams();
  const repoSlug = params.slug as string;
  const { data: session, isPending } = useSession();

  // Fetch workflows for this repository
  const { 
    data: workflows = [], 
    isLoading: isLoadingWorkflows 
  } = useRepositoryWorkflows(repoSlug);

  // Fetch workflows metrics and runs (no workflow selected, so we get all runs)
  const { 
    data, 
    isLoading, 
    error 
  } = useWorkflowsForRepo(repoSlug, undefined);

  // Fetch usage metrics for the year (for long widget: hosted/self-hosted runners, majority OS)
  const { data: usageData, isLoading: isUsageLoading } = useUsageMetrics(repoSlug, { period: "current_year" });

  // Calculate today's date string for fetching today's runs
  const todayDateString = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Calculate yesterday's date string for fetching yesterday's runs
  const yesterdayDateString = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch today's workflow runs for health status comparison
  const { 
    data: todayRuns = [], 
    isLoading: isLoadingTodayRuns 
  } = useWorkflowRuns(repoSlug, todayDateString);

  // Fetch yesterday's workflow runs for health status comparison
  const { 
    data: yesterdayRuns = [], 
    isLoading: isLoadingYesterdayRuns 
  } = useWorkflowRuns(repoSlug, yesterdayDateString);

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

  // Get all runs for the year (for commit history visualization and workflow cards)
  const allRunsForMonth = useMemo(() => {
    if (!data) return [];
    return data.allRuns || [];
  }, [data]);

  // Group workflow runs by workflow ID for efficient lookup
  const groupedWorkflowRuns = useMemo(() => {
    const grouped = new Map<number, WorkflowRun[]>();
    
    allRunsForMonth.forEach((run) => {
      const workflowId = run.workflow_id;
      if (!grouped.has(workflowId)) {
        grouped.set(workflowId, []);
      }
      grouped.get(workflowId)!.push(run);
    });

    return grouped;
  }, [allRunsForMonth]);

  // Calculate full year date range (January 1st to December 31st)
  const yearDateRange = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1); // January 1st
    const endDate = new Date(today.getFullYear(), 11, 31); // December 31st
    return { startDate, endDate };
  }, []);

  /**
   * Get the last run result (success or failure) for a specific workflow
   * Used for comparing today's results with yesterday's results
   * @param workflowId - The workflow ID to check
   * @param runs - Array of workflow runs to search through
   * @returns 'success', 'failure', or null if no runs found
   */
  const getLastRunResult = useCallback((workflowId: number, runs: RepoWorkflowRun[]): 'success' | 'failure' | null => {
    const workflowRuns = runs.filter(run => run.workflow_id === workflowId);
    if (workflowRuns.length === 0) return null;
    
    // Sort by run_started_at descending and get the most recent
    const sortedRuns = workflowRuns.sort((a, b) => 
      new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
    );
    
    const lastRun = sortedRuns[0];
    return lastRun.conclusion === 'success' ? 'success' : 'failure';
  }, []);

  /**
   * Get the last available run (full run object) for a specific workflow from all runs
   * Excludes today's runs to get the most recent historical run
   * @param workflowId - The workflow ID to check
   * @returns The last available run object, or null if no runs found
   */
  const getLastAvailableRun = useCallback((workflowId: number): WorkflowRun | null => {
    // Get today's date key for filtering
    const todayKey = todayDateString;
    
    // Filter out today's runs and get all historical runs
    const historicalRuns = allRunsForMonth.filter(run => {
      const runDate = new Date(run.run_started_at);
      const year = runDate.getFullYear();
      const month = String(runDate.getMonth() + 1).padStart(2, '0');
      const day = String(runDate.getDate()).padStart(2, '0');
      const runDateKey = `${year}-${month}-${day}`;
      return runDateKey !== todayKey && run.workflow_id === workflowId;
    });
    
    if (historicalRuns.length === 0) return null;
    
    // Sort by run_started_at descending and get the most recent
    const sortedRuns = historicalRuns.sort((a, b) => 
      new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
    );
    
    return sortedRuns[0];
  }, [allRunsForMonth, todayDateString]);

  /**
   * Get the last available run result (success or failure) for a specific workflow from all runs
   * Excludes today's runs to get the most recent historical run
   * @param workflowId - The workflow ID to check
   * @returns 'success', 'failure', or null if no runs found
   */
  const getLastAvailableRunResult = useCallback((workflowId: number): 'success' | 'failure' | null => {
    const lastRun = getLastAvailableRun(workflowId);
    if (!lastRun) return null;
    return lastRun.conclusion === 'success' ? 'success' : 'failure';
  }, [getLastAvailableRun]);

  /**
   * Classify workflow health status by comparing today's runs with yesterday's
   * Determines if workflow is consistent, improved, regressed, still failing, or has no runs
   * @param workflowId - The workflow ID to classify
   * @returns Health status classification
   */
  const classifyWorkflowHealth = useCallback((workflowId: number): 'consistent' | 'improved' | 'regressed' | 'still_failing' | 'no_runs_today' => {
    // Check if there's a currently running workflow from today's runs
    const currentlyRunning = todayRuns.find(run => 
      run.workflow_id === workflowId && 
      (run.status === 'in_progress' || run.status === 'queued')
    );
    
    const todayWorkflowRuns = todayRuns.filter(run => run.workflow_id === workflowId);
    
    // If currently running, don't show historical health status
    if (currentlyRunning) {
      return todayWorkflowRuns.length === 0 ? 'no_runs_today' : 'consistent';
    }
    
    // If no runs today, use the last available run result to determine health status
    if (todayWorkflowRuns.length === 0) {
      const lastAvailableResult = getLastAvailableRunResult(workflowId);
      // If the last available result was success, show consistent (was good, still good)
      // If the last available result was failure, show still_failing (was failing, still failing)
      // If no historical data, return no_runs_today
      if (lastAvailableResult === 'success') {
        return 'consistent';
      } else if (lastAvailableResult === 'failure') {
        return 'still_failing';
      }
      return 'no_runs_today';
    }
    
    // Check if all runs today were successful
    const allSuccessfulToday = todayWorkflowRuns.every(run => run.conclusion === 'success');
    const allFailedToday = todayWorkflowRuns.every(run => run.conclusion === 'failure');
    
    // Get yesterday's last run result
    const yesterdayLastResult = getLastRunResult(workflowId, yesterdayRuns);
    
    if (allSuccessfulToday) {
      if (yesterdayLastResult === 'failure') {
        return 'improved';
      } else {
        return 'consistent';
      }
    } else if (allFailedToday) {
      if (yesterdayLastResult === 'success') {
        return 'regressed';
      } else {
        return 'still_failing';
      }
    } else {
      // Mixed results today
      const todayLastResult = getLastRunResult(workflowId, todayWorkflowRuns);
      
      if (yesterdayLastResult === null) {
        const successCount = todayWorkflowRuns.filter(run => run.conclusion === 'success').length;
        const failureCount = todayWorkflowRuns.filter(run => run.conclusion === 'failure').length;
        return successCount > failureCount ? 'improved' : 'regressed';
      }
      
      if (yesterdayLastResult === 'failure' && todayLastResult === 'success') {
        return 'improved';
      } else if (yesterdayLastResult === 'success' && todayLastResult === 'failure') {
        return 'regressed';
      } else {
        const successCount = todayWorkflowRuns.filter(run => run.conclusion === 'success').length;
        const failureCount = todayWorkflowRuns.filter(run => run.conclusion === 'failure').length;
        
        if (yesterdayLastResult === 'success') {
          return successCount > failureCount ? 'consistent' : 'regressed';
        } else {
          return successCount > failureCount ? 'improved' : 'still_failing';
        }
      }
    }
  }, [todayRuns, yesterdayRuns, getLastRunResult, getLastAvailableRunResult]);

  /**
   * Separate workflows into idle and active groups
   * Idle workflows have no runs today (will show "Idle" status)
   * @returns Object with idleWorkflows and activeWorkflows arrays
   */
  const { idleWorkflows, activeWorkflows } = useMemo(() => {
    const idle: typeof workflows = [];
    const active: typeof workflows = [];
    
    workflows.forEach(workflow => {
      // Check if workflow has any runs today
      const hasRunsToday = todayRuns.some(run => run.workflow_id === workflow.id);
      
      if (hasRunsToday) {
        active.push(workflow);
      } else {
        idle.push(workflow);
      }
    });
    
    return {
      idleWorkflows: idle,
      activeWorkflows: active
    };
  }, [workflows, todayRuns]);

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  // Show loading state while checking authentication
  if (isPending) {
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

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Overview</h1>
        </div>

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>Failed to load workflows. Please try again.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data loading - show spinner while workflows/runs are loading */}
        {(isLoading || isLoadingWorkflows || isLoadingTodayRuns || isLoadingYesterdayRuns) && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading workflows...</p>
            </div>
          </div>
        )}

        {/* Workflow Gallery */}
        {!isLoading && !isLoadingWorkflows && !isLoadingTodayRuns && !isLoadingYesterdayRuns && (
          <div className="space-y-6">
            {/* GitHub-style commit history cards - side by side */}
            {allRunsForMonth.length > 0 && yearDateRange && (
              <div className="flex gap-6 w-full items-stretch">
                {/* Runs This Year - natural width */}
                <div className="shrink-0">
                  <WorkflowRunsHistory
                    runs={allRunsForMonth}
                    startDate={yearDateRange.startDate}
                    endDate={yearDateRange.endDate}
                  />
                </div>
                
                {/* Overview - takes remaining space */}
                <div className="flex-1 min-w-0">
                  <WorkflowRunsHistoryMonth
                    runs={allRunsForMonth}
                    usageSummary={
                      usageData?.summary
                        ? {
                            totalHostedJobRuns: usageData.summary.totalHostedJobRuns,
                            totalSelfHostedJobRuns: usageData.summary.totalSelfHostedJobRuns,
                            majorityRuntimeOs: usageData.summary.majorityRuntimeOs,
                          }
                        : null
                    }
                    usageLoading={isUsageLoading}
                  />
                </div>
              </div>
            )}

            {/* Workflows Grid Section - Displays individual workflow cards */}
            {workflows.length > 0 && !isLoading && (
              <div className="space-y-8">
                {/* Workflow Cards - Using the same WorkflowCard component from repo dashboard */}
                {!isLoading && !isLoadingWorkflows && data && data.allRuns !== undefined && (() => {
                  if (activeWorkflows.length === 0) {
                    return null;
                  }
                  
                  return (
                    <div className="space-y-4">
                      {/* Section header with active workflow count */}
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        <h2 className="text-xl font-semibold">Workflows</h2>
                        <Badge variant="secondary" className="ml-2">
                          {activeWorkflows.length}
                        </Badge>
                      </div>
                      
                      {/* Workflow cards grid - Responsive layout (1 col mobile, 2 cols tablet, 3 cols desktop) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeWorkflows.map((workflow) => {
                          // Get all runs for this workflow from the grouped map
                          const runs = groupedWorkflowRuns.get(workflow.id) || [];
                          
                          // Sort runs by date (most recent first) to get the latest run
                          const sortedRuns = [...runs].sort((a, b) => 
                            new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
                          );
                          
                          // Use the most recent run as the primary display
                          const mostRecentRun = sortedRuns[0];
                          
                          // Calculate health status for this workflow
                          const healthStatus = classifyWorkflowHealth(workflow.id);
                          
                          // Enhance the run with metadata for the WorkflowCard component
                          const enhancedRun = {
                            ...mostRecentRun,
                            run_count: runs.length,
                            all_runs: runs
                          };
                          
                          return (
                            <WorkflowCard
                              key={workflow.id}
                              run={enhancedRun}
                              healthStatus={healthStatus}
                              repoSlug={repoSlug}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Idle Workflows Section - Always shown, badge only when there are idle workflows */}
                {!isLoading && !isLoadingWorkflows && (
                  <div className="space-y-4">
                    {/* Section header with idle workflow count */}
                    <div className="flex items-center gap-2">
                      <MoonStar className="h-5 w-5" />
                      <h2 className="text-xl font-semibold">Idle</h2>
                      {idleWorkflows.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {idleWorkflows.length}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Idle workflow cards grid - Only shown when there are idle workflows */}
                    {idleWorkflows.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {idleWorkflows.map((workflow) => {
                          // Calculate health status for idle workflows based on last available run
                          const healthStatus = classifyWorkflowHealth(workflow.id);
                          // Get the last available run for duration display
                          const lastAvailableRun = getLastAvailableRun(workflow.id);
                          return (
                            <IdleWorkflowCard 
                              key={workflow.id} 
                              workflow={workflow} 
                              repoSlug={repoSlug}
                              healthStatus={healthStatus}
                              lastAvailableRun={lastAvailableRun}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {allRunsForMonth.length === 0 && workflows.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No workflows found</p>
                    <p className="text-sm">
                      This repository doesn&apos;t have any workflows yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
