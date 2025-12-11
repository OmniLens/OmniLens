import { useQuery } from "@tanstack/react-query";
import { useRepositories, type RepositoryWithMetrics } from "./use-repositories";

// Enhanced hook that combines repository data with metrics
export function useDashboardRepositories() {
  const { data: repositories = [], isLoading: isLoadingRepos, error: reposError } = useRepositories();

  // Get today's date for metrics
  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch all workflow existence checks in parallel
  const workflowExistenceQueries = useQuery({
    queryKey: ['workflow-existence', repositories.map(r => r.slug)],
    queryFn: async () => {
      if (repositories.length === 0) return [];
      
      const existenceChecks = await Promise.all(
        repositories.map(async (repo) => {
          try {
            const response = await fetch(`/api/workflow/${repo.slug}/exists`, { 
              cache: 'no-store',
              credentials: 'include'
            });
            if (response.ok) {
              const data = await response.json();
              return { slug: repo.slug, hasWorkflows: data.hasWorkflows, workflowCount: data.workflowCount };
            }
            return { slug: repo.slug, hasWorkflows: false, workflowCount: 0 };
          } catch (error) {
            console.error(`Error checking workflow existence for ${repo.slug}:`, error);
            return { slug: repo.slug, hasWorkflows: false, workflowCount: 0 };
          }
        })
      );
      return existenceChecks;
    },
    enabled: repositories.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Fetch metrics for repositories that have workflows
  const metricsQueries = useQuery({
    queryKey: ['repository-metrics', todayStr, workflowExistenceQueries.data?.filter(w => w.hasWorkflows).map(w => w.slug)],
    queryFn: async () => {
      const reposWithWorkflows = workflowExistenceQueries.data?.filter(w => w.hasWorkflows) || [];
      if (reposWithWorkflows.length === 0) return [];

      const metricsPromises = reposWithWorkflows.map(async ({ slug }) => {
        try {
          const response = await fetch(`/api/workflow/${slug}?date=${todayStr}`, { 
            cache: 'no-store',
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            const overviewData = data.overviewData;
            return {
              slug,
              metrics: {
                totalWorkflows: 0, // Will be filled from existence check
                passedRuns: overviewData.passedRuns || 0,
                failedRuns: overviewData.failedRuns || 0,
                inProgressRuns: overviewData.inProgressRuns || 0,
                successRate: overviewData.completedRuns > 0 
                  ? Math.round((overviewData.passedRuns / overviewData.completedRuns) * 100) 
                  : 0,
              }
            };
          }
          return { slug, metrics: null };
        } catch (error) {
          console.error(`Error fetching metrics for ${slug}:`, error);
          return { slug, metrics: null };
        }
      });

      return Promise.all(metricsPromises);
    },
    enabled: workflowExistenceQueries.data && workflowExistenceQueries.data.some(w => w.hasWorkflows),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Combine all data
  const enhancedRepositories: RepositoryWithMetrics[] = repositories.map(repo => {
    const existenceData = workflowExistenceQueries.data?.find(w => w.slug === repo.slug);
    const metricsData = metricsQueries.data?.find(m => m.slug === repo.slug);
    
    const hasWorkflows = existenceData?.hasWorkflows || false;
    const workflowCount = existenceData?.workflowCount || 0;
    
    let metrics = {
      totalWorkflows: workflowCount,
      passedRuns: 0,
      failedRuns: 0,
      inProgressRuns: 0,
      successRate: 0
    };

    if (hasWorkflows && metricsData?.metrics) {
      metrics = {
        ...metricsData.metrics,
        totalWorkflows: workflowCount
      };
    }

    return {
      ...repo,
      hasWorkflows,
      metrics
    };
  });

  return {
    repositories: enhancedRepositories,
    isLoading: isLoadingRepos || workflowExistenceQueries.isLoading || metricsQueries.isLoading,
    error: reposError || workflowExistenceQueries.error || metricsQueries.error,
    // Individual loading states for better UX
    isLoadingRepos,
    isLoadingWorkflows: workflowExistenceQueries.isLoading,
    isLoadingMetrics: metricsQueries.isLoading,
  };
}
