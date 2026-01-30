import { useQuery } from "@tanstack/react-query";

// ============================================================================
// Type Definitions
// ============================================================================

export type RuntimeOs = "Linux" | "macOS" | "Windows";

export interface UsageSummary {
  totalMinutes: number;
  totalJobRuns: number;
  totalJobs: number;
  totalHostedJobRuns: number;
  totalSelfHostedJobRuns: number;
  majorityRuntimeOs: RuntimeOs | null;
}

export interface UsageByWorkflowRow {
  workflowName: string;
  path: string;
  totalMinutes: number;
  workflowRuns: number;
  jobs: number;
  runnerType: "hosted" | "self-hosted" | "mixed";
  runtimeOs: string;
}

export interface UsageMetricsResponse {
  summary: UsageSummary;
  byWorkflow: UsageByWorkflowRow[];
  period: string;
  dateRange: { start: string; end: string };
}

export type UsagePeriod = "current_month" | "last_7_days" | "current_year";

export interface UseUsageMetricsOptions {
  period?: UsagePeriod;
  start?: string;
  end?: string;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetches usage metrics for a repository (hosted/self-hosted job runs, majority OS, etc.).
 * Use period (e.g. current_year for workflows page) or start/end for custom range.
 */
export function useUsageMetrics(repoSlug: string, options: UseUsageMetricsOptions = {}) {
  const { period = "current_month", start, end } = options;

  const queryKey = ["usage", repoSlug, period, start ?? "", end ?? ""];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<UsageMetricsResponse> => {
      const params = new URLSearchParams();
      if (start && end) {
        params.set("start", start);
        params.set("end", end);
      } else {
        params.set("period", period);
      }
      const url = `/api/usage/${encodeURIComponent(repoSlug)}?${params.toString()}`;
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to fetch usage metrics");
      }
      return response.json();
    },
    enabled: !!repoSlug,
  });
}
