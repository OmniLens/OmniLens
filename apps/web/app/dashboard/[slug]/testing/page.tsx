"use client";

// External library imports
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FileCheck, Network, MousePointerClick } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Hook imports
import { useSession } from "@/lib/auth-client";

// ============================================================================
// Type Definitions
// ============================================================================

// ============================================================================
// Main Component
// ============================================================================

/**
 * Testing page for a specific repository
 * Displays three test type cards: Unit tests (enabled), API tests and E2E tests (disabled)
 * Supports authentication and navigation
 */
export default function TestingPage() {
  // Extract repository slug from URL params using useParams hook
  const params = useParams();
  const repoSlug = params.slug as string;
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // ============================================================================
  // Effects
  // ============================================================================

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  // Authentication loading state - show spinner while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Testing</h1>
        </div>

        {/* Test Type Cards Grid - Responsive layout (1 col mobile, 2 cols tablet, 3 cols desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Unit Tests Card - Links to /dashboard/[slug]/testing/unit */}
          <Link href={`/dashboard/${repoSlug}/testing/unit`}>
            <Card className="hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 transition-all duration-200 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                    <FileCheck className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-200">Unit Tests</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View and manage unit test results and coverage for individual components and functions.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* API Tests Card - Disabled */}
          <Card className="opacity-50 cursor-not-allowed">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Network className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-muted-foreground">API Tests</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monitor API endpoint testing, response times, and integration test results.
              </p>
            </CardContent>
          </Card>

          {/* E2E Tests Card - Disabled */}
          <Card className="opacity-50 cursor-not-allowed">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <MousePointerClick className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-muted-foreground">E2E Tests</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track end-to-end test execution, user flow validation, and browser compatibility tests.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

