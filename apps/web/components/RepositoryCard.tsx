// External library imports
import { AlertCircle, Trash2 } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CompactMetricsOverview from "@/components/CompactMetricsOverview";

// Utility imports
import { formatRepoDisplayName, getAvatarLetter, getAvatarColor } from "@/lib/utils";

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
  } | null;
  /** Optional callback when delete button is clicked - opens confirmation modal */
  onRequestDelete?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RepositoryCard component
 * Displays a single repository card with metrics in mockup style
 * Supports error states and workflow metrics
 */
export default function RepositoryCard({
  repoSlug: _repoSlug,
  repoPath,
  displayName,
  visibility,
  hasError,
  errorMessage,
  hasWorkflows,
  metrics,
  onRequestDelete,
}: RepositoryCardProps) {
  const avatarLetter = getAvatarLetter(repoPath || displayName);
  const avatarColor = getAvatarColor(repoPath || displayName);

  // Card content JSX - reused for both error and normal states
  const cardContent = (
    <Card className={`repository-card relative h-full flex flex-col transition-all duration-200 ${
      hasError
        ? 'border-red-500 bg-card hover:border-red-400'
        : 'border-border bg-card hover:border-border/80 hover:shadow-md'
    }`}>
      {/* Card Header - Avatar, name, public badge, delete button (mockup style) */}
      <CardHeader className="pb-3">
        <div className="drc-head flex items-center gap-2">
          {/* Avatar - Colored square with letter (no GitHub image) */}
          <div
            className="drc-avatar flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold text-black"
            style={{ background: avatarColor }}
          >
            {avatarLetter}
          </div>
          {/* Repository name - aligns with website typography */}
          <span className="drc-name min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {repoPath || formatRepoDisplayName(displayName)}
          </span>
          {/* Public/Private badge - aligns with website typography */}
          {visibility && (
            <span className="drc-pub-badge flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[rgba(77,159,255,0.15)] bg-[rgba(77,159,255,0.08)] px-2 py-0.5 text-xs text-[#4d9fff]">
              <span className="drc-pub-dot h-1 w-1 rounded-full bg-[#4d9fff]" />
              {visibility === 'private' ? 'Private' : 'Public'}
            </span>
          )}
          {/* Error indicator */}
          {hasError && <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />}
          {/* Delete button - opens confirmation modal to remove repo from dashboard */}
          {onRequestDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Remove repository from dashboard"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRequestDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      {/* Card Content - Error message, metrics, or empty state */}
      <CardContent className="flex-1 flex flex-col">
        {hasError ? (
          <div className="space-y-2">
            <p className="text-sm text-red-600">
              {errorMessage || "Unable to access repository"}
            </p>
          </div>
        ) : hasWorkflows && metrics ? (
          <CompactMetricsOverview
            totalWorkflows={metrics.totalWorkflows}
            passedRuns={metrics.passedRuns}
            failedRuns={metrics.failedRuns}
            inProgressRuns={metrics.inProgressRuns}
            successRate={metrics.successRate}
          />
        ) : (
          <div className="space-y-3 flex flex-col justify-center flex-1">
            <p className="text-sm text-muted-foreground">
              No workflows found
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (hasError) {
    return (
      <div className="opacity-75 h-full">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="block h-full transition-all duration-200 hover:scale-[1.02]">
      {cardContent}
    </div>
  );
}
