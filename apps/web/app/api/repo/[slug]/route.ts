// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { getUserRepo, removeUserRepo, deleteWorkflows } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Zod schema for repository slug parameter validation
 */
const slugSchema = z.string().min(1, 'Repository slug is required');

/**
 * Zod schema for GET repository response validation
 */
const repositoryResponseSchema = z.object({
  success: z.boolean(),
  repo: z.object({
    id: z.number().optional(),
    slug: z.string(),
    repoPath: z.string(),
    displayName: z.string(),
    htmlUrl: z.string(),
    defaultBranch: z.string(),
    avatarUrl: z.string().nullable().optional(),
    addedAt: z.any().optional(), // Date string from database
    updatedAt: z.any().optional() // Date string from database
  })
});

/**
 * Zod schema for DELETE repository response validation
 */
const deleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  deletedRepo: z.object({
    id: z.number().optional(),
    slug: z.string(),
    repoPath: z.string(),
    displayName: z.string(),
    htmlUrl: z.string(),
    defaultBranch: z.string(),
    avatarUrl: z.string().nullable().optional(),
    addedAt: z.any().optional(), // Date string from database
    updatedAt: z.any().optional() // Date string from database
  })
});

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/repo/[slug]
 * 
 * Retrieves a specific repository by slug for the authenticated user.
 * 
 * @openapi
 * /api/repo/{slug}:
 *   get:
 *     summary: Get repository by slug
 *     description: Retrieves a specific repository by slug for the authenticated user
 *     tags:
 *       - Repositories
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
 *         description: Successfully retrieved repository
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 repo:
 *                   type: object
 *                   description: Repository details
 *       400:
 *         description: Bad request - Invalid slug format
 *       401:
 *         description: Unauthorized - Authentication required
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
    
    // Fetch repository from database
    const repo = await getUserRepo(validatedSlug, authData.user.id);

    // Return 404 if repository not found
    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Validate response structure with Zod before returning
    const responseData = { success: true, repo };
    repositoryResponseSchema.parse(responseData);

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    // Handle Zod validation errors (slug validation or response validation)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid repository slug',
        details: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400 });
    }
    
    // Handle unexpected errors
    console.error('Get repo API Error:', error);
    return NextResponse.json({ error: 'Failed to get repository' }, { status: 500 });
  }
});

/**
 * DELETE /api/repo/[slug]
 * 
 * Deletes a specific repository and its associated workflows from the dashboard.
 * 
 * @openapi
 * /api/repo/{slug}:
 *   delete:
 *     summary: Delete repository from dashboard
 *     description: Deletes a specific repository and its associated workflows from the user's dashboard
 *     tags:
 *       - Repositories
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
 *         description: Repository deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedRepo:
 *                   type: object
 *                   description: Details of the deleted repository
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
    const existingRepo = await getUserRepo(validatedSlug, authData.user.id);
    if (!existingRepo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    
    // Delete associated workflows first (best effort - don't fail if this fails)
    try {
      await deleteWorkflows(validatedSlug, authData.user.id);
    } catch (error) {
      // Log error but continue with repository deletion
      console.error('Error deleting workflows for repo:', validatedSlug, error);
    }
    
    // Delete repository from database
    const deletedRepo = await removeUserRepo(validatedSlug, authData.user.id);

    // Return error if deletion failed
    if (!deletedRepo) {
      return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 });
    }
    
    // Validate response structure with Zod before returning
    const responseData = {
      success: true,
      message: 'Repository removed from dashboard successfully',
      deletedRepo
    };
    deleteResponseSchema.parse(responseData);
    
    return NextResponse.json(responseData);

  } catch (error: unknown) {
    // Handle Zod validation errors (slug validation or response validation)
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.issues);
      return NextResponse.json({ 
        error: 'Invalid repository slug',
        details: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400 });
    }
    
    // Handle unexpected errors
    console.error('Delete repo API Error:', error);
    return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 });
  }
});
