"use client";

// External library imports
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FileCheck, Network, MousePointerClick, HardDrive, Cloud } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Utility imports
import { isFeatureEnabled } from "@/lib/utils";

// Hook imports
import { useSession } from "@/lib/auth-client";

// ============================================================================
// Type Definitions
// ============================================================================

type SupportedFramework = 
  | "Jest"
  | "Vitest"
  | "Mocha"
  | "Jasmine"
  | "AVA"
  | "Tape"
  | "Tap"
  | "uvu"
  | "QUnit"
  | "Not Found";

interface FrameworkInfo {
  name: SupportedFramework;
  version: string | null;
  detected?: {
    name: string;
    version: string;
  };
}

interface FrameworkResponse {
  framework?: FrameworkInfo;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Framework cache key for sessionStorage
 */
function getFrameworkCacheKey(repoSlug: string, dataSource: 'local' | 'remote'): string {
  return `framework_cache_${repoSlug}_${dataSource}`;
}

/**
 * Cache framework info in sessionStorage
 * Accepts FrameworkInfo which is compatible with CoverageData['framework']
 */
function setCachedFramework(repoSlug: string, dataSource: 'local' | 'remote', framework: FrameworkInfo): void {
  if (typeof window === 'undefined' || !framework) return;
  
  try {
    // Store framework info - compatible with both FrameworkInfo and CoverageData['framework']
    sessionStorage.setItem(getFrameworkCacheKey(repoSlug, dataSource), JSON.stringify(framework));
  } catch (error) {
    console.error('Error caching framework:', error);
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Testing page for a specific repository
 * Displays test type cards: Unit tests (enabled), API tests (disabled), E2E tests (disabled)
 * Supports authentication and navigation
 */
export default function TestingPage() {
  // Extract repository slug from URL params using useParams hook
  const params = useParams();
  const repoSlug = params.slug as string;
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [framework, setFramework] = useState<FrameworkInfo | null>(null);
  const [isLoadingFramework, setIsLoadingFramework] = useState(true);
  const [dataSource, setDataSource] = useState<'remote' | 'local'>('local');

  // Feature flags
  const isLocalRemoteSwitcherEnabled = isFeatureEnabled('LOCAL_REMOTE_SWITCHER');

  // ============================================================================
  // Effects
  // ============================================================================

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isPending]);

  // Fetch unit test framework detection data
  useEffect(() => {
    async function fetchFramework() {
      if (!session || !repoSlug) return;
      
      try {
        setIsLoadingFramework(true);
        const sourceParam = `?source=${dataSource}&frameworkOnly=true`;
        const response = await fetch(`/api/auto-detect/${repoSlug}${sourceParam}`);
        
        if (response.ok) {
          const data: FrameworkResponse = await response.json();
          if (data.framework) {
            setFramework(data.framework);
            // Cache framework info for use on unit tests page
            setCachedFramework(repoSlug, dataSource, data.framework);
          }
        }
      } catch (error) {
        console.error('Error fetching framework:', error);
      } finally {
        setIsLoadingFramework(false);
      }
    }

    if (session && repoSlug) {
      fetchFramework();
    }
  }, [session, repoSlug, dataSource]);

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
          <h1 className="text-2xl sm:text-3xl font-bold">Testing Frameworks</h1>
          {/* Data Source Switcher - Only shown if feature flag is enabled */}
          {isLocalRemoteSwitcherEnabled && (
            <div className="flex items-center gap-2 border rounded-md p-1 bg-muted">
              <Button
                variant={dataSource === 'local' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDataSource('local')}
                className="gap-2"
              >
                <HardDrive className="h-4 w-4" />
                Local
              </Button>
              <Button
                variant={dataSource === 'remote' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDataSource('remote')}
                className="gap-2"
              >
                <Cloud className="h-4 w-4" />
                Remote
              </Button>
            </div>
          )}
        </div>

        {/* Test Type Cards Grid - Each card in its own row */}
        <div className="grid grid-cols-1 gap-6">
          {/* Unit Tests Card - Non-clickable */}
          <Card className="overflow-hidden">
            <div className="flex">
              <div className="flex-1">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Unit Tests</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    View and manage unit test results and coverage for individual components and functions.
                  </p>
                </CardContent>
              </div>
              {!isLoadingFramework && framework && (
                <div className={`w-1/3 p-4 flex flex-col justify-center items-center border-l ${
                  framework.name !== "Not Found" 
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                    : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                }`}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Framework</div>
                  <div className="text-2xl font-bold mb-1">{framework.name}</div>
                  {framework.version && (
                    <Badge variant="outline" className="text-xs mt-1">{framework.version}</Badge>
                  )}
                </div>
              )}
              {isLoadingFramework && (
                <div className="w-1/3 p-4 flex flex-col justify-center items-center border-l bg-muted/50">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Framework</div>
                  <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                </div>
              )}
            </div>
          </Card>

          {/* API Tests Card - Disabled */}
          <Card className="opacity-50 cursor-not-allowed overflow-hidden">
            <div className="flex">
              <div className="flex-1">
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
              </div>
              <div className="w-1/3 p-4 flex flex-col justify-center items-center border-l bg-muted/30">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Framework</div>
                <div className="text-sm text-muted-foreground">Not Available</div>
              </div>
            </div>
          </Card>

          {/* E2E Tests Card - Disabled */}
          <Card className="opacity-50 cursor-not-allowed overflow-hidden">
            <div className="flex">
              <div className="flex-1">
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
              </div>
              <div className="w-1/3 p-4 flex flex-col justify-center items-center border-l bg-muted/30">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Framework</div>
                <div className="text-sm text-muted-foreground">Not Available</div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

