"use client";

// External library imports
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Github, BookOpen, FileText, BookCheck, FileCheck, Globe, BarChart3, Sparkles } from "lucide-react";

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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
import { RepoSwitcherMenuItem } from "@/components/RepoSwitcher";

// Utility imports
import packageJson from "../package.json";
import { isFeatureEnabled } from "@/lib/utils";

// Hook imports
import { useSession, signOut } from "@/lib/auth-client";

// ============================================================================
// Type Definitions
// ============================================================================

// ============================================================================
// Main Component
// ============================================================================

/**
 * AppSidebar component
 * Main navigation sidebar for authenticated users
 * Displays logo, navigation items (Summary, Workflows), and user menu
 * Responsive design with collapsible functionality
 * Note: Testing Frameworks menu temporarily disabled - functionality preserved for later restoration
 */
export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

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

  // Determine if we're on a repo-specific page
  const isRepoPage = pathname?.startsWith('/dashboard/') && pathname !== '/dashboard';
  const repoSlug = isRepoPage ? pathname.split('/').slice(2)[0] : null;
  const repoPageType = isRepoPage ? pathname.split('/').slice(3)[0] || 'summary' : null;
  const repoPageSubType = isRepoPage ? pathname.split('/').slice(4)[0] : null;

  // Active state logic
  const isSummaryActive = isRepoPage && (!repoPageType || repoPageType === 'summary');
  // Temporarily disabled - functionality preserved for later restoration
  // const isTestingActive = isRepoPage && repoPageType === 'testing';
  // const isUnitTestsActive = isRepoPage && repoPageType === 'testing' && repoPageSubType === 'unit';
  const isWorkflowsActive = isRepoPage && repoPageType === 'workflows' && !repoPageSubType;
  const isWorkflowSummaryActive = isRepoPage && repoPageType === 'workflows' && !!repoPageSubType;
//   const isRunnersActive = isRepoPage && repoPageType === 'runners';
//   const isUsageActive = isRepoPage && repoPageType === 'usage';

  // Feature flags
  const isUnitTestsEnabled = isFeatureEnabled('UNIT_TESTS');

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
              {/* Repo Switcher - Only shown on repo pages */}
              {isRepoPage && repoSlug ? (
                <RepoSwitcherMenuItem currentRepoSlug={repoSlug} currentPageType={repoPageType || 'summary'} />
              ) : null}

              {/* Repo-specific navigation - Only shown on repo pages */}
              {isRepoPage && repoSlug ? (
                <>
                  {/* Summary - Links to /dashboard/[slug] */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isSummaryActive} tooltip="Summary">
                      <Link href={`/dashboard/${repoSlug}`}>
                        <LayoutDashboard />
                        <span>Summary</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Workflows - Links to /dashboard/[slug]/workflows */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isWorkflowsActive} tooltip="Workflows">
                      <Link href={`/dashboard/${repoSlug}/workflows`}>
                        <BarChart3 />
                        <span>Workflows</span>
                      </Link>
                    </SidebarMenuButton>
                    {isWorkflowSummaryActive && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive tooltip="Summary">
                            <Link href={pathname ?? ''}>
                              <Sparkles />
                              <span>Summary</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>

                  {/* Workflow Summary icon - visible only when sidebar is collapsed (sub-menu is hidden in icon mode) */}
                  {isWorkflowSummaryActive ? (
                    <SidebarMenuItem className="hidden group-data-[collapsible=icon]:flex">
                      <SidebarMenuButton asChild isActive tooltip="Summary">
                        <Link href={pathname ?? ''}>
                          <Sparkles />
                          <span>Summary</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : null}

                  {/* Testing - Links to /dashboard/[slug]/testing with Unit Tests as submenu */}
                  {/* Temporarily disabled - functionality preserved for later restoration */}
                  {/* 
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isTestingActive} tooltip="Testing Frameworks">
                      <Link href={`/dashboard/${repoSlug}/testing`}>
                        <BookCheck />
                        <span>Testing Frameworks</span>
                      </Link>
                    </SidebarMenuButton>
                    {isUnitTestsEnabled && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isUnitTestsActive}>
                            <Link href={`/dashboard/${repoSlug}/testing/unit`}>
                              <FileCheck />
                              <span>Unit Tests</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                  */}

                  {/* Runners - Links to /dashboard/[slug]/runners */}
                  {/* <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isRunnersActive} tooltip="Runners">
                      <Link href={`/dashboard/${repoSlug}/runners`}>
                        <Zap />
                        <span>Runners</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem> */}

                  {/* Usage - Links to /dashboard/[slug]/usage */}
                  {/* <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isUsageActive} tooltip="Usage">
                      <Link href={`/dashboard/${repoSlug}/usage`}>
                        <TrendingUp />
                        <span>Usage</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem> */}
                </>
              ) : null}
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
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full border border-sidebar-border"
                          unoptimized
                        />
                      ) : (
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                          <span className="text-xs font-medium">
                            {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{session.user?.name || 'User'}</span>
                        {session.user?.email && (
                          <span className="truncate text-xs text-sidebar-foreground/70">
                            {session.user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/blog" className="flex items-center cursor-pointer">
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

