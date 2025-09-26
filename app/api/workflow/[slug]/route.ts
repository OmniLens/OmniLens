import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserRepo, saveWorkflows } from '@/lib/db-storage';
import { getLatestWorkflowRuns, getWorkflowRunsForDate, getWorkflowRunsForDateGrouped } from '@/lib/github';
import { withAuth } from '@/lib/auth-middleware';
import { makeGitHubRequest } from '@/lib/github-auth';

// Zod schemas for validation
const slugSchema = z.string().min(1, 'Repository slug is required');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// GitHub API response types
interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'deleted';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface GitHubWorkflowsResponse {
  total_count: number;
  workflows: GitHubWorkflow[];
}

interface GitHubWorkflowRun {
  id: number;
  name: string;
  workflow_id: number;
  path?: string;
  conclusion: string | null;
  status: string;
  html_url: string;
  run_started_at: string;
  updated_at: string;
  run_count?: number;
}

interface GitHubWorkflowRunsResponse {
  total_count: number;
  workflow_runs: GitHubWorkflowRun[];
}

/**
 * @openapi
 * /api/workflow/{slug}:
 *   get:
 *     summary: Get workflows or workflow runs for a repository
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository slug
 *       - name: date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Date in YYYY-MM-DD format to get workflow runs for that date
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/WorkflowsResponse'
 *                 - $ref: '#/components/schemas/WorkflowRunsResponse'
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Repository not found
 *       500:
 *         description: Internal server error
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { slug: string } },
  authData
) => {
  try {
    // Validate the slug parameter
    const validatedSlug = slugSchema.parse(params.slug);
    
    // Check if the repository exists in our database
    const repo = await getUserRepo(validatedSlug);
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found in dashboard' },
        { status: 404 }
      );
    }
    
    // Check if this is a request for workflow runs (with date parameter)
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const grouped = searchParams.get('grouped') === 'true';
    
    if (date) {
      try {
        // Validate date parameter
        const validatedDate = dateSchema.parse(date);
        // Handle workflow runs request
        return await handleWorkflowRunsRequest(validatedSlug, repo, validatedDate, grouped, authData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid date format. Use YYYY-MM-DD format.' },
            { status: 400 }
          );
        }
        throw error;
      }
    }
    
    // Always fetch fresh workflows from GitHub first to ensure data integrity
    // Extract owner and repo name from the repository path
    const [owner, repoName] = repo.repoPath.split('/');
    if (!owner || !repoName) {
      return NextResponse.json(
        { error: 'Invalid repository path format' },
        { status: 400 }
      );
    }
    
    // Use user's GitHub token for API calls
    
    // First, get the repository info to find the default branch
    const repoResponse = await makeGitHubRequest(
      authData.user.id,
      `https://api.github.com/repos/${owner}/${repoName}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OmniLens-Dashboard'
        }
      }
    );
    
    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch repository information' },
        { status: 500 }
      );
    }
    
    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch;
    
    // Fetch ALL workflows (GitHub's state=active filter is broken)
    // Add cache-busting timestamp to force fresh data
    const githubResponse = await makeGitHubRequest(
      authData.user.id,
      `https://api.github.com/repos/${owner}/${repoName}/actions/workflows?_t=${Date.now()}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OmniLens-Dashboard',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
    
    if (!githubResponse.ok) {
      if (githubResponse.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found on GitHub' },
          { status: 404 }
        );
      } else if (githubResponse.status === 403) {
        return NextResponse.json(
          { error: 'Access denied to repository workflows' },
          { status: 403 }
        );
      } else {
        console.error('GitHub API error:', githubResponse.status, githubResponse.statusText);
        return NextResponse.json(
          { error: 'Failed to fetch workflows from GitHub' },
          { status: 500 }
        );
      }
    }
    
    const workflowsData: GitHubWorkflowsResponse = await githubResponse.json();
    
    // Filter to only active workflows (GitHub's state=active filter is broken)
    const activeWorkflows = workflowsData.workflows.filter(w => w.state === 'active');
    
    // Return ALL active workflows - don't filter by whether they have runs
    // This ensures consistency with metrics which are calculated from all workflows
    const workflows = activeWorkflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      path: workflow.path,
      state: workflow.state,
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at,
      deletedAt: workflow.deleted_at
    }));
    
    // Save workflows to database for home page display (but still return fresh data)
    try {
      await saveWorkflows(validatedSlug, workflows);
      console.log(`💾 [WORKFLOW API] Saved ${workflows.length} workflows to database for ${validatedSlug}`);
    } catch (error) {
      console.error('❌ [WORKFLOW API] Error saving workflows to database:', error);
      // Continue with response even if saving fails
    }
    
    console.log(`🚀 [WORKFLOW API] Returning ${workflows.length} fresh workflows from GitHub for ${validatedSlug}`);
    
    const response = {
      repository: {
        slug: validatedSlug,
        displayName: repo.displayName,
        repoPath: repo.repoPath
      },
      workflows: workflows,
      totalCount: workflows.length
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid repository slug', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Helper function to handle workflow runs requests
async function handleWorkflowRunsRequest(
  slug: string,
  repo: any,
  date: string,
  grouped: boolean = false,
  authData: any
) {
  try {
    
    // Get fresh workflows directly from GitHub API instead of internal API call
    // Extract owner and repo name from the repository path
    const [owner, repoName] = repo.repoPath.split('/');
    if (!owner || !repoName) {
      return NextResponse.json(
        { error: 'Invalid repository path format' },
        { status: 400 }
      );
    }
    
    // Fetch workflows directly from GitHub
    const githubResponse = await makeGitHubRequest(
      authData.user.id,
      `https://api.github.com/repos/${owner}/${repoName}/actions/workflows?_t=${Date.now()}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OmniLens-Dashboard',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
    
    if (!githubResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch workflows from GitHub' },
        { status: 500 }
      );
    }
    
    const workflowsData = await githubResponse.json();
    const activeWorkflows = workflowsData.workflows.filter((w: any) => w.state === 'active');
    const activeWorkflowIds = new Set(activeWorkflows.map((w: any) => w.id));
    
    const repoResponse = await makeGitHubRequest(
      authData.user.id,
      `https://api.github.com/repos/${owner}/${repoName}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OmniLens-Dashboard'
        }
      }
    );
    
    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch repository information' },
        { status: 500 }
      );
    }
    
    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch;
    
    // The getWorkflowRunsForDate function handles all GitHub API calls and error handling
    const dateObj = new Date(date);
    
    const allWorkflowRuns = grouped 
      ? await getWorkflowRunsForDateGrouped(dateObj, slug, authData.user.id, defaultBranch)
      : await getWorkflowRunsForDate(dateObj, slug, authData.user.id, defaultBranch);
    
    // Filter to only include runs from active workflows
    const workflowRuns = allWorkflowRuns.filter(run => activeWorkflowIds.has(run.workflow_id));
    
    // Calculate overview data
    const completedRuns = workflowRuns.filter(run => run.status === 'completed').length;
    const inProgressRuns = workflowRuns.filter(run => run.status === 'in_progress').length;
    const passedRuns = workflowRuns.filter(run => run.conclusion === 'success').length;
    const failedRuns = workflowRuns.filter(run => run.conclusion === 'failure').length;
    
    // Calculate total runtime in seconds (simplified - would need more detailed API calls for accurate runtime)
    const totalRuntime = workflowRuns.reduce((total, run) => {
      if (run.status === 'completed' && run.run_started_at && run.updated_at) {
        const start = new Date(run.run_started_at).getTime();
        const end = new Date(run.updated_at).getTime();
        return total + Math.floor((end - start) / 1000); // Convert milliseconds to seconds
      }
      return total;
    }, 0);
    
    // Calculate total active workflows and missing workflows
    const totalWorkflows = activeWorkflows.length;
    const workflowsWithRuns = new Set(workflowRuns.map(run => run.workflow_id));
    const missingWorkflows = activeWorkflows
      .filter((workflow: any) => !workflowsWithRuns.has(workflow.id))
      .map((workflow: any) => workflow.name);
    const didntRunCount = missingWorkflows.length;
    
    const overviewData = {
      completedRuns,
      inProgressRuns,
      passedRuns,
      failedRuns,
      totalRuntime,
      didntRunCount,
      totalWorkflows,
      missingWorkflows
    };
    
    const response = {
      workflowRuns,
      overviewData
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
