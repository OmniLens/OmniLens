import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserRepo, removeUserRepo, deleteWorkflows } from '@/lib/db-storage';

// Zod schema for slug parameter validation
const slugSchema = z.string().min(1, 'Repository slug is required');

// Zod schema for repository response
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
    addedAt: z.any().optional(),
    updatedAt: z.any().optional()
  })
});

// Zod schema for delete response
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
    addedAt: z.any().optional(),
    updatedAt: z.any().optional()
  })
});

// GET /api/repo/{slug} - Get a specific repository
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Validate the slug parameter
    const validatedSlug = slugSchema.parse(params.slug);
    
    const repo = await getUserRepo(validatedSlug);

    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Validate response with Zod
    const responseData = { success: true, repo };
    repositoryResponseSchema.parse(responseData);

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid repository slug',
        details: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400 });
    }
    
    console.error('Get repo API Error:', error);
    return NextResponse.json({ error: 'Failed to get repository' }, { status: 500 });
  }
}

// DELETE /api/repo/{slug} - Delete a specific repository
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Validate the slug parameter
    const validatedSlug = slugSchema.parse(params.slug);
    
    // First check if the repository exists
    const existingRepo = await getUserRepo(validatedSlug);
    if (!existingRepo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    
    // Delete associated workflows first
    try {
      await deleteWorkflows(validatedSlug);
    } catch (error) {
      console.error('Error deleting workflows for repo:', validatedSlug, error);
      // Continue with repository deletion even if workflow deletion fails
    }
    
    const deletedRepo = await removeUserRepo(validatedSlug);

    if (!deletedRepo) {
      return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 });
    }
    
    // Validate response with Zod
    const responseData = {
      success: true,
      message: 'Repository removed from dashboard successfully',
      deletedRepo
    };
    deleteResponseSchema.parse(responseData);
    
    return NextResponse.json(responseData);

  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.issues);
      return NextResponse.json({ 
        error: 'Invalid repository slug',
        details: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400 });
    }
    
    console.error('Delete repo API Error:', error);
    return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 });
  }
}
