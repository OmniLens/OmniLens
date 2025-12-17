"use client";

// External library imports
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";

// Hook imports
import { useSession } from "@/lib/auth-client";

// ============================================================================
// Main Component
// ============================================================================

/**
 * BackButton component
 * Smart back button that remembers where the user came from
 * Uses browser history if available, otherwise falls back to dashboard or root
 */
export default function BackButton() {
  const router = useRouter();
  const { data: session } = useSession();

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle back navigation with smart routing
   * Routes to login if not authenticated, otherwise uses referrer or defaults to dashboard
   * Matches the changelog page navigation pattern
   */
  const handleBackNavigation = () => {
    // If not authenticated, go to login
    if (!session) {
      router.push("/login");
      return;
    }

    // Check if there's a referrer from the same origin
    if (typeof window !== "undefined" && document.referrer) {
      const referrerUrl = new URL(document.referrer);
      const currentUrl = new URL(window.location.href);

      // If referrer is from the same origin, go back to it
      if (referrerUrl.origin === currentUrl.origin) {
        router.back();
        return;
      }
    }

    // Default fallback: go to dashboard
    router.push("/dashboard");
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleBackNavigation}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}

