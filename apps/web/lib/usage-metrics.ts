// Internal utility imports
import {
  getWorkflowRunsForDateRange,
  getJobsForRun,
  type WorkflowJob,
} from "@/lib/github";

// ============================================================================
// Type Definitions
// ============================================================================

export type RuntimeOs = "Linux" | "macOS" | "Windows";

export interface UsageSummary {
  totalMinutes: number;
  totalJobRuns: number;
  totalJobs: number;
  /** Number of distinct workflows that used hosted runners (for long widget: "one runner per workflow") */
  totalHostedJobRuns: number;
  /** Number of distinct workflows that used self-hosted runners (for long widget) */
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

export interface UsageMetricsResult {
  summary: UsageSummary;
  byWorkflow: UsageByWorkflowRow[];
}

/** Max workflows to consider (latest run per workflow); keeps job fetches bounded */
const WORKFLOW_CAP = 100;
/** Max concurrent GitHub API calls for jobs; keeps response time low without hammering the API */
const JOB_FETCH_CONCURRENCY = 10;
const MS_PER_MINUTE = 60_000;

// ============================================================================
// Helpers: derive runner type and OS from job labels
// ============================================================================

function isSelfHosted(labels: string[]): boolean {
  return labels.some((l) => l.toLowerCase() === "self-hosted");
}

function getRuntimeOsFromLabels(labels: string[]): RuntimeOs | null {
  const lower = labels.map((l) => l.toLowerCase());
  if (lower.some((l) => l.startsWith("ubuntu") || l === "linux")) return "Linux";
  if (lower.some((l) => l.startsWith("macos"))) return "macOS";
  if (lower.some((l) => l.startsWith("windows"))) return "Windows";
  return null;
}

function jobDurationMinutes(job: WorkflowJob): number {
  if (!job.started_at || !job.completed_at) return 0;
  const start = new Date(job.started_at).getTime();
  const end = new Date(job.completed_at).getTime();
  if (end <= start) return 0;
  return (end - start) / MS_PER_MINUTE;
}

// ============================================================================
// Aggregation
// ============================================================================

/**
 * Fetch usage metrics for a repository over a date range.
 * Uses only the latest run per workflow (one run per workflow) and its jobs to compute
 * hosted/self-hosted counts and majority OS. Keeps API calls minimal for yearly view.
 */
export async function getUsageMetrics(
  repoSlug: string,
  userId: string,
  startDate: Date,
  endDate: Date,
  options?: { workflowCap?: number }
): Promise<UsageMetricsResult> {
  const cap = options?.workflowCap ?? WORKFLOW_CAP;

  const runs = await getWorkflowRunsForDateRange(startDate, endDate, repoSlug, userId);

  // Keep only the latest run per workflow (by workflow_id) so we fetch jobs once per workflow
  const runsNewestFirst = [...runs].sort(
    (a, b) => new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
  );
  const latestByWorkflow = new Map<number, (typeof runs)[0]>();
  for (const run of runsNewestFirst) {
    if (!latestByWorkflow.has(run.workflow_id)) {
      latestByWorkflow.set(run.workflow_id, run);
    }
  }
  const runsToProcess = Array.from(latestByWorkflow.values()).slice(0, cap);

  // Fetch jobs only for those runs (one per workflow)
  const runAndJobs: Array<{ run: (typeof runsToProcess)[0]; jobs: Awaited<ReturnType<typeof getJobsForRun>> }> = [];
  for (let i = 0; i < runsToProcess.length; i += JOB_FETCH_CONCURRENCY) {
    const batch = runsToProcess.slice(i, i + JOB_FETCH_CONCURRENCY);
    const jobArrays = await Promise.all(
      batch.map((run) => getJobsForRun(repoSlug, run.id, userId))
    );
    batch.forEach((run, j) => runAndJobs.push({ run, jobs: jobArrays[j] ?? [] }));
  }

  let totalMinutes = 0;
  let totalJobs = 0;
  const osCounts: Record<RuntimeOs, number> = { Linux: 0, macOS: 0, Windows: 0 };

  // Per-workflow aggregation: key = workflow path or name
  const byWorkflow = new Map<
    string,
    {
      workflowName: string;
      path: string;
      totalMinutes: number;
      workflowRuns: number;
      jobs: number;
      hostedJobs: number;
      selfHostedJobs: number;
      osCounts: Record<RuntimeOs, number>;
    }
  >();

  for (const { run, jobs } of runAndJobs) {
    const workflowKey = run.path ?? run.name ?? `workflow-${run.workflow_id}`;
    const displayName = run.path?.replace(/\.github\/workflows\/(.+)@.+/, "$1") ?? run.name ?? workflowKey;

    if (!byWorkflow.has(workflowKey)) {
      byWorkflow.set(workflowKey, {
        workflowName: displayName,
        path: workflowKey,
        totalMinutes: 0,
        workflowRuns: 0,
        jobs: 0,
        hostedJobs: 0,
        selfHostedJobs: 0,
        osCounts: { Linux: 0, macOS: 0, Windows: 0 },
      });
    }
    const row = byWorkflow.get(workflowKey)!;

    row.workflowRuns += 1;

    for (const job of jobs) {
      totalJobs += 1;
      const mins = jobDurationMinutes(job);
      totalMinutes += mins;
      row.totalMinutes += mins;
      row.jobs += 1;

      const labels = job.labels ?? [];
      const selfHosted = isSelfHosted(labels);
      if (selfHosted) {
        row.selfHostedJobs += 1;
      } else {
        row.hostedJobs += 1;
      }

      const os = getRuntimeOsFromLabels(labels);
      if (os) {
        osCounts[os] += 1;
        row.osCounts[os] += 1;
      }
    }
  }

  const majorityRuntimeOs: RuntimeOs | null =
    Math.max(osCounts.Linux, osCounts.macOS, osCounts.Windows) > 0
      ? (["Linux", "macOS", "Windows"] as RuntimeOs[]).reduce((a, b) =>
          osCounts[a] >= osCounts[b] ? a : b
        )
      : null;

  const byWorkflowRows: UsageByWorkflowRow[] = Array.from(byWorkflow.values()).map((row) => {
    let runnerType: "hosted" | "self-hosted" | "mixed" = "hosted";
    if (row.selfHostedJobs > 0 && row.hostedJobs > 0) runnerType = "mixed";
    else if (row.selfHostedJobs > 0) runnerType = "self-hosted";

    const os =
      Math.max(row.osCounts.Linux, row.osCounts.macOS, row.osCounts.Windows) > 0
        ? (["Linux", "macOS", "Windows"] as RuntimeOs[]).reduce((a, b) =>
            row.osCounts[a] >= row.osCounts[b] ? a : b
          )
        : "—";
    return {
      workflowName: row.workflowName,
      path: row.path,
      totalMinutes: Math.round(row.totalMinutes * 10) / 10,
      workflowRuns: row.workflowRuns,
      jobs: row.jobs,
      runnerType,
      runtimeOs: os,
    };
  });

  // Count distinct workflows that used hosted vs self-hosted (one "runner" per workflow for the long widget)
  const workflowsUsingHosted = byWorkflowRows.filter((r) => r.runnerType === "hosted" || r.runnerType === "mixed").length;
  const workflowsUsingSelfHosted = byWorkflowRows.filter((r) => r.runnerType === "self-hosted" || r.runnerType === "mixed").length;

  return {
    summary: {
      totalMinutes: Math.round(totalMinutes * 10) / 10,
      totalJobRuns: runs.length,
      totalJobs,
      totalHostedJobRuns: workflowsUsingHosted,
      totalSelfHostedJobRuns: workflowsUsingSelfHosted,
      majorityRuntimeOs,
    },
    byWorkflow: byWorkflowRows.sort((a, b) => b.totalMinutes - a.totalMinutes),
  };
}
