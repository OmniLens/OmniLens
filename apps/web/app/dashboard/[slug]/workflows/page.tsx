"use client";

// External library imports
import { useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { BarChart3 } from "lucide-react";

// Internal component imports
import { Card, CardContent } from "@/components/ui/card";

// Hook imports
import { useSession } from "@/lib/auth-client";
import { useRepositoryWorkflows } from "@/lib/hooks/use-repository-dashboard";
import { useWorkflowsForRepo, type WorkflowRun } from "@/lib/hooks/use-workflows";
import { useUsageMetrics } from "@/lib/hooks/use-usage-metrics";

// Component imports
import WorkflowRunsHistory from "@/components/WorkflowRunsHistory";
import WorkflowRunsHistoryMonth from "@/components/WorkflowRunsHistoryMonth";
import WorkflowsPageSkeleton from "@/components/WorkflowsPageSkeleton";
import YearlyWorkflowCards from "@/components/YearlyWorkflowCards";

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

        {/* Data loading - show skeleton while workflows/runs are loading */}
        {(isLoading || isLoadingWorkflows) && <WorkflowsPageSkeleton />}

        {/* Workflow Gallery */}
        {!isLoading && !isLoadingWorkflows && (
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
                {/* Yearly Workflow Cards - 6 different variants showing year-to-date data */}
                {!isLoading && !isLoadingWorkflows && data && data.allRuns !== undefined && (
                  <YearlyWorkflowCards
                    workflows={workflows}
                    groupedRuns={groupedWorkflowRuns}
                    repoSlug={repoSlug}
                  />
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
