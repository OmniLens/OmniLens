// External library imports
import { NextRequest, NextResponse } from 'next/server';

// Internal utility imports
import { loadUserAddedRepos, type Repository } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';
import { makeGitHubRequest } from '@/lib/github-auth';
import { getWorkflowRunsForDate, type WorkflowRun } from '@/lib/github';

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
  created_at?: string;
  updated_at?: string;
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
// Route Configuration
// ============================================================================

export const dynamic = 'force-dynamic';

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/repo/dashboard
 * 
 * Batch endpoint that returns all user repositories with today's workflow metrics.
 * Processes repositories in parallel for better performance.
 * 
 * @openapi
 * /api/repo/dashboard:
 *   get:
 *     summary: Get dashboard data with workflow metrics
 *     description: Returns all user repositories with today's workflow metrics, processed in parallel
 *     tags:
 *       - Repositories
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 repositories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Repository with workflow metrics
 *                 totalCount:
 *                   type: number
 *                   description: Total number of repositories
 *                 loadedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when data was loaded
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Internal server error
 */
export const GET = withAuth(async (request: NextRequest, _context, authData) => {
  try {
    // Get today's date in YYYY-MM-DD format for filtering workflow runs
    const todayStr = new Date().toISOString().slice(0, 10);

    // Fetch all repositories for the authenticated user
    const userRepos = await loadUserAddedRepos(authData.user.id);

    // Early return if user has no repositories
    if (userRepos.length === 0) {
      return NextResponse.json({
        repositories: [],
        totalCount: 0
      });
    }

    // Process all repositories in parallel for better performance
    const repoPromises = userRepos.map(async (repo: Repository) => {
      try {
        // Quick check if workflows exist in database (avoids unnecessary GitHub API calls)
        const { getWorkflows } = await import('@/lib/db-storage');
        const savedWorkflows = await getWorkflows(repo.slug, authData.user.id);
        const hasWorkflows = savedWorkflows.length > 0;

        // Initialize default metrics
        let metrics = {
          totalWorkflows: 0,
          passedRuns: 0,
          failedRuns: 0,
          inProgressRuns: 0,
          successRate: 0,
          hasActivity: false
        };

        // Fetch today's metrics from GitHub if workflows exist
        if (hasWorkflows) {
          try {
            const [owner, repoName] = repo.repoPath.split('/');
            if (owner && repoName) {
              // Fetch active workflows from GitHub API (ensures latest data)
              const workflowsResponse = await makeGitHubRequest(
                authData.user.id,
                `https://api.github.com/repos/${owner}/${repoName}/actions/workflows`,
                { cache: 'no-store' }
              );

              if (workflowsResponse.ok) {
                const workflowsData: GitHubWorkflowsResponse = await workflowsResponse.json();
                // Filter to active workflows (GitHub's state=active query parameter is unreliable)
                const activeWorkflows = workflowsData.workflows.filter(
                  (w: GitHubWorkflow) => w.state === 'active'
                );

                // Fetch today's workflow runs from ALL branches (no branch filtering)
                const todayDate = new Date(todayStr);
                const allRuns = await getWorkflowRunsForDate(todayDate, repo.slug, authData.user.id);

                // Filter to runs that actually STARTED today (not just currently running)
                // This ensures accurate daily metrics
                const todayStart = new Date(todayStr + 'T00:00:00Z');
                const todayEnd = new Date(todayStr + 'T23:59:59Z');
                
                const runs = allRuns.filter((run: WorkflowRun) => {
                  const runStartTime = new Date(run.run_started_at);
                  return runStartTime >= todayStart && runStartTime <= todayEnd;
                });

                // Calculate metrics from filtered runs
                const completedRuns = runs.filter((run: WorkflowRun) => run.status === 'completed').length;
                const inProgressRuns = runs.filter((run: WorkflowRun) => 
                  run.status === 'in_progress' || run.status === 'queued'
                ).length;
                const passedRuns = runs.filter((run: WorkflowRun) => run.conclusion === 'success').length;
                const failedRuns = runs.filter((run: WorkflowRun) => run.conclusion === 'failure').length;

                // Calculate success rate and update metrics
                metrics = {
                  totalWorkflows: activeWorkflows.length,
                  passedRuns,
                  failedRuns,
                  inProgressRuns,
                  successRate: completedRuns > 0 ? Math.round((passedRuns / completedRuns) * 100) : 0,
                  hasActivity: completedRuns > 0 || inProgressRuns > 0
                };
              }
            }
          } catch (error) {
            // Log error but continue with default metrics (graceful degradation)
            console.error(`Error fetching metrics for ${repo.slug}:`, error);
          }
        }

        // Return repository data with metrics
        return {
          slug: repo.slug,
          repoPath: repo.repoPath,
          displayName: repo.displayName,
          avatarUrl: repo.avatarUrl,
          htmlUrl: repo.htmlUrl,
          visibility: repo.visibility || 'public',
          hasWorkflows,
          metrics,
          hasError: false,
          errorMessage: null
        };
      } catch (error) {
        // Handle individual repository processing errors gracefully
        // Return repository with error state but don't fail entire request
        console.error(`Error processing repository ${repo.slug}:`, error);
        return {
          slug: repo.slug,
          repoPath: repo.repoPath,
          displayName: repo.displayName,
          avatarUrl: repo.avatarUrl,
          htmlUrl: repo.htmlUrl,
          visibility: repo.visibility || 'public',
          hasWorkflows: false,
          metrics: {
            totalWorkflows: 0,
            passedRuns: 0,
            failedRuns: 0,
            inProgressRuns: 0,
            successRate: 0,
            hasActivity: false
          },
          hasError: true,
          errorMessage: 'Failed to load repository data'
        };
      }
    });

    // Wait for all repositories to be processed in parallel
    const repositories = await Promise.all(repoPromises);

    // Return successful response with all repository data
    return NextResponse.json({
      repositories,
      totalCount: repositories.length,
      loadedAt: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    // Handle top-level errors
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
});
