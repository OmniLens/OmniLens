import { NextRequest, NextResponse } from 'next/server';
import { loadUserAddedRepos } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';
import { makeGitHubRequest } from '@/lib/github-auth';
import { getWorkflowRunsForDate } from '@/lib/github';

// Force dynamic rendering since this API route requires authentication and request headers
export const dynamic = 'force-dynamic';

// Batch endpoint that returns all repository data with metrics in one call
export const GET = withAuth(async (request: NextRequest, _context, authData) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    // Step 1: Get all user repositories
    const userRepos = await loadUserAddedRepos(authData.user.id);

    if (userRepos.length === 0) {
      return NextResponse.json({
        repositories: [],
        totalCount: 0
      });
    }

    // Step 2: For each repository, fetch workflow data and metrics in parallel
    const repoPromises = userRepos.map(async (repo) => {
      try {
        // Check if workflows exist in database (fast check)
        const { getWorkflows } = await import('@/lib/db-storage');
        const savedWorkflows = await getWorkflows(repo.slug, authData.user.id);
        const hasWorkflows = savedWorkflows.length > 0;

        let metrics = {
          totalWorkflows: 0,
          passedRuns: 0,
          failedRuns: 0,
          inProgressRuns: 0,
          successRate: 0,
          hasActivity: false
        };

        // If workflows exist, fetch today's metrics from GitHub
        if (hasWorkflows) {
          try {
            const [owner, repoName] = repo.repoPath.split('/');
            if (owner && repoName) {
              // Fetch workflows from GitHub to ensure we have latest data
              const workflowsResponse = await makeGitHubRequest(
                authData.user.id,
                `https://api.github.com/repos/${owner}/${repoName}/actions/workflows`,
                { cache: 'no-store' }
              );

              if (workflowsResponse.ok) {
                const workflowsData = await workflowsResponse.json();
                const activeWorkflows = workflowsData.workflows.filter((w: any) => w.state === 'active');

                // Get the repository's default branch (same as individual repository API)
                const repoResponse = await makeGitHubRequest(
                  authData.user.id,
                  `https://api.github.com/repos/${owner}/${repoName}`,
                  { cache: 'no-store' }
                );
                
                let defaultBranch = 'main'; // fallback
                if (repoResponse.ok) {
                  const repoData = await repoResponse.json();
                  defaultBranch = repoData.default_branch;
                }

                // Fetch today's workflow runs using the same logic as individual repository API (with default branch)
                const todayDate = new Date(todayStr);
                const allRuns = await getWorkflowRunsForDate(todayDate, repo.slug, authData.user.id, defaultBranch);

                // For dashboard metrics, only count runs that actually STARTED today (not just currently running)
                const todayStart = new Date(todayStr + 'T00:00:00Z');
                const todayEnd = new Date(todayStr + 'T23:59:59Z');
                
                const runs = allRuns.filter((run: any) => {
                  const runStartTime = new Date(run.run_started_at);
                  return runStartTime >= todayStart && runStartTime <= todayEnd;
                });

                const completedRuns = runs.filter((run: any) => run.status === 'completed').length;
                const inProgressRuns = runs.filter((run: any) => run.status === 'in_progress' || run.status === 'queued').length;
                const passedRuns = runs.filter((run: any) => run.conclusion === 'success').length;
                const failedRuns = runs.filter((run: any) => run.conclusion === 'failure').length;


                metrics = {
                  totalWorkflows: activeWorkflows.length,
                  passedRuns,
                  failedRuns,
                  inProgressRuns,
                  successRate: completedRuns > 0 ? Math.round((passedRuns / completedRuns) * 100) : 0,
                  hasActivity: completedRuns > 0 || inProgressRuns > 0
                };
              }
            }
          } catch (error) {
            console.error(`Error fetching metrics for ${repo.slug}:`, error);
            // Return default metrics on error
          }
        }

        return {
          slug: repo.slug,
          repoPath: repo.repoPath,
          displayName: repo.displayName,
          avatarUrl: repo.avatarUrl,
          htmlUrl: repo.htmlUrl,
          visibility: repo.visibility || 'public',
          hasWorkflows,
          metrics,
          // Add error state if needed
          hasError: false,
          errorMessage: null
        };
      } catch (error) {
        console.error(`Error processing repository ${repo.slug}:`, error);
        return {
          slug: repo.slug,
          repoPath: repo.repoPath,
          displayName: repo.displayName,
          avatarUrl: repo.avatarUrl,
          htmlUrl: repo.htmlUrl,
          visibility: repo.visibility || 'public',
          hasWorkflows: false,
          metrics: {
            totalWorkflows: 0,
            passedRuns: 0,
            failedRuns: 0,
            inProgressRuns: 0,
            successRate: 0,
            hasActivity: false
          },
          hasError: true,
          errorMessage: 'Failed to load repository data'
        };
      }
    });

    // Wait for all repositories to be processed in parallel
    const repositories = await Promise.all(repoPromises);

    return NextResponse.json({
      repositories,
      totalCount: repositories.length,
      loadedAt: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
});
