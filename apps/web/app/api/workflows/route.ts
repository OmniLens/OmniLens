// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { getWorkflowRunsForDateRange, type WorkflowRun } from '@/lib/github';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Zod schema for workflow ID parameter validation (optional)
 */
const workflowIdSchema = z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate full year date range (January 1st to December 31st of current year)
 */
function getYearDateRange(): { startDate: Date; endDate: Date } {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1); // January 1st
  const endDate = new Date(today.getFullYear(), 11, 31); // December 31st
  
  return { startDate, endDate };
}

/**
 * Calculate metrics from workflow runs
 */
function calculateMetrics(workflowRuns: WorkflowRun[]) {
  const totalRuns = workflowRuns.length;
  const completedRuns = workflowRuns.filter((run) => run.status === 'completed').length;
  const passedRuns = workflowRuns.filter((run) => run.conclusion === 'success').length;
  const failedRuns = workflowRuns.filter((run) => run.conclusion === 'failure').length;
  const inProgressRuns = workflowRuns.filter((run) => 
    run.status === 'in_progress' || run.status === 'queued'
  ).length;

  // Calculate pass/fail rate
  const passFailRate = completedRuns > 0 
    ? Math.round((passedRuns / completedRuns) * 100) 
    : 0;

  // Calculate total duration sum in seconds
  const durationSum = workflowRuns.reduce((total, run) => {
    if (run.status === 'completed' && run.run_started_at && run.updated_at) {
      const start = new Date(run.run_started_at).getTime();
      const end = new Date(run.updated_at).getTime();
      return total + Math.floor((end - start) / 1000);
    }
    return total;
  }, 0);

  return {
    totalRuns,
    completedRuns,
    passedRuns,
    failedRuns,
    inProgressRuns,
    passFailRate,
    durationSum,
  };
}


// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/workflows
 * 
 * Gets workflows for a specific repository and aggregated metrics for the current year.
 * Optionally filters by workflow ID to get runs for a specific workflow.
 * 
 * @openapi
 * /api/workflows:
 *   get:
 *     summary: Get workflows and year-view metrics for a repository
 *     description: Returns workflows for a specific repository with aggregated metrics for the current year (January 1st to December 31st). Optionally filter by workflow ID.
 *     tags:
 *       - Workflows
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: slug
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository slug identifier
 *       - name: workflowId
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: Optional workflow ID to filter runs for a specific workflow
 *     responses:
 *       200:
 *         description: Successfully retrieved workflows and metrics
 *       401:
 *         description: Unauthorized - Authentication required
 *       400:
 *         description: Bad request - Missing slug parameter
 *       404:
 *         description: Repository not found
 *       500:
 *         description: Internal server error
 */
export const GET = withAuth(async (
  request: NextRequest,
  _context,
  authData
) => {
  try {
    // Get required slug and optional workflow ID from query string
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const workflowIdParam = searchParams.get('workflowId');
    const workflowId = workflowIdParam ? workflowIdSchema.parse(workflowIdParam) : undefined;

    if (!slug) {
      return NextResponse.json(
        { error: 'Repository slug is required' },
        { status: 400 }
      );
    }

    // Verify repository exists and belongs to user
    const { getUserRepo } = await import('@/lib/db-storage');
    const repo = await getUserRepo(slug, authData.user.id);
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    // Get year date range (1st of current year to today)
    const { startDate, endDate } = getYearDateRange();

    // Get workflows for this specific repository
    const { getWorkflows } = await import('@/lib/db-storage');
    const repoWorkflows = await getWorkflows(slug, authData.user.id);

    // Transform workflows to include repo info
    const workflows = repoWorkflows.map((w) => ({
      id: w.id,
      name: w.name,
      path: w.path,
      state: w.state,
      repoSlug: slug,
      repoPath: repo.repoPath,
      repoDisplayName: repo.displayName,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));

    // If no workflows, return early
    if (workflows.length === 0) {
      return NextResponse.json({
        workflows: [],
        metrics: {
          totalRuns: 0,
          completedRuns: 0,
          passedRuns: 0,
          failedRuns: 0,
          inProgressRuns: 0,
          passFailRate: 0,
          durationSum: 0,
        },
        selectedWorkflow: null,
        selectedWorkflowRuns: [],
        selectedWorkflowMetrics: null,
      });
    }

    // Fetch workflow runs for the month from this repository
    let allRuns: WorkflowRun[] = [];
    try {
      allRuns = await getWorkflowRunsForDateRange(startDate, endDate, slug, authData.user.id);
    } catch (error) {
      console.error(`Error fetching runs for repo ${slug}:`, error);
      // Continue with empty runs array
    }

    // Calculate overall metrics from all runs
    const metrics = calculateMetrics(allRuns);

    // If workflow ID is specified, get runs and metrics for that workflow
    let selectedWorkflow = null;
    let selectedWorkflowRuns: WorkflowRun[] = [];
    let selectedWorkflowMetrics = null;

    if (workflowId !== undefined) {
      // Find the workflow in our list
      selectedWorkflow = workflows.find((w) => w.id === workflowId);

      if (selectedWorkflow) {
        // Filter runs for this specific workflow
        selectedWorkflowRuns = allRuns.filter((run) => run.workflow_id === workflowId);

        // Calculate metrics for selected workflow
        selectedWorkflowMetrics = calculateMetrics(selectedWorkflowRuns);

        // Calculate average run duration
        const completedRuns = selectedWorkflowRuns.filter((run) => run.status === 'completed');
        const avgDuration = completedRuns.length > 0
          ? completedRuns.reduce((sum, run) => {
              if (run.run_started_at && run.updated_at) {
                const start = new Date(run.run_started_at).getTime();
                const end = new Date(run.updated_at).getTime();
                return sum + (end - start) / 1000; // seconds
              }
              return sum;
            }, 0) / completedRuns.length
          : 0;

        selectedWorkflowMetrics = {
          ...selectedWorkflowMetrics,
          avgDuration: Math.round(avgDuration),
        };
      }
    }

    // Return response
    return NextResponse.json({
      workflows,
      metrics,
      selectedWorkflow,
      selectedWorkflowRuns: selectedWorkflowRuns.slice(0, 100), // Limit to 100 most recent runs
      selectedWorkflowMetrics,
      allRuns: workflowId === undefined ? allRuns : undefined, // Return all runs when no workflow selected
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    });

  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
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
