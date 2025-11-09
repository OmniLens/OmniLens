// External library imports
import { NextResponse } from 'next/server';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * GitHub Status API component structure
 */
interface GitHubStatusComponent {
  id: string;
  name: string;
  status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage';
  created_at: string;
  updated_at: string;
  position: number;
  description: string | null;
  showcase: boolean;
  start_date: string | null;
  end_date: string | null;
  page_id: string;
  group_id: string | null;
  components: string[];
  only_show_if_degraded: boolean;
}

/**
 * GitHub Status API page structure
 */
interface GitHubStatusPage {
  id: string;
  name: string;
  url: string;
  time_zone: string;
  updated_at: string;
}

/**
 * GitHub Status API response structure
 */
interface GitHubStatusResponse {
  page: GitHubStatusPage;
  components: GitHubStatusComponent[];
}

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/github-status
 * 
 * Fetches GitHub Actions status from GitHub Status API.
 * Filters for Actions-related components and returns simplified status information.
 * 
 * @openapi
 * /api/github-status:
 *   get:
 *     summary: Get GitHub Actions status
 *     description: Fetches GitHub Actions status from GitHub Status API and returns simplified status information
 *     tags:
 *       - Status
 *     responses:
 *       200:
 *         description: Successfully retrieved GitHub Actions status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasIssues:
 *                   type: boolean
 *                   description: Whether GitHub Actions has any issues
 *                 status:
 *                   type: string
 *                   enum: [operational, degraded_performance, partial_outage, major_outage]
 *                   description: Current status of GitHub Actions
 *                 message:
 *                   type: string
 *                   description: Human-readable status message
 *                 components:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                 source:
 *                   type: string
 *                   enum: [GitHub Status API, fallback]
 *                 error:
 *                   type: string
 *                   description: Error message if status fetch failed (only in fallback)
 *       500:
 *         description: Internal server error (fallback response still returns 200)
 */
export async function GET() {
  try {
    // Fetch GitHub Status API data with caching to avoid rate limits
    const response = await fetch('https://www.githubstatus.com/api/v2/components.json', {
      headers: {
        'User-Agent': 'OmniLens/1.0',
        'Accept': 'application/json',
      },
      // Cache for 1 minute to avoid hitting rate limits
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`GitHub Status API responded with ${response.status}`);
    }

    // Parse GitHub Status API response
    const data: GitHubStatusResponse = await response.json();
    
    // Filter for GitHub Actions related components (more specific filtering)
    const actionsComponents = data.components.filter(component => 
      component.name.toLowerCase().includes('actions') ||
      component.name.toLowerCase().includes('workflows')
    );

    // Check if any Actions components have issues
    // Only consider it an issue if there are actual problems (not just degraded performance)
    const hasIssues = actionsComponents.some(component => 
      component.status === 'partial_outage' || component.status === 'major_outage'
    );

    // Helper function to get status severity for comparison
    const getStatusSeverity = (status: string): number => {
      switch (status) {
        case 'major_outage': return 4;
        case 'partial_outage': return 3;
        case 'degraded_performance': return 2;
        case 'operational': return 1;
        default: return 0;
      }
    };

    // Find the most severe component status
    const mostSevereComponent = actionsComponents.reduce((prev, current) => {
      const prevSeverity = getStatusSeverity(prev.status);
      const currentSeverity = getStatusSeverity(current.status);
      return currentSeverity > prevSeverity ? current : prev;
    }, actionsComponents[0]);

    // Build simplified status information response
    const statusInfo = {
      hasIssues,
      status: hasIssues ? mostSevereComponent?.status || 'operational' : 'operational',
      message: hasIssues 
        ? `GitHub Actions is experiencing ${mostSevereComponent?.status.replace('_', ' ')}`
        : 'GitHub Actions is operational',
      components: actionsComponents.map(component => ({
        name: component.name,
        status: component.status,
        description: component.description
      })),
      lastUpdated: new Date().toISOString(),
      source: 'GitHub Status API' as const
    };

    return NextResponse.json(statusInfo, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });

  } catch (error: unknown) {
    // Handle errors gracefully - return fallback response instead of failing
    console.error('Error fetching GitHub status:', error);
    
    // Return fallback response (assume operational when status unavailable)
    // Don't show banner when we can't fetch status - assume operational
    return NextResponse.json({
      hasIssues: false,
      status: 'operational',
      message: 'GitHub Actions status unavailable - assuming operational',
      components: [],
      lastUpdated: new Date().toISOString(),
      source: 'fallback' as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 200, // Don't fail the request, just return unknown status
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  }
}
