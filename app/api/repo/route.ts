import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadUserAddedRepos } from '@/lib/db-storage';

export const dynamic = 'force-dynamic';

// Zod schema for repository response
const repositorySchema = z.object({
  slug: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  htmlUrl: z.string().optional()
});

const repositoriesResponseSchema = z.object({
  repositories: z.array(repositorySchema)
});

export async function GET() {
  try {
    const userAddedRepos = await loadUserAddedRepos();
    
    // Convert user-added repos to the expected format
    const allRepos = userAddedRepos.map((repo: any) => ({
      slug: repo.slug,
      displayName: repo.displayName,
      avatarUrl: repo.avatarUrl || null,
      htmlUrl: repo.htmlUrl || null
    }));

    // Validate response with Zod
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
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('Validation Error: Response data structure is invalid');
      return NextResponse.json(
        { error: 'Invalid response data structure' },
        { status: 500 }
      );
    }
    
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}