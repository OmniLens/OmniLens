import { NextRequest, NextResponse } from 'next/server';
import { getAllUserIds } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic';

// GET /api/admin/user-ids - Get all user IDs (admin only)
export const GET = withAuth(async (request: NextRequest, _context, authData) => {
  try {
    // Get all user IDs
    const userIds = await getAllUserIds();
    
    return NextResponse.json({
      userIds,
      count: userIds.length,
      message: `Found ${userIds.length} users`
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user IDs' },
      { status: 500 }
    );
  }
});
