// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { addUserRepo, type Repository } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';
import { makeGitHubRequest } from '@/lib/github-auth';
import { fetchWorkflowDataForNewRepo, type WorkflowData } from '@/lib/repo-workflow-fetch';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * GitHub repository API response (minimal fields we use)
 */
interface GitHubRepoResponse {
  private: boolean;
  owner: {
    avatar_url: string;
  };
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Zod schema for adding a repository request body
 */
const addRepoSchema = z.object({
  repoPath: z.string().min(1, 'Repository path is required'),
  displayName: z.string().min(1, 'Display name is required'),
  htmlUrl: z.string().url('Valid HTML URL is required'),
  defaultBranch: z.string().min(1, 'Default branch is required'),
  avatarUrl: z.string().url('Valid avatar URL is required').optional()
});

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * POST /api/repo/add
 * 
 * Adds a new repository to the user's dashboard.
 * Validates repository exists on GitHub and fetches initial workflow data.
 * 
 * @param request - Next.js request object containing repository details in body
 * @returns Success response with repository and workflow data (if available)
 */
export const POST = withAuth(async (request: NextRequest, _context, authData) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { repoPath, displayName, htmlUrl, defaultBranch, avatarUrl } = addRepoSchema.parse(body);

    // Validate repository exists on GitHub before adding (using user's GitHub token)
    try {
      const res = await makeGitHubRequest(
        authData.user.id,
        `https://api.github.com/repos/${repoPath}`,
        { cache: 'no-store' }
      );

      // Handle GitHub API errors
      if (res.status === 404) {
        return NextResponse.json({ 
          error: 'Repository not found or does not exist',
          repoPath 
        }, { status: 404 });
      }
      
      if (res.status === 403) {
        return NextResponse.json({ 
          error: 'Repository access denied. Check your GitHub permissions.',
          repoPath 
        }, { status: 403 });
      }
      
      if (!res.ok) {
        return NextResponse.json({ 
          error: `GitHub API error: ${res.status} ${res.statusText}`,
          repoPath 
        }, { status: 500 });
      }
      
      // Parse GitHub API response
      const repoData: GitHubRepoResponse = await res.json();
      
      // Generate slug from repository path (org-repo format for uniqueness)
      const slug = repoPath.replace('/', '-');

      // Create repository object with data from GitHub API
      const newRepo: Repository = {
        slug,
        repoPath,
        displayName,
        htmlUrl,
        defaultBranch,
        avatarUrl: avatarUrl || repoData.owner?.avatar_url || undefined,
        visibility: (repoData.private ? 'private' : 'public') as 'public' | 'private',
        addedAt: new Date().toISOString()
      };

      // Add repository to database
      const addResult = await addUserRepo(newRepo, authData.user.id);
      if (!addResult.success) {
        // Handle specific error cases
        if (addResult.error?.includes('Maximum repository limit')) {
          return NextResponse.json({
            error: addResult.error
          }, { status: 400 });
        } else {
          return NextResponse.json({
            error: 'Repository already exists in dashboard',
            slug
          }, { status: 409 });
        }
      }

      // Fetch workflow data asynchronously (doesn't block response)
      const workflowPromise = fetchWorkflowDataForNewRepo(repoPath, authData.user.id, slug);

      // Try to get workflow data quickly (with 10 second timeout) to include in response
      let workflowData: WorkflowData | null = null;
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        );
        workflowData = await Promise.race([workflowPromise, timeoutPromise]);
      } catch {
        // Workflow data fetch continues in background (graceful degradation)
        console.log(`Workflow data fetch initiated for ${repoPath} (timeout after 10s)`);
      }

      // Return success response with repository and workflow data (if available)
      return NextResponse.json({
        success: true,
        repo: newRepo,
        workflowData,
        message: workflowData
          ? 'Repository added to dashboard successfully with workflow data'
          : 'Repository added to dashboard successfully'
      });
    } catch (error) {
      // Handle GitHub token errors specifically
      if (error instanceof Error && error.message.includes('GitHub access token not found')) {
        return NextResponse.json({ 
          error: 'GitHub access token not found. Please ensure you are logged in with GitHub.',
        }, { status: 401 });
      }
      throw error;
    }

  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400 });
    }
    
    // Handle unexpected errors
    console.error('Add repo API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to add repository to dashboard' 
    }, { status: 500 });
  }
});
