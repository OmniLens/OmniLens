import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAllUsers, getAllUserIds, getUserById, getAllUsersWithStats } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';

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

// GET /api/admin/users - Get all users (admin only)
export const GET = withAuth(async (request: NextRequest, _context, authData) => {
  try {
    // Check if user is admin (you can implement your own admin logic here)
    // For now, we'll allow any authenticated user to see the user list
    // In production, you might want to add role-based access control
    
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
