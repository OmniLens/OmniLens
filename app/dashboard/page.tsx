"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Plus,
  Trash2,
  Package,
  Github,
  Settings,
  Loader,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CompactMetricsOverview from "@/components/CompactMetricsOverview";
import RepositoryCardSkeleton, { SingleRepositorySkeleton } from "@/components/RepositoryCardSkeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";
import { useDashboardRepositoriesBatch } from "@/lib/hooks/use-dashboard-repositories-batch";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Helper function to format repository name for display
function formatRepoDisplayName(repoName: string): string {
  const repoNamePart = repoName.split('/').pop() || repoName;
  
  // Special case for nuqs - keep it lowercase
  if (repoNamePart.toLowerCase() === 'nuqs') {
    return 'nuqs';
  }
  
  return repoNamePart
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

// Helper function to find where a new repository should be inserted in the sorted list
function findInsertIndex(repositories: any[], newRepoDisplayName: string): number {
  const formattedNewName = formatRepoDisplayName(newRepoDisplayName);

  for (let i = 0; i < repositories.length; i++) {
    const existingFormattedName = formatRepoDisplayName(repositories[i].displayName);
    if (formattedNewName.localeCompare(existingFormattedName) < 0) {
      return i; // Insert before this item
    }
  }

  return repositories.length; // Insert at the end
}

// Type for display items (can be repository or skeleton)
type DisplayItem = {
  isSkeleton?: boolean;
  displayName?: string;
} & {
  slug?: string;
  repoPath?: string;
  displayName: string;
  avatarUrl?: string;
  htmlUrl?: string;
  visibility?: 'public' | 'private';
  hasError?: boolean;
  errorMessage?: string;
  hasWorkflows?: boolean;
  metrics?: any;
  isUserRepo?: boolean;
  onRequestDelete?: () => void;
};

interface RepositoryCardProps {
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

function RepositoryCard({
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
  const owner = (repoPath || displayName || '').split('/')[0] || '';
  
  const cardContent = (
    <Card className={`relative h-full transition-all duration-200 ${
      hasError 
        ? 'border-red-500 bg-card hover:border-red-400' 
        : 'border-border bg-card hover:border-border/80 hover:shadow-md'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt={`${owner} avatar`}
                className="h-6 w-6 rounded-full border border-border"
                width={24}
                height={24}
                unoptimized
                priority
              />
            )}
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">
                {formatRepoDisplayName(displayName)}
              </CardTitle>
              {visibility && (
                <Badge variant={visibility === 'private' ? 'secondary' : 'outline'} className="text-xs">
                  {visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasError && <AlertCircle className="h-5 w-5 text-red-500" />}
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
      <CardContent>
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
            hasActivity={metrics.hasActivity}
          />
        ) : (
          <div className="space-y-2">
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
      <div className="opacity-75">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="block transition-all duration-200 hover:scale-[1.02] cursor-pointer" onClick={() => window.location.href = `/dashboard/${repoSlug}`}>
      {cardContent}
    </div>
  );
}

function NoRepositoriesFound({
  newRepoUrl,
  isValidating,
  isAdding,
  addError,
  onUrlChange,
  onSubmit,
}: {
  newRepoUrl: string;
  isValidating: boolean;
  isAdding: boolean;
  addError: string | null;
  onUrlChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-xl">
        <div className="border rounded-lg bg-card/60 backdrop-blur-sm p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">No repositories yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a GitHub repository to start tracking workflows and metrics.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <input
              type="text"
              value={newRepoUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="owner/repo or GitHub URL"
              disabled={isValidating || isAdding}
              className="w-full sm:w-80 px-3 py-2 rounded-md bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2 justify-center">
              <Button type="submit" size="sm" disabled={isValidating || isAdding} className="gap-2">
                <Plus className="h-4 w-4" />
                {isValidating ? 'Validating…' : isAdding ? 'Adding…' : 'Add Repo'}
              </Button>
            </div>
          </form>
          {addError && (
            <p className="mt-2 text-sm text-red-500">{addError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardHomePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const queryClient = useQueryClient();
  
  // Use the new batch hook for repository data (single request, parallel loading)
  const {
    data: dashboardData,
    isLoading,
    error,
    isError
  } = useDashboardRepositoriesBatch();

  // Extract repositories from the batch response
  const repositories = dashboardData?.repositories || [];

  // Local state for UI interactions
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newRepoUrl, setNewRepoUrl] = React.useState("");
  const [addError, setAddError] = React.useState<string | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState<'idle' | 'validating' | 'adding' | 'getting-data'>('idle');
  const [repoToDelete, setRepoToDelete] = React.useState<{
    slug: string;
    displayName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deletingRepoSlug, setDeletingRepoSlug] = React.useState<string | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  // Clear delete modal and deleting state when repository is no longer in the list
  React.useEffect(() => {
    if (repoToDelete && dashboardData?.repositories) {
      const repoExists = dashboardData.repositories.some(repo => repo.slug === repoToDelete.slug);
      if (!repoExists) {
        setRepoToDelete(null);
        setIsDeleting(false);
        setDeletingRepoSlug(null);
      }
    }
  }, [dashboardData, repoToDelete]);

  // Process each repository to check for errors and workflow data
  const repositoryData: DisplayItem[] = repositories.map(repo => ({
    ...repo,
    hasError: false,
    errorMessage: ''
  })).sort((a, b) => {
    const repoNameA = formatRepoDisplayName(a.displayName);
    const repoNameB = formatRepoDisplayName(b.displayName);
    return repoNameA.localeCompare(repoNameB);
  });

  // Use repository data directly (no skeleton needed with modal)
  const displayData: DisplayItem[] = repositoryData;

  // Add repository mutation
  const addRepoMutation = useMutation({
    mutationFn: async (repoData: any) => {
      const response = await fetch('/api/repo/add', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to add repository');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCurrentStep('getting-data');
      
      // If workflow data was returned, optimistically update the cache
      if (data.workflowData) {
        // Get current dashboard data
        const currentData = queryClient.getQueryData(['dashboard-repositories-batch']);

        if (currentData && typeof currentData === 'object' && 'repositories' in currentData) {
          const dashboardData = currentData as { repositories: any[]; totalCount: number; loadedAt: string };

          // Create enhanced repository object with workflow data
          const enhancedRepo = {
            ...data.repo,
            hasWorkflows: data.workflowData.workflows.length > 0,
            metrics: data.workflowData.todayMetrics,
            hasError: false,
            errorMessage: null
          };

          // Find where this repository should be inserted (alphabetically sorted)
          const insertIndex = findInsertIndex(dashboardData.repositories, enhancedRepo.displayName);

          // Insert the new repository at the correct position
          const updatedRepositories = [
            ...dashboardData.repositories.slice(0, insertIndex),
            enhancedRepo,
            ...dashboardData.repositories.slice(insertIndex)
          ];

          queryClient.setQueryData(['dashboard-repositories-batch'], {
            repositories: updatedRepositories,
            totalCount: updatedRepositories.length,
            loadedAt: new Date().toISOString()
          });
        }
      } else {
        // Fallback: invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['dashboard-repositories-batch'] });
      }

      // Small delay to show the "getting data" step before closing
      setTimeout(() => {
        setNewRepoUrl('');
        setShowAddForm(false);
        setShowAddModal(false);
        setAddError(null);
        setCurrentStep('idle');
      }, 1000);
    },
    onError: (error) => {
      setAddError(error.message);
      setCurrentStep('idle');
    },
  });

  // Delete repository mutation
  const deleteRepoMutation = useMutation({
    mutationFn: async (slug: string) => {
      const response = await fetch(`/api/repo/${slug}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete repository');
      }
    },
    onMutate: (slug) => {
      // Set deleting state and track which repo is being deleted
      setIsDeleting(true);
      setDeletingRepoSlug(slug);
    },
    onSuccess: (data, slug) => {
      // Invalidate the batch dashboard query and any related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-repositories-batch'] });
      queryClient.invalidateQueries({ queryKey: ['repository-workflows', slug] });
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', slug] });
      queryClient.invalidateQueries({ queryKey: ['workflow-overview', slug] });
      queryClient.invalidateQueries({ queryKey: ['yesterday-workflow-runs', slug] });
      // Keep deleting state until UI updates and removes the card
    },
    onSettled: () => {
      // Don't clear deleting state here - it will be cleared by useEffect when card is removed
    },
    onError: (error) => {
      console.error('Delete error:', error);
      // Clear deleting state on error
      setIsDeleting(false);
      setDeletingRepoSlug(null);
    },
  });

  async function handleAddRepo(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setAddError(null);
    setCurrentStep('idle');
    const input = newRepoUrl.trim();
    if (!input) {
      setAddError('Please enter a GitHub repository URL or owner/repo');
      return;
    }

    // Start validation
    setIsValidating(true);
    setCurrentStep('validating');
    try {
      // Step 1: Validate the repository
      const validateRes = await fetch('/api/repo/validate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: input }),
      });
      const validateJson = await validateRes.json();

      if (!validateRes.ok || validateJson.valid === false) {
        setAddError(validateJson?.error || 'Repository validation failed');
        setCurrentStep('idle');
        return;
      }

      // Validation successful, now adding
      setIsValidating(false);
      setIsAdding(true);
      setCurrentStep('adding');

      // Step 2: Add the repository using mutation
      await addRepoMutation.mutateAsync({
        repoPath: validateJson.repoPath,
        displayName: validateJson.displayName,
        htmlUrl: validateJson.htmlUrl,
        defaultBranch: validateJson.defaultBranch,
        avatarUrl: validateJson.avatarUrl
      });

    } catch (err) {
      if (err instanceof Error) {
        setAddError(err.message);
      } else {
        setAddError('Network error processing repository');
      }
      setCurrentStep('idle');
    } finally {
      setIsValidating(false);
      setIsAdding(false);
    }
  }

  const handleAddRepoClick = () => {
    if (repositories.length > 0) {
      setShowAddModal(true);
    } else {
      setShowAddForm(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading state for authentication
  if (isPending) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <p className="text-muted-foreground text-red-600">
              Error: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state with skeleton cards while fetching data
  if (isLoading && repositories.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex justify-end mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {/* Add Repo button skeleton */}
                <div className="h-8 w-24 bg-muted animate-pulse rounded-md"></div>
                {/* Settings button skeleton */}
                <div className="h-8 w-8 bg-muted animate-pulse rounded-md"></div>
              </div>
            </div>
          </div>

          {/* Show skeleton cards while loading */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RepositoryCardSkeleton count={6} />
          </div>
        </div>
      </div>
    );
  }

  // Only show "No repositories" if we're not loading and actually have no repos
  if (!isLoading && repositories.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Settings"
                  className="flex items-center justify-center gap-0 px-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center">
                    <Settings className="h-4 w-4" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="cursor-default">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <NoRepositoriesFound
            newRepoUrl={newRepoUrl}
            isValidating={isValidating}
            isAdding={isAdding}
            addError={addError}
            onUrlChange={(v) => {
              setNewRepoUrl(v);
              // Clear error when user starts typing
              if (addError) {
                setAddError(null);
              }
            }}
            onSubmit={handleAddRepo}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex justify-end mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {showAddForm && (
                  <form onSubmit={handleAddRepo} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRepoUrl}
                      onChange={(e) => {
                        setNewRepoUrl(e.target.value);
                        // Clear error when user starts typing
                        if (addError) {
                          setAddError(null);
                        }
                      }}
                      placeholder="owner/repo or GitHub URL"
                      disabled={isValidating || isAdding}
                      className={`w-80 px-3 py-2 rounded-md bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-primary ${
                        addError ? 'animate-shake' : ''
                      }`}
                      onAnimationEnd={() => {
                        if (addError) {
                          setNewRepoUrl("");
                        }
                      }}
                      autoFocus
                      onFocus={() => {
                        if (addError) {
                          setNewRepoUrl("");
                        }
                      }}
                      onBlur={() => {
                        if (!isValidating && !isAdding) {
                          setShowAddForm(false);
                          setAddError(null);
                          setNewRepoUrl("");
                        }
                      }}
                    />
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={isValidating || isAdding || repositories.length >= 12} 
                      onMouseDown={(e) => e.preventDefault()} 
                      className="z-0"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isValidating ? 'Validating…' : isAdding ? 'Adding…' : 'Add Repo'}
                    </Button>
                  </form>
                )}
                {!showAddForm && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddRepoClick}
                    disabled={repositories.length >= 12}
                    aria-label="Add repository"
                    className="flex items-center justify-center gap-2 px-3"
                  >
                    <Plus className="h-4 w-4" />
                    Add Repo
                  </Button>
                )}
                {repositories.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="Settings"
                        className="flex items-center justify-center gap-0 px-2"
                      >
                        <span className="flex h-7 w-7 items-center justify-center">
                          <Settings className="h-4 w-4" />
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled className="cursor-default">
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayData.map((item, index) => (
              <RepositoryCard
                key={item.slug || `repo-${index}`}
                repoSlug={item.slug!}
                repoPath={item.repoPath!}
                displayName={item.displayName}
                avatarUrl={item.avatarUrl}
                htmlUrl={item.htmlUrl}
                visibility={item.visibility}
                hasError={item.hasError || false}
                errorMessage={item.errorMessage}
                hasWorkflows={item.hasWorkflows}
                metrics={item.metrics}
                isUserRepo={true}
                onRequestDelete={() => setRepoToDelete({ slug: item.slug!, displayName: item.displayName })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Delete Repository Modal */}
      <Modal
        isOpen={!!repoToDelete}
        onClose={() => {
          setRepoToDelete(null);
          setIsDeleting(false);
          setDeletingRepoSlug(null);
        }}
        title="Remove repository"
        footer={
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => {
              setRepoToDelete(null);
              setIsDeleting(false);
              setDeletingRepoSlug(null);
            }}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!repoToDelete) return;
                deleteRepoMutation.mutate(repoToDelete.slug);
              }}
              disabled={deleteRepoMutation.isPending || (isDeleting && deletingRepoSlug === repoToDelete?.slug)}
            >
              {deleteRepoMutation.isPending || (isDeleting && deletingRepoSlug === repoToDelete?.slug) ? 'Deleting…' : 'Remove'}
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove
            {" "}
            <span className="font-medium text-foreground">{formatRepoDisplayName(repoToDelete?.displayName || '')}</span>?
          </p>
        </div>
      </Modal>

      {/* Add Repository Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewRepoUrl("");
          setAddError(null);
          setCurrentStep('idle');
        }}
        title="Add repository"
        footer={
          <ModalFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowAddModal(false);
                setNewRepoUrl("");
                setAddError(null);
                setCurrentStep('idle');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddRepo}
              disabled={currentStep !== 'idle' || !newRepoUrl.trim()}
            >
              {currentStep !== 'idle' ? 'Adding...' : 'Add'}
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={newRepoUrl}
              onChange={(e) => {
                setNewRepoUrl(e.target.value);
                // Clear error when user starts typing
                if (addError) {
                  setAddError(null);
                }
              }}
              placeholder="owner/repo or GitHub URL"
              disabled={currentStep !== 'idle'}
              className={`w-full px-3 py-2 rounded-md bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-primary ${
                addError ? 'border-red-500' : ''
              }`}
              autoFocus
            />
            {addError && (
              <p className="mt-2 text-sm text-red-500">{addError}</p>
            )}
          </div>
          
          {/* Progress Indicator */}
          {currentStep !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {currentStep === 'validating' ? (
                  <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                ) : currentStep === 'adding' || currentStep === 'getting-data' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${currentStep === 'validating' ? 'text-blue-600' : currentStep === 'adding' || currentStep === 'getting-data' ? 'text-green-600' : 'text-gray-500'}`}>
                  Validating repository
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {currentStep === 'adding' ? (
                  <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                ) : currentStep === 'getting-data' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${currentStep === 'adding' ? 'text-blue-600' : currentStep === 'getting-data' ? 'text-green-600' : 'text-gray-500'}`}>
                  Adding to dashboard
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {currentStep === 'getting-data' ? (
                  <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${currentStep === 'getting-data' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Getting workflow data
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
