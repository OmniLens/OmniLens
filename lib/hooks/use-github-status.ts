import { useQuery } from '@tanstack/react-query';

interface GitHubStatusComponent {
  name: string;
  status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage';
  description: string | null;
}

interface GitHubStatusData {
  hasIssues: boolean;
  status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'unknown';
  message: string;
  components: GitHubStatusComponent[];
  lastUpdated: string;
  source: string;
  error?: string;
}

async function fetchGitHubStatus(): Promise<GitHubStatusData> {
  const response = await fetch('/api/github-status', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub status: ${response.status}`);
  }
  
  return response.json();
}

export function useGitHubStatus() {
  return useQuery({
    queryKey: ['github-status'],
    queryFn: fetchGitHubStatus,
    refetchInterval: 60000, // Refetch every minute
    refetchIntervalInBackground: true,
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Don't show loading state for status - it's not critical
    placeholderData: (previousData) => previousData,
  });
}

// Helper function to get status severity for sorting/comparison
export function getStatusSeverity(status: string): number {
  switch (status) {
    case 'major_outage': return 4;
    case 'partial_outage': return 3;
    case 'degraded_performance': return 2;
    case 'operational': return 1;
    case 'unknown': return 0;
    default: return 0;
  }
}

// Helper function to get status color classes
export function getStatusColorClasses(status: string): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  switch (status) {
    case 'major_outage':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-400',
        icon: 'text-red-500'
      };
    case 'partial_outage':
      return {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        text: 'text-orange-400',
        icon: 'text-orange-500'
      };
    case 'degraded_performance':
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        text: 'text-yellow-400',
        icon: 'text-yellow-500'
      };
    case 'operational':
      return {
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        text: 'text-green-400',
        icon: 'text-green-500'
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/20',
        text: 'text-gray-400',
        icon: 'text-gray-500'
      };
  }
}
