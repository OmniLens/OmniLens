"use client";

// External library imports
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Network } from "lucide-react";

// Hook imports
import { useSession } from "@/lib/auth-client";

// ============================================================================
// Type Definitions
// ============================================================================

// ============================================================================
// Main Component
// ============================================================================

/**
 * API Tests page for a specific repository
 * Displays API endpoint testing, response times, and integration test results
 */
export default function ApiTestsPage() {
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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">API Tests</h1>
        </div>

        {/* Content Section */}
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            API test results, response times, and integration test data will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}

