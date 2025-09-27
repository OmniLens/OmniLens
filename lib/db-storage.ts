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

// Load all user-added repositories from database for a specific user
export async function loadUserAddedRepos(userId: string): Promise<Repository[]> {
  try {
    const result = await pool.query(
      'SELECT id, slug, repo_path as "repoPath", display_name as "displayName", html_url as "htmlUrl", default_branch as "defaultBranch", avatar_url as "avatarUrl", added_at as "addedAt", updated_at as "updatedAt" FROM repositories WHERE user_id = $1 ORDER BY added_at DESC',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error loading repositories:', error);
    return [];
  }
}

// Add a new repository to the database for a specific user
export async function addUserRepo(repo: Repository, userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'INSERT INTO repositories (slug, repo_path, display_name, html_url, default_branch, avatar_url, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id, slug) DO NOTHING RETURNING id',
      [repo.slug, repo.repoPath, repo.displayName, repo.htmlUrl, repo.defaultBranch, repo.avatarUrl, userId]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error adding repository:', error);
    return false;
  }
}

// Remove a repository from the database for a specific user
export async function removeUserRepo(slug: string, userId: string): Promise<Repository | null> {
  try {
    const result = await pool.query(
      'DELETE FROM repositories WHERE slug = $1 AND user_id = $2 RETURNING id, slug, repo_path as "repoPath", display_name as "displayName", html_url as "htmlUrl", default_branch as "defaultBranch", avatar_url as "avatarUrl", added_at as "addedAt", updated_at as "updatedAt"',
      [slug, userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error removing repository:', error);
    return null;
  }
}

// Get a specific repository by slug for a specific user
export async function getUserRepo(slug: string, userId: string): Promise<Repository | null> {
  try {
    const result = await pool.query(
      'SELECT id, slug, repo_path as "repoPath", display_name as "displayName", html_url as "htmlUrl", default_branch as "defaultBranch", avatar_url as "avatarUrl", added_at as "addedAt", updated_at as "updatedAt" FROM repositories WHERE slug = $1 AND user_id = $2',
      [slug, userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting repository:', error);
    return null;
  }
}

// Clear all repositories for a specific user (useful for testing)
export async function clearUserRepos(userId: string): Promise<void> {
  try {
    await pool.query('DELETE FROM repositories WHERE user_id = $1', [userId]);
  } catch (error) {
    console.error('Error clearing user repositories:', error);
  }
}

// Clear all repositories (useful for testing) - ADMIN ONLY
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
}>, userId: string) {
  try {
    // Use UPSERT instead of DELETE ALL for better performance and optimistic updates
    for (const workflow of workflows) {
      await pool.query(`
        INSERT INTO workflows (repo_slug, workflow_id, workflow_name, workflow_path, workflow_state, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, repo_slug, workflow_id) 
        DO UPDATE SET 
          workflow_name = EXCLUDED.workflow_name,
          workflow_path = EXCLUDED.workflow_path,
          workflow_state = EXCLUDED.workflow_state,
          updated_at = CURRENT_TIMESTAMP
      `, [repoSlug, workflow.id, workflow.name, workflow.path, workflow.state, userId]);
    }
    
    // Only delete workflows that are no longer in the GitHub response
    if (workflows.length > 0) {
      const currentWorkflowIds = workflows.map(w => w.id);
      // Use NOT IN with proper array handling for PostgreSQL
      await pool.query(
        'DELETE FROM workflows WHERE repo_slug = $1 AND user_id = $2 AND workflow_id NOT IN (SELECT unnest($3::int[]))',
        [repoSlug, userId, currentWorkflowIds]
      );
    } else {
      // If no workflows, delete all for this repo
      await pool.query(
        'DELETE FROM workflows WHERE repo_slug = $1 AND user_id = $2',
        [repoSlug, userId]
      );
    }
    
  } catch (error) {
    console.error('Error saving workflows:', error);
    throw error;
  }
}

export async function getWorkflows(repoSlug: string, userId: string) {
  try {
    const result = await pool.query(
      'SELECT workflow_id, workflow_name, workflow_path, workflow_state, created_at, updated_at FROM workflows WHERE repo_slug = $1 AND user_id = $2 ORDER BY workflow_name',
      [repoSlug, userId]
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

export async function deleteWorkflows(repoSlug: string, userId: string) {
  try {
    await pool.query(
      'DELETE FROM workflows WHERE repo_slug = $1 AND user_id = $2',
      [repoSlug, userId]
    );
  } catch (error) {
    console.error('🚨 Error deleting workflows:', error);
    throw error;
  }
}

// User management functions
export interface User {
  id: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  githubId: string | null;
  avatarUrl: string | null;
}

// Get all users from the database
export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        "emailVerified", 
        image, 
        "createdAt", 
        "updatedAt", 
        "githubId", 
        "avatarUrl"
      FROM "user" 
      ORDER BY "createdAt" DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// Get all user IDs only
export async function getAllUserIds(): Promise<string[]> {
  try {
    const result = await pool.query('SELECT id FROM "user" ORDER BY "createdAt" DESC');
    return result.rows.map(row => row.id);
  } catch (error) {
    console.error('Error getting all user IDs:', error);
    return [];
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        "emailVerified", 
        image, 
        "createdAt", 
        "updatedAt", 
        "githubId", 
        "avatarUrl"
      FROM "user" 
      WHERE id = $1
    `, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

// Get user statistics
export async function getUserStats(userId: string): Promise<{
  repositoryCount: number;
  workflowCount: number;
  lastActivity: string | null;
}> {
  try {
    // Get repository count
    const repoResult = await pool.query(
      'SELECT COUNT(*) as count FROM repositories WHERE user_id = $1',
      [userId]
    );
    
    // Get workflow count
    const workflowResult = await pool.query(
      'SELECT COUNT(*) as count FROM workflows WHERE user_id = $1',
      [userId]
    );
    
    // Get last activity (most recent repository or workflow update)
    const activityResult = await pool.query(`
      SELECT GREATEST(
        COALESCE((SELECT MAX(updated_at) FROM repositories WHERE user_id = $1), '1970-01-01'::timestamp),
        COALESCE((SELECT MAX(updated_at) FROM workflows WHERE user_id = $1), '1970-01-01'::timestamp)
      ) as last_activity
    `, [userId]);
    
    return {
      repositoryCount: parseInt(repoResult.rows[0].count),
      workflowCount: parseInt(workflowResult.rows[0].count),
      lastActivity: activityResult.rows[0].last_activity
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      repositoryCount: 0,
      workflowCount: 0,
      lastActivity: null
    };
  }
}

// Get all users with their statistics
export async function getAllUsersWithStats(): Promise<(User & {
  repositoryCount: number;
  workflowCount: number;
  lastActivity: string | null;
})[]> {
  try {
    const users = await getAllUsers();
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await getUserStats(user.id);
        return { ...user, ...stats };
      })
    );
    return usersWithStats;
  } catch (error) {
    console.error('Error getting all users with stats:', error);
    return [];
  }
}
