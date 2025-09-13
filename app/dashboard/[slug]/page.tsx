"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, isToday } from "date-fns";
import { DatePicker } from "@/components/DatePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Settings, BarChart3, RefreshCw } from "lucide-react";
import Link from "next/link";
import { removeEmojiFromWorkflowName } from "@/lib/utils";
import type { WorkflowRun } from "@/lib/github";
import WorkflowCard from "@/components/WorkflowCard";
import DailyMetrics from "@/components/DailyMetrics";


// Helper function to format repository name for display
function formatRepoDisplayName(repoName: string): string {
  // Extract just the repo name part (after the last slash)
  const repoNamePart = repoName.split('/').pop() || repoName;
  
  // Convert kebab-case or snake_case to Title Case
  return repoNamePart
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

// Workflow Definition Card Component
function WorkflowDefinitionCard({ workflow }: { workflow: any }) {
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

// Workflow Card Skeleton Component
function WorkflowCardSkeleton() {
  return (
    <Card className="relative h-auto border-2 border-border animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm leading-tight truncate pr-2">
            <div className="h-4 bg-muted rounded w-32" />
          </h3>
          <div className="flex items-center gap-2">
            {/* Run count badge skeleton */}
            <div className="h-5 bg-muted rounded w-6" />
            {/* Status badge skeleton */}
            <div className="h-5 bg-muted rounded w-12" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Health Status Section Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
        
        {/* Duration and View Button Section Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-16" />
          </div>
          <div className="h-8 bg-muted rounded w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

interface PageProps {
  params: { slug: string };
}

export default function DashboardPage({ params }: PageProps) {
  const { slug: repoSlug } = params;
  const [addedRepoPath, setAddedRepoPath] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [groupedWorkflowRuns, setGroupedWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [yesterdayWorkflowRuns, setYesterdayWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);

  // Initialize with today's date - static reference
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const selectedDateRef = useRef(selectedDate);



  // Load workflows when component mounts
  useEffect(() => {
    const loadWorkflows = async () => {
      console.log(`📋 Initial load: Validating cache and fetching workflows for ${repoSlug}`);
      setIsLoadingWorkflows(true);
      try {
        const response = await fetch(`/api/workflow/${repoSlug}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Log cache status from API response
          if (data.cacheUpdated) {
            console.log(`🔄 Initial load: Cache was outdated and has been updated with ${data.totalCount} workflows`);
          } else if (data.cached === false) {
            console.log(`✅ Initial load: Cache was current, ${data.totalCount} workflows validated`);
          } else {
            console.log(`📋 Initial load: ${data.totalCount} workflows loaded`);
          }
          
          // Filter to only active workflows and sort by name
          const activeWorkflows = (data.workflows || [])
            .filter((workflow: any) => workflow.state === 'active')
            .sort((a: any, b: any) => {
              const nameA = removeEmojiFromWorkflowName(a.name || '');
              const nameB = removeEmojiFromWorkflowName(b.name || '');
              return nameA.localeCompare(nameB);
            });
          setWorkflows(activeWorkflows);
          console.log(`✅ Initial load complete: ${activeWorkflows.length} active workflows loaded`);
        } else {
          console.error('Failed to load workflows');
          setWorkflows([]);
        }
      } catch (error) {
        console.error('Error loading workflows:', error);
        setWorkflows([]);
      } finally {
        setIsLoadingWorkflows(false);
      }
    };

    loadWorkflows();
  }, [repoSlug]);

  // Update ref when selectedDate changes
  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  // Load workflow runs when selectedDate changes
  useEffect(() => {
    const loadWorkflowRuns = async () => {
      if (workflows.length === 0) return; // Don't load runs if no workflows
      
      setIsLoadingRuns(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        // Fetch workflow runs
        const runsResponse = await fetch(`/api/workflow/${repoSlug}?date=${dateStr}&grouped=true`);
        
        // Fetch overview data
        const overviewResponse = await fetch(`/api/workflow/${repoSlug}/overview?date=${dateStr}`);
        
        if (runsResponse.ok && overviewResponse.ok) {
          const runsData = await runsResponse.json();
          const overviewDataResponse = await overviewResponse.json();
          
          setWorkflowRuns(runsData.workflowRuns || []);
          setGroupedWorkflowRuns(runsData.workflowRuns || []);
          setOverviewData(overviewDataResponse.overview || null);
          console.log(`📊 Loaded ${runsData.workflowRuns?.length || 0} workflow runs for ${dateStr}`);
        } else {
          console.error('Failed to load workflow data');
          setWorkflowRuns([]);
          setGroupedWorkflowRuns([]);
          setOverviewData(null);
        }
      } catch (error) {
        console.error('Error loading workflow runs:', error);
        setWorkflowRuns([]);
        setGroupedWorkflowRuns([]);
        setOverviewData(null);
      } finally {
        setIsLoadingRuns(false);
      }
    };

    loadWorkflowRuns();
  }, [selectedDate, repoSlug, workflows.length]);

  // Load yesterday's workflow runs for health comparison
  useEffect(() => {
    const loadYesterdayRuns = async () => {
      if (workflows.length === 0) return; // Don't load runs if no workflows
      
      try {
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        
        const response = await fetch(`/api/workflow/${repoSlug}?date=${yesterdayStr}&grouped=true`);
        if (response.ok) {
          const data = await response.json();
          setYesterdayWorkflowRuns(data.workflowRuns || []);
          console.log(`📊 Loaded ${data.workflowRuns?.length || 0} yesterday's workflow runs for ${yesterdayStr}`);
        } else {
          console.error('Failed to load yesterday workflow runs');
          setYesterdayWorkflowRuns([]);
        }
      } catch (error) {
        console.error('Error loading yesterday workflow runs:', error);
        setYesterdayWorkflowRuns([]);
      }
    };

    loadYesterdayRuns();
  }, [selectedDate, repoSlug, workflows.length]);


  const selectedDateStr = format(selectedDate, "EEEE, MMMM d, yyyy");
  const isSelectedDateToday = isToday(selectedDate);

  // Handle setting date to today
  const handleSetToday = useCallback(() => {
    setSelectedDate(today);
  }, [today]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    console.log(`🔄 Manual refresh triggered - validating cache and fetching latest workflows from GitHub`);
    setIsLoadingWorkflows(true);
    setIsLoadingRuns(true);
    
    try {
      // Add timestamp to force cache revalidation
      const response = await fetch(`/api/workflow/${repoSlug}?refresh=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Log cache status from API response
        if (data.cacheUpdated) {
          console.log(`🔄 Manual refresh: Cache was outdated and has been updated with ${data.totalCount} workflows`);
        } else if (data.cached === false) {
          console.log(`✅ Manual refresh: Cache was current, ${data.totalCount} workflows validated`);
        } else {
          console.log(`🔄 Manual refresh: ${data.totalCount} workflows loaded`);
        }
        
        // Filter to only active workflows and sort by name
        const activeWorkflows = (data.workflows || [])
          .filter((workflow: any) => workflow.state === 'active')
          .sort((a: any, b: any) => {
            const nameA = removeEmojiFromWorkflowName(a.name || '');
            const nameB = removeEmojiFromWorkflowName(b.name || '');
            return nameA.localeCompare(nameB);
          });
        setWorkflows(activeWorkflows);
        console.log(`✅ Manual refresh: workflows updated with ${activeWorkflows.length} active workflows`);
        
        // Also refresh workflow runs data to get latest running status
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        // Fetch workflow runs
        const runsResponse = await fetch(`/api/workflow/${repoSlug}?date=${dateStr}&grouped=true&refresh=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        // Fetch overview data
        const overviewResponse = await fetch(`/api/workflow/${repoSlug}/overview?date=${dateStr}&refresh=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (runsResponse.ok && overviewResponse.ok) {
          const runsData = await runsResponse.json();
          const overviewDataResponse = await overviewResponse.json();
          
          setWorkflowRuns(runsData.workflowRuns || []);
          setGroupedWorkflowRuns(runsData.workflowRuns || []);
          setOverviewData(overviewDataResponse.overview || null);
          console.log(`📊 Manual refresh: Loaded ${runsData.workflowRuns?.length || 0} workflow runs for ${dateStr}`);
        }
        
        // Also refresh yesterday's runs for health comparison
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        
        const yesterdayResponse = await fetch(`/api/workflow/${repoSlug}?date=${yesterdayStr}&grouped=true&refresh=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (yesterdayResponse.ok) {
          const yesterdayData = await yesterdayResponse.json();
          setYesterdayWorkflowRuns(yesterdayData.workflowRuns || []);
          console.log(`📊 Manual refresh: Loaded ${yesterdayData.workflowRuns?.length || 0} yesterday's workflow runs for ${yesterdayStr}`);
        }
        
        console.log(`✅ Manual refresh complete: workflows and runs refreshed`);
      } else {
        console.error('Failed to refresh workflows');
      }
    } catch (error) {
      console.error('Error refreshing workflows:', error);
    } finally {
      setIsLoadingWorkflows(false);
      setIsLoadingRuns(false);
    }
  }, [repoSlug, selectedDate]);

  // Get workflow run data for a specific workflow (from today's runs for cards)
  const getWorkflowRunData = useCallback((workflowId: number): WorkflowRun | null => {
    return workflowRuns.find(run => run.workflow_id === workflowId) || null;
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

  // Helper function to classify workflow health status with proper yesterday comparison
  const classifyWorkflowHealth = useCallback((workflowId: number): 'consistent' | 'improved' | 'regressed' | 'still_failing' | 'no_runs_today' => {
    // Check if there's a currently running workflow from today's runs
    const currentlyRunning = workflowRuns.find(run => 
      run.workflow_id === workflowId && 
      (run.status === 'in_progress' || run.status === 'queued')
    );
    
    const todayRuns = workflowRuns.filter(run => run.workflow_id === workflowId);
    
    // If currently running, don't show historical health status - just show no historical data
    if (currentlyRunning) {
      return todayRuns.length === 0 ? 'no_runs_today' : 'consistent';
    }
    
    if (todayRuns.length === 0) {
      return 'no_runs_today'; // No runs today, show as no runs rather than failing
    }
    
    // Check if all runs today were successful
    const allSuccessfulToday = todayRuns.every(run => run.conclusion === 'success');
    const allFailedToday = todayRuns.every(run => run.conclusion === 'failure');
    
    // Get yesterday's last run result
    const yesterdayLastResult = getLastRunResult(workflowId, yesterdayWorkflowRuns);
    
    if (allSuccessfulToday) {
      // All runs today were successful
      if (yesterdayLastResult === 'failure') {
        return 'improved'; // Was failing yesterday, now all passing
      } else {
        return 'consistent'; // Was passing yesterday, still passing
      }
    } else if (allFailedToday) {
      // All runs today failed
      if (yesterdayLastResult === 'success') {
        return 'regressed'; // Was passing yesterday, now all failing
      } else {
        return 'still_failing'; // Was failing yesterday, still failing
      }
    } else {
      // Mixed results today - need to compare with yesterday's last result
      const todayLastResult = getLastRunResult(workflowId, todayRuns);
      
      if (yesterdayLastResult === null) {
        // No yesterday data, use majority rule as fallback
        const successCount = todayRuns.filter(run => run.conclusion === 'success').length;
        const failureCount = todayRuns.filter(run => run.conclusion === 'failure').length;
        return successCount > failureCount ? 'improved' : 'regressed';
      }
      
      if (yesterdayLastResult === 'failure' && todayLastResult === 'success') {
        return 'improved'; // Was failing yesterday, last run today passed
      } else if (yesterdayLastResult === 'success' && todayLastResult === 'failure') {
        return 'regressed'; // Was passing yesterday, last run today failed
      } else {
        // Same result as yesterday - determine based on majority
        const successCount = todayRuns.filter(run => run.conclusion === 'success').length;
        const failureCount = todayRuns.filter(run => run.conclusion === 'failure').length;
        
        if (yesterdayLastResult === 'success') {
          return successCount > failureCount ? 'consistent' : 'regressed';
        } else {
          return successCount > failureCount ? 'improved' : 'still_failing';
        }
      }
    }
  }, [workflowRuns, yesterdayWorkflowRuns, getLastRunResult]);

  // Helper function to get workflow health metrics (simplified for now)
  const getWorkflowHealthMetrics = useCallback((workflowId: number) => {
    const healthStatus = classifyWorkflowHealth(workflowId);
    const todayRuns = workflowRuns.filter(run => run.workflow_id === workflowId);
    
    return {
      status: healthStatus,
      totalRuns: todayRuns.length,
      successfulRuns: todayRuns.filter(run => run.conclusion === 'success').length,
      failedRuns: todayRuns.filter(run => run.conclusion === 'failure').length
    };
  }, [workflowRuns, classifyWorkflowHealth]);

  // Helper function to calculate health metrics from workflow health data
  const calculateHealthMetrics = useCallback(() => {
    // Count workflows by health status (all workflows are active now)
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

  // Format repository display name - use the same logic as the repo card
  const repoDisplayName = addedRepoPath ? formatRepoDisplayName(addedRepoPath) : formatRepoDisplayName(repoSlug);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{repoDisplayName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
            disabled={isLoadingWorkflows}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingWorkflows ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled
          >
            <BarChart3 className="h-4 w-4" />
            Report
          </Button>
          <Button
            variant={isSelectedDateToday ? "default" : "outline"}
            size="sm"
            onClick={handleSetToday}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Today
          </Button>
          <DatePicker
            date={selectedDate}
            onDateChange={(date) => {
              console.log('DatePicker onDateChange called with:', date);
              if (date) {
                console.log('Setting selected date to:', date);
                setSelectedDate(date);
              }
            }}
            placeholder="Select Date"
          />
        </div>
      </div>

      {/* Daily Metrics */}
      {isLoadingWorkflows || isLoadingRuns ? (
        // Daily Metrics Skeleton
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pass/Fail Rate Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Pass/Fail Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-32 w-32 bg-muted rounded-full animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Health Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Workflow Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Runs by hour Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Runs by hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      ) : !overviewData ? (
        // Loading state while waiting for API data
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-36 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (() => {
        const healthMetrics = calculateHealthMetrics();
        
        return (
          <>
            <DailyMetrics
              successRate={overviewData.successRate || 0}
              passRate={overviewData.passRate || 0}
              passedRuns={overviewData.passedRuns || 0}
              failedRuns={overviewData.failedRuns || 0}
              completedRuns={overviewData.completedRuns || 0}
              totalRuntime={overviewData.totalRuntime || 0}
              didntRunCount={overviewData.didntRunCount || 0}
              activeWorkflows={workflows.length}
              consistentCount={healthMetrics.consistentCount}
              improvedCount={healthMetrics.improvedCount}
              regressedCount={healthMetrics.regressedCount}
              stillFailingCount={healthMetrics.stillFailingCount}
              avgRunsPerHour={overviewData.avgRunsPerHour || 0}
              minRunsPerHour={overviewData.minRunsPerHour || 0}
              maxRunsPerHour={overviewData.maxRunsPerHour || 0}
              runsByHour={overviewData.runsByHour || []}
              selectedDate={selectedDate}
            />
            

          </>
        );
      })()}



      {/* Show workflows or loading skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Workflows
          </h2>
        </div>
        {/* Active Workflows */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {isLoadingWorkflows || isLoadingRuns ? (
            // Show skeleton cards for active workflows (6 cards)
            Array.from({ length: 6 }).map((_, index) => (
              <WorkflowCardSkeleton key={index} />
            ))
          ) : (
            workflows
              .map((workflow: any) => {
                const runData = getWorkflowRunData(workflow.id);
                const healthData = getWorkflowHealthMetrics(workflow.id);
                
                // Create a placeholder run object for workflows without run data
                const displayRun: WorkflowRun = runData || {
                  id: 0,
                  name: workflow.name,
                  workflow_id: workflow.id,
                  path: workflow.path,
                  conclusion: null,
                  status: 'no_runs',
                  html_url: '',
                  run_started_at: '',
                  updated_at: ''
                };
                
                return (
                  <WorkflowCard
                    key={workflow.id}
                    run={displayRun}
                    repoSlug={repoSlug}
                    healthStatus={healthData.status}
                    healthMetrics={healthData}
                  />
                );
              })
          )}
        </div>

      </div>
    </div>
  );
} 