// External library imports
import Image from "next/image";
import { AlertCircle, Github, Trash2 } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CompactMetricsOverview from "@/components/CompactMetricsOverview";

// Utility imports
import { formatRepoDisplayName } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the RepositoryCard component
 */
export interface RepositoryCardProps {
  repoSlug: string;
  repoPath: string;
  displayName: string;
  avatarUrl?: string;
  htmlUrl?: string;
  visibility?: 'public' | 'private';
  hasError: boolean;
  errorMessage?: string;
  hasWorkflows?: boolean;
  metrics?: {
    totalWorkflows: number;
    passedRuns: number;
    failedRuns: number;
    inProgressRuns: number;
    successRate: number;
    hasActivity: boolean;
  } | null;
  isUserRepo?: boolean;
  onRequestDelete?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RepositoryCard component
 * Displays a single repository card with metrics, actions, and navigation
 * Supports error states, workflow metrics, and delete functionality
 */
export default function RepositoryCard({
  repoSlug,
  repoPath,
  displayName,
  avatarUrl,
  htmlUrl,
  visibility,
  hasError,
  errorMessage,
  hasWorkflows,
  metrics,
  isUserRepo = false,
  onRequestDelete
}: RepositoryCardProps) {
  // Extract owner name from repository path for avatar alt text
  const owner = (repoPath || displayName || '').split('/')[0] || '';
  
  // Card content JSX - reused for both error and normal states
  const cardContent = (
    <Card className={`relative h-full flex flex-col transition-all duration-200 ${
      hasError 
        ? 'border-red-500 bg-card hover:border-red-400' 
        : 'border-border bg-card hover:border-border/80 hover:shadow-md'
    }`}>
      {/* Card Header - Contains repository name, avatar, visibility badge, and action buttons */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Avatar - Owner's GitHub avatar */}
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt={`${owner} avatar`}
                className="h-6 w-6 rounded-full border border-border flex-shrink-0"
                width={24}
                height={24}
                unoptimized
                priority
              />
            )}
            {/* Repository name and visibility badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold truncate">
                {formatRepoDisplayName(displayName)}
              </CardTitle>
              {visibility && (
                <Badge variant={visibility === 'private' ? 'secondary' : 'outline'} className="text-xs flex-shrink-0">
                  {visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                </Badge>
              )}
            </div>
          </div>
          {/* Action buttons - Error indicator, GitHub link, and delete button */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Error indicator */}
            {hasError && <AlertCircle className="h-5 w-5 text-red-500" />}
            {/* GitHub link button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(htmlUrl || `https://github.com/${repoPath}`, '_blank', 'noopener,noreferrer');
              }}
              title="View on GitHub"
              aria-label="View on GitHub"
            >
              <Github className="h-4 w-4" />
            </Button>
            {/* Delete button - Only shown for user repositories */}
            {isUserRepo && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRequestDelete?.();
                }}
                title="Remove repository"
                aria-label="Remove repository"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {/* Card Content - Shows error message, metrics, or empty state */}
      <CardContent className="flex-1 flex flex-col">
        {hasError ? (
          // Error state - Display error message
          <div className="space-y-2">
            <p className="text-sm text-red-600">
              {errorMessage || "Unable to access repository"}
            </p>
          </div>
        ) : hasWorkflows && metrics ? (
          // Metrics state - Show workflow metrics overview
          <CompactMetricsOverview
            totalWorkflows={metrics.totalWorkflows}
            passedRuns={metrics.passedRuns}
            failedRuns={metrics.failedRuns}
            inProgressRuns={metrics.inProgressRuns}
            successRate={metrics.successRate}
            hasActivity={metrics.hasActivity}
          />
        ) : (
          // Empty state - No workflows found (matching height of metrics view)
          <div className="space-y-3 flex flex-col justify-center flex-1">
            <p className="text-sm text-muted-foreground">
              No workflows found
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Error state - show card with reduced opacity
  if (hasError) {
    return (
      <div className="opacity-75 h-full">
        {cardContent}
      </div>
    );
  }

  // Normal state - card display
  return (
    <div className="block h-full transition-all duration-200 hover:scale-[1.02]">
      {cardContent}
    </div>
  );
}

