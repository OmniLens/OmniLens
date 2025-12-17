"use client";

// External library imports
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, Github, BarChart3, ChevronRight } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Hook imports
import { useSession, signOut } from "@/lib/auth-client";

// ============================================================================
// Type Definitions
// ============================================================================

// ============================================================================
// Main Component
// ============================================================================

/**
 * Header component
 * Navigation header for authenticated users
 * Displays logo, navigation links, and user menu with settings/logout
 * Responsive design that matches the application's dark theme aesthetic
 */
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

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
  // Render Logic - Early Returns
  // ============================================================================

  // Don't render header if not authenticated or still loading
  if (isPending || !session) {
    return null;
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section - Logo and Navigation */}
          <div className="flex items-center gap-6">
            {/* Logo and Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 flex-shrink-0">
                <Image
                  src="/omnilens.jpeg"
                  alt="OmniLens"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover rounded-lg"
                  priority
                />
              </div>
              <span className="text-xl font-bold text-foreground">OmniLens</span>
            </Link>

            {/* Navigation Links / Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard">
                <Button
                  variant={pathname === '/dashboard' ? 'secondary' : pathname?.startsWith('/dashboard/') ? 'outline' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Repositories
                </Button>
              </Link>
              {/* Breadcrumb separator and Workflows button - only shown on workflow dashboard pages */}
              {pathname?.startsWith('/dashboard/') && pathname !== '/dashboard' && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                  <Link href={pathname}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Workflows
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Section - User Menu and Actions */}
          <div className="flex items-center gap-3">
            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                >
                  {/* User Avatar */}
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border border-border"
                      unoptimized
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                      <span className="text-xs font-medium text-muted-foreground">
                        {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium leading-none">
                    {session.user?.name || 'User'}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a 
                    href="https://github.com/omnilens/OmniLens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
