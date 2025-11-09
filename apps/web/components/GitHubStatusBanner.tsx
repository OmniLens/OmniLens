"use client";

// External library imports
import React, { useState } from 'react';
import { AlertTriangle, X, ExternalLink, RefreshCw } from 'lucide-react';

// Internal component imports
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Hook imports
import { useGitHubStatus, getStatusColorClasses } from '@/lib/hooks/use-github-status';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the GitHubStatusBanner component
 */
interface GitHubStatusBannerProps {
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * GitHubStatusBanner component
 * Displays a banner showing GitHub Actions status when there are outages
 * Only shows for partial or major outages, hides for operational/degraded performance
 * Includes dismiss functionality and links to GitHub status page
 * @param className - Optional additional CSS classes
 */
export default function GitHubStatusBanner({ 
  className = '', 
}: GitHubStatusBannerProps) {
  const { data: statusData, isLoading, error, refetch } = useGitHubStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  // Don't show banner if dismissed by user
  if (isDismissed) {
    return null;
  }

  // Don't show banner if there's an error and no cached data
  if (error && !statusData) {
    return null;
  }

  // Don't show banner if still loading and no cached data
  if (isLoading && !statusData) {
    return null;
  }

  // Only show banner if there are actual issues (not operational, unknown, or degraded performance)
  if (!statusData?.hasIssues || 
      statusData?.status === 'operational' || 
      statusData?.status === 'unknown' ||
      statusData?.status === 'degraded_performance') {
    return null;
  }

  // ============================================================================
  // Computed Values
  // ============================================================================

  const status = statusData?.status || 'unknown';
  const message = statusData?.message || 'GitHub Actions status unknown';
  const lastUpdated = statusData?.lastUpdated;
  const colors = getStatusColorClasses(status);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get status icon based on outage type
   * @returns AlertTriangle icon component
   */
  const getStatusIcon = () => {
    switch (status) {
      case 'partial_outage':
      case 'major_outage':
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />;
      default:
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />;
    }
  };

  /**
   * Get human-readable status text
   * @returns Status text string
   */
  const getStatusText = () => {
    switch (status) {
      case 'partial_outage':
        return 'Partial Outage';
      case 'major_outage':
        return 'Major Outage';
      default:
        return 'Unknown';
    }
  };

  /**
   * Format last updated timestamp to relative time
   * @param timestamp - ISO timestamp string
   * @returns Formatted relative time string (e.g., "Just now", "5m ago", "2h ago")
   */
  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={`relative ${className}`}>
      {/* Banner Container - Color-coded based on outage severity */}
      <div className={`
        border rounded-lg p-3 sm:p-4 backdrop-blur-sm transition-all duration-300 animate-slide-in-down
        ${colors.bg} ${colors.border} border
        ${status === 'major_outage' ? 'border-red-500' : ''}
      `}>
        <div className="flex items-start justify-between gap-3">
          {/* Content Section - Icon, title, message, and timestamp */}
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Status Icon */}
            <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
              {getStatusIcon()}
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              {/* Header - Title, badge, and action buttons */}
              <div className="flex items-center justify-between gap-2">
                {/* Title and Status Badge */}
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium text-sm sm:text-base ${colors.text}`}>
                    GitHub Actions
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${colors.bg} ${colors.text} ${colors.border} border flex-shrink-0`}
                  >
                    {getStatusText()}
                  </Badge>
                </div>
                {/* Action Buttons - Refresh, external link, dismiss */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Refresh Button - Reloads status data */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${colors.text} hover:bg-white/10`}
                    title="Refresh status"
                  >
                    <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  
                  {/* External Link Button - Opens GitHub Status page */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://www.githubstatus.com/', '_blank', 'noopener,noreferrer')}
                    className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${colors.text} hover:bg-white/10`}
                    title="View GitHub Status Page"
                  >
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  {/* Dismiss Button - Hides the banner */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDismissed(true)}
                    className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${colors.text} hover:bg-white/10`}
                    title="Dismiss banner"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Status Message - Description of the outage */}
              <p className={`text-xs sm:text-sm ${colors.text} opacity-90 mt-1 line-clamp-2`}>
                {message}
              </p>
              
              {/* Last Updated Timestamp - Relative time display */}
              {lastUpdated && (
                <p className={`text-xs ${colors.text} opacity-60 mt-1`}>
                  Updated {formatLastUpdated(lastUpdated)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
