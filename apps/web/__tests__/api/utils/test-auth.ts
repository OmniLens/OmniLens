// External library imports
import { randomBytes } from 'crypto';
import pool from '@/lib/db';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TestUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthHeaders extends Record<string, string> {
  Cookie: string;
}

// ============================================================================
// Test User Creation
// ============================================================================

/**
 * Get an existing dev user from the database
 * Returns the first user found, or null if no users exist
 */
export async function getExistingDevUser(): Promise<TestUser | null> {
  try {
    const result = await pool.query(
      'SELECT id, name, email, "emailVerified", image, "createdAt", "updatedAt" FROM "user" ORDER BY "createdAt" DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      image: row.image,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('Error getting existing dev user:', error);
    return null;
  }
}

/**
 * Create a test user in the database
 * Uses unique identifiers to avoid conflicts with dev data
 */
export async function createTestUser(): Promise<TestUser> {
  const timestamp = Date.now();
  const randomId = randomBytes(8).toString('hex');
  const userId = `test-user-${timestamp}-${randomId}`;
  
  try {
    const result = await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, email, "emailVerified", image, "createdAt", "updatedAt"`,
      [
        userId,
        `Test User ${timestamp}`,
        `test-${timestamp}-${randomId}@example.com`, // Include randomId to ensure unique email
        true,
        null,
      ]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      image: row.image,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Get or create a test user
 * First tries to use an existing dev user, otherwise creates a test user
 */
export async function getOrCreateTestUser(): Promise<TestUser> {
  const existingUser = await getExistingDevUser();
  if (existingUser) {
    return existingUser;
  }
  return await createTestUser();
}

/**
 * Get a user that has an existing valid session
 * This is useful for testing with real sessions
 */
export async function getUserWithSession(): Promise<{ user: TestUser; session: TestSession } | null> {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u."emailVerified", u.image, u."createdAt", u."updatedAt",
              s.id as session_id, s.token, s."expiresAt" as session_expires, s."createdAt" as session_created, s."updatedAt" as session_updated
       FROM "user" u
       JOIN session s ON s."userId" = u.id
       WHERE s."expiresAt" > CURRENT_TIMESTAMP
       ORDER BY s."createdAt" DESC
       LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: row.emailVerified,
        image: row.image,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      session: {
        id: row.session_id,
        userId: row.id,
        token: row.token,
        expiresAt: row.session_expires,
        createdAt: row.session_created,
        updatedAt: row.session_updated,
      },
    };
  } catch (error) {
    console.error('Error getting user with session:', error);
    return null;
  }
}

// ============================================================================
// Test Session Creation
// ============================================================================

/**
 * Get an existing valid session for a user from the database
 * Returns null if no valid session exists
 */
export async function getExistingSession(userId: string): Promise<TestSession | null> {
  try {
    const result = await pool.query(
      `SELECT id, "userId", token, "expiresAt", "createdAt", "updatedAt"
       FROM session
       WHERE "userId" = $1 AND "expiresAt" > CURRENT_TIMESTAMP
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      token: row.token,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('Error getting existing session:', error);
    return null;
  }
}

/**
 * Create a test session for a user using Better Auth
 * This creates a valid session that can be used in authenticated requests
 * 
 * Better Auth stores plain tokens in the database. We try to use an existing
 * session first, or create a new one with a random token similar to Better Auth's format.
 */
export async function createTestSession(userId: string): Promise<TestSession> {
  try {
    // First, try to get an existing valid session
    const existingSession = await getExistingSession(userId);
    if (existingSession) {
      return existingSession;
    }
    
    // If no existing session, create a new one
    // Better Auth uses plain random tokens (not JWTs) stored in the database
    const sessionId = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Generate a random token similar to Better Auth's format
    // Based on existing tokens, they appear to be base64url encoded random bytes
    const sessionToken = randomBytes(32).toString('base64url');
    
    // Insert session into database
    const result = await pool.query(
      `INSERT INTO session (id, "userId", token, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, "userId", token, "expiresAt", "createdAt", "updatedAt"`,
      [sessionId, userId, sessionToken, expiresAt]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      token: row.token,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('Error creating test session:', error);
    throw error;
  }
}

/**
 * Get session from database by token
 * This queries the database directly to get session and user info
 */
export async function getSessionByToken(token: string): Promise<{ user: TestUser; session: TestSession } | null> {
  try {
    const result = await pool.query(
      `SELECT 
        s.id as session_id, s.token, s."expiresAt" as session_expires, s."createdAt" as session_created, s."updatedAt" as session_updated,
        u.id, u.name, u.email, u."emailVerified", u.image, u."createdAt", u."updatedAt"
       FROM session s
       JOIN "user" u ON s."userId" = u.id
       WHERE s.token = $1 AND s."expiresAt" > CURRENT_TIMESTAMP`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: row.emailVerified,
        image: row.image,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      session: {
        id: row.session_id,
        userId: row.id,
        token: row.token,
        expiresAt: row.session_expires,
        createdAt: row.session_created,
        updatedAt: row.session_updated,
      },
    };
  } catch (error) {
    console.error('Error getting session by token:', error);
    return null;
  }
}

/**
 * Create authenticated request headers with session cookie
 * Better Auth uses the cookie name: better-auth.session_token
 * NextRequest expects cookies in the Cookie header (capital C)
 */
export async function createAuthHeaders(userId: string): Promise<AuthHeaders> {
  const session = await createTestSession(userId);
  
  // Better Auth uses a cookie format: better-auth.session_token=<token>
  // NextRequest reads cookies from the Cookie header (capital C)
  const cookie = `better-auth.session_token=${session.token}`;
  
  return { Cookie: cookie };
}

/**
 * Create authenticated request headers using an existing session token
 * This is useful when you have a real session token from the database
 */
export async function createAuthHeadersWithToken(token: string): Promise<AuthHeaders> {
  const cookie = `better-auth.session_token=${token}`;
  return { Cookie: cookie };
}

/**
 * Get authenticated headers for an existing user
 * Creates a session if needed
 */
export async function getAuthHeadersForUser(user: TestUser): Promise<AuthHeaders> {
  return await createAuthHeaders(user.id);
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Clean up test user and associated data
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  try {
    // Sessions will be deleted via CASCADE
    // Repositories will need to be cleaned up separately
    await pool.query('DELETE FROM "user" WHERE id = $1', [userId]);
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
}

/**
 * Clean up test repositories for a user
 */
export async function cleanupTestRepos(userId: string, testPrefix: string = 'test-repo-'): Promise<void> {
  try {
    await pool.query(
      'DELETE FROM repositories WHERE user_id = $1 AND slug LIKE $2',
      [userId, `${testPrefix}%`]
    );
  } catch (error) {
    console.error('Error cleaning up test repositories:', error);
  }
}

