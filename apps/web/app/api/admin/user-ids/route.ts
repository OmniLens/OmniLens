// External library imports
import { NextRequest, NextResponse } from 'next/server';

// Internal utility imports
import { getAllUserIds } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';

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
 * Get all user IDs (admin only).
 * Lightweight endpoint that returns only user IDs and count.
 * 
 * @openapi
 * /api/admin/user-ids:
 *   get:
 *     summary: Get all user IDs (admin only)
 *     description: Returns all user IDs in the system. Requires authentication.
 *     tags:
 *       - Admin
 *     security:
 *       - cookieAuth: []
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
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Internal server error
 */
export const GET = withAuth(async (_request: NextRequest, _context, _authData) => {
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
