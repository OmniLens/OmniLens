import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addUserRepo } from '@/lib/db-storage';

// Zod schema for adding a repository
const addRepoSchema = z.object({
  repoPath: z.string().min(1, 'Repository path is required'),
  displayName: z.string().min(1, 'Display name is required'),
  htmlUrl: z.string().url('Valid HTML URL is required'),
  defaultBranch: z.string().min(1, 'Default branch is required'),
  avatarUrl: z.string().url('Valid avatar URL is required').optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body with Zod
    const { repoPath, displayName, htmlUrl, defaultBranch, avatarUrl } = addRepoSchema.parse(body);

    // Validate repository exists on GitHub before adding
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Missing GITHUB_TOKEN environment variable' }, { status: 500 });
    }

    const API_BASE = 'https://api.github.com';
    const res = await fetch(`${API_BASE}/repos/${repoPath}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    });

    if (res.status === 404) {
      return NextResponse.json({ 
        error: 'Repository not found or does not exist',
        repoPath 
      }, { status: 404 });
    }
    
    if (res.status === 403) {
      return NextResponse.json({ 
        error: 'Repository access denied. Check token permissions.',
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
    // Generate slug from just the repository name (not the full path)
    const slug = repoPath.split('/').pop() || repoPath;

    // Create new repo object with avatar URL from GitHub API
    const newRepo = {
      slug,
      repoPath,
      displayName,
      htmlUrl,
      defaultBranch,
      avatarUrl: avatarUrl || repoData.owner?.avatar_url || null,
      addedAt: new Date().toISOString()
    };

    // Add to storage
    const success = await addUserRepo(newRepo);
    if (!success) {
      return NextResponse.json({ 
        error: 'Repository already exists in dashboard',
        slug 
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      repo: newRepo,
      message: 'Repository added to dashboard successfully'
    });

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
}
