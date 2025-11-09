// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { withAuth } from '@/lib/auth-middleware';
import { makeGitHubRequest } from '@/lib/github-auth';

// ============================================================================
// Constants
// ============================================================================

const API_BASE = 'https://api.github.com';

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
 * Zod schema for repository validation request body
 */
const validateRepoSchema = z.object({
  repoUrl: z.string().min(1, 'Repository URL is required')
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes repository input to owner/repo format
 * 
 * Accepts either:
 * - Full GitHub URL (https://github.com/owner/repo)
 * - Owner/repo format (owner/repo)
 * 
 * @param input - Repository URL or owner/repo string
 * @returns Normalized owner/repo string or null if invalid
 */
function normalizeRepoInput(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

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

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * POST /api/repo/validate
 * 
 * Validates a GitHub repository URL and checks if it's accessible.
 * Also verifies workflow access and counts active workflows.
 * 
 * @param request - Next.js request object containing repoUrl in body
 * @returns Validation result with repository details and workflow count
 */
export const POST = withAuth(async (request: NextRequest, _context, authData) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { repoUrl } = validateRepoSchema.parse(body);

    // Normalize repository input to owner/repo format
    const repoPath = normalizeRepoInput(repoUrl);
    if (!repoPath) {
      return NextResponse.json({ 
        error: 'Invalid GitHub repository URL or format. Use owner/repo or a full GitHub URL.' 
      }, { status: 400 });
    }

    // Validate repository exists and is accessible using user's GitHub token
    const res = await makeGitHubRequest(
      authData.user.id,
      `${API_BASE}/repos/${repoPath}`,
      { cache: 'no-store' }
    );

    // Handle repository access errors
    if (res.status === 404) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Repository not found' 
      }, { status: 404 });
    }
    if (res.status === 403) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Repository access denied. Check your GitHub permissions.' 
      }, { status: 403 });
    }
    if (!res.ok) {
      return NextResponse.json({ 
        valid: false, 
        error: `GitHub API error: ${res.status} ${res.statusText}` 
      }, { status: 500 });
    }

    // Extract repository information from GitHub API response
    const json = await res.json();
    const fullName: string = json.full_name; // owner/repo format
    const htmlUrl: string = json.html_url;
    const defaultBranch: string = json.default_branch;
    const repoName: string = json.name; // repository name only
    const owner: string = json.owner.login;
    const avatarUrl: string = json.owner.avatar_url;

    // Validate workflow access (GitHub's state=active filter is broken, so we check manually)
    const workflowsRes = await makeGitHubRequest(
      authData.user.id,
      `${API_BASE}/repos/${repoPath}/actions/workflows`,
      { cache: 'no-store' }
    );

    // Handle workflow access errors
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

    // Parse workflows response and filter to active workflows only
    // Note: GitHub's state=active query parameter is broken, so we filter manually
    const workflowsData: GitHubWorkflowsResponse = await workflowsRes.json();
    const activeWorkflows = (workflowsData.workflows || []).filter(
      (w: GitHubWorkflow) => w.state === 'active'
    );
    const usableWorkflowCount = activeWorkflows.length;

    // Return validation success with repository details
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
    
    // Handle unexpected errors
    console.error('Validation API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to validate repository' 
    }, { status: 500 });
  }
});


