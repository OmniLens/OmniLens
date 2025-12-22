"use client";

// External library imports
import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Internal component imports
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

// Utility imports
import { formatRepoDisplayName } from "@/lib/utils";

// Hook imports
import { useSession } from "@/lib/auth-client";

// ============================================================================
// Type Definitions
// ============================================================================

interface SidebarLayoutProps {
  children: ReactNode;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Read sidebar state from cookie
 * Returns the stored sidebar state or null if not found
 */
function getSidebarStateFromCookie(): boolean | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const sidebarCookie = cookies.find(cookie => 
    cookie.trim().startsWith('sidebar_state=')
  );
  
  if (sidebarCookie) {
    const value = sidebarCookie.split('=')[1];
    return value === 'true';
  }
  
  return null;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SidebarLayout component
 * Wraps authenticated pages with sidebar navigation
 * Only renders sidebar for authenticated users on authenticated routes
 * Excludes landing page (/) and login page (/login)
 * Forces sidebar closed when navigating to dashboard page
 */
export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  
  // Initialize sidebar state from cookie or default based on page
  const isDashboardPage = pathname === '/dashboard';
  const cookieState = getSidebarStateFromCookie();
  const initialOpen = isDashboardPage ? false : (cookieState ?? true);
  
  const [sidebarOpen, setSidebarOpen] = useState(initialOpen);

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Routes that should not show the sidebar
  const noSidebarRoutes = ['/', '/login', '/changelog'];
  const isBlogPage = pathname?.startsWith('/blog');
  const shouldShowSidebar = session && !isPending && !noSidebarRoutes.includes(pathname || '') && !isBlogPage;

  // Determine if we're on a repo page and extract repo slug
  const isRepoPage = pathname?.startsWith('/dashboard/') && pathname !== '/dashboard';
  const repoSlug = isRepoPage ? pathname.split('/').slice(2)[0] : null;

  // ============================================================================
  // Effects
  // ============================================================================

  // Force sidebar closed when navigating to dashboard page
  // Always collapsed on dashboard, regardless of previous state
  useEffect(() => {
    if (isDashboardPage) {
      setSidebarOpen(false);
    } else {
      // On repo pages, restore from cookie if available, otherwise default to open
      const cookieState = getSidebarStateFromCookie();
      setSidebarOpen(cookieState ?? true);
    }
  }, [isDashboardPage, pathname]);

  // ============================================================================
  // Render Logic
  // ============================================================================

  // Don't render sidebar if not authenticated, still loading, or on excluded routes
  // This allows unauthenticated pages (login, landing) to render without sidebar
  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  // Render sidebar layout for authenticated users on authenticated routes
  // Use controlled state to force closed on dashboard, allow normal state on repo pages
  return (
    <SidebarProvider 
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          {/* Repo name - Only shown on repo pages */}
          {isRepoPage && repoSlug && (
            <div className="flex items-center min-w-0">
              <h1 className="text-lg font-semibold truncate">
                {formatRepoDisplayName(repoSlug.replace(/-/g, '/'))}
              </h1>
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

