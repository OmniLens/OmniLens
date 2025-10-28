import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { APIError } from 'better-auth/api';

interface User {
  id: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface AuthData {
  user: User;
  session: Session;
}

interface RouteContext {
  params: Record<string, string>;
}

type AuthResult = 
  | { authenticated: true; user: User; session: Session }
  | { authenticated: false; error: string; response: NextResponse };

/**
 * Authentication middleware for API routes
 * Validates the session and returns user information if authenticated
 */
export async function validateAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session?.session) {
      return {
        authenticated: false,
        error: 'Authentication required',
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    return {
      authenticated: true,
      user: session.user,
      session: session.session,
    };
  } catch (error) {
    console.error('Auth validation error:', error);
    
    if (error instanceof APIError) {
      return {
        authenticated: false,
        error: error.message,
        response: NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        ),
      };
    }

    return {
      authenticated: false,
      error: 'Authentication failed',
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Higher-order function to protect API routes with authentication
 * Usage: export const GET = withAuth(async (request, { params }, authData) => { ... })
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: RouteContext, authData: AuthData) => Promise<NextResponse>,
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    return handler(request, args[0] as RouteContext, {
      user: authResult.user,
      session: authResult.session,
    });
  };
}
