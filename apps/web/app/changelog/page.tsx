"use client";

// External library imports
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Tag, Plus, Wrench, Bug, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Hook imports
import { useSession } from "@/lib/auth-client";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Type for semantic version types (major, minor, patch, beta)
 */
type VersionType = "major" | "minor" | "patch" | "beta";

/**
 * Type for change types in changelog entries
 */
type ChangeType = "added" | "changed" | "fixed";

/**
 * Structure for changelog entry changes
 */
interface ChangelogChanges {
  added?: string[];
  changed?: string[];
  fixed?: string[];
}

/**
 * Structure for a changelog entry
 */
interface ChangelogEntry {
  version: string;
  date: string;
  type: VersionType;
  changes: ChangelogChanges;
}

// ============================================================================
// Changelog Data
// ============================================================================

/**
 * Changelog data array containing all version history entries
 * Follows Keep a Changelog format with Semantic Versioning
 */
const changelogData: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2025-01-27",
    type: "major",
    changes: {
      added: [
        "Official 1.0.0 release - OmniLens is now production ready!",
        "Stable API and feature set for production use"
      ],
      changed: [
        "Version updated to 1.0.0",
        "Removed all beta badges - OmniLens is now fully released"
      ]
    }
  },
  {
    version: "0.9.6-alpha",
    date: "2025-12-11",
    type: "minor",
    changes: {
      added: [
        "End-to-end testing infrastructure with Playwright",
        "Automated E2E test execution in CI/CD pipeline"
      ],
      changed: [
        "Refactored repository metrics data structure"
      ]
    }
  },
  {
    version: "0.9.5-alpha",
    date: "2025-11-24",
    type: "minor",
    changes: {
      added: [
        "Comprehensive API test suite covering all 10 API route endpoints",
        "Test utilities for authenticated request creation (test-auth.ts, test-request.ts)",
        "API test coverage for repository, workflow, health, and GitHub status endpoints"
      ],
      changed: [
        "Separated test coverage commands from regular test execution in package.json",
        "Simplified API documentation page styling",
        "Updated test setup and Vitest configuration for improved test isolation"
      ]
    }
  },
  {
    version: "0.9.4-alpha",
    date: "2025-11-23",
    type: "patch",
    changes: {
      changed: [
        "Simplified UI design with consistent theme colors across landing and login pages",
        "Removed animated background elements for cleaner, more focused interface",
        "Extracted NoRepositoriesCard component for better code organization",
        "Moved documentation files to centralized docs/ directory"
      ]
    }
  },
  {
    version: "0.9.3-alpha",
    date: "2025-11-17",
    type: "minor",
    changes: {
      added: [
        "Comprehensive test infrastructure with unit, API, and E2E test suites",
        "GitHub Actions workflows for automated CI/CD testing",
        "Coverage reporting and baseline documentation",
        "Vitest and Playwright test frameworks integration"
      ]
    }
  },
  {
    version: "0.9.2-alpha",
    date: "2025-11-15",
    type: "minor",
    changes: {
      added: [
        "Interactive preview components for landing page",
        "Vercel OSS Program badge on landing page"
      ],
      changed: [
        "Landing page features section redesigned with improved responsive padding",
        "RepositoryCard component layout improvements with flexbox for consistent card heights",
        "Next.js config updated with turbopack root configuration for monorepo compatibility"
      ]
    }
  },
  {
    version: "0.9.1-alpha",
    date: "2025-11-10",
    type: "patch",
    changes: {
      added: [
        "Workflow categorization on dashboard page - workflows now separated into active and idle groups",
        "DatePicker component iconOnly prop for improved usability and space efficiency",
        "Vercel OSS Program badge on login page"
      ],
      changed: [
        "Header component now always displays application name for better brand visibility",
        "GitHub link moved from header to user menu dropdown for cleaner navigation",
        "Dashboard page button styling updated from 'outline' to 'ghost' variant for better UI consistency",
        "Removed redundant mobile-only DatePicker code from dashboard page while retaining functionality",
        "Dashboard workflow section icons updated - Zap for Active, MoonStar for Idle workflows"
      ]
    }
  },
  {
    version: "0.9.0-alpha",
    date: "2025-11-09",
    type: "minor",
    changes: {
      added: [
        "Turbo repo implementation for monorepo build orchestration and task management",
        "Interactive API Documentation page with Swagger UI",
        "OpenAPI 3.0 specification endpoint",
        "Complete OpenAPI documentation for all 15 API endpoints",
        "Code review guidelines and standards (.cursorrules)",
        "Shared utility functions for workflow metrics calculations",
        "Type declarations for third-party libraries",
        "Header component with navigation, user menu, and breadcrumb support",
        "Breadcrumb navigation (Repositories -> Workflows) with visual separators",
        "Repositories heading on dashboard page aligned with Add Repo button"
      ],
      changed: [
        "Monorepo structure migration - all code moved to apps/web/ workspace",
        "API routes refactored with consistent structure, documentation, and code organization",
        "Type safety improved - removed all `any` types and added proper TypeScript types throughout",
        "Error handling enhanced with proper type annotations",
        "Shared calculation logic extracted to reusable utility functions to eliminate duplication",
        "Layout max-width constraint updated to 1920px for better utilization of standard MacBook window sizes",
        "All pages now use consistent max-width constraint with responsive padding",
        "Version indicator now respects max-width constraint and aligns with content",
        "Login page button styling unified with landing page design",
        "Changelog page back button aligned with page heading"
      ],
      fixed: [
        "ESLint and TypeScript errors across all API routes",
        "Inconsistent code structure and missing type definitions in API files",
        "Repository dashboard loading skeleton now matches actual heading and button sizes"
      ]
    }
  },
  {
    version: "0.8.2-alpha",
    date: "2025-10-14",
    type: "patch",
    changes: {
      fixed: [
        "Production OAuth redirect URI using Vercel URL instead of production domain"
      ],
      changed: [
        "Improved auth baseURL logic to distinguish between production and preview deployments"
      ]
    }
  },
  {
    version: "0.8.1-alpha",
    date: "2025-10-14",
    type: "patch",
    changes: {
      fixed: [
        "PostgreSQL ON CONFLICT constraint error in production",
        "Missing unique constraint on workflows table",
        "Repository data not loading after adding new repositories",
        "OAuth redirect URI configuration for Vercel preview deployments"
      ],
      added: [
        "Automatic database constraint detection and creation",
        "Runtime database constraint validation"
      ],
      changed: [
        "Increased workflow data fetch timeout from 3 to 10 seconds",
        "Simplified auth baseURL configuration for better Vercel compatibility"
      ]
    }
  },
  {
    version: "0.8.0-alpha",
    date: "2025-10-10",
    type: "major",
    changes: {
      added: [
        "Changelog page with version history and changelog",
        "Enhanced Repository Management with public/private repo support and visibility detection",
        "Improved Workflow Data Fetching with background processing and timeout handling",
        "Advanced Error Handling with comprehensive GitHub API error responses",
        "Repository Validation with real-time GitHub API checks before adding",
        "Optimized Database Operations with UPSERT workflows for better performance",
        "Enhanced User Statistics with repository and workflow counts",
        "Streamlined Test Infrastructure with focused health and infrastructure testing",
        "Improved Modal Components with better UX for repository management",
        "Enhanced Loading States with skeleton improvements for dashboard performance",
        "GitHub icon link in root page header for easy repository access",
        "Open Source section on root page with repository information and GitHub link",
        "Animated background effects on login page matching root page design"
      ],
      changed: [
        "Repository Addition Flow with immediate workflow data fetching",
        "Database Schema with improved workflow persistence and user isolation",
        "API Endpoints with better error handling and validation",
        "Authentication System with enhanced GitHub token management",
        "Workflow Storage with optimistic updates and conflict resolution",
        "Test Suite Structure with removal of redundant test files and focus on health testing",
        "Root page button styling unified to match Sign In button design",
        "Feature section icons updated with distinct colors and consistent hover animations",
        "Open Source section redesigned with two-column layout and interactive elements",
        "Login page Continue button styling updated to match root page buttons"
      ],
      fixed: [
        "Repository Dashboard Loading Performance with optimized skeleton rendering",
        "Merge Conflicts in dashboard page rendering",
        "Branch Filtering Issues by removing unnecessary filtering logic",
        "Data Fetching Performance with improved caching and background processing",
        "Workflow Status Badge Display Issues",
        "Version Display Consistency across components",
        "Error Message Positioning in UI components",
        "Modal Component Behavior and user interaction issues",
        "TypeScript errors in GitHubStatusBanner component with proper type handling",
        "Button consistency across all pages with unified sizing and styling",
        "Icon rotation animations standardized across all feature cards"
      ]
    }
  },
  {
    version: "0.7.5-alpha",
    date: "2024-10-09",
    type: "patch",
    changes: {
      added: [
        "GitHub Status Warnings with API integration",
        "GitHub status testing workflow for CI/CD validation"
      ],
      fixed: [
        "URL State Management with nuqs parameter handling"
      ]
    }
  },
  {
    version: "0.7.4-alpha",
    date: "2024-10-05",
    type: "minor",
    changes: {
      added: [
        "Landing Page with improved navigation and user onboarding",
        "Version indicator component with conditional display"
      ]
    }
  },
  {
    version: "0.7.3-alpha",
    date: "2024-10-04",
    type: "minor",
    changes: {
      added: [
        "Legal Compliance framework with Terms of Service and Privacy Policy",
        "Enhanced UI/UX with improved visual design"
      ],
      changed: [
        "Build & CI/CD workflows for better deployment"
      ]
    }
  },
  {
    version: "0.7.2-alpha",
    date: "2024-09-28",
    type: "patch",
    changes: {
      fixed: [
        "Data Management issues with date selection and caching",
        "Component Architecture with enhanced skeleton loading"
      ]
    }
  },
  {
    version: "0.7.1-alpha",
    date: "2024-09-27",
    type: "minor",
    changes: {
      added: [
        "React Query & Nuqs Integration for efficient data fetching",
        "Sentry Error Monitoring for comprehensive error tracking",
        "Multi-User Support with user isolation and admin APIs"
      ],
      changed: [
        "Database Schema with user isolation and migration system"
      ]
    }
  },
  {
    version: "0.7.0-alpha",
    date: "2024-09-26",
    type: "major",
    changes: {
      added: [
        "Better Auth System with GitHub OAuth integration",
        "Analytics & Monitoring with Vercel Analytics and Speed Insights",
        "Performance Optimizations with loading skeletons"
      ],
      fixed: [
        "Database & Deployment issues with PostgreSQL SSL",
        "Missing BetterAuth columns and initialization"
      ],
      changed: [
        "UI/UX with dark mode default and cleaner design"
      ]
    }
  }
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get CSS classes for version type badge styling
 * Returns Tailwind classes for major (red), minor (blue), patch (green), or beta (purple) versions
 * @param type - Version type (major, minor, patch, beta)
 * @returns CSS class string for badge styling
 */
function getVersionTypeColor(type: VersionType): string {
  switch (type) {
    case "major":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "minor":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "patch":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "beta":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
}

/**
 * Get icon component for change type
 * Returns appropriate Lucide icon for added (Plus), changed (Wrench), or fixed (Bug)
 * @param type - Change type (added, changed, fixed)
 * @returns React component with icon
 */
function getChangeTypeIcon(type: ChangeType): React.ReactElement {
  switch (type) {
    case "added":
      return <Plus className="h-4 w-4 text-green-500" />;
    case "changed":
      return <Wrench className="h-4 w-4 text-blue-500" />;
    case "fixed":
      return <Bug className="h-4 w-4 text-orange-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}

/**
 * Get CSS class for change type text color
 * Returns Tailwind text color classes for added (green), changed (blue), or fixed (orange)
 * @param type - Change type (added, changed, fixed)
 * @returns CSS class string for text color
 */
function getChangeTypeColor(type: ChangeType): string {
  switch (type) {
    case "added":
      return "text-green-400";
    case "changed":
      return "text-blue-400";
    case "fixed":
      return "text-orange-400";
    default:
      return "text-gray-400";
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ChangelogPage component
 * Displays version history and changelog entries in a card-based layout
 * Supports semantic versioning with color-coded badges and change type icons
 * Includes smart back navigation based on authentication and referrer
 */
export default function ChangelogPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isAlphaExpanded, setIsAlphaExpanded] = React.useState(false);

  // ============================================================================
  // Local State
  // ============================================================================

  // Separate changelog entries into current (1.0.0) and alpha versions
  const currentEntries = changelogData.filter((entry) => !entry.version.includes("-alpha"));
  const alphaEntries = changelogData.filter((entry) => entry.version.includes("-alpha"));

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  // Authentication loading state - show spinner while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle back navigation with smart routing
   * Routes to login if not authenticated, otherwise uses referrer or defaults to dashboard
   */
  const handleBackNavigation = () => {
    if (!session) {
      router.push('/login');
      return;
    }

    // Check if there's a referrer from the same origin
    if (document.referrer) {
      const referrerUrl = new URL(document.referrer);
      const currentUrl = new URL(window.location.href);
      
      // If referrer is from the same origin, go back to it
      if (referrerUrl.origin === currentUrl.origin) {
        router.back();
        return;
      }
    }

    // Default fallback: go to dashboard
    router.push('/dashboard');
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto p-6 sm:px-6 lg:px-8">
        {/* Header Section - Back button and page title */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleBackNavigation}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold">Changelog</h1>
          <div className="w-[72px]"></div> {/* Spacer to center the heading */}
        </div>
        
        {/* Description Section */}
        <div className="text-center mb-12">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete version history and changelog for OmniLens.<br />
            Track all features, improvements, and bug fixes.
          </p>
        </div>

        {/* Changelog Entries - Version cards with change details */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Current Release Entries (1.0.0 and above) */}
          {currentEntries.map((entry) => (
            <Card key={entry.version} className="relative">
              {/* Card Header - Version number, type badge, and date */}
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Version tag icon */}
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    {/* Version number */}
                    <CardTitle className="text-2xl">v{entry.version}</CardTitle>
                    {/* Version type badge (major/minor/patch) */}
                    <Badge 
                      variant="outline" 
                      className={getVersionTypeColor(entry.type)}
                    >
                      {entry.type}
                    </Badge>
                  </div>
                  {/* Release date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {entry.date}
                  </div>
                </div>
              </CardHeader>
              
              {/* Card Content - Change lists grouped by type */}
              <CardContent className="space-y-6">
                {Object.entries(entry.changes).map(([changeType, changes]) => (
                  <div key={changeType} className="space-y-3">
                    {/* Change type header with icon */}
                    <div className="flex items-center gap-2">
                      {getChangeTypeIcon(changeType as ChangeType)}
                      <h3 className={`font-semibold capitalize ${getChangeTypeColor(changeType as ChangeType)}`}>
                        {changeType}
                      </h3>
                    </div>
                    {/* Change list items */}
                    <ul className="space-y-2 ml-6 list-disc list-inside">
                      {changes.map((change: string, changeIndex: number) => (
                        <li key={changeIndex} className="text-sm leading-relaxed">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Alpha Changelog Section - Collapsible */}
          {alphaEntries.length > 0 && (
            <div className="space-y-8">
              {/* Collapsible Alpha Heading */}
              <button
                onClick={() => setIsAlphaExpanded(!isAlphaExpanded)}
                className="w-full flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold">Alpha</h2>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    {alphaEntries.length} {alphaEntries.length === 1 ? 'version' : 'versions'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                  {isAlphaExpanded ? (
                    <>
                      <span className="text-sm">Hide</span>
                      <ChevronUp className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm">Show</span>
                      <ChevronDown className="h-5 w-5" />
                    </>
                  )}
                </div>
              </button>

              {/* Alpha Entries - Shown when expanded */}
              {isAlphaExpanded && (
                <div className="space-y-8">
                  {alphaEntries.map((entry) => (
                    <Card key={entry.version} className="relative">
                      {/* Card Header - Version number, type badge, and date */}
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Version tag icon */}
                            <Tag className="h-5 w-5 text-muted-foreground" />
                            {/* Version number */}
                            <CardTitle className="text-2xl">v{entry.version}</CardTitle>
                            {/* Version type badge (major/minor/patch) */}
                            <Badge 
                              variant="outline" 
                              className={getVersionTypeColor(entry.type)}
                            >
                              {entry.type}
                            </Badge>
                          </div>
                          {/* Release date */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {entry.date}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Card Content - Change lists grouped by type */}
                      <CardContent className="space-y-6">
                        {Object.entries(entry.changes).map(([changeType, changes]) => (
                          <div key={changeType} className="space-y-3">
                            {/* Change type header with icon */}
                            <div className="flex items-center gap-2">
                              {getChangeTypeIcon(changeType as ChangeType)}
                              <h3 className={`font-semibold capitalize ${getChangeTypeColor(changeType as ChangeType)}`}>
                                {changeType}
                              </h3>
                            </div>
                            {/* Change list items */}
                            <ul className="space-y-2 ml-6 list-disc list-inside">
                              {changes.map((change: string, changeIndex: number) => (
                                <li key={changeIndex} className="text-sm leading-relaxed">
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Section - Changelog format information and version type legend */}
        <div className="max-w-4xl mx-auto mt-16 p-6 rounded-lg border bg-muted/20">
          <h3 className="text-lg font-semibold mb-3">About This Changelog</h3>
          <p className="text-muted-foreground mb-4">
            This changelog follows the <a href="https://keepachangelog.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Keep a Changelog</a> format and uses <a href="https://semver.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Semantic Versioning</a>.
          </p>
          {/* Version type legend */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
              Major
            </Badge>
            <span className="text-muted-foreground">Breaking changes and major new features</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm mt-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              Minor
            </Badge>
            <span className="text-muted-foreground">New features and improvements</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm mt-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
              Patch
            </Badge>
            <span className="text-muted-foreground">Bug fixes and small improvements</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm mt-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              Beta
            </Badge>
            <span className="text-muted-foreground">Beta release milestone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
