import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";

export interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
  event: string;
  status: string;
  conclusion: string | null;
  workflow_id: number;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_attempt: number;
  run_started_at: string;
  jobs_url: string;
  logs_url: string;
  check_suite_url: string;
  artifacts_url: string;
  cancel_url: string;
  rerun_url: string;
  workflow_url: string;
  head_commit: any;
  repository: any;
  head_repository: any;
}

export interface WorkflowOverview {
  totalWorkflows: number;
  totalRuns: number;
  completedRuns: number;
  passedRuns: number;
  failedRuns: number;
  inProgressRuns: number;
  successRate: number;
  passRate?: number;
  totalRuntime?: number;
  didntRunCount?: number;
  avgRunsPerHour?: number;
  minRunsPerHour?: number;
  maxRunsPerHour?: number;
  runsByHour?: Array<{ hour: number; passed: number; failed: number; total: number }>;
}

// Hook to manage date state with URL persistence
export function useDateState() {
  const [selectedDate, setSelectedDate] = useQueryState(
    'date',
    parseAsString.withDefault(new Date().toISOString().slice(0, 10))
  );

  return {
    selectedDate,
    setSelectedDate,
  };
}

// Fetch workflows for a repository
export function useRepositoryWorkflows(slug: string) {
  return useQuery({
    queryKey: ['repository-workflows', slug],
    queryFn: async (): Promise<Workflow[]> => {
      const response = await fetch(`/api/workflow/${slug}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows for ${slug}`);
      }
      
      const data = await response.json();
      return (data.workflows || []).sort((a: Workflow, b: Workflow) => {
        const nameA = a.name?.replace(/[^\w\s]/g, '') || '';
        const nameB = b.name?.replace(/[^\w\s]/g, '') || '';
        return nameA.localeCompare(nameB);
      });
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes - workflows don't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
}

// Fetch workflow runs for a specific date
export function useWorkflowRuns(slug: string, date: string) {
  return useQuery({
    queryKey: ['workflow-runs', slug, date],
    queryFn: async (): Promise<WorkflowRun[]> => {
      const response = await fetch(`/api/workflow/${slug}?date=${date}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow runs for ${slug} on ${date}`);
      }
      
      const data = await response.json();
      return data.workflowRuns || [];
    },
    enabled: !!slug && !!date,
    staleTime: (() => {
      // Historical data never changes
      const queryDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (queryDate < today) {
        return Infinity; // Cache indefinitely for historical data
      }
      
      // Current day data is fresh for 2 minutes
      return 2 * 60 * 1000;
    })(),
    gcTime: (() => {
      // Historical data stays in cache for 24 hours
      const queryDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (queryDate < today) {
        return 24 * 60 * 60 * 1000; // 24 hours
      }
      
      // Current day data cached for 1 hour
      return 60 * 60 * 1000;
    })(),
  });
}

// Fetch workflow overview data for a specific date
export function useWorkflowOverview(slug: string, date: string) {
  return useQuery({
    queryKey: ['workflow-overview', slug, date],
    queryFn: async (): Promise<WorkflowOverview> => {
      const response = await fetch(`/api/workflow/${slug}/overview?date=${date}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow overview for ${slug} on ${date}`);
      }
      
      const data = await response.json();
      return data.overview || {
        totalWorkflows: 0,
        totalRuns: 0,
        completedRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        inProgressRuns: 0,
        successRate: 0
      };
    },
    enabled: !!slug && !!date,
    staleTime: (() => {
      // Historical data never changes
      const queryDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (queryDate < today) {
        return Infinity; // Cache indefinitely for historical data
      }
      
      // Current day data is fresh for 2 minutes
      return 2 * 60 * 1000;
    })(),
    gcTime: (() => {
      // Historical data stays in cache for 24 hours
      const queryDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (queryDate < today) {
        return 24 * 60 * 60 * 1000; // 24 hours
      }
      
      // Current day data cached for 1 hour
      return 60 * 60 * 1000;
    })(),
  });
}

// Fetch yesterday's data for comparison
export function useYesterdayWorkflowRuns(slug: string, date: string) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  return useQuery({
    queryKey: ['workflow-runs', slug, yesterdayStr],
    queryFn: async (): Promise<WorkflowRun[]> => {
      const response = await fetch(`/api/workflow/${slug}?date=${yesterdayStr}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch yesterday's workflow runs for ${slug}`);
      }
      
      const data = await response.json();
      return data.workflowRuns || [];
    },
    enabled: !!slug && !!date,
    staleTime: Infinity, // Yesterday's data never changes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours cache
  });
}
