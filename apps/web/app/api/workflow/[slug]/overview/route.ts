// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { getUserRepo } from '@/lib/db-storage';
import { 
  getWorkflowRunsForDate, 
  calculateOverviewData, 
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
// Validation Schemas
// ============================================================================

/**
 * Zod schema for repository slug parameter validation
 */
const slugSchema = z.string().min(1, 'Repository slug is required');

/**
 * Zod schema for date parameter validation
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional();

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/workflow/[slug]/overview
 * 
 * Get aggregated daily metrics for workflows in a repository.
 * 
 * @openapi
 * /api/workflow/{slug}/overview:
 *   get:
 *     summary: Get workflow overview metrics
 *     description: Get aggregated daily metrics for workflows in a repository, including hourly breakdown and statistics
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
 *       - name: date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Date in YYYY-MM-DD format (defaults to today)
 *     responses:
 *       200:
 *         description: Successfully retrieved overview metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 repository:
 *                   type: object
 *                   description: Repository information
 *                 overview:
 *                   type: object
 *                   description: Aggregated metrics and statistics
 *                 date:
 *                   type: string
 *                   format: date
 *                   description: Date for which metrics were calculated
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when overview was generated
 *       400:
 *         description: Bad request - Invalid slug or date format
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Repository not found in dashboard
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
    
    // Get date parameter from query string (defaults to today if not provided)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const date = dateParam ? dateSchema.parse(dateParam) : new Date().toISOString().split('T')[0];
    
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
    
    // Return empty overview if workflows can't be fetched
    if (!githubResponse.ok) {
      return NextResponse.json({
        repository: {
          slug: validatedSlug,
          displayName: repo.displayName,
          repoPath: repo.repoPath
        },
        overview: {
          completedRuns: 0,
          inProgressRuns: 0,
          passedRuns: 0,
          failedRuns: 0,
          totalRuntime: 0,
          didntRunCount: 0,
          totalWorkflows: 0,
          missingWorkflows: [],
          successRate: 0,
          passRate: 0
        },
        message: 'No active workflows found. Please fetch workflows first.'
      });
    }
    
    // Parse workflows response and filter to active workflows only
    const workflowsData: GitHubWorkflowsResponse = await githubResponse.json();
    const savedWorkflows = workflowsData.workflows.filter(
      (w: GitHubWorkflow) => w.state === 'active'
    );
    
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
    const dateObj = new Date(date!); // date is guaranteed to be defined by this point
    const workflowRuns = await getWorkflowRunsForDate(dateObj, validatedSlug, authData.user.id);
    
    // Calculate base overview data using utility function
    const overviewData = calculateOverviewData(workflowRuns);
    
    // Calculate workflows that didn't run on the specified date using utility function
    const missingWorkflows = calculateMissingWorkflows(savedWorkflows, workflowRuns);
    const didntRunCount = missingWorkflows.length;
    
    // Calculate success rate (passed runs / completed runs)
    const successRate = overviewData.completedRuns > 0 
      ? Math.round((overviewData.passedRuns / overviewData.completedRuns) * 100) 
      : 0;
    
    // Calculate pass rate (passed runs / total workflows)
    const passRate = overviewData.totalWorkflows > 0 
      ? Math.round((overviewData.passedRuns / overviewData.totalWorkflows) * 100) 
      : 0;
    
    // Calculate hourly breakdown and statistics using utility functions
    const runsByHour = calculateHourlyBreakdown(workflowRuns);
    const hourlyStats = calculateHourlyStatistics(runsByHour);
    
    // Build enhanced overview with all calculated metrics
    const enhancedOverview = {
      ...overviewData,
      didntRunCount, // Override with correct calculation
      missingWorkflows, // Override with correct calculation
      totalWorkflows: savedWorkflows.length, // Override with correct total
      successRate,
      passRate,
      avgRunsPerHour: hourlyStats.avgRunsPerHour,
      minRunsPerHour: hourlyStats.minRunsPerHour,
      maxRunsPerHour: hourlyStats.maxRunsPerHour,
      runsByHour,
      totalRuns: hourlyStats.totalRuns
    };
    
    // Return response with repository info and enhanced overview
    const response = {
      repository: {
        slug: validatedSlug,
        displayName: repo.displayName,
        repoPath: repo.repoPath
      },
      overview: enhancedOverview,
      date,
      generatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(response);
    
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    // Handle unexpected errors
    console.error('Error fetching overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
