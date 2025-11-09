import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAllUsers, getAllUsersWithStats } from '@/lib/db-storage';
import { withAdminAuth } from '@/lib/admin-auth';

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic';

// Zod schema for user response
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

const userWithStatsSchema = userSchema.extend({
  repositoryCount: z.number(),
  workflowCount: z.number(),
  lastActivity: z.string().nullable()
});

// GET /api/admin/users - Get all users (admin token required)
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    // This endpoint is now protected by admin API token authentication
    // Only requests with valid admin tokens can access this data
    
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const userId = searchParams.get('userId');
    
    if (userId) {
      // Get specific user
      const { getUserById } = await import('@/lib/db-storage');
      const user = await getUserById(userId);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Validate response with Zod
      const responseData = { user };
      userSchema.parse(user);
      
      return NextResponse.json(responseData);
    }
    
    if (includeStats) {
      // Get all users with statistics
      const usersWithStats = await getAllUsersWithStats();
      
      // Validate response with Zod
      const responseData = { users: usersWithStats };
      z.array(userWithStatsSchema).parse(usersWithStats);
      
      return NextResponse.json(responseData);
    } else {
      // Get all users without statistics
      const users = await getAllUsers();
      
      // Validate response with Zod
      const responseData = { users };
      z.array(userSchema).parse(users);
      
      return NextResponse.json(responseData);
    }

  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('Validation Error: Response data structure is invalid');
      return NextResponse.json(
        { error: 'Invalid response data structure' },
        { status: 500 }
      );
    }
    
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});
