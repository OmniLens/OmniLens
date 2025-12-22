"use client";

// External library imports
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";

// Hook imports
import { useSession } from "@/lib/auth-client";

// ============================================================================
// Type Definitions
// ============================================================================

interface BackButtonProps {
  /**
   * Optional fallback path when browser history is unavailable
   * Defaults to "/dashboard" for authenticated users, "/" for unauthenticated
   */
  fallbackPath?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * BackButton component
 * Simple back button that uses browser history
 * Falls back to appropriate default based on authentication status if no history exists
 * 
 * Industry best practice: Use browser history (router.back()) as primary method
 * rather than relying on unreliable document.referrer
 */
export default function BackButton({ fallbackPath }: BackButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle back navigation using browser history
   * Falls back to default route if no history is available
   */
  const handleBackNavigation = () => {
    // Use browser history - this works correctly with Next.js client-side navigation
    // and respects where the user actually came from
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Fallback: only used if user directly navigated to URL (no history)
      // Default to dashboard for authenticated users, landing page for unauthenticated
      router.push(fallbackPath || (session ? "/dashboard" : "/"));
    }
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

