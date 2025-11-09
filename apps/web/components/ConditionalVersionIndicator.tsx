"use client";

// External library imports
import { usePathname } from 'next/navigation';
import packageJson from 'package.json';

// Internal component imports
import { VersionIndicator } from './VersionIndicator';

// ============================================================================
// Main Component
// ============================================================================

/**
 * ConditionalVersionIndicator component
 * Conditionally renders VersionIndicator based on current route
 * Hides version indicator on the landing page (root path)
 * Used in layout to show version info on all pages except home
 */
export default function ConditionalVersionIndicator() {
  const pathname = usePathname();

  // Hide version indicator on the landing page (root path)
  if (pathname === '/') {
    return null;
  }

  // Get version directly from package.json
  const version = packageJson.version;

  return <VersionIndicator version={version} />;
}
