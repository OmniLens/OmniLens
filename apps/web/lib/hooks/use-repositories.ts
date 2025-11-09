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
}

export interface RepositoryWithMetrics extends Repository {
  hasWorkflows: boolean;
  metrics: {
    totalWorkflows: number;
    passedRuns: number;
    failedRuns: number;
    inProgressRuns: number;
    successRate: number;
    hasActivity: boolean;
  };
}

// Fetch basic repository list
export function useRepositories() {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: async (): Promise<Repository[]> => {
      const response = await fetch('/api/repo', { 
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      
      const data = await response.json();
      return data.repositories || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - repos don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

// Check if repository has workflows
export function useRepositoryWorkflows(slug: string) {
  return useQuery({
    queryKey: ['repository-workflows', slug],
    queryFn: async () => {
      const response = await fetch(`/api/workflow/${slug}/exists`, { 
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to check workflows for ${slug}`);
      }
      
      return response.json();
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes - workflow existence rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
}

// Fetch workflow metrics for a specific date
export function useRepositoryMetrics(slug: string, date: string) {
  return useQuery({
    queryKey: ['repository-metrics', slug, date],
    queryFn: async () => {
      const response = await fetch(`/api/workflow/${slug}?date=${date}`, { 
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics for ${slug} on ${date}`);
      }
      
      return response.json();
    },
    enabled: !!slug && !!date,
    staleTime: (() => {
      // Historical data never changes, so cache indefinitely
      const queryDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // If the date is before today, cache indefinitely
      if (queryDate < today) {
        return Infinity;
      }
      
      // Current day data is fresh for 5 minutes
      return 5 * 60 * 1000;
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
