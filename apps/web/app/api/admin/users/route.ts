// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { getAllUsers, getAllUsersWithStats } from '@/lib/db-storage';
import { withAdminAuth } from '@/lib/admin-auth';

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Force dynamic rendering for admin routes
 */
export const dynamic = 'force-dynamic';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Zod schema for user response validation
 */
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  githubId: z.string().nullable(),
  avatarUrl: z.string().nullable()
});

/**
 * Zod schema for user with statistics response validation
 */
const userWithStatsSchema = userSchema.extend({
  repositoryCount: z.number(),
  workflowCount: z.number(),
  lastActivity: z.string().nullable()
});

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/admin/users
 * 
 * Get all users (admin token required).
 * Supports optional query parameters for filtering and statistics.
 * 
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     description: Returns all users in the system. Requires admin API token authentication.
 *     tags:
 *       - Admin
 *     security:
 *       - adminTokenAuth: []
 *     parameters:
 *       - name: includeStats
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Include user statistics (repository count, workflow count, last activity)
 *       - name: userId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Get specific user by ID
 *     responses:
 *       200:
 *         description: Successfully retrieved users
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: Single user object
 *                 - type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: User object (with or without stats)
 *       401:
 *         description: Unauthorized - Admin token required
 *       404:
 *         description: User not found (when userId is provided)
 *       500:
 *         description: Internal server error
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const userId = searchParams.get('userId');
    
    // Handle single user lookup by ID
    if (userId) {
      const { getUserById } = await import('@/lib/db-storage');
      const user = await getUserById(userId);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Validate response structure with Zod
      const responseData = { user };
      userSchema.parse(user);
      
      return NextResponse.json(responseData);
    }
    
    // Handle all users request (with or without statistics)
    if (includeStats) {
      // Get all users with statistics (repository count, workflow count, last activity)
      const usersWithStats = await getAllUsersWithStats();
      
      // Validate response structure with Zod
      const responseData = { users: usersWithStats };
      z.array(userWithStatsSchema).parse(usersWithStats);
      
      return NextResponse.json(responseData);
    } else {
      // Get all users without statistics (faster query)
      const users = await getAllUsers();
      
      // Validate response structure with Zod
      const responseData = { users };
      z.array(userSchema).parse(users);
      
      return NextResponse.json(responseData);
    }

  } catch (error: unknown) {
    // Handle Zod validation errors (response structure validation failed)
    if (error instanceof z.ZodError) {
      console.error('Validation Error: Response data structure is invalid');
      return NextResponse.json(
        { error: 'Invalid response data structure' },
        { status: 500 }
      );
    }
    
    // Handle unexpected errors
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});
