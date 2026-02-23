"use client";

// External library imports
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Workflow } from "lucide-react";

// Internal component imports
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Utility imports
import { formatRepoDisplayName, getAvatarLetter, getAvatarColor } from "@/lib/utils";

// Hook imports
import { useRepositories } from "@/lib/hooks/use-repositories";
import { useRepositoryWorkflows, useWorkflowRuns } from "@/lib/hooks/use-repository-dashboard";

// ============================================================================
// Type Definitions
// ============================================================================

interface RepoSwitcherProps {
  currentRepoSlug: string;
}

interface RepoSwitcherMenuItemProps {
  currentRepoSlug: string;
  currentPageType: string;
}

interface WorkflowSwitcherMenuItemProps {
  currentWorkflowId: number;
  repoSlug: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RepoSwitcher component
 * Displays current repository and allows switching between repositories
 * Shows dropdown with all available repos when multiple repos exist
 * Shows static button without dropdown when only one repo exists
 */
export function RepoSwitcher({ currentRepoSlug }: RepoSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data: repositories = [], isLoading } = useRepositories();
  const { state } = useSidebar();

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Find current repo from the list
  const currentRepo = repositories.find((repo) => repo.slug === currentRepoSlug);
  // Sort other repos alphabetically by display name (same as dashboard)
  const otherRepos = repositories
    .filter((repo) => repo.slug !== currentRepoSlug)
    .sort((a, b) => {
      const repoNameA = formatRepoDisplayName(a.displayName);
      const repoNameB = formatRepoDisplayName(b.displayName);
      return repoNameA.localeCompare(repoNameB);
    });
  const hasMultipleRepos = repositories.length > 1;

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle repository selection
   * Navigates to the selected repository's summary page
   */
  const handleRepoSelect = (slug: string) => {
    router.push(`/dashboard/${slug}`);
    setIsOpen(false);
  };

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  // Show loading state
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-sidebar-primary-foreground border-t-transparent" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  // Render button content (shared between dropdown and non-dropdown states)
  const buttonContent = (
    <>
      {currentRepo?.avatarUrl ? (
        <Image
          src={currentRepo.avatarUrl}
          alt={currentRepo.displayName}
          width={32}
          height={32}
          className="flex aspect-square size-8 items-center justify-center rounded-lg object-cover"
          unoptimized
        />
      ) : (
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <span className="text-xs font-medium">
            {currentRepo?.displayName?.[0]?.toUpperCase() || 'R'}
          </span>
        </div>
      )}
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">
          {currentRepo ? formatRepoDisplayName(currentRepo.displayName) : 'Repository'}
        </span>
        <span className="truncate text-xs text-sidebar-foreground/70">
          {currentRepoSlug.replace(/-/g, '/')}
        </span>
      </div>
      {hasMultipleRepos && <ChevronDown className="ml-auto size-4" />}
    </>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {hasMultipleRepos ? (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {buttonContent}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={state === "collapsed" ? "w-56 min-w-56 rounded-lg" : "w-[--radix-dropdown-menu-trigger-width] min-w-35 rounded-lg"}
              align="start"
              side="bottom"
              sideOffset={4}
            >
              {repositories.length > 0 ? (
                <>
                  <DropdownMenuLabel className="text-xs text-sidebar-foreground/70">
                    Your Repositories
                  </DropdownMenuLabel>
                  {otherRepos.length > 0 && (
                    <>
                      {otherRepos.map((repo) => (
                        <DropdownMenuItem
                          key={repo.slug}
                          onClick={() => handleRepoSelect(repo.slug)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            {repo.avatarUrl ? (
                              <Image
                                src={repo.avatarUrl}
                                alt={repo.displayName}
                                width={20}
                                height={20}
                                className="h-5 w-5 rounded object-cover flex-shrink-0"
                                unoptimized
                              />
                            ) : (
                              <div className="flex aspect-square size-5 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">
                                <span className="text-[10px] font-medium">
                                  {repo.displayName[0]?.toUpperCase() || 'R'}
                                </span>
                              </div>
                            )}
                            <span className="truncate flex-1">
                              {formatRepoDisplayName(repo.displayName)}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton size="lg" disabled>
            {buttonContent}
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * RepoSwitcherMenuItem component
 * Sidebar menu item version of repo switcher
 * Preserves current page type when switching repos
 */
export function RepoSwitcherMenuItem({ currentRepoSlug, currentPageType }: RepoSwitcherMenuItemProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data: repositories = [], isLoading } = useRepositories();
  const { state } = useSidebar();

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Find current repo from the list
  const currentRepo = repositories.find((repo) => repo.slug === currentRepoSlug);
  // Sort other repos alphabetically by display name (same as dashboard)
  const otherRepos = repositories
    .filter((repo) => repo.slug !== currentRepoSlug)
    .sort((a, b) => {
      const repoNameA = formatRepoDisplayName(a.displayName);
      const repoNameB = formatRepoDisplayName(b.displayName);
      return repoNameA.localeCompare(repoNameB);
    });
  const hasMultipleRepos = repositories.length > 1;

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle repository selection
   * Navigates to the same page type in the selected repository
   * Preserves page type (summary, workflows, runners, usage)
   */
  const handleRepoSelect = (slug: string) => {
    const pagePath = currentPageType === 'summary' 
      ? `/dashboard/${slug}`
      : `/dashboard/${slug}/${currentPageType}`;
    router.push(pagePath);
    setIsOpen(false);
  };

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  // ============================================================================
  // Main Render
  // ============================================================================

  // Render button content (shared between dropdown and non-dropdown states)
  const buttonContent = isLoading ? (
    <>
      <div className="flex aspect-square size-4 items-center justify-center">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-sidebar-foreground/30 border-t-sidebar-foreground" />
      </div>
      <span>Loading...</span>
    </>
  ) : (
    <>
      <div
        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-black"
        style={{ background: getAvatarColor(currentRepo?.repoPath || currentRepo?.displayName || currentRepoSlug) }}
      >
        {getAvatarLetter(currentRepo?.repoPath || currentRepo?.displayName || currentRepoSlug)}
      </div>
      <span className="truncate">
        {currentRepo ? formatRepoDisplayName(currentRepo.displayName) : 'Repository'}
      </span>
      {hasMultipleRepos && <ChevronDown className="ml-auto size-4" />}
    </>
  );

  return (
    <SidebarMenuItem>
      {hasMultipleRepos ? (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip="Switch Repository"
              disabled={isLoading}
            >
              {buttonContent}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={state === "collapsed" ? "w-56 min-w-56 rounded-lg" : "w-[--radix-dropdown-menu-trigger-width] min-w-35 rounded-lg"}
            align="start"
            side="right"
            sideOffset={4}
          >
            {repositories.length > 0 ? (
              <>
                <DropdownMenuLabel className="text-xs text-sidebar-foreground/70">
                  Your Repositories
                </DropdownMenuLabel>
                {otherRepos.length > 0 && (
                  <>
                    {otherRepos.map((repo) => (
                      <DropdownMenuItem
                        key={repo.slug}
                        onClick={() => handleRepoSelect(repo.slug)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold text-black"
                            style={{ background: getAvatarColor(repo.repoPath || repo.displayName) }}
                          >
                            {getAvatarLetter(repo.repoPath || repo.displayName)}
                          </div>
                          <span className="truncate flex-1">
                            {formatRepoDisplayName(repo.displayName)}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <SidebarMenuButton
          tooltip="Repository"
          disabled={isLoading}
        >
          {buttonContent}
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}

/**
 * WorkflowSwitcherMenuItem component
 * Sidebar menu item for switching between workflows within the current repository.
 * Shows the active workflow name and a dropdown of other workflows in the same repo.
 * Only navigates within the current repo — repo switching is not available here.
 */
export function WorkflowSwitcherMenuItem({ currentWorkflowId, repoSlug }: WorkflowSwitcherMenuItemProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data: workflows = [], isLoading } = useRepositoryWorkflows(repoSlug);
  const { state } = useSidebar();

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Fetch today's runs to classify which workflows are active vs idle
  const today = new Date().toISOString().slice(0, 10);
  const { data: todayRuns = [] } = useWorkflowRuns(repoSlug, today);

  const currentWorkflow = workflows.find((w) => w.id === currentWorkflowId);
  const hasMultipleWorkflows = workflows.length > 1;

  // Build a set of workflow IDs that had at least one run today
  const workflowIdsWithRunsToday = new Set(todayRuns.map((r) => r.workflow_id));

  // Workflows that ran today = "active" (green dot), sorted alphabetically, excluding current
  const activeWorkflows = workflows
    .filter((w) => w.id !== currentWorkflowId && workflowIdsWithRunsToday.has(w.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Workflows with no runs today = "idle" (grey dot), sorted alphabetically, excluding current
  const idleWorkflows = workflows
    .filter((w) => w.id !== currentWorkflowId && !workflowIdsWithRunsToday.has(w.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleWorkflowSelect = (workflowId: number) => {
    router.push(`/dashboard/${repoSlug}/workflow/${workflowId}`);
    setIsOpen(false);
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  const buttonContent = isLoading ? (
    <>
      <div className="flex aspect-square size-4 items-center justify-center">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-sidebar-foreground/30 border-t-sidebar-foreground" />
      </div>
      <span>Loading...</span>
    </>
  ) : (
    <>
      <Workflow className="size-4 flex-shrink-0" />
      <span className="truncate">
        {currentWorkflow?.name ?? `Workflow #${currentWorkflowId}`}
      </span>
      {hasMultipleWorkflows && <ChevronDown className="ml-auto size-4" />}
    </>
  );

  return (
    <SidebarMenuItem>
      {hasMultipleWorkflows ? (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              isActive
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip="Switch Workflow"
              disabled={isLoading}
            >
              {buttonContent}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={state === "collapsed" ? "w-56 min-w-56 rounded-lg" : "w-[--radix-dropdown-menu-trigger-width] min-w-44 rounded-lg"}
            align="start"
            side="right"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-sidebar-foreground/70">
              Workflows
            </DropdownMenuLabel>
            {/* Active workflows — green dot, sorted alphabetically */}
            {activeWorkflows.map((w) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => handleWorkflowSelect(w.id)}
                className="cursor-pointer"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#00e5a0] flex-shrink-0 mr-2" />
                <span className="truncate">{w.name}</span>
              </DropdownMenuItem>
            ))}
            {/* Separator between active and idle groups when both exist */}
            {activeWorkflows.length > 0 && idleWorkflows.length > 0 && (
              <DropdownMenuSeparator />
            )}
            {/* Idle workflows (no runs today) — grey dot, sorted alphabetically */}
            {idleWorkflows.map((w) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => handleWorkflowSelect(w.id)}
                className="cursor-pointer"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0 mr-2" />
                <span className="truncate">{w.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <SidebarMenuButton isActive tooltip="Workflow" disabled={isLoading}>
          {buttonContent}
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}

