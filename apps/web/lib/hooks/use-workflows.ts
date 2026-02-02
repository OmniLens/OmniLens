import { useQuery } from "@tanstack/react-query";
import type { WorkflowRun } from "@/lib/github";

// ============================================================================
// Type Definitions
// ============================================================================

export interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  repoSlug: string;
  repoPath: string;
  repoDisplayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowMetrics {
  totalRuns: number;
  completedRuns: number;
  passedRuns: number;
  failedRuns: number;
  inProgressRuns: number;
  passFailRate: number;
  durationSum: number;
}

export interface SelectedWorkflowMetrics extends WorkflowMetrics {
  avgDuration: number;
}

// Re-export WorkflowRun for convenience
export type { WorkflowRun };

export interface WorkflowsResponse {
  workflows: Workflow[];
  metrics: WorkflowMetrics;
  selectedWorkflow: Workflow | null;
  selectedWorkflowRuns: WorkflowRun[];
  selectedWorkflowMetrics: SelectedWorkflowMetrics | null;
  allRuns?: WorkflowRun[]; // All runs for the month (when no workflow selected)
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch workflows and year-view metrics for a specific repository
 * Uses unified cache with select option to filter by workflow ID when provided
 * 
 * Best practice: Always fetches all runs, then uses `select` to filter client-side
 * This allows overview and summary pages to share the same cached data
 * 
 * @param repoSlug - Repository slug identifier
 * @param workflowId - Optional workflow ID to filter runs for a specific workflow
 * @returns WorkflowsResponse with filtered data when workflowId is provided
 */
export function useWorkflowsForRepo(repoSlug: string, workflowId?: number) {
  return useQuery({
    // Unified cache key - same for overview and summary pages
    queryKey: ['workflows-all-runs', repoSlug],
    queryFn: async (): Promise<WorkflowsResponse> => {
      // Always fetch all runs (no workflowId in URL)
      // The API always returns all runs for the year regardless of workflowId param
      const url = `/api/workflows?slug=${encodeURIComponent(repoSlug)}`;
      
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      
      return response.json();
    },
    // Use select option to filter by workflowId when provided
    // This runs on each render but is efficient for filtering operations
    select: (data: WorkflowsResponse): WorkflowsResponse => {
      if (workflowId !== undefined) {
        // Filter runs for the specific workflow
        const selectedWorkflowRuns = (data.allRuns || []).filter(
          (run) => run.workflow_id === workflowId
        );

        // Find the selected workflow
        const selectedWorkflow = data.workflows.find((w) => w.id === workflowId) || null;

        // Calculate metrics for selected workflow
        const totalRuns = selectedWorkflowRuns.length;
        const completedRuns = selectedWorkflowRuns.filter(
          (run) => run.status === 'completed'
        ).length;
        const passedRuns = selectedWorkflowRuns.filter(
          (run) => run.conclusion === 'success'
        ).length;
        const failedRuns = selectedWorkflowRuns.filter(
          (run) => run.conclusion === 'failure'
        ).length;
        const inProgressRuns = selectedWorkflowRuns.filter(
          (run) => run.status === 'in_progress' || run.status === 'queued'
        ).length;

        const passFailRate =
          completedRuns > 0 ? Math.round((passedRuns / completedRuns) * 100) : 0;

        // Calculate duration sum
        const durationSum = selectedWorkflowRuns.reduce((total, run) => {
          if (run.status === 'completed' && run.run_started_at && run.updated_at) {
            const start = new Date(run.run_started_at).getTime();
            const end = new Date(run.updated_at).getTime();
            return total + Math.floor((end - start) / 1000);
          }
          return total;
        }, 0);

        // Calculate average duration
        const avgDuration =
          completedRuns > 0
            ? Math.round(
                selectedWorkflowRuns.reduce((sum, run) => {
                  if (run.run_started_at && run.updated_at) {
                    const start = new Date(run.run_started_at).getTime();
                    const end = new Date(run.updated_at).getTime();
                    return sum + (end - start) / 1000; // seconds
                  }
                  return sum;
                }, 0) / completedRuns
              )
            : 0;

        const selectedWorkflowMetrics: SelectedWorkflowMetrics = {
          totalRuns,
          completedRuns,
          passedRuns,
          failedRuns,
          inProgressRuns,
          passFailRate,
          durationSum,
          avgDuration,
        };

        return {
          ...data,
          selectedWorkflow,
          selectedWorkflowRuns: selectedWorkflowRuns.slice(0, 100), // Limit to 100 most recent runs
          selectedWorkflowMetrics,
          // Don't include allRuns when filtering by workflowId
          allRuns: undefined,
        };
      }

      // Return all data when no workflowId is provided (overview page)
      return data;
    },
    enabled: !!repoSlug,
    staleTime: 15 * 60 * 1000, // 15 minutes - data is fresh for 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
