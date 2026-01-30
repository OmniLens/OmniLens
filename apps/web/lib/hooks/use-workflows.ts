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
 * Hook to fetch workflows and month-view metrics for a specific repository
 * Optionally filters by workflow ID to get runs for a specific workflow
 */
export function useWorkflowsForRepo(repoSlug: string, workflowId?: number) {
  return useQuery({
    queryKey: ['workflows', repoSlug, workflowId],
    queryFn: async (): Promise<WorkflowsResponse> => {
      const url = workflowId 
        ? `/api/workflows?slug=${encodeURIComponent(repoSlug)}&workflowId=${workflowId}`
        : `/api/workflows?slug=${encodeURIComponent(repoSlug)}`;
      
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
    enabled: !!repoSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
