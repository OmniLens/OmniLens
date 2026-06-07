// External library imports
import { NextRequest, NextResponse } from 'next/server';

// Internal utility imports
import { getAllUserIds } from '@/lib/db-storage';
import { withAdminAuth } from '@/lib/admin-auth';

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Force dynamic rendering for admin routes
 */
export const dynamic = 'force-dynamic';

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/admin/user-ids
 *
 * Get all user IDs (admin token required).
 * Lightweight endpoint that returns only user IDs and count.
 *
 * @openapi
 * /api/admin/user-ids:
 *   get:
 *     summary: Get all user IDs (admin only)
 *     description: Returns all user IDs in the system. Requires admin API token authentication.
 *     tags:
 *       - Admin
 *     security:
 *       - adminTokenAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of user IDs
 *                 count:
 *                   type: number
 *                   description: Total number of users
 *                 message:
 *                   type: string
 *                   description: Human-readable message
 *       401:
 *         description: Unauthorized - Admin token required
 *       403:
 *         description: Forbidden - Invalid or invalidated admin token
 *       500:
 *         description: Internal server error
 */
export const GET = withAdminAuth(async (_request: NextRequest) => {
  try {
    // Fetch all user IDs from database
    const userIds = await getAllUserIds();
    
    return NextResponse.json({
      userIds,
      count: userIds.length,
      message: `Found ${userIds.length} users`
    });

  } catch (error: unknown) {
    // Handle unexpected errors
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user IDs' },
      { status: 500 }
    );
  }
});
