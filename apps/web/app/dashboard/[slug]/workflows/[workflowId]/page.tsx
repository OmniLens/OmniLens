"use client";

// External library imports
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronRight, ChevronDown, Github, CheckCircle, TrendingUp, TrendingDown, AlertTriangle, Eye } from "lucide-react";
import { startOfMonth, endOfMonth, isSameMonth } from "date-fns";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Component imports (same layout as overview; right column uses Health instead of runner bar)
import { Activity, Clock, Timer } from "lucide-react";
import WorkflowHealthStats, { type StatConfig } from "@/components/WorkflowHealthStats";
import WorkflowRunsHistory from "@/components/WorkflowRunsHistory";
import MonthSelector from "@/components/MonthSelector";

// Utility imports
import { formatDurationSeconds } from "@/lib/utils";

// Hook imports
import { useSession } from "@/lib/auth-client";
import { useWorkflowsForRepo, type WorkflowRun } from "@/lib/hooks/use-workflows";
import { useRepositoryWorkflows, useMonthState } from "@/lib/hooks/use-repository-dashboard";

// ============================================================================
// Helper Functions
// ============================================================================

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
 * Uses local time to match WorkflowRunsHistory component
 */
function formatDateToDay(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

/**
 * Check if a date falls within a given month
 * @param date - Date to check
 * @param month - Month to check against (first day of the month)
 * @returns true if date is in the same month and year
 */
function isDateInMonth(date: Date, month: Date): boolean {
  return isSameMonth(date, month);
}

/**
 * Get the start of a month (first day at 00:00:00)
 * @param date - Date to get month start for
 * @returns First day of the month
 */
function getMonthStart(date: Date): Date {
  return startOfMonth(date);
}

/**
 * Get the end of a month (last day at 23:59:59)
 * @param date - Date to get month end for
 * @returns Last day of the month
 */
function getMonthEnd(date: Date): Date {
  return endOfMonth(date);
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

  // Track selected month for Recent Runs filtering (synced with URL using nuqs)
  const { selectedMonth, setSelectedMonth } = useMonthState();

  // Fetch workflow metrics and runs
  const { 
    data, 
    isLoading, 
    error 
  } = useWorkflowsForRepo(repoSlug, workflowId);

  // Fetch all workflows for the repository (for workflow switcher)
  const { 
    data: workflows = [], 
    isLoading: isLoadingWorkflows 
  } = useRepositoryWorkflows(repoSlug);

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

  // Today's date key (YYYY-MM-DD) for filtering current-day runs
  // Uses local time to match WorkflowRunsHistory component
  const todayKey = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Calculate yesterday's date key for filtering runs
  const yesterdayKey = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Derive yesterday's workflow runs from cached data instead of separate API call
  const yesterdayRuns = useMemo(() => {
    return selectedWorkflowRuns.filter(
      (run) => formatDateToDay(run.run_started_at) === yesterdayKey
    );
  }, [selectedWorkflowRuns, yesterdayKey]);

  // Runs for today only (for Current day status card)
  const todayRuns = useMemo(() => {
    return selectedWorkflowRuns.filter(
      (run) => formatDateToDay(run.run_started_at) === todayKey
    );
  }, [selectedWorkflowRuns, todayKey]);

  // Most recent run overall (for "Open in GitHub" and "Last run" line)
  const lastRun = useMemo(() => {
    if (selectedWorkflowRuns.length === 0) return null;
    const sorted = [...selectedWorkflowRuns].sort(
      (a, b) =>
        new Date(b.run_started_at).getTime() -
        new Date(a.run_started_at).getTime()
    );
    return sorted[0] ?? null;
  }, [selectedWorkflowRuns]);

  // Group workflow runs by day for the Recent Runs section (filtered by selected month)
  const runsByDay = useMemo(() => {
    const grouped = new Map<string, WorkflowRun[]>();

    // Filter runs by selected month
    // Use isSameMonth to check if run date is in the selected month
    const selectedMonthYear = selectedMonth.getFullYear();
    const selectedMonthIndex = selectedMonth.getMonth();

    selectedWorkflowRuns.forEach((run) => {
      const runDate = new Date(run.run_started_at);
      const runYear = runDate.getFullYear();
      const runMonth = runDate.getMonth();
      
      // Check if run falls within the selected month (same year and month)
      if (runYear === selectedMonthYear && runMonth === selectedMonthIndex) {
        const dayKey = formatDateToDay(run.run_started_at);
        if (!grouped.has(dayKey)) {
          grouped.set(dayKey, []);
        }
        grouped.get(dayKey)!.push(run);
      }
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
  }, [selectedWorkflowRuns, selectedMonth]);

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

  // Current day status (Passed / Failed / Running / No runs today)
  const todayStatus = useMemo(() => {
    if (todayRuns.length === 0) {
      return { status: 'success' as const, label: 'No runs today' };
    }
    const sorted = [...todayRuns].sort(
      (a, b) =>
        new Date(b.run_started_at).getTime() -
        new Date(a.run_started_at).getTime()
    );
    return getDayStatus(sorted);
  }, [todayRuns]);

  /**
   * Get the last run result (success or failure) for today's runs
   * Used for comparing today's results with yesterday's results
   */
  const getLastRunResult = useCallback((runs: WorkflowRun[]): 'success' | 'failure' | null => {
    if (runs.length === 0) return null;
    
    // Sort by run_started_at descending and get the most recent
    const sortedRuns = runs.sort((a, b) => 
      new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
    );
    
    const lastRun = sortedRuns[0];
    return lastRun.conclusion === 'success' ? 'success' : 'failure';
  }, []);

  /**
   * Get the last available run result (success or failure) from all historical runs
   * Excludes today's runs to get the most recent historical run
   * @returns 'success', 'failure', or null if no runs found
   */
  const getLastAvailableRunResult = useCallback((): 'success' | 'failure' | null => {
    // Filter out today's runs and get all historical runs
    const historicalRuns = selectedWorkflowRuns.filter(run => {
      const runDateKey = formatDateToDay(run.run_started_at);
      return runDateKey !== todayKey;
    });
    
    if (historicalRuns.length === 0) return null;
    
    // Sort by run_started_at descending and get the most recent
    const sortedRuns = historicalRuns.sort((a, b) => 
      new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
    );
    
    const lastRun = sortedRuns[0];
    return lastRun.conclusion === 'success' ? 'success' : 'failure';
  }, [selectedWorkflowRuns, todayKey]);

  /**
   * Classify workflow health status by comparing today's runs with yesterday's
   * Determines if workflow is consistent, improved, regressed, still failing, or has no runs
   */
  const workflowHealthStatus = useMemo((): 'consistent' | 'improved' | 'regressed' | 'still_failing' | 'no_runs_today' => {
    // Check if there's a currently running workflow from today's runs
    const currentlyRunning = todayRuns.find(run => 
      run.status === 'in_progress' || run.status === 'queued'
    );
    
    // If currently running, don't show historical health status
    if (currentlyRunning) {
      return todayRuns.length === 0 ? 'no_runs_today' : 'consistent';
    }
    
    // If no runs today, use the last available run result to determine health status
    if (todayRuns.length === 0) {
      const lastAvailableResult = getLastAvailableRunResult();
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
    const allSuccessfulToday = todayRuns.every(run => run.conclusion === 'success');
    const allFailedToday = todayRuns.every(run => run.conclusion === 'failure');
    
    // Get yesterday's last run result
    const yesterdayLastResult = getLastRunResult(yesterdayRuns);
    
    // If no yesterday data, check historical runs
    let previousResult = yesterdayLastResult;
    if (previousResult === null) {
      previousResult = getLastAvailableRunResult();
    }
    
    if (allSuccessfulToday) {
      if (previousResult === 'failure') {
        return 'improved';
      } else {
        return 'consistent';
      }
    } else if (allFailedToday) {
      if (previousResult === 'success') {
        return 'regressed';
      } else {
        return 'still_failing';
      }
    } else {
      // Mixed results today - compare last run results
      const todayLastResult = getLastRunResult(todayRuns);
      
      // Compare last results
      if (previousResult === null) {
        // No historical data at all - use today's last result
        return todayLastResult === 'success' ? 'consistent' : 'regressed';
      }
      
      if (previousResult === 'success' && todayLastResult === 'success') {
        return 'consistent';
      } else if (previousResult === 'success' && todayLastResult === 'failure') {
        return 'regressed';
      } else if (previousResult === 'failure' && todayLastResult === 'failure') {
        return 'still_failing';
      } else if (previousResult === 'failure' && todayLastResult === 'success') {
        return 'improved';
      }
      
      // Fallback (should not reach here)
      return 'consistent';
    }
  }, [todayRuns, yesterdayRuns, getLastRunResult, getLastAvailableRunResult]);

  /**
   * Get health status icon component based on workflow health classification
   */
  const healthStatusIcon = useMemo(() => {
    switch (workflowHealthStatus) {
      case 'consistent':
        return CheckCircle;
      case 'improved':
        return TrendingUp;
      case 'regressed':
        return TrendingDown;
      case 'still_failing':
        return AlertTriangle;
      default:
        return CheckCircle;
    }
  }, [workflowHealthStatus]);

  /**
   * Get health status label based on workflow health classification
   */
  const getHealthStatusLabel = useCallback(() => {
    switch (workflowHealthStatus) {
      case 'consistent':
        return 'Consistent';
      case 'improved':
        return 'Improved';
      case 'regressed':
        return 'Regressed';
      case 'still_failing':
        return 'Still failing';
      case 'no_runs_today':
        return 'No runs today';
      default:
        return '—';
    }
  }, [workflowHealthStatus]);

  /**
   * Get health status icon background color class
   */
  const getHealthStatusIconBg = useCallback(() => {
    switch (workflowHealthStatus) {
      case 'consistent':
        return 'bg-green-500/15';
      case 'improved':
        return 'bg-blue-500/15';
      case 'regressed':
        return 'bg-orange-500/15';
      case 'still_failing':
        return 'bg-red-500/15';
      default:
        return 'bg-gray-500/15';
    }
  }, [workflowHealthStatus]);

  /**
   * Get health status icon color class
   */
  const getHealthStatusIconColor = useCallback(() => {
    switch (workflowHealthStatus) {
      case 'consistent':
        return 'text-green-600 dark:text-green-400';
      case 'improved':
        return 'text-blue-600 dark:text-blue-400';
      case 'regressed':
        return 'text-orange-600 dark:text-orange-400';
      case 'still_failing':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }, [workflowHealthStatus]);

  // Year-level health score
  const healthScore = selectedWorkflowMetrics?.passFailRate ?? 0;

  // Get health label from health score
  const getHealthLabel = useMemo(() => {
    if (healthScore >= 90) return 'Excellent';
    if (healthScore >= 70) return 'Good';
    if (healthScore >= 50) return 'Fair';
    return 'Poor';
  }, [healthScore]);

  /**
   * Get value color class for Health stat based on health label
   */
  const getHealthValueColor = useCallback(() => {
    const label = getHealthLabel;
    if (label === 'Excellent') return 'text-green-600 dark:text-green-400';
    if (label === 'Good') return 'text-green-600 dark:text-green-400';
    if (label === 'Fair') return 'text-yellow-600 dark:text-yellow-400';
    if (label === 'Poor') return 'text-red-600 dark:text-red-400';
    return '';
  }, [getHealthLabel]);

  /**
   * Get value color class for Latest Run stat based on status label
   */
  const getLatestRunValueColor = useCallback(() => {
    const label = todayStatus.label;
    if (label === 'Passed') return 'text-green-600 dark:text-green-400';
    if (label === 'Failed') return 'text-red-600 dark:text-red-400';
    if (label === 'Running') return 'text-blue-600 dark:text-blue-400';
    return '';
  }, [todayStatus.label]);

  /**
   * Get value color class for Status stat based on health status label
   */
  const getStatusValueColor = useCallback(() => {
    const label = getHealthStatusLabel();
    if (label === 'Consistent') return 'text-green-600 dark:text-green-400';
    if (label === 'Improved') return 'text-blue-600 dark:text-blue-400';
    if (label === 'Regressed') return 'text-orange-600 dark:text-orange-400';
    if (label === 'Still failing') return 'text-red-600 dark:text-red-400';
    return '';
  }, [getHealthStatusLabel]);

  /**
   * Get icon color class for Health stat (matches value color)
   */
  const getHealthIconColor = useCallback(() => {
    const label = getHealthLabel;
    if (label === 'Excellent') return 'text-green-600 dark:text-green-400';
    if (label === 'Good') return 'text-green-600 dark:text-green-400';
    if (label === 'Fair') return 'text-yellow-600 dark:text-yellow-400';
    if (label === 'Poor') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  }, [getHealthLabel]);

  /**
   * Get icon background color class for Health stat
   */
  const getHealthIconBg = useCallback(() => {
    const label = getHealthLabel;
    if (label === 'Excellent') return 'bg-green-500/15';
    if (label === 'Good') return 'bg-green-500/15';
    if (label === 'Fair') return 'bg-yellow-500/15';
    if (label === 'Poor') return 'bg-red-500/15';
    return 'bg-gray-500/15';
  }, [getHealthLabel]);

  /**
   * Get icon color class for Latest Run stat (matches value color)
   */
  const getLatestRunIconColor = useCallback(() => {
    const label = todayStatus.label;
    if (label === 'Passed') return 'text-green-600 dark:text-green-400';
    if (label === 'Failed') return 'text-red-600 dark:text-red-400';
    if (label === 'Running') return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  }, [todayStatus.label]);

  /**
   * Get icon background color class for Latest Run stat
   */
  const getLatestRunIconBg = useCallback(() => {
    const label = todayStatus.label;
    if (label === 'Passed') return 'bg-green-500/15';
    if (label === 'Failed') return 'bg-red-500/15';
    if (label === 'Running') return 'bg-blue-500/15';
    return 'bg-gray-500/15';
  }, [todayStatus.label]);

  // Format duration values
  const avgDurationValue = selectedWorkflowMetrics?.avgDuration
    ? formatDurationSeconds(selectedWorkflowMetrics.avgDuration)
    : "—";
  const totalDurationValue = selectedWorkflowMetrics?.durationSum
    ? formatDurationSeconds(selectedWorkflowMetrics.durationSum)
    : "—";

  // Daily view URL (dashboard summary with today's date)
  const dailyViewHref = `/dashboard/${repoSlug}?date=${todayKey}`;

  // Full year date range for "Runs This Year" heatmap (same as workflows overview page)
  const yearDateRange = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1);
    const endDate = new Date(today.getFullYear(), 11, 31);
    return { startDate, endDate };
  }, []);

  // Create stats array for top WorkflowHealthStats component (Runs Today, Average Duration, Total Duration)
  const topStats: StatConfig[] = useMemo(
    () => [
      {
        icon: Activity,
        iconBgClass: "bg-yellow-500/15",
        iconColorClass: "text-yellow-600 dark:text-yellow-400",
        title: "Runs Today",
        value: todayRuns.length,
      },
      {
        icon: Timer,
        iconBgClass: "bg-blue-500/15",
        iconColorClass: "text-blue-600 dark:text-blue-400",
        title: "Avg Duration",
        value: avgDurationValue,
      },
      {
        icon: Clock,
        iconBgClass: "bg-orange-500/15",
        iconColorClass: "text-orange-600 dark:text-orange-400",
        title: "Total Duration",
        value: totalDurationValue,
      },
    ],
    [todayRuns.length, avgDurationValue, totalDurationValue]
  );

  // Create stats array for bottom WorkflowHealthStats component (Health, Latest Run Status, Workflow Health Status)
  const todayStats: StatConfig[] = useMemo(
    () => [
      {
        icon: Activity,
        iconBgClass: getHealthIconBg(),
        iconColorClass: getHealthIconColor(),
        title: "Health",
        value: getHealthLabel,
        valueColorClass: getHealthValueColor(),
      },
      {
        icon: Clock,
        iconBgClass: getLatestRunIconBg(),
        iconColorClass: getLatestRunIconColor(),
        title: "Latest Run",
        value: todayStatus.label,
        valueColorClass: getLatestRunValueColor(),
      },
      {
        icon: healthStatusIcon,
        iconBgClass: getHealthStatusIconBg(),
        iconColorClass: getHealthStatusIconColor(),
        title: "Status",
        value: getHealthStatusLabel(),
        valueColorClass: getStatusValueColor(),
      },
    ],
    [todayStatus.label, getHealthLabel, healthStatusIcon, getHealthStatusLabel, getLatestRunValueColor, getHealthValueColor, getStatusValueColor, getHealthIconBg, getHealthIconColor, getLatestRunIconBg, getLatestRunIconColor, getHealthStatusIconBg, getHealthStatusIconColor]
  );

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
        {/* Header Section — Workflow name + actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">{selectedWorkflow.name}</h1>
          {workflows.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Switch workflow
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {workflows.map((workflow) => (
                  <DropdownMenuItem
                    key={workflow.id}
                    onClick={() => router.push(`/dashboard/${repoSlug}/workflows/${workflow.id}`)}
                    className={workflow.id === workflowId ? "bg-accent" : ""}
                  >
                    {workflow.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Same layout as workflows overview: Runs This Year heatmap (left) | 6 widgets (right). Right column uses h-full so it matches heatmap height and does not extend past it. */}
        {selectedWorkflowRuns.length > 0 && yearDateRange && (
          <div className="flex gap-6 w-full items-stretch">
            {/* Left: heatmap (shows workflow result per day) */}
            <div className="shrink-0">
              <WorkflowRunsHistory
                runs={selectedWorkflowRuns}
                startDate={yearDateRange.startDate}
                endDate={yearDateRange.endDate}
                mode="result"
              />
            </div>
            {/* Right: Two WorkflowHealthStats rows */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-4 w-full h-full min-h-0">
                {/* First row: Runs Today, Average Duration, Total Duration (one card) */}
                <WorkflowHealthStats stats={topStats} />
                {/* Second row: Health, Latest Run Status, Workflow Health Status (one card) */}
                <WorkflowHealthStats stats={todayStats} />
              </div>
            </div>
          </div>
        )}

        {/* Run History List — Recent Runs */}
        {selectedWorkflowRuns.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Runs</CardTitle>
                <MonthSelector
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  currentYear={new Date().getFullYear()}
                />
              </div>
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
                                ? 'success'
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
                          <div className="flex items-center gap-2 ml-auto">
                            {hasMultipleRuns && isExpanded && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/${repoSlug}`);
                                }}
                                title="View repository dashboard"
                                aria-label="View repository dashboard"
                                className="w-8 h-8 p-1.5 border rounded hover:bg-muted/50 transition-colors flex items-center justify-center flex-shrink-0"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                            )}
                            <ChevronRight 
                              className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </div>
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
                                        ? 'success'
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
