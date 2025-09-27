import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';

// In-memory store for invalidated tokens (in production, use Redis or database)
const invalidatedTokens = new Set<string>();

/**
 * Admin API Token Authentication
 * This provides a separate authentication mechanism for admin endpoints
 * that is completely isolated from user sessions.
 */

// Generate a secure admin token
export function generateAdminToken(): string {
  const randomBytes = require('crypto').randomBytes(32);
  return randomBytes.toString('hex');
}

// Hash the token for secure storage
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Verify a token against its hash
export function verifyToken(token: string, hashedToken: string): boolean {
  const tokenHash = hashToken(token);
  return timingSafeEqual(
    Buffer.from(tokenHash, 'hex'),
    Buffer.from(hashedToken, 'hex')
  );
}

// Invalidate a token (mark as unusable)
export function invalidateToken(token: string): void {
  const tokenHash = hashToken(token);
  invalidatedTokens.add(tokenHash);
}

// Check if a token is invalidated
export function isTokenInvalidated(token: string): boolean {
  const tokenHash = hashToken(token);
  return invalidatedTokens.has(tokenHash);
}

// Clear all invalidated tokens (for testing)
export function clearInvalidatedTokens(): void {
  invalidatedTokens.clear();
}

/**
 * Validate admin API token from request headers
 */
export async function validateAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Admin token required',
      response: NextResponse.json(
        { error: 'Admin token required. Use Authorization: Bearer <token>' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // Get the admin token from environment variables
  const adminToken = process.env.ADMIN_API_TOKEN;
  
  if (!adminToken) {
    console.error('ADMIN_API_TOKEN environment variable not set');
    return {
      authenticated: false,
      error: 'Admin authentication not configured',
      response: NextResponse.json(
        { error: 'Admin authentication not configured' },
        { status: 500 }
      ),
    };
  }

  // Check if token is invalidated
  if (isTokenInvalidated(token)) {
    return {
      authenticated: false,
      error: 'Token has been invalidated',
      response: NextResponse.json(
        { error: 'Token has been invalidated' },
        { status: 403 }
      ),
    };
  }

  // Verify the token
  if (!verifyToken(token, adminToken)) {
    return {
      authenticated: false,
      error: 'Invalid admin token',
      response: NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 403 }
      ),
    };
  }

  return {
    authenticated: true,
  };
}

/**
 * Higher-order function to protect admin API routes with token authentication
 * Usage: export const GET = withAdminAuth(async (request) => { ... })
 */
export function withAdminAuth(
  handler: (request: NextRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await validateAdminToken(request);
    
    if (!authResult.authenticated) {
      return authResult.response!;
    }
    
    return handler(request);
  };
}
