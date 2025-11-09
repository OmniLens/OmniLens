// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { loadUserAddedRepos, type Repository } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

// ============================================================================
// Type Definitions & Validation Schemas
// ============================================================================

/**
 * Zod schema for individual repository in response
 */
const repositorySchema = z.object({
  slug: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  htmlUrl: z.string().optional()
});

/**
 * Zod schema for repositories list response
 */
const repositoriesResponseSchema = z.object({
  repositories: z.array(repositorySchema)
});

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/repo
 * 
 * Retrieves all repositories added by the authenticated user.
 * 
 * @returns List of user's repositories with slug, displayName, avatarUrl, and htmlUrl
 */
export const GET = withAuth(async (request: NextRequest, _context, authData) => {
  try {
    // Fetch user's repositories from database
    const userAddedRepos = await loadUserAddedRepos(authData.user.id);
    
    // Convert database repository format to API response format
    const allRepos = userAddedRepos.map((repo: Repository) => ({
      slug: repo.slug,
      displayName: repo.displayName,
      avatarUrl: repo.avatarUrl || null,
      htmlUrl: repo.htmlUrl || null
    }));

    // Validate response structure with Zod before returning
    const responseData = { repositories: allRepos };
    repositoriesResponseSchema.parse(responseData);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: unknown) {
    // Handle Zod validation errors (response structure validation failed)
    if (error instanceof z.ZodError) {
      console.error('Validation Error: Response data structure is invalid');
      return NextResponse.json(
        { error: 'Invalid response data structure' },
        { status: 500 }
      );
    }
    
    // Handle unexpected errors
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
});