// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { getWorkflows } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Zod schema for repository slug parameter validation
 */
const slugSchema = z.string().min(1, 'Repository slug is required');

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/workflow/[slug]/exists
 * 
 * Checks if workflows exist in database for a repository without triggering GitHub API fetch.
 * This is a lightweight check for UI state management.
 * 
 * @openapi
 * /api/workflow/{slug}/exists:
 *   get:
 *     summary: Check if workflows exist
 *     description: Checks if workflows exist in database for a repository without triggering GitHub API fetch
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
 *         description: Successfully checked workflow existence
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasWorkflows:
 *                   type: boolean
 *                   description: Whether workflows exist in database
 *                 workflowCount:
 *                   type: number
 *                   description: Number of workflows found
 *                 message:
 *                   type: string
 *                   description: Human-readable message
 *       400:
 *         description: Bad request - Invalid slug format
 *       401:
 *         description: Unauthorized - Authentication required
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
    
    // Check if workflows exist in database (doesn't trigger GitHub API fetch)
    const savedWorkflows = await getWorkflows(validatedSlug, authData.user.id);
    const hasWorkflows = savedWorkflows.length > 0;
    const workflowCount = savedWorkflows.length;
    
    return NextResponse.json({
      hasWorkflows,
      workflowCount,
      message: hasWorkflows 
        ? `Found ${workflowCount} saved workflows for ${validatedSlug}`
        : `No saved workflows found for ${validatedSlug}`
    });

  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid repository slug',
        details: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400 });
    }
    
    // Handle unexpected errors
    console.error('Check workflows API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to check workflows',
      hasWorkflows: false,
      workflowCount: 0
    }, { status: 500 });
  }
});
