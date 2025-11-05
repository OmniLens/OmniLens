import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth-middleware';
import { makeGitHubRequest } from '@/lib/github-auth';

const API_BASE = 'https://api.github.com';

// Zod schema for repository validation
const validateRepoSchema = z.object({
  repoUrl: z.string().min(1, 'Repository URL is required')
});

function normalizeRepoInput(input: string): string | null {
  if (!input) return null;
  let trimmed = input.trim();

  // If it's a full GitHub URL
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      if (url.hostname !== 'github.com') return null;
      const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
      if (parts.length < 2) return null;
      return `${parts[0]}/${parts[1]}`;
    }
  } catch {
    // fall through to owner/repo parsing
  }

  // Owner/repo form
  const parts = trimmed.split('/').filter(Boolean);
  if (parts.length === 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return null;
}

export const POST = withAuth(async (request: NextRequest, _context, authData) => {
  try {
    const body = await request.json();
    
    // Validate request body with Zod
    const { repoUrl } = validateRepoSchema.parse(body);

    const repoPath = normalizeRepoInput(repoUrl);
    if (!repoPath) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL or format. Use owner/repo or a full GitHub URL.' }, { status: 400 });
    }

    // Use user's GitHub token to validate repository
    const res = await makeGitHubRequest(
      authData.user.id,
      `${API_BASE}/repos/${repoPath}`,
      { cache: 'no-store' }
    );

    if (res.status === 404) {
      return NextResponse.json({ valid: false, error: 'Repository not found' }, { status: 404 });
    }
    if (res.status === 403) {
      return NextResponse.json({ valid: false, error: 'Repository access denied. Check your GitHub permissions.' }, { status: 403 });
    }
    if (!res.ok) {
      return NextResponse.json({ valid: false, error: `GitHub API error: ${res.status} ${res.statusText}` }, { status: 500 });
    }

    const json = await res.json();
    const fullName: string = json.full_name; // owner/repo
    const htmlUrl: string = json.html_url;
    const defaultBranch: string = json.default_branch;
    const repoName: string = json.name; // just the repo name
    const owner: string = json.owner.login;
    const avatarUrl: string = json.owner.avatar_url;

    // Also validate that we can access workflows for this repository (GitHub's state=active filter is broken)
    const workflowsRes = await makeGitHubRequest(
      authData.user.id,
      `${API_BASE}/repos/${repoPath}/actions/workflows`,
      { cache: 'no-store' }
    );

    if (!workflowsRes.ok) {
      if (workflowsRes.status === 403) {
        return NextResponse.json({ 
          valid: false, 
          error: 'Access denied to repository workflows. Check token permissions for organization repositories.' 
        }, { status: 403 });
      } else if (workflowsRes.status === 404) {
        return NextResponse.json({ 
          valid: false, 
          error: 'Cannot access repository workflows. Repository may not support GitHub Actions.' 
        }, { status: 404 });
      } else {
        return NextResponse.json({ 
          valid: false, 
          error: `Cannot access workflows: ${workflowsRes.status} ${workflowsRes.statusText}` 
        }, { status: 500 });
      }
    }

    // Check if we can actually see workflows (empty response might indicate permission issues)
    const workflowsData = await workflowsRes.json();

    // Filter to only active workflows (GitHub's state=active filter is broken)
    const activeWorkflows = (workflowsData.workflows || []).filter((w: any) => w.state === 'active');

    // Count active workflows (we now allow repositories without workflows for future workflow creation)
    const usableWorkflowCount = activeWorkflows.length;

    return NextResponse.json({
      valid: true,
      repoPath: fullName,
      htmlUrl,
      defaultBranch,
      displayName: repoName,
      owner,
      avatarUrl,
      visibility: json.private ? 'private' : 'public',
      workflowsAccessible: true,
      workflowCount: usableWorkflowCount
    });
  } catch (error: unknown) {
    // Handle GitHub token errors
    if (error instanceof Error && error.message.includes('GitHub access token not found')) {
      return NextResponse.json({ 
        error: 'GitHub access token not found. Please ensure you are logged in with GitHub.',
      }, { status: 401 });
    }
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        message: 'Repository URL is required'
      }, { status: 400 });
    }
    
    console.error('Validation API Error:', error);
    return NextResponse.json({ error: 'Failed to validate repository' }, { status: 500 });
  }
});


