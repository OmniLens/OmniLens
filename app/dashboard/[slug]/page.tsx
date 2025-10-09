"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/DatePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useDateState, 
  useRepositoryWorkflows, 
  useWorkflowRuns, 
  useWorkflowOverview,
  useYesterdayWorkflowRuns,
  type Workflow,
  type WorkflowRun
} from "@/lib/hooks/use-repository-dashboard";
import WorkflowCard from "@/components/WorkflowCard";
import DailyMetrics from "@/components/DailyMetrics";

// Helper function to format repository name for display
function formatRepoDisplayName(repoName: string): string {
  const repoNamePart = repoName.split('/').pop() || repoName;
  
  // Special case for nuqs - keep it lowercase
  if (repoNamePart.toLowerCase() === 'nuqs') {
    return 'nuqs';
  }
  
  return repoNamePart
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

// Workflow Definition Card Component
function WorkflowDefinitionCard({ workflow }: { workflow: Workflow }) {
  return (
    <Card className="relative h-full transition-all duration-200 border-border bg-card hover:border-border/80 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">
              {workflow.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              -
            </Badge>
            <Badge variant={workflow.state === 'active' ? 'success' : 'secondary'}>
              {workflow.state === 'active' ? 'Active' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
      </CardContent>
    </Card>
  );
}


interface PageProps {
  params: { slug: string };
}

export default function DashboardPage({ params }: PageProps) {
  const { slug: repoSlug } = params;
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const queryClient = useQueryClient();
  
  // Use nuqs for date state management
  const { selectedDate, setSelectedDate } = useDateState();
  
  // Cache invalidation when date changes
  useEffect(() => {
    if (selectedDate) {
      // Clear old comparison queries to prevent stale data
      queryClient.removeQueries({ queryKey: ['yesterday-workflow-runs', repoSlug] });
      queryClient.removeQueries({ queryKey: ['comparison-data', repoSlug] });
      queryClient.removeQueries({ queryKey: ['yesterday-disabled', repoSlug] });
    }
  }, [selectedDate, repoSlug, queryClient]);
  
  // Local state for UI interactions

  // Initialize with today's date - static reference
  const today = useMemo(() => new Date(), []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  // Fetch data using TanStack Query
  const { 
    data: workflows = [], 
    isLoading: isLoadingWorkflows, 
    error: workflowsError 
  } = useRepositoryWorkflows(repoSlug);

  const { 
    data: workflowRuns = [], 
    isLoading: isLoadingRuns, 
    error: runsError 
  } = useWorkflowRuns(repoSlug, selectedDate);

  const { 
    data: overviewData, 
    isLoading: isLoadingOverview, 
    error: overviewError 
  } = useWorkflowOverview(repoSlug, selectedDate);

  const { 
    data: yesterdayRuns = [], 
    isLoading: isLoadingYesterday, 
    error: yesterdayError 
  } = useYesterdayWorkflowRuns(repoSlug, selectedDate);

  // Group workflow runs by workflow ID
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

  // Helper function to get the last run result for a workflow
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

  // Helper function to classify workflow health status
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

  // Calculate workflow health metrics
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

  // Show loading state for authentication
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

  // Show error state
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

  // Show loading state while fetching workflows
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

  // Show loading state while fetching runs
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {formatRepoDisplayName(repoSlug.replace(/-/g, '/'))}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDate(new Date().toISOString().slice(0, 10));
              }}
              className={selectedDate === new Date().toISOString().slice(0, 10) ? "bg-primary text-primary-foreground" : ""}
            >
              Today
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TanStack Query will automatically refetch when we invalidate
                window.location.reload();
              }}
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Daily Metrics */}
        {overviewData && (
          <DailyMetrics
            successRate={overviewData.successRate || 0}
            passRate={overviewData.passRate || 0}
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
            avgRunsPerHour={overviewData.avgRunsPerHour || 0}
            minRunsPerHour={overviewData.minRunsPerHour || 0}
            maxRunsPerHour={overviewData.maxRunsPerHour || 0}
            runsByHour={overviewData.runsByHour || []}
            selectedDate={new Date(selectedDate)}
          />
        )}

        {/* Workflows Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Workflows</h2>
            <Badge variant="secondary" className="ml-2">
              {workflows.length} active
            </Badge>
          </div>

          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No workflows found for this repository.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => {
                const runs = groupedWorkflowRuns.get(workflow.id) || [];
                const hasRuns = runs.length > 0;
                
                if (!hasRuns) {
                  return (
                    <WorkflowDefinitionCard key={workflow.id} workflow={workflow} />
                  );
                }

                // Use the first run for the WorkflowCard, but include all runs data
                const firstRun = runs[0];
                const healthStatus = classifyWorkflowHealth(workflow.id);
                const todayRuns = workflowRuns.filter(run => run.workflow_id === workflow.id);
                
                // Enhance the first run with run count and all runs data
                const enhancedRun = {
                  ...firstRun,
                  run_count: runs.length,
                  all_runs: runs
                };
                
                return (
                  <WorkflowCard
                    key={workflow.id}
                    run={enhancedRun}
                    repoSlug={repoSlug}
                    healthStatus={healthStatus}
                    healthMetrics={{
                      status: healthStatus,
                      totalRuns: todayRuns.length,
                      successfulRuns: todayRuns.filter(run => run.conclusion === 'success').length,
                      failedRuns: todayRuns.filter(run => run.conclusion === 'failure').length
                    }}
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
