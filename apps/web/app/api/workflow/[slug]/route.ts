// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { getUserRepo, saveWorkflows, deleteWorkflows, type Repository } from '@/lib/db-storage';
import { 
  getWorkflowRunsForDate, 
  getWorkflowRunsForDateGrouped, 
  type WorkflowRun,
  calculateHourlyBreakdown,
  calculateHourlyStatistics,
  calculateMissingWorkflows
} from '@/lib/github';
import { withAuth } from '@/lib/auth-middleware';
import { makeGitHubRequest } from '@/lib/github-auth';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * GitHub workflow object from API response
 */
interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'deleted';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * GitHub workflows API response structure
 */
interface GitHubWorkflowsResponse {
  total_count: number;
  workflows: GitHubWorkflow[];
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Zod schema for repository slug parameter validation
 */
const slugSchema = z.string().min(1, 'Repository slug is required');

/**
 * Zod schema for date parameter validation (YYYY-MM-DD format)
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/workflow/[slug]
 * 
 * Gets workflows or workflow runs for a repository.
 * - Without date parameter: Returns list of active workflows (with 5-minute cache)
 * - With date parameter: Returns workflow runs for that date with overview metrics
 * 
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
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Repository not found
 *       500:
 *         description: Internal server error
 */
export const GET = withAuth(async (
  request: NextRequest,
  context,
  authData
) => {
  try {
    // Validate slug parameter
    const validatedSlug = slugSchema.parse(context.params.slug);
    
    // Check if the repository exists in our database for this user
    const repo = await getUserRepo(validatedSlug, authData.user.id);
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found in dashboard' },
        { status: 404 }
      );
    }
    
    // Check if this is a request for workflow runs (with date query parameter)
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const grouped = searchParams.get('grouped') === 'true';
    
    // Handle workflow runs request if date parameter is provided
    if (date) {
      try {
        // Validate date parameter
        const validatedDate = dateSchema.parse(date);
        // Delegate to helper function for workflow runs handling
        return await handleWorkflowRunsRequest(validatedSlug, repo, validatedDate, grouped, authData);
      } catch (error) {
        // Handle date validation errors
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid date format. Use YYYY-MM-DD format.' },
            { status: 400 }
          );
        }
        throw error;
      }
    }
    
    // Check if we have recent workflow data in database (5-minute cache)
    const { getWorkflows } = await import('@/lib/db-storage');
    const savedWorkflows = await getWorkflows(validatedSlug, authData.user.id);
    
    // Check if workflows were updated within the last 5 minutes
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const hasRecentWorkflows = savedWorkflows.length > 0 && 
      savedWorkflows.some((workflow) => 
        workflow.updatedAt && new Date(workflow.updatedAt) > fiveMinutesAgo
      );
    
    // Return cached workflows if recent data exists
    if (hasRecentWorkflows) {
      const workflows = savedWorkflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      }));
      
      const response = {
        repository: {
          slug: validatedSlug,
          displayName: repo.displayName,
          repoPath: repo.repoPath
        },
        workflows: workflows,
        totalCount: workflows.length
      };
      
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
          'X-Cache': 'HIT'
        }
      });
    }
    
    // Fetch fresh workflows from GitHub API
    
    // Extract owner and repo name from repository path
    const [owner, repoName] = repo.repoPath.split('/');
    if (!owner || !repoName) {
      return NextResponse.json(
        { error: 'Invalid repository path format' },
        { status: 400 }
      );
    }
    
    // Fetch repository info (for future use if needed)
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
    
    // Fetch ALL workflows from GitHub (GitHub's state=active filter is unreliable)
    const githubResponse = await makeGitHubRequest(
      authData.user.id,
      `https://api.github.com/repos/${owner}/${repoName}/actions/workflows`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OmniLens-Dashboard'
        }
      }
    );
    
    // Handle GitHub API errors
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
    
    // Parse workflows response and filter to active workflows only
    const workflowsData: GitHubWorkflowsResponse = await githubResponse.json();
    const activeWorkflows = workflowsData.workflows.filter(
      (w: GitHubWorkflow) => w.state === 'active'
    );
    
    // Transform GitHub workflows to our format
    // Return ALL active workflows (don't filter by whether they have runs)
    // This ensures consistency with metrics which are calculated from all workflows
    const workflows = activeWorkflows.map((workflow: GitHubWorkflow) => ({
      id: workflow.id,
      name: workflow.name,
      path: workflow.path,
      state: workflow.state,
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at,
      deletedAt: workflow.deleted_at
    }));
    
    // Save workflows to database for caching (best effort - don't fail if this fails)
    try {
      await saveWorkflows(validatedSlug, workflows, authData.user.id);
    } catch (error) {
      console.error('Error saving workflows to database:', error);
      // Continue with response even if saving fails
    }
    
    // Return fresh workflows from GitHub
    const response = {
      repository: {
        slug: validatedSlug,
        displayName: repo.displayName,
        repoPath: repo.repoPath
      },
      workflows: workflows,
      totalCount: workflows.length
    };
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-Cache': 'MISS'
      }
    });
    
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid repository slug', details: error.issues },
        { status: 400 }
      );
    }
    
    // Handle unexpected errors
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper function to handle workflow runs requests
 * 
 * @param slug - Repository slug
 * @param repo - Repository object from database
 * @param date - Date string in YYYY-MM-DD format
 * @param grouped - Whether to group workflow runs
 * @param authData - Authentication data
 * @returns Workflow runs response with overview data
 */
async function handleWorkflowRunsRequest(
  slug: string,
  repo: Repository,
  date: string,
  grouped: boolean = false,
  authData: { user: { id: string }; session: unknown }
) {
  try {
    // Extract owner and repo name from repository path
    const [owner, repoName] = repo.repoPath.split('/');
    if (!owner || !repoName) {
      return NextResponse.json(
        { error: 'Invalid repository path format' },
        { status: 400 }
      );
    }
    
    // Fetch active workflows directly from GitHub API (ensures latest data)
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
    
    // Parse workflows and filter to active workflows only
    const workflowsData: GitHubWorkflowsResponse = await githubResponse.json();
    const activeWorkflows = workflowsData.workflows.filter(
      (w: GitHubWorkflow) => w.state === 'active'
    );
    const activeWorkflowIds = new Set(activeWorkflows.map((w: GitHubWorkflow) => w.id));
    
    // Fetch repository info (for future use if needed)
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
    
    // Fetch workflow runs for the specified date from ALL branches (no branch filtering)
    const dateObj = new Date(date);
    const allWorkflowRuns = grouped 
      ? await getWorkflowRunsForDateGrouped(dateObj, slug, authData.user.id)
      : await getWorkflowRunsForDate(dateObj, slug, authData.user.id);
    
    // Filter to only include runs from active workflows
    const workflowRuns = allWorkflowRuns.filter((run: WorkflowRun) => 
      activeWorkflowIds.has(run.workflow_id)
    );
    
    // Calculate overview metrics from workflow runs
    const completedRuns = workflowRuns.filter((run: WorkflowRun) => run.status === 'completed').length;
    const inProgressRuns = workflowRuns.filter((run: WorkflowRun) => 
      run.status === 'in_progress' || run.status === 'queued'
    ).length;
    const passedRuns = workflowRuns.filter((run: WorkflowRun) => run.conclusion === 'success').length;
    const failedRuns = workflowRuns.filter((run: WorkflowRun) => run.conclusion === 'failure').length;
    
    // Calculate total runtime in seconds (simplified calculation)
    // Note: More accurate runtime would require detailed API calls per run
    const totalRuntime = workflowRuns.reduce((total, run: WorkflowRun) => {
      if (run.status === 'completed' && run.run_started_at && run.updated_at) {
        const start = new Date(run.run_started_at).getTime();
        const end = new Date(run.updated_at).getTime();
        return total + Math.floor((end - start) / 1000); // Convert milliseconds to seconds
      }
      return total;
    }, 0);
    
    // Calculate workflows that didn't run on the specified date
    const totalWorkflows = activeWorkflows.length;
    const missingWorkflows = calculateMissingWorkflows(activeWorkflows, workflowRuns);
    const didntRunCount = missingWorkflows.length;
    
    // Calculate hourly breakdown and statistics using utility functions
    const runsByHour = calculateHourlyBreakdown(workflowRuns);
    const hourlyStats = calculateHourlyStatistics(runsByHour);
    
    // Build overview data object with all calculated metrics
    const overviewData = {
      completedRuns,
      inProgressRuns,
      passedRuns,
      failedRuns,
      totalRuntime,
      didntRunCount,
      totalWorkflows,
      missingWorkflows,
      runsByHour,
      avgRunsPerHour: hourlyStats.avgRunsPerHour,
      minRunsPerHour: hourlyStats.minRunsPerHour,
      maxRunsPerHour: hourlyStats.maxRunsPerHour
    };
    
    // Return workflow runs and overview data
    const response = {
      workflowRuns,
      overviewData
    };
    
    return NextResponse.json(response);
    
  } catch (error: unknown) {
    // Handle unexpected errors
    console.error('Error fetching workflow runs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflow/[slug]
 * 
 * Updates/saves workflows for a repository to the database.
 * 
 * @openapi
 * /api/workflow/{slug}:
 *   put:
 *     summary: Save workflows for a repository
 *     description: Updates/saves workflows for a repository to the database
 *     tags:
 *       - Workflows
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository slug identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workflows
 *             properties:
 *               workflows:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - name
 *                     - path
 *                     - state
 *                   properties:
 *                     id:
 *                       type: number
 *                       description: GitHub workflow ID
 *                     name:
 *                       type: string
 *                       description: Workflow name
 *                     path:
 *                       type: string
 *                       description: Workflow file path
 *                     state:
 *                       type: string
 *                       description: Workflow state (active/deleted)
 *     responses:
 *       200:
 *         description: Workflows saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 workflows:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request - Invalid workflow data
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Repository not found
 *       500:
 *         description: Internal server error
 */
export const PUT = withAuth(async (
  request: NextRequest,
  context,
  authData
) => {
  try {
    // Validate slug parameter
    const validatedSlug = slugSchema.parse(context.params.slug);
    
    // Parse and validate request body
    const body = await request.json();
    const { workflows } = body;
    
    if (!Array.isArray(workflows)) {
      return NextResponse.json({ 
        error: 'Workflows must be an array' 
      }, { status: 400 });
    }
    
    // Validate workflow structure with Zod
    const workflowSchema = z.object({
      id: z.number(),
      name: z.string(),
      path: z.string(),
      state: z.string()
    });
    
    const validatedWorkflows = workflows.map(workflow => workflowSchema.parse(workflow));
    
    // Save workflows to database
    await saveWorkflows(validatedSlug, validatedWorkflows, authData.user.id);
    
    return NextResponse.json({
      success: true,
      message: `Successfully saved ${validatedWorkflows.length} workflows for ${validatedSlug}`,
      workflows: validatedWorkflows
    });
    
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json({ 
        error: 'Invalid workflow data',
        details: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400 });
    }
    
    // Handle unexpected errors
    console.error('Error saving workflows:', error);
    return NextResponse.json({ 
      error: 'Failed to save workflows' 
    }, { status: 500 });
  }
});

/**
 * DELETE /api/workflow/[slug]
 * 
 * Deletes all workflows for a repository from the database.
 * 
 * @openapi
 * /api/workflow/{slug}:
 *   delete:
 *     summary: Delete all workflows for a repository
 *     description: Deletes all workflows for a repository from the database
 *     tags:
 *       - Workflows
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository slug identifier
 *     responses:
 *       200:
 *         description: Workflows deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid slug format
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Repository not found
 *       500:
 *         description: Internal server error
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  context,
  authData
) => {
  try {
    // Validate slug parameter
    const validatedSlug = slugSchema.parse(context.params.slug);
    
    // Verify repository exists before attempting deletion
    const repo = await getUserRepo(validatedSlug, authData.user.id);
    if (!repo) {
      return NextResponse.json({ 
        error: 'Repository not found' 
      }, { status: 404 });
    }
    
    // Delete workflows from database
    await deleteWorkflows(validatedSlug, authData.user.id);
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted workflows for ${validatedSlug}`
    });
    
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json({ 
        error: 'Invalid repository slug',
        details: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400 });
    }
    
    // Handle unexpected errors
    console.error('Error deleting workflows:', error);
    return NextResponse.json({ 
      error: 'Failed to delete workflows' 
    }, { status: 500 });
  }
});
