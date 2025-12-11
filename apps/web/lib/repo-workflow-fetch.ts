import { makeGitHubRequest } from './github-auth';
import { getWorkflowRunsForDate } from './github';
import { saveWorkflows } from './db-storage';

interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
}

interface GitHubWorkflowRun {
  run_started_at: string;
  status: string;
  conclusion: string | null;
}

export interface WorkflowData {
  workflows: Array<{
    id: number;
    name: string;
    path: string;
    state: string;
  }>;
  todayMetrics: {
    totalWorkflows: number;
    passedRuns: number;
    failedRuns: number;
    inProgressRuns: number;
    successRate: number;
  };
}

/**
 * Fetches workflows and today's metrics for a newly added repository
 * This function runs asynchronously and doesn't block the add repository response
 */
export async function fetchWorkflowDataForNewRepo(
  repoPath: string,
  userId: string,
  slug: string
): Promise<WorkflowData | null> {
  try {
    const [owner, repoName] = repoPath.split('/');
    if (!owner || !repoName) {
      console.error(`Invalid repository path format: ${repoPath}`);
      return null;
    }

    // Get repository info to find the default branch
    const repoResponse = await makeGitHubRequest(
      userId,
      `https://api.github.com/repos/${owner}/${repoName}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OmniLens-Dashboard'
        }
      }
    );

    if (!repoResponse.ok) {
      console.error(`Failed to fetch repository info for ${repoPath}: ${repoResponse.status}`);
      return null;
    }

    // Fetch workflows from GitHub
    const workflowsResponse = await makeGitHubRequest(
      userId,
      `https://api.github.com/repos/${owner}/${repoName}/actions/workflows`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OmniLens-Dashboard'
        }
      }
    );

    if (!workflowsResponse.ok) {
      console.error(`Failed to fetch workflows for ${repoPath}: ${workflowsResponse.status}`);
      return null;
    }

    const workflowsData = await workflowsResponse.json();
    const activeWorkflows = workflowsData.workflows.filter((w: GitHubWorkflow) => w.state === 'active');

    // Save workflows to database
    if (activeWorkflows.length > 0) {
      await saveWorkflows(slug, activeWorkflows, userId);
    }

    // Fetch today's workflow runs from ALL branches (no branch filtering)
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);
    const allRuns = await getWorkflowRunsForDate(todayDate, slug, userId);

    // For metrics, only count runs that actually STARTED today (not just currently running)
    const todayStart = new Date(todayStr + 'T00:00:00Z');
    const todayEnd = new Date(todayStr + 'T23:59:59Z');
    
    const runs = allRuns.filter((run: GitHubWorkflowRun) => {
      const runStartTime = new Date(run.run_started_at);
      return runStartTime >= todayStart && runStartTime <= todayEnd;
    });

    const completedRuns = runs.filter((run: GitHubWorkflowRun) => run.status === 'completed').length;
    const inProgressRuns = runs.filter((run: GitHubWorkflowRun) => run.status === 'in_progress' || run.status === 'queued').length;
    const passedRuns = runs.filter((run: GitHubWorkflowRun) => run.conclusion === 'success').length;
    const failedRuns = runs.filter((run: GitHubWorkflowRun) => run.conclusion === 'failure').length;

    const todayMetrics = {
      totalWorkflows: activeWorkflows.length,
      passedRuns,
      failedRuns,
      inProgressRuns,
      successRate: completedRuns > 0 ? Math.round((passedRuns / completedRuns) * 100) : 0
    };

    return {
      workflows: activeWorkflows,
      todayMetrics
    };

  } catch (error) {
    console.error(`Error fetching workflow data for ${repoPath}:`, error);
    return null;
  }
}
