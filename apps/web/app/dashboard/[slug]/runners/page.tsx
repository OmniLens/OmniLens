"use client";

// External library imports
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


// Hook imports
import { useSession } from "@/lib/auth-client";

// ============================================================================
// Main Component
// ============================================================================

/**
 * Runners page for a specific repository
 * Displays GitHub Actions runner information and status for the selected repository
 * Placeholder page for future runner functionality
 */
export default function RepoRunnersPage() {
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

  // Show loading state while checking authentication
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

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-foreground" />
            <h1 className="text-xl sm:text-2xl font-bold">
              Runners
            </h1>
          </div>
        </div>

        {/* Content Section - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Runner Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Runner information and status for this repository will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

