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

    return NextResponse.json({
      valid: true,
      repoPath: fullName,
      htmlUrl,
      defaultBranch,
      displayName: repoName,
      owner,
      avatarUrl,
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


