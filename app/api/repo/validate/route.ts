import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

export async function POST(request: NextRequest) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Missing GITHUB_TOKEN environment variable' }, { status: 500 });
    }

    const body = await request.json();
    
    // Validate request body with Zod
    const { repoUrl } = validateRepoSchema.parse(body);

    const repoPath = normalizeRepoInput(repoUrl);
    if (!repoPath) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL or format. Use owner/repo or a full GitHub URL.' }, { status: 400 });
    }

    const res = await fetch(`${API_BASE}/repos/${repoPath}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      // do not cache validation calls
      cache: 'no-store',
    });

    if (res.status === 404) {
      return NextResponse.json({ valid: false, error: 'Repository not found' }, { status: 404 });
    }
    if (res.status === 403) {
      return NextResponse.json({ valid: false, error: 'Repository access denied. Check token permissions.' }, { status: 403 });
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
    const workflowsRes = await fetch(`${API_BASE}/repos/${repoPath}/actions/workflows`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    });

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

    // Now filter workflows the same way the workflow API does - only include workflows that have runs
    let usableWorkflowCount = 0;
    for (const workflow of activeWorkflows) {
      try {
        // Check if this workflow has runs on the default branch
        const runsResponse = await fetch(
          `${API_BASE}/repos/${repoPath}/actions/workflows/${workflow.id}/runs?branch=${defaultBranch}&per_page=1`,
          {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${token}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
            cache: 'no-store',
          }
        );
        
        if (runsResponse.ok) {
          const runsData = await runsResponse.json();
          if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
            usableWorkflowCount++;
            continue;
          }
          
          // If no runs on default branch, check if it has any runs at all
          const allRunsResponse = await fetch(
            `${API_BASE}/repos/${repoPath}/actions/workflows/${workflow.id}/runs?per_page=1`,
            {
              headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28',
              },
              cache: 'no-store',
            }
          );
          
          if (allRunsResponse.ok) {
            const allRunsData = await allRunsResponse.json();
            if (allRunsData.workflow_runs && allRunsData.workflow_runs.length > 0) {
              usableWorkflowCount++;
            }
          }
        }
      } catch (error) {
        console.warn(`Validation: Failed to check runs for workflow ${workflow.id}:`, error);
      }
    }

    if (usableWorkflowCount === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Repository has no workflows with runs. OmniLens requires workflows that have executed at least once.' 
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      repoPath: fullName,
      htmlUrl,
      defaultBranch,
      displayName: repoName,
      owner,
      avatarUrl,
      workflowsAccessible: true,
      workflowCount: usableWorkflowCount
    });
  } catch (error: unknown) {
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
}


