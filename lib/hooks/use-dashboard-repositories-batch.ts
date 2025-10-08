import { useQuery } from "@tanstack/react-query";

export interface Repository {
  slug: string;
  repoPath: string;
  displayName: string;
  avatarUrl?: string;
  htmlUrl?: string;
  hasWorkflows?: boolean;
  metrics?: {
    totalWorkflows: number;
    passedRuns: number;
    failedRuns: number;
    inProgressRuns: number;
    successRate: number;
    hasActivity: boolean;
  } | null;
  hasError?: boolean;
  errorMessage?: string | null;
}

export interface DashboardData {
  repositories: Repository[];
  totalCount: number;
  loadedAt: string;
}

// New batch hook that loads all repository data in a single request
export function useDashboardRepositoriesBatch() {
  return useQuery({
    queryKey: ['dashboard-repositories-batch'],
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch('/api/repo/dashboard', {
        cache: 'no-store',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
