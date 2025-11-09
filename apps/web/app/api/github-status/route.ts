import { NextResponse } from 'next/server';

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

interface GitHubStatusPage {
  id: string;
  name: string;
  url: string;
  time_zone: string;
  updated_at: string;
}

interface GitHubStatusResponse {
  page: GitHubStatusPage;
  components: GitHubStatusComponent[];
}

export async function GET() {
  try {
    // Fetch GitHub Status API data
    const response = await fetch('https://www.githubstatus.com/api/v2/components.json', {
      headers: {
        'User-Agent': 'OmniLens/1.0',
        'Accept': 'application/json',
      },
      // Add cache control to avoid hitting rate limits
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`GitHub Status API responded with ${response.status}`);
    }

    const data: GitHubStatusResponse = await response.json();
    
    // Filter for GitHub Actions related components (more specific)
    const actionsComponents = data.components.filter(component => 
      component.name.toLowerCase().includes('actions') ||
      component.name.toLowerCase().includes('workflows')
    );

    // Check if any Actions components have issues
    // Only consider it an issue if there are actual problems (not just degraded performance)
    const hasIssues = actionsComponents.some(component => 
      component.status === 'partial_outage' || component.status === 'major_outage'
    );

    // Get the most severe status
    const getStatusSeverity = (status: string) => {
      switch (status) {
        case 'major_outage': return 4;
        case 'partial_outage': return 3;
        case 'degraded_performance': return 2;
        case 'operational': return 1;
        default: return 0;
      }
    };

    const mostSevereComponent = actionsComponents.reduce((prev, current) => {
      const prevSeverity = getStatusSeverity(prev.status);
      const currentSeverity = getStatusSeverity(current.status);
      return currentSeverity > prevSeverity ? current : prev;
    }, actionsComponents[0]);

    // Return simplified status information
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
      source: 'GitHub Status API'
    };

    return NextResponse.json(statusInfo, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });

  } catch (error) {
    console.error('Error fetching GitHub status:', error);
    
    // Return a fallback response indicating we couldn't fetch status
    // Don't show banner when we can't fetch status - assume operational
    return NextResponse.json({
      hasIssues: false,
      status: 'operational',
      message: 'GitHub Actions status unavailable - assuming operational',
      components: [],
      lastUpdated: new Date().toISOString(),
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 200, // Don't fail the request, just return unknown status
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  }
}
