// External library imports
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Type imports
// (No external type imports used in this component)

// Internal component imports
// (No internal components used in this component)

// Utility imports
// (No utility functions used in this component)

// ============================================================================
// Type Definitions
// ============================================================================

export interface GetStartedButtonProps {
  className?: string;
  href?: string;
  children?: React.ReactNode;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * GetStartedButton component
 * Displays a styled "Get Started" button that links to the login page
 * Consistent styling and behavior across the application
 */
export default function GetStartedButton({
  className = "",
  href = "/login",
  children
}: GetStartedButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-white/25 ${className}`}
    >
      {children || (
        <>
          Get Started
          <ArrowRight className="h-5 w-5" />
        </>
      )}
    </Link>
  );
}
