import { format, startOfDay, endOfDay } from "date-fns";

export interface WorkflowRun {
  id: number;
  name: string;
  workflow_id: number;
  workflow_name?: string; // Made optional since GitHub API doesn't provide this
  path?: string; // Added path field from GitHub API
  conclusion: string | null;
  status: string;
  html_url: string;
  run_started_at: string;
  updated_at: string;
  run_count?: number; // Number of times this workflow was run on this date
  all_runs?: Array<{
    id: number;
    conclusion: string | null;
    status: string;
    html_url: string;
    run_started_at: string;
  }>; // All runs for this workflow on this date
}

interface OverviewData {
  completedRuns: number;
  inProgressRuns: number;
  passedRuns: number;
  failedRuns: number;
  totalRuntime: number;
  didntRunCount: number;
  totalWorkflows: number;
  missingWorkflows: string[];
}

const API_BASE = "https://api.github.com";

// Helper function to get repository info from database
async function getRepoInfo(repoSlug: string) {
  const { getUserRepo } = await import('./db-storage');
  const repo = await getUserRepo(repoSlug);

  if (!repo) {
    throw new Error(`Repository not found: ${repoSlug}`);
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN environment variable");
  }

  return { token, repo: repo.repoPath };
}

// Helper function to get one card per workflow but collect all run data
// This shows one card per workflow (latest run) but the card displays total run count
// and clicking the count shows all individual runs
export function getLatestWorkflowRuns(workflowRuns: WorkflowRun[]): WorkflowRun[] {
  const latestRuns = new Map<string, WorkflowRun>();
  const duplicateCount = new Map<string, number>();
  const allRunsForWorkflow = new Map<string, Array<{
    id: number;
    conclusion: string | null;
    status: string;
    html_url: string;
    run_started_at: string;
  }>>();

  // Sort by run_started_at descending to get the most recent runs first
  const sortedRuns = workflowRuns.sort((a, b) =>
    new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
  );

  // Use workflow ID as the key (workflow names are not unique!)
  sortedRuns.forEach(run => {
    const workflowKey = run.workflow_id.toString();

    if (!latestRuns.has(workflowKey)) {
      latestRuns.set(workflowKey, run);
      duplicateCount.set(workflowKey, 1);
      allRunsForWorkflow.set(workflowKey, [{
        id: run.id,
        conclusion: run.conclusion,
        status: run.status,
        html_url: run.html_url,
        run_started_at: run.run_started_at
      }]);
    } else {
      // Count duplicates for the total run count
      duplicateCount.set(workflowKey, (duplicateCount.get(workflowKey) || 0) + 1);
      // Add this run to the all_runs collection
      const existingRuns = allRunsForWorkflow.get(workflowKey) || [];
      existingRuns.push({
        id: run.id,
        conclusion: run.conclusion,
        status: run.status,
        html_url: run.html_url,
        run_started_at: run.run_started_at
      });
      allRunsForWorkflow.set(workflowKey, existingRuns);
    }
  });

  // Add run count and all runs to each workflow run for the UI
  const result = Array.from(latestRuns.values()).map(run => {
    const workflowKey = run.workflow_id.toString();
    return {
      ...run,
      run_count: duplicateCount.get(workflowKey) || 1,
      all_runs: allRunsForWorkflow.get(workflowKey) || []
    };
  });

  return result;
}

// Get workflow runs for a specific date and repository (for daily metrics - returns all runs)
export async function getWorkflowRunsForDate(date: Date, repoSlug: string, branch?: string): Promise<WorkflowRun[]> {
  try {
    const { token, repo } = await getRepoInfo(repoSlug);

    // Format date to ISO string for GitHub API
    const dateStr = format(date, "yyyy-MM-dd");

    // Get workflow runs from midnight of the target date until now
    const startOfDay = `${dateStr}T00:00:00Z`;
    const now = new Date().toISOString();

    const startTime = startOfDay;
    const endTime = now;

    // Fetch all workflow runs for the date, handling pagination
    let allRuns: WorkflowRun[] = [];
    let page = 1;
    let hasMorePages = true;
    let pagesFetched = 0;

    while (hasMorePages) {
      // Use the correct time range: from midnight of target date until now
      const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : '';
      const res = await fetch(
        `${API_BASE}/repos/${repo}/actions/runs?created=${startTime}..${endTime}&per_page=100&page=${page}${branchParam}&_t=${Date.now()}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            // Add conditional request headers to reduce unnecessary data transfer
            'If-None-Match': '', // Will be populated if we have a cached ETag
          },
        }
      );

      // Handle 304 Not Modified response
      if (res.status === 304) {
        break; // No need to fetch more pages if data hasn't changed
      }

      if (!res.ok) {
        // Handle specific GitHub API errors gracefully
        if (res.status === 404) {
          return []; // Return empty array for repositories with no workflows
        }
        if (res.status === 403) {
          throw new Error(`GitHub API error: ${res.status} ${res.statusText} - Repository access denied`);
        }
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      const pageRuns = json.workflow_runs as WorkflowRun[];

      allRuns = allRuns.concat(pageRuns);
      pagesFetched++;

      // Check if we need to fetch more pages
      hasMorePages = pageRuns.length === 100; // If we got 100 results, there might be more
      page++;

      // Safety break to avoid infinite loops
      if (page > 10) {
        break;
      }
    }

    // Filter runs to include those that started on the target date OR are currently running (only for today)
    const targetDateStart = new Date(date);
    targetDateStart.setHours(0, 0, 0, 0);
    const targetDateEnd = new Date(date);
    targetDateEnd.setHours(23, 59, 59, 999);

    // Check if the target date is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isTargetDateToday = targetDateStart.getTime() === today.getTime();

    const filteredRuns = allRuns.filter(run => {
      const runStartTime = new Date(run.run_started_at);
      const startedOnTargetDate = runStartTime >= targetDateStart && runStartTime <= targetDateEnd;
      const isCurrentlyRunning = run.status === 'in_progress' || run.status === 'queued';

      // Include if it started on the target date OR if it's currently running (only when viewing today)
      return startedOnTargetDate || (isCurrentlyRunning && isTargetDateToday);
    });

    // For daily metrics, return ALL runs for the day, not just the latest per workflow
    return filteredRuns;

  } catch (error) {
    console.error("Error fetching workflow runs:", error);
    throw error;
  }
}

// Get workflow runs for a specific date and repository (for workflow cards - returns grouped data)
export async function getWorkflowRunsForDateGrouped(date: Date, repoSlug: string, branch?: string): Promise<WorkflowRun[]> {
  try {
    const { token, repo } = await getRepoInfo(repoSlug);

    // Format date to ISO string for GitHub API
    const dateStr = format(date, "yyyy-MM-dd");

    // Get workflow runs with timezone buffer (12 hours before and after target date)
    const targetDate = new Date(dateStr + "T00:00:00Z");
    const startTime = new Date(targetDate.getTime() - 12 * 60 * 60 * 1000).toISOString(); // 12 hours before
    const endTime = new Date(targetDate.getTime() + 36 * 60 * 60 * 1000).toISOString(); // 36 hours after (next day + 12 hours)

    // Debug logging
    console.log(`🔍 GitHub API Debug: Searching for runs between ${startTime} and ${endTime} for repo ${repo}`);

    // Fetch all workflow runs for the date, handling pagination
    let allRuns: WorkflowRun[] = [];
    let page = 1;
    let hasMorePages = true;
    let pagesFetched = 0;

    while (hasMorePages) {
      // Use the correct time range: from midnight of target date until now
      const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : '';
      const res = await fetch(
        `${API_BASE}/repos/${repo}/actions/runs?created=${startTime}..${endTime}&per_page=100&page=${page}${branchParam}&_t=${Date.now()}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            // Add conditional request headers to reduce unnecessary data transfer
            'If-None-Match': '', // Will be populated if we have a cached ETag
          },
        }
      );

      // Handle 304 Not Modified response
      if (res.status === 304) {
        break; // No need to fetch more pages if data hasn't changed
      }

      if (!res.ok) {
        // Handle specific GitHub API errors gracefully
        if (res.status === 404) {
          return []; // Return empty array for repositories with no workflows
        }
        if (res.status === 403) {
          throw new Error(`GitHub API error: ${res.status} ${res.statusText} - Repository access denied`);
        }
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      const pageRuns = json.workflow_runs as WorkflowRun[];

      allRuns = allRuns.concat(pageRuns);
      pagesFetched++;

      // Check if we need to fetch more pages
      hasMorePages = pageRuns.length === 100; // If we got 100 results, there might be more
      page++;

      // Safety break to avoid infinite loops
      if (page > 10) {
        break;
      }
    }

    // Filter runs to include those that started on the target date OR are currently running (only for today)
    const targetDateStart = new Date(date);
    targetDateStart.setHours(0, 0, 0, 0);
    const targetDateEnd = new Date(date);
    targetDateEnd.setHours(23, 59, 59, 999);

    // Check if the target date is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isTargetDateToday = targetDateStart.getTime() === today.getTime();

    const filteredRuns = allRuns.filter(run => {
      const runStartTime = new Date(run.run_started_at);
      const startedOnTargetDate = runStartTime >= targetDateStart && runStartTime <= targetDateEnd;
      const isCurrentlyRunning = run.status === 'in_progress' || run.status === 'queued';

      // Include if it started on the target date OR if it's currently running (only when viewing today)
      return startedOnTargetDate || (isCurrentlyRunning && isTargetDateToday);
    });

    // For workflow cards, group by workflow and collect all run data for the UI
    // This shows one card per workflow but includes run_count and all_runs data
    const latestRuns = getLatestWorkflowRuns(filteredRuns);

    return latestRuns;

  } catch (error) {
    console.error("Error fetching workflow runs:", error);
    throw error;
  }
}

// Calculate overview data from workflow runs
export function calculateOverviewData(workflowRuns: WorkflowRun[]): OverviewData {
  const completedRuns = workflowRuns.filter((run: WorkflowRun) => run.status === 'completed').length;
  const inProgressRuns = workflowRuns.filter((run: WorkflowRun) =>
    run.status === 'in_progress' || run.status === 'queued'
  ).length;
  const passedRuns = workflowRuns.filter((run: WorkflowRun) => run.conclusion === 'success').length;
  const failedRuns = workflowRuns.filter((run: WorkflowRun) => run.conclusion === 'failure').length;

  // Calculate total runtime (this is an approximation - GitHub doesn't provide exact runtime in the list API)
  const totalRuntime = workflowRuns.reduce((total: number, run: WorkflowRun) => {
    if (run.status === 'completed') {
      // Estimate runtime based on update time vs start time
      const start = new Date(run.run_started_at).getTime();
      const end = new Date(run.updated_at).getTime();
      return total + Math.floor((end - start) / 1000); // Convert to seconds
    }
    return total;
  }, 0);

  // Simple workflow metrics calculation
  const didntRunCount = 0;
  const totalWorkflows = workflowRuns.length;
  const missingWorkflows: string[] = [];

  return {
    completedRuns,
    inProgressRuns,
    passedRuns,
    failedRuns,
    totalRuntime,
    didntRunCount,
    totalWorkflows,
    missingWorkflows,
  };
}

// Get overview data for a specific date and repository
export async function getOverviewDataForDate(date: Date, repoSlug: string): Promise<OverviewData> {
  const workflowRuns = await getWorkflowRunsForDate(date, repoSlug);
  return calculateOverviewData(workflowRuns);
}

// Legacy functions for backward compatibility - now require repo parameter
export async function getTodayWorkflowRuns(repoSlug: string): Promise<WorkflowRun[]> {
  return getWorkflowRunsForDate(new Date(), repoSlug);
}

export async function getYesterdayWorkflowRuns(repoSlug: string): Promise<WorkflowRun[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getWorkflowRunsForDate(yesterday, repoSlug);
}

export async function getTodayOverviewData(repoSlug: string): Promise<OverviewData> {
  return getOverviewDataForDate(new Date(), repoSlug);
}

export async function getYesterdayOverviewData(repoSlug: string): Promise<OverviewData> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getOverviewDataForDate(yesterday, repoSlug);
} 