// External library imports
import { NextResponse } from 'next/server';

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Force dynamic rendering for health check endpoint
 */
export const dynamic = 'force-dynamic';

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/health
 * 
 * Health check endpoint - no authentication required.
 * Used by health tests and monitoring to verify server is running.
 * 
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns server health status, uptime, and version information. No authentication required.
 *     tags:
 *       - Status
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy]
 *                   description: Health status
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Current server timestamp
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 version:
 *                   type: string
 *                   description: Application version
 *       500:
 *         description: Server is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [unhealthy]
 *                 error:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: unknown) {
    // Handle health check failures
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
