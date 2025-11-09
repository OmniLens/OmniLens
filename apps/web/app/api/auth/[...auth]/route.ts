// External library imports
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// ============================================================================
// Better Auth Handler Setup
// ============================================================================

/**
 * Better Auth Next.js handler
 * Handles all authentication routes (login, logout, callback, etc.)
 */
const handler = toNextJsHandler(auth);

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * POST /api/auth/[...auth]
 * 
 * Handles POST requests for authentication operations (login, signup, etc.).
 * This is a catch-all route handled by Better Auth library.
 * 
 * Note: OpenAPI documentation is not included as this is handled by the Better Auth library.
 * Refer to Better Auth documentation for endpoint details.
 * 
 * @param request - Request object from Next.js
 * @returns Authentication response from Better Auth handler
 */
export const POST = async (request: Request) => {
  try {
    return await handler.POST(request);
  } catch (error: unknown) {
    // Handle authentication errors
    console.error('Auth POST error:', error);
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * GET /api/auth/[...auth]
 * 
 * Handles GET requests for authentication operations (session check, callback, etc.).
 * This is a catch-all route handled by Better Auth library.
 * 
 * Note: OpenAPI documentation is not included as this is handled by the Better Auth library.
 * Refer to Better Auth documentation for endpoint details.
 * 
 * @param request - Request object from Next.js
 * @returns Authentication response from Better Auth handler
 */
export const GET = async (request: Request) => {
  try {
    return await handler.GET(request);
  } catch (error: unknown) {
    // Handle authentication errors
    console.error('Auth GET error:', error);
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};