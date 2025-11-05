import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addUserRepo } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';
import { makeGitHubRequest } from '@/lib/github-auth';
import { fetchWorkflowDataForNewRepo } from '@/lib/repo-workflow-fetch';

// Zod schema for adding a repository
const addRepoSchema = z.object({
  repoPath: z.string().min(1, 'Repository path is required'),
  displayName: z.string().min(1, 'Display name is required'),
  htmlUrl: z.string().url('Valid HTML URL is required'),
  defaultBranch: z.string().min(1, 'Default branch is required'),
  avatarUrl: z.string().url('Valid avatar URL is required').optional()
});

export const POST = withAuth(async (request: NextRequest, _context, authData) => {
  try {
    const body = await request.json();
    
    // Validate request body with Zod
    const { repoPath, displayName, htmlUrl, defaultBranch, avatarUrl } = addRepoSchema.parse(body);

    // Validate repository exists on GitHub before adding using user's GitHub token
    try {
      const res = await makeGitHubRequest(
        authData.user.id,
        `https://api.github.com/repos/${repoPath}`,
        { cache: 'no-store' }
      );

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
      // Get repository data from GitHub API response
      const repoData = await res.json();
      
      // Repository exists, proceed with adding to database
      // Generate slug from the full repository path (org-repo format for uniqueness)
      const slug = repoPath.replace('/', '-');

      // Create new repo object with avatar URL and visibility from GitHub API
      const newRepo = {
        slug,
        repoPath,
        displayName,
        htmlUrl,
        defaultBranch,
        avatarUrl: avatarUrl || repoData.owner?.avatar_url || null,
        visibility: (repoData.private ? 'private' : 'public') as 'public' | 'private',
        addedAt: new Date().toISOString()
      };

      // Add to storage
      const addResult = await addUserRepo(newRepo, authData.user.id);
      if (!addResult.success) {
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

      // Immediately fetch workflow data for the newly added repository
      // This runs asynchronously and doesn't block the response
      const workflowPromise = fetchWorkflowDataForNewRepo(repoPath, authData.user.id, slug);

      // Try to get workflow data quickly (with timeout) to include in response
      let workflowData = null;
      try {
        // Wait up to 10 seconds for workflow data (increased from 3 seconds)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        );
        workflowData = await Promise.race([workflowPromise, timeoutPromise]);
      } catch (error) {
        // Workflow data fetch is still running in background, that's fine
        console.log(`Workflow data fetch initiated for ${repoPath} (timeout after 10s)`);
      }

      return NextResponse.json({
        success: true,
        repo: newRepo,
        workflowData,
        message: workflowData
          ? 'Repository added to dashboard successfully with workflow data'
          : 'Repository added to dashboard successfully'
      });
    } catch (error) {
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
    
    console.error('Add repo API Error:', error);
    return NextResponse.json({ error: 'Failed to add repository to dashboard' }, { status: 500 });
  }
});
