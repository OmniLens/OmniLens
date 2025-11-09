// External library imports
import Link from "next/link";
import packageJson from "../package.json";

// Internal component imports
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the VersionIndicator component
 */
interface VersionIndicatorProps {
  version?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * VersionIndicator component
 * Displays the application version as a fixed badge in the bottom-left corner
 * Links to the changelog page when clicked
 * Uses package.json version as default if not provided
 * @param version - Optional version string (defaults to package.json version)
 */
export function VersionIndicator({ version = packageJson.version }: VersionIndicatorProps) {
  return (
    <Link 
      href="/changelog"
      className="fixed bottom-4 left-4 z-50 transition-all duration-200 hover:scale-105"
      title="View changelog"
    >
      <Badge 
        variant="outline" 
        className="bg-background/80 backdrop-blur-sm border-border/50 text-muted-foreground hover:text-foreground hover:border-border font-mono text-xs px-2 py-1"
      >
        v{version}
      </Badge>
    </Link>
  );
}
