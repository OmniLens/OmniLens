import pool from './db';

export interface Repository {
  id?: number;
  slug: string;
  repoPath: string;
  displayName: string;
  htmlUrl: string;
  defaultBranch: string;
  avatarUrl?: string;
  addedAt?: string;
  updatedAt?: string;
}

// Load all user-added repositories from database
export async function loadUserAddedRepos(): Promise<Repository[]> {
  try {
    const result = await pool.query(
      'SELECT id, slug, repo_path as "repoPath", display_name as "displayName", html_url as "htmlUrl", default_branch as "defaultBranch", avatar_url as "avatarUrl", added_at as "addedAt", updated_at as "updatedAt" FROM repositories ORDER BY added_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error loading repositories:', error);
    return [];
  }
}

// Add a new repository to the database
export async function addUserRepo(repo: Repository): Promise<boolean> {
  try {
    const result = await pool.query(
      'INSERT INTO repositories (slug, repo_path, display_name, html_url, default_branch, avatar_url) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (slug) DO NOTHING RETURNING id',
      [repo.slug, repo.repoPath, repo.displayName, repo.htmlUrl, repo.defaultBranch, repo.avatarUrl]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error adding repository:', error);
    return false;
  }
}

// Remove a repository from the database
export async function removeUserRepo(slug: string): Promise<Repository | null> {
  try {
    const result = await pool.query(
      'DELETE FROM repositories WHERE slug = $1 RETURNING id, slug, repo_path as "repoPath", display_name as "displayName", html_url as "htmlUrl", default_branch as "defaultBranch", avatar_url as "avatarUrl", added_at as "addedAt", updated_at as "updatedAt"',
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error removing repository:', error);
    return null;
  }
}

// Get a specific repository by slug
export async function getUserRepo(slug: string): Promise<Repository | null> {
  try {
    const result = await pool.query(
      'SELECT id, slug, repo_path as "repoPath", display_name as "displayName", html_url as "htmlUrl", default_branch as "defaultBranch", avatar_url as "avatarUrl", added_at as "addedAt", updated_at as "updatedAt" FROM repositories WHERE slug = $1',
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting repository:', error);
    return null;
  }
}

// Clear all repositories (useful for testing)
export async function clearAllRepos(): Promise<void> {
  try {
    await pool.query('DELETE FROM repositories');
  } catch (error) {
    console.error('Error clearing repositories:', error);
  }
}

// Workflow persistence functions
export async function saveWorkflows(repoSlug: string, workflows: Array<{
  id: number;
  name: string;
  path: string;
  state: string;
}>) {
  try {
    // Delete existing workflows for this repo to ensure clean state
    await pool.query(
      'DELETE FROM workflows WHERE repo_slug = $1',
      [repoSlug]
    );
    
    console.log(`🧹 Deleted existing workflows for repo: ${repoSlug}`);
    
    // Insert only current workflows from GitHub
    for (const workflow of workflows) {
      await pool.query(
        `INSERT INTO workflows (repo_slug, workflow_id, workflow_name, workflow_path, workflow_state)
         VALUES ($1, $2, $3, $4, $5)`,
        [repoSlug, workflow.id, workflow.name, workflow.path, workflow.state]
      );
    }
    
    console.log(`✅ Saved ${workflows.length} current workflows for repo: ${repoSlug}`);
  } catch (error) {
    console.error('Error saving workflows:', error);
    throw error;
  }
}

export async function getWorkflows(repoSlug: string) {
  try {
    const result = await pool.query(
      'SELECT workflow_id, workflow_name, workflow_path, workflow_state, created_at, updated_at FROM workflows WHERE repo_slug = $1 ORDER BY workflow_name',
      [repoSlug]
    );
    
    return result.rows.map((row: any) => ({
      id: row.workflow_id,
      name: row.workflow_name,
      path: row.workflow_path,
      state: row.workflow_state,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('Error getting workflows:', error);
    throw error;
  }
}

export async function deleteWorkflows(repoSlug: string) {
  try {
    await pool.query(
      'DELETE FROM workflows WHERE repo_slug = $1',
      [repoSlug]
    );
    console.log(`✅ Deleted workflows for repo: ${repoSlug}`);
  } catch (error) {
    console.error('🚨 Error deleting workflows:', error);
    throw error;
  }
}
