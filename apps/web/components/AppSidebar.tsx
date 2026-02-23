"use client";

// External library imports
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, LogOut, Github, BookOpen, FileText, Globe } from "lucide-react";

// Internal component imports
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { RepoSwitcherMenuItem, WorkflowSwitcherMenuItem } from "@/components/RepoSwitcher";

// Utility imports
import { getAvatarLetter, getAvatarColor, formatRepoDisplayName } from "@/lib/utils";
import packageJson from "../package.json";

// Hook imports
import { useSession, signOut } from "@/lib/auth-client";
import { useRepositories } from "@/lib/hooks/use-repositories";

// ============================================================================
// Type Definitions
// ============================================================================

// ============================================================================
// Main Component
// ============================================================================

/**
 * AppSidebar component
 * Main navigation sidebar for authenticated users
 * Displays logo, navigation items (Summary), and user menu
 * Responsive design with collapsible functionality
 */
export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: repositories = [] } = useRepositories();

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle user logout
   * Signs out and redirects to login page
   */
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Determine current route context from path segments
  const pathParts = pathname?.split('/') ?? [];
  const isRepositoriesPage = pathname === '/dashboard';
  const isRepoPage = pathParts[1] === 'dashboard' && !!pathParts[2];
  const repoSlug = isRepoPage ? pathParts[2] : null;
  const isWorkflowPage = isRepoPage && pathParts[3] === 'workflow' && !!pathParts[4];
  const workflowId = isWorkflowPage ? parseInt(pathParts[4], 10) : null;
  // currentPageType is used by RepoSwitcherMenuItem to preserve page on repo switch
  const repoPageType = isRepoPage ? pathParts[3] || 'summary' : null;
  // Resolve current repo for avatar display
  const currentRepo = repoSlug ? repositories.find((r) => r.slug === repoSlug) : null;
  const repoAvatarKey = currentRepo?.repoPath || currentRepo?.displayName || repoSlug || '';

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!h-16 group-data-[collapsible=icon]:!p-0">
        {/* Logo and Brand - Always shown */}
        <SidebarGroup className="group-data-[collapsible=icon]:!p-0">
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton asChild size="lg" className="group-data-[collapsible=icon]:!h-7 group-data-[collapsible=icon]:!w-7 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!mx-auto">
                  <Link href="/dashboard">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:!size-7">
                      <Image
                        src="/omnilens.jpeg"
                        alt="OmniLens"
                        width={24}
                        height={24}
                        className="w-full h-full object-cover rounded-lg group-data-[collapsible=icon]:!size-7"
                        priority
                      />
                    </div>
                    <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:!hidden">
                      <span className="truncate font-semibold text-base">OmniLens</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Repositories — always visible, links to the main repos listing */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isRepositoriesPage} tooltip="Repositories">
                  <Link href="/dashboard">
                    <LayoutGrid />
                    <span>Repositories</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Repo context — shown on any repo page */}
              {isRepoPage && repoSlug && (
                <>
                  {/* Repo Dashboard: switcher with dropdown to change repo */}
                  {!isWorkflowPage && (
                    <RepoSwitcherMenuItem
                      currentRepoSlug={repoSlug}
                      currentPageType={repoPageType || 'summary'}
                    />
                  )}

                  {/* Workflow Dashboard: static repo link (no switching) + workflow switcher */}
                  {isWorkflowPage && workflowId && (
                    <>
                      {/* Repo item — links back to repo dashboard, no switcher */}
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Repository Dashboard">
                          <Link href={`/dashboard/${repoSlug}`}>
                            <div
                              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-black"
                              style={{ background: getAvatarColor(repoAvatarKey) }}
                            >
                              {getAvatarLetter(repoAvatarKey)}
                            </div>
                            <span className="truncate">
                              {currentRepo
                                ? formatRepoDisplayName(currentRepo.displayName)
                                : repoSlug.replace(/-/g, '/')}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Workflow switcher — switch between workflows in this repo */}
                      <WorkflowSwitcherMenuItem
                        currentWorkflowId={workflowId}
                        repoSlug={repoSlug}
                      />
                    </>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* User Menu */}
        {session && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    tooltip={session.user?.name || 'User'}
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full border border-sidebar-border flex-shrink-0"
                        unoptimized
                      />
                    ) : (
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <span className="text-xs font-medium">
                          {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-1 items-center text-sm">
                      <span className="truncate font-semibold">{session.user?.name || 'User'}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
                    {session.user?.name || 'User'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/blog" target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Blog
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/changelog" className="flex items-center justify-between cursor-pointer w-full">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Changelog
                      </div>
                      <Badge variant="outline" className="ml-4">v{packageJson.version}</Badge>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a 
                      href="https://github.com/omnilens/OmniLens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center cursor-pointer"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      GitHub
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center cursor-pointer">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

