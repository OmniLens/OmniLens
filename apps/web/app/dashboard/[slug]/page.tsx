"use client";

// External library imports
import React, { useMemo, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Internal component imports
import { DatePicker } from "@/components/DatePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WorkflowCard, { IdleWorkflowCard } from "@/components/WorkflowCard";
import DailyMetrics from "@/components/DailyMetrics";
import GitHubStatusBanner from "@/components/GitHubStatusBanner";

// Utility imports
import { formatRepoDisplayName } from "@/lib/utils";

// Hook imports
import { useSession } from "@/lib/auth-client";
import { 
  useDateState, 
  useRepositoryWorkflows, 
  useWorkflowRuns, 
  useWorkflowOverview,
  useYesterdayWorkflowRuns,
  type WorkflowRun
} from "@/lib/hooks/use-repository-dashboard";

// ============================================================================
// Type Definitions
// ============================================================================

// ============================================================================
// Main Component
// ============================================================================

/**
 * Dashboard page for a specific repository
 * Displays workflow runs, metrics, and health status for a selected date
 * Supports date selection, authentication, and real-time data fetching
 */
export default function DashboardPage() {
  // Extract repository slug from URL params using useParams hook
  const params = useParams();
  const repoSlug = params.slug as string;
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const queryClient = useQueryClient();
  
  // Date state management using nuqs for URL synchronization
  const { selectedDate, setSelectedDate } = useDateState();
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Cache invalidation when date changes - prevents stale comparison data
  useEffect(() => {
    if (selectedDate) {
      // Clear old comparison queries to prevent stale data
      queryClient.removeQueries({ queryKey: ['yesterday-workflow-runs', repoSlug] });
      queryClient.removeQueries({ queryKey: ['comparison-data', repoSlug] });
      queryClient.removeQueries({ queryKey: ['yesterday-disabled', repoSlug] });
    }
  }, [selectedDate, repoSlug, queryClient]);
  
  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  // ============================================================================
  // Data Fetching (TanStack Query)
  // ============================================================================

  // Fetch workflow definitions for this repository
  const { 
    data: workflows = [], 
    isLoading: isLoadingWorkflows, 
    error: workflowsError 
  } = useRepositoryWorkflows(repoSlug);

  // Fetch workflow runs for the selected date
  const { 
    data: workflowRuns = [], 
    isLoading: isLoadingRuns, 
    error: runsError 
  } = useWorkflowRuns(repoSlug, selectedDate);

  // Fetch overview metrics for the selected date
  const { 
    data: overviewData, 
    isLoading: isLoadingOverview, 
    error: overviewError 
  } = useWorkflowOverview(repoSlug, selectedDate);

  // Fetch yesterday's workflow runs for comparison
  const { 
    data: yesterdayRuns = [], 
    isLoading: isLoadingYesterday, 
    error: yesterdayError 
  } = useYesterdayWorkflowRuns(repoSlug, selectedDate);

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Group workflow runs by workflow ID for efficient lookup
  const groupedWorkflowRuns = useMemo(() => {
    const grouped = new Map<number, WorkflowRun[]>();
    
    workflowRuns.forEach((run) => {
      const workflowId = run.workflow_id;
      if (!grouped.has(workflowId)) {
        grouped.set(workflowId, []);
      }
      grouped.get(workflowId)!.push(run);
    });

    return grouped;
  }, [workflowRuns]);

  /**
   * Get the last run result (success or failure) for a specific workflow
   * Used for comparing today's results with yesterday's results
   * @param workflowId - The workflow ID to check
   * @param runs - Array of workflow runs to search through
   * @returns 'success', 'failure', or null if no runs found
   */
  const getLastRunResult = useCallback((workflowId: number, runs: WorkflowRun[]): 'success' | 'failure' | null => {
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
   * Classify workflow health status by comparing today's runs with yesterday's
   * Determines if workflow is consistent, improved, regressed, still failing, or has no runs
   * @param workflowId - The workflow ID to classify
   * @returns Health status classification
   */
  const classifyWorkflowHealth = useCallback((workflowId: number): 'consistent' | 'improved' | 'regressed' | 'still_failing' | 'no_runs_today' => {
    // Check if there's a currently running workflow from today's runs
    const currentlyRunning = workflowRuns.find(run => 
      run.workflow_id === workflowId && 
      (run.status === 'in_progress' || run.status === 'queued')
    );
    
    const todayRuns = workflowRuns.filter(run => run.workflow_id === workflowId);
    
    // If currently running, don't show historical health status
    if (currentlyRunning) {
      return todayRuns.length === 0 ? 'no_runs_today' : 'consistent';
    }
    
    if (todayRuns.length === 0) {
      return 'no_runs_today';
    }
    
    // Check if all runs today were successful
    const allSuccessfulToday = todayRuns.every(run => run.conclusion === 'success');
    const allFailedToday = todayRuns.every(run => run.conclusion === 'failure');
    
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
      const todayLastResult = getLastRunResult(workflowId, todayRuns);
      
      if (yesterdayLastResult === null) {
        const successCount = todayRuns.filter(run => run.conclusion === 'success').length;
        const failureCount = todayRuns.filter(run => run.conclusion === 'failure').length;
        return successCount > failureCount ? 'improved' : 'regressed';
      }
      
      if (yesterdayLastResult === 'failure' && todayLastResult === 'success') {
        return 'improved';
      } else if (yesterdayLastResult === 'success' && todayLastResult === 'failure') {
        return 'regressed';
      } else {
        const successCount = todayRuns.filter(run => run.conclusion === 'success').length;
        const failureCount = todayRuns.filter(run => run.conclusion === 'failure').length;
        
        if (yesterdayLastResult === 'success') {
          return successCount > failureCount ? 'consistent' : 'regressed';
        } else {
          return successCount > failureCount ? 'improved' : 'still_failing';
        }
      }
    }
  }, [workflowRuns, yesterdayRuns, getLastRunResult]);

  /**
   * Calculate aggregate health metrics across all workflows
   * Counts workflows by their health status for display in DailyMetrics
   */
  const workflowHealthMetrics = useMemo(() => {
    let consistentCount = 0;
    let improvedCount = 0;
    let regressedCount = 0;
    let stillFailingCount = 0;
    let noRunsTodayCount = 0;
    
    workflows.forEach(workflow => {
      const healthStatus = classifyWorkflowHealth(workflow.id);
      switch (healthStatus) {
        case 'consistent':
          consistentCount++;
          break;
        case 'improved':
          improvedCount++;
          break;
        case 'regressed':
          regressedCount++;
          break;
        case 'still_failing':
          stillFailingCount++;
          break;
        case 'no_runs_today':
          noRunsTodayCount++;
          break;
      }
    });
    
    return {
      consistentCount,
      improvedCount,
      regressedCount,
      stillFailingCount,
      noRunsTodayCount
    };
  }, [workflows, classifyWorkflowHealth]);

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  // Authentication loading state - show spinner while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
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

  // Error state - show error message if any data fetch failed
  if (workflowsError || runsError || overviewError || yesterdayError) {
    const error = workflowsError || runsError || overviewError || yesterdayError;
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <p className="text-muted-foreground text-red-600">
              Error: {error?.message || 'Failed to load data'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Initial data loading state - show spinner while fetching workflows and yesterday's data
  if (isLoadingWorkflows || isLoadingYesterday) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading workflows...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Secondary loading state - show spinner while fetching runs and overview data
  if (isLoadingRuns || isLoadingOverview) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {isLoadingRuns ? 'Loading workflow runs...' : 'Loading overview...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* GitHub Actions Status Banner - Shows if GitHub Actions is experiencing issues */}
        <GitHubStatusBanner className="mb-6" />
        
        {/* Header Section - Repository name, back button, and date controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back button - Returns to main dashboard */}
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            {/* Repository name - Formatted for display */}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {formatRepoDisplayName(repoSlug.replace(/-/g, '/'))}
              </h1>
            </div>
          </div>
          {/* Date controls - Today button, date picker, and refresh */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Today button - Quick jump to today's date */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDate(new Date().toISOString().slice(0, 10));
              }}
              className={`flex-shrink-0 ${selectedDate === new Date().toISOString().slice(0, 10) ? "bg-primary text-primary-foreground" : ""}`}
            >
              Today
            </Button>
            {/* Desktop date picker - Calendar widget for date selection */}
            <div className="hidden sm:block">
              <DatePicker
                date={new Date(selectedDate)}
                onDateChange={(date) => {
                  if (date) {
                    // Use local date formatting to avoid timezone issues
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    setSelectedDate(`${year}-${month}-${day}`);
                  }
                }}
              />
            </div>
            {/* Refresh button - Reloads the page to fetch fresh data */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TanStack Query will automatically refetch when we invalidate
                window.location.reload();
              }}
              aria-label="Refresh data"
              className="flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile-only date picker - Shown only on small screens */}
        <div className="sm:hidden">
          <DatePicker
            date={new Date(selectedDate)}
            onDateChange={(date) => {
              if (date) {
                // Use local date formatting to avoid timezone issues
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                setSelectedDate(`${year}-${month}-${day}`);
              }
            }}
          />
        </div>

        {/* Daily Metrics Section - Shows aggregated statistics for the selected date */}
        {overviewData && (
          <DailyMetrics
            passedRuns={overviewData.passedRuns || 0}
            failedRuns={overviewData.failedRuns || 0}
            completedRuns={overviewData.completedRuns || 0}
            totalRuntime={overviewData.totalRuntime || 0}
            didntRunCount={overviewData.didntRunCount || 0}
            activeWorkflows={workflows.length}
            consistentCount={workflowHealthMetrics.consistentCount}
            improvedCount={workflowHealthMetrics.improvedCount}
            regressedCount={workflowHealthMetrics.regressedCount}
            stillFailingCount={workflowHealthMetrics.stillFailingCount}
            runsByHour={overviewData.runsByHour || []}
          />
        )}

        {/* Workflows Grid Section - Displays individual workflow cards */}
        <div className="space-y-4">
          {/* Section header with workflow count */}
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Workflows</h2>
            <Badge variant="secondary" className="ml-2">
              {workflows.length} active
            </Badge>
          </div>

          {workflows.length === 0 ? (
            // Empty state - No workflows found
            <div className="text-center py-12">
              <p className="text-muted-foreground">No workflows found for this repository.</p>
            </div>
          ) : (
            // Workflow cards grid - Responsive layout (1 col mobile, 2 cols tablet, 3 cols desktop)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => {
                // Get all runs for this workflow from the grouped map
                const runs = groupedWorkflowRuns.get(workflow.id) || [];
                const hasRuns = runs.length > 0;
                
                // Show idle card if workflow has no runs for the selected date
                if (!hasRuns) {
                  return (
                    <IdleWorkflowCard key={workflow.id} workflow={workflow} />
                  );
                }

                // Use the first run as the primary display, but include all runs data
                const firstRun = runs[0];
                const healthStatus = classifyWorkflowHealth(workflow.id);
                
                // Enhance the first run with metadata for the WorkflowCard component
                const enhancedRun = {
                  ...firstRun,
                  run_count: runs.length,
                  all_runs: runs
                };
                
                return (
                  <WorkflowCard
                    key={workflow.id}
                    run={enhancedRun}
                    healthStatus={healthStatus}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
