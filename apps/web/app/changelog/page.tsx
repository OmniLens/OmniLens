"use client";

// External library imports
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Tag, Plus, Wrench, Bug, AlertTriangle } from "lucide-react";

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
 * Type for semantic version types (major, minor, patch)
 */
type VersionType = "major" | "minor" | "patch";

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
 * Returns Tailwind classes for major (red), minor (blue), or patch (green) versions
 * @param type - Version type (major, minor, patch)
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
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Back Button - Smart navigation based on authentication */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={handleBackNavigation}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        {/* Header Section - Page title and description */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete version history and changelog for OmniLens.<br />
            Track all features, improvements, and bug fixes.
          </p>
        </div>

        {/* Changelog Entries - Version cards with change details */}
        <div className="space-y-8">
          {changelogData.map((entry) => (
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

        {/* Footer Section - Changelog format information and version type legend */}
        <div className="mt-16 p-6 rounded-lg border bg-muted/20">
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
        </div>
      </div>
    </div>
  );
}
