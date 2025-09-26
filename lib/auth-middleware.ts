import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { APIError } from 'better-auth/api';

/**
 * Authentication middleware for API routes
 * Validates the session and returns user information if authenticated
 */
export async function validateAuth(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
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
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, context: any, authData: { user: any; session: any }) => Promise<NextResponse>,
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return authResult.response!;
    }
    
    return handler(request, args[0], {
      user: authResult.user,
      session: authResult.session,
    });
  };
}
