// External library imports
import { NextRequest } from 'next/server';

// Internal imports
import type { AuthHeaders } from './test-auth';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CreateAuthenticatedRequestOptions {
  method?: string;
  body?: unknown;
}

// ============================================================================
// Request Creation Utilities
// ============================================================================

/**
 * Create an authenticated NextRequest with session cookie
 * 
 * @param url - The request URL
 * @param authHeaders - Authentication headers containing the session cookie
 * @param options - Optional request options (method, body)
 * @returns A NextRequest instance with authentication cookie set
 * 
 * @example
 * ```typescript
 * const authHeaders = await createAuthHeaders(userId);
 * const request = createAuthenticatedRequest('http://localhost:3000/api/repo', authHeaders);
 * ```
 * 
 * @example
 * ```typescript
 * const authHeaders = await createAuthHeaders(userId);
 * const request = createAuthenticatedRequest(
 *   'http://localhost:3000/api/repo/add',
 *   authHeaders,
 *   { method: 'POST', body: { slug: 'owner/repo' } }
 * );
 * ```
 */
export function createAuthenticatedRequest(
  url: string,
  authHeaders: AuthHeaders,
  options?: CreateAuthenticatedRequestOptions
): NextRequest {
  const method = options?.method || 'GET';
  const hasBody = options?.body !== undefined;
  
  // Extract cookie value from authHeaders.Cookie
  // Format: "better-auth.session_token=<token>"
  const cookieValue = authHeaders.Cookie.split('=')[1];
  
  // Build request options - match original implementation exactly
  const requestOptions: {
    method: string;
    body?: string;
    headers?: Record<string, string>;
  } = {
    method,
  };
  
  // Add body and Content-Type header if body is provided
  if (hasBody) {
    requestOptions.body = JSON.stringify(options.body);
    requestOptions.headers = {
      'Content-Type': 'application/json',
    };
  }
  
  // Create NextRequest - match original implementation exactly
  const request = new NextRequest(url, requestOptions);
  
  // Set cookie using NextRequest's cookie API - this is what the original did
  request.cookies.set('better-auth.session_token', cookieValue);
  
  return request;
}

