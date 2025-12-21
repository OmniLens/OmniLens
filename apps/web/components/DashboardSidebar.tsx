"use client";

// External library imports
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Package } from "lucide-react";

// Internal component imports
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// Utility imports
import { formatRepoDisplayName } from "@/lib/utils";

// Hook imports
import { useDashboardRepositoriesBatch, type Repository } from "@/lib/hooks/use-dashboard-repositories-batch";

// ============================================================================
// Type Definitions
// ============================================================================

// ============================================================================
// Main Component
// ============================================================================

/**
 * DashboardSidebar component
 * Sidebar navigation for dashboard pages
 * Displays repositories list and navigation links
 * Matches application's dark theme styling
 */
export default function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: dashboardData, isLoading } = useDashboardRepositoriesBatch();
  const repositories = dashboardData?.repositories || [];

  // Sort repositories alphabetically
  const sortedRepositories = React.useMemo(() => {
    return [...repositories].sort((a, b) => {
      const nameA = formatRepoDisplayName(a.displayName);
      const nameB = formatRepoDisplayName(b.displayName);
      return nameA.localeCompare(nameB);
    });
  }, [repositories]);

  // Determine if we're on a specific repo dashboard
  const currentRepoSlug = pathname?.startsWith('/dashboard/') && pathname !== '/dashboard' 
    ? pathname.split('/dashboard/')[1]?.split('/')[0] 
    : null;

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-semibold text-sm">Navigation</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard'}
                    size="sm"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Repositories</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {sortedRepositories.length > 0 && (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Repositories</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sortedRepositories.map((repo: Repository) => {
                      const isActive = currentRepoSlug === repo.slug;
                      return (
                        <SidebarMenuItem key={repo.slug}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            size="sm"
                          >
                            <Link href={`/dashboard/${repo.slug}`}>
                              <BarChart3 className="h-4 w-4" />
                              <span className="truncate">
                                {formatRepoDisplayName(repo.displayName)}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}

          {isLoading && sortedRepositories.length === 0 && (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Repositories</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>Loading...</span>
                      </div>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-1 flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
