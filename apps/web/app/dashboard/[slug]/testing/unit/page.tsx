"use client";

// External library imports
import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { FileCheck, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Hook imports
import { useSession } from "@/lib/auth-client";

// ============================================================================
// Type Definitions
// ============================================================================

interface CoverageSummary {
  statements: { total: number; covered: number; percentage: number };
  branches: { total: number; covered: number; percentage: number };
  functions: { total: number; covered: number; percentage: number };
  lines: { total: number; covered: number; percentage: number };
}

interface CoverageFile {
  path: string;
  statements: { total: number; covered: number; percentage: number };
  branches: { total: number; covered: number; percentage: number };
  functions: { total: number; covered: number; percentage: number };
  lines: { total: number; covered: number; percentage: number };
}

interface CoverageData {
  summary: CoverageSummary;
  files: CoverageFile[];
  framework?: {
    name: "Jest" | "Not Found";
    version: string | null;
    detected?: {
      name: string;
      version: string;
    };
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get coverage badge color based on percentage
 */
function getCoverageColor(percentage: number): "default" | "secondary" | "destructive" | "outline" {
  if (percentage >= 80) return "default";
  if (percentage >= 50) return "secondary";
  return "destructive";
}

/**
 * Format percentage with 2 decimal places
 */
function formatPercentage(percentage: number): string {
  return percentage.toFixed(2);
}

/**
 * Calculate summary statistics for a group of files
 */
function calculateCategorySummary(files: CoverageFile[]): {
  totalFiles: number;
  avgStatements: number;
  avgBranches: number;
  avgFunctions: number;
  avgLines: number;
  totalStatements: { covered: number; total: number };
  totalBranches: { covered: number; total: number };
  totalFunctions: { covered: number; total: number };
  totalLines: { covered: number; total: number };
} {
  if (files.length === 0) {
    return {
      totalFiles: 0,
      avgStatements: 0,
      avgBranches: 0,
      avgFunctions: 0,
      avgLines: 0,
      totalStatements: { covered: 0, total: 0 },
      totalBranches: { covered: 0, total: 0 },
      totalFunctions: { covered: 0, total: 0 },
      totalLines: { covered: 0, total: 0 },
    };
  }

  const totals = files.reduce(
    (acc, file) => ({
      statements: { covered: acc.statements.covered + file.statements.covered, total: acc.statements.total + file.statements.total },
      branches: { covered: acc.branches.covered + file.branches.covered, total: acc.branches.total + file.branches.total },
      functions: { covered: acc.functions.covered + file.functions.covered, total: acc.functions.total + file.functions.total },
      lines: { covered: acc.lines.covered + file.lines.covered, total: acc.lines.total + file.lines.total },
    }),
    {
      statements: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
      lines: { covered: 0, total: 0 },
    }
  );

  const avgStatements = totals.statements.total > 0 ? (totals.statements.covered / totals.statements.total) * 100 : 0;
  const avgBranches = totals.branches.total > 0 ? (totals.branches.covered / totals.branches.total) * 100 : 0;
  const avgFunctions = totals.functions.total > 0 ? (totals.functions.covered / totals.functions.total) * 100 : 0;
  const avgLines = totals.lines.total > 0 ? (totals.lines.covered / totals.lines.total) * 100 : 0;

  return {
    totalFiles: files.length,
    avgStatements,
    avgBranches,
    avgFunctions,
    avgLines,
    totalStatements: totals.statements,
    totalBranches: totals.branches,
    totalFunctions: totals.functions,
    totalLines: totals.lines,
  };
}

/**
 * Get display name for a category key
 */
function getCategoryDisplayName(categoryKey: string): string {
  const displayNameMap: Record<string, string> = {
    app: "App",
    components: "Components",
    hooks: "Hooks",
    lib: "Lib",
    libHooks: "Lib/Hooks",
  };

  if (displayNameMap[categoryKey]) {
    return displayNameMap[categoryKey];
  }

  // For dynamic categories, capitalize first letter
  return categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
}

/**
 * Group files by category dynamically
 * Uses hybrid approach: common patterns + any other top-level directories
 */
function groupFilesByCategory(files: CoverageFile[]): Record<string, CoverageFile[]> {
  const grouped: Record<string, CoverageFile[]> = {};
  
  // Define common patterns with their category keys
  const commonPatterns: Array<{ prefix: string; key: string }> = [
    { prefix: 'app/', key: 'app' },
    { prefix: 'components/', key: 'components' },
    { prefix: 'hooks/', key: 'hooks' },
    { prefix: 'lib/hooks/', key: 'libHooks' },
    { prefix: 'lib/', key: 'lib' },
  ];

  // Initialize common pattern categories
  commonPatterns.forEach(({ key }) => {
    grouped[key] = [];
  });

  for (const file of files) {
    // Normalize path - remove leading slash and handle absolute paths
    let normalizedPath = file.path;
    if (normalizedPath.startsWith('/')) {
      // Extract relative path from absolute path (e.g., /Users/.../apps/web/components/... -> components/...)
      const parts = normalizedPath.split('/');
      const webIndex = parts.indexOf('web');
      if (webIndex >= 0 && webIndex < parts.length - 1) {
        normalizedPath = parts.slice(webIndex + 1).join('/');
      } else {
        // Fallback: just remove leading slash
        normalizedPath = normalizedPath.slice(1);
      }
    }
    
    // Remove leading './' if present
    if (normalizedPath.startsWith('./')) {
      normalizedPath = normalizedPath.slice(2);
    }
    
    // Try to match common patterns first
    let matched = false;
    for (const { prefix, key } of commonPatterns) {
      if (normalizedPath.startsWith(prefix)) {
        grouped[key].push({ ...file, path: normalizedPath });
        matched = true;
        break;
      }
    }

    // If no common pattern matched, extract first directory for dynamic category
    if (!matched) {
      const firstSlashIndex = normalizedPath.indexOf('/');
      if (firstSlashIndex > 0) {
        const categoryKey = normalizedPath.substring(0, firstSlashIndex);
        if (!grouped[categoryKey]) {
          grouped[categoryKey] = [];
        }
        grouped[categoryKey].push({ ...file, path: normalizedPath });
      } else {
        // File at root level - use 'root' category
        if (!grouped['root']) {
          grouped['root'] = [];
        }
        grouped['root'].push({ ...file, path: normalizedPath });
      }
    }
  }

  // Sort each category by path
  Object.values(grouped).forEach((category) => {
    category.sort((a, b) => a.path.localeCompare(b.path));
  });

  // Remove empty categories
  Object.keys(grouped).forEach((key) => {
    if (grouped[key].length === 0) {
      delete grouped[key];
    }
  });

  return grouped;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Unit Tests page for displaying Jest coverage reports
 * Shows overall coverage summary and per-file coverage breakdown
 */
export default function UnitTestsPage() {
  const router = useRouter();
  const params = useParams();
  const repoSlug = params.slug as string;
  const { data: session, isPending } = useSession();
  
  const [coverageData, setCoverageData] = useState<CoverageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for view mode: 'original' (single table) or 'pro' (grouped tables)
  const [viewMode, setViewMode] = useState<'original' | 'pro'>('original');
  
  // State for collapsed/expanded categories (default: all collapsed)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group files by category using useMemo
  const groupedFiles = useMemo(() => {
    if (!coverageData || !coverageData.files || coverageData.files.length === 0) {
      return null;
    }
    const grouped = groupFilesByCategory(coverageData.files);
    
    // Initialize expandedCategories state for all categories (all collapsed by default)
    setExpandedCategories(prev => {
      const newState = { ...prev };
      Object.keys(grouped).forEach((key) => {
        if (!(key in newState)) {
          newState[key] = false;
        }
      });
      return newState;
    });
    
    return grouped;
  }, [coverageData]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  // Fetch coverage data
  useEffect(() => {
    async function fetchCoverage() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/coverage');
        
        if (!response.ok) {
          throw new Error('Failed to fetch coverage data');
        }
        
        const data = await response.json();
        setCoverageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchCoverage();
    }
  }, [session]);

  // Log unsupported framework detection
  useEffect(() => {
    if (coverageData?.framework?.detected) {
      console.warn(
        `Unsupported framework detected: ${coverageData.framework.detected.name} v${coverageData.framework.detected.version}`
      );
    }
  }, [coverageData]);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCheck className="h-6 w-6 text-foreground" />
            <h1 className="text-xl sm:text-2xl font-bold">
              Unit Tests
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center gap-1 border rounded-md p-1 bg-muted">
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === 'original'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setViewMode('pro')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === 'pro'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pro
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              aria-label="Refresh coverage data"
              className="flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading coverage data...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coverage Summary */}
        {coverageData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Framework */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Framework
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {coverageData.framework?.name || "Not Found"}
                    </span>
                    {coverageData.framework?.name === "Jest" && coverageData.framework?.version && (
                      <Badge variant="default">v{coverageData.framework.version}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Statements */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Statements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatPercentage(coverageData.summary.statements.percentage)}%
                    </span>
                    <Badge variant={getCoverageColor(coverageData.summary.statements.percentage)}>
                      {coverageData.summary.statements.covered}/{coverageData.summary.statements.total}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Branches */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Branches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatPercentage(coverageData.summary.branches.percentage)}%
                    </span>
                    <Badge variant={getCoverageColor(coverageData.summary.branches.percentage)}>
                      {coverageData.summary.branches.covered}/{coverageData.summary.branches.total}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Functions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Functions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatPercentage(coverageData.summary.functions.percentage)}%
                    </span>
                    <Badge variant={getCoverageColor(coverageData.summary.functions.percentage)}>
                      {coverageData.summary.functions.covered}/{coverageData.summary.functions.total}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Lines */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatPercentage(coverageData.summary.lines.percentage)}%
                    </span>
                    <Badge variant={getCoverageColor(coverageData.summary.lines.percentage)}>
                      {coverageData.summary.lines.covered}/{coverageData.summary.lines.total}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Files Tables - Original View (Single Table) */}
            {viewMode === 'original' && coverageData && coverageData.files.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Coverage by File</CardTitle>
                    <Badge variant="secondary">{coverageData.files.length} {coverageData.files.length === 1 ? 'file' : 'files'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">File</th>
                          <th className="text-right p-2 font-medium">Statements</th>
                          <th className="text-right p-2 font-medium">Branches</th>
                          <th className="text-right p-2 font-medium">Functions</th>
                          <th className="text-right p-2 font-medium">Lines</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coverageData.files.map((file) => (
                          <tr key={file.path} className="border-b hover:bg-muted/50">
                            <td className="p-2 text-sm font-mono">{file.path}</td>
                            <td className="p-2 text-right text-sm">
                              <span className={file.statements.percentage >= 80 ? 'text-green-600' : file.statements.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                {formatPercentage(file.statements.percentage)}%
                              </span>
                              <span className="text-muted-foreground ml-1">
                                ({file.statements.covered}/{file.statements.total})
                              </span>
                            </td>
                            <td className="p-2 text-right text-sm">
                              <span className={file.branches.percentage >= 80 ? 'text-green-600' : file.branches.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                {formatPercentage(file.branches.percentage)}%
                              </span>
                              <span className="text-muted-foreground ml-1">
                                ({file.branches.covered}/{file.branches.total})
                              </span>
                            </td>
                            <td className="p-2 text-right text-sm">
                              <span className={file.functions.percentage >= 80 ? 'text-green-600' : file.functions.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                {formatPercentage(file.functions.percentage)}%
                              </span>
                              <span className="text-muted-foreground ml-1">
                                ({file.functions.covered}/{file.functions.total})
                              </span>
                            </td>
                            <td className="p-2 text-right text-sm">
                              <span className={file.lines.percentage >= 80 ? 'text-green-600' : file.lines.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                {formatPercentage(file.lines.percentage)}%
                              </span>
                              <span className="text-muted-foreground ml-1">
                                ({file.lines.covered}/{file.lines.total})
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Files Tables - Pro View (Grouped by Category) */}
            {viewMode === 'pro' && groupedFiles && coverageData && coverageData.files.length > 0 && (
              <div className="space-y-6">
                {Object.entries(groupedFiles)
                  .sort(([keyA], [keyB]) => {
                    // Prioritize common patterns first, then alphabetical
                    const commonPatterns = ['app', 'components', 'hooks', 'lib', 'libHooks'];
                    const indexA = commonPatterns.indexOf(keyA);
                    const indexB = commonPatterns.indexOf(keyB);
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return keyA.localeCompare(keyB);
                  })
                  .map(([categoryKey, files]) => {
                  if (files.length === 0) return null;
                  const summary = calculateCategorySummary(files);
                  const displayName = getCategoryDisplayName(categoryKey);
                  const isExpanded = expandedCategories[categoryKey] || false;
                  return (
                    <Card key={categoryKey}>
                      <CardHeader>
                        <button
                          onClick={() => toggleCategory(categoryKey)}
                          className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
                        >
                          <CardTitle>{displayName}</CardTitle>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </CardHeader>
                      {isExpanded ? (
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2 font-medium">File</th>
                                  <th className="text-right p-2 font-medium">Statements</th>
                                  <th className="text-right p-2 font-medium">Branches</th>
                                  <th className="text-right p-2 font-medium">Functions</th>
                                  <th className="text-right p-2 font-medium">Lines</th>
                                </tr>
                              </thead>
                              <tbody>
                                {files.map((file) => (
                                  <tr key={file.path} className="border-b hover:bg-muted/50">
                                    <td className="p-2 text-sm font-mono">{file.path}</td>
                                    <td className="p-2 text-right text-sm">
                                      <span className={file.statements.percentage >= 80 ? 'text-green-600' : file.statements.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                        {formatPercentage(file.statements.percentage)}%
                                      </span>
                                      <span className="text-muted-foreground ml-1">
                                        ({file.statements.covered}/{file.statements.total})
                                      </span>
                                    </td>
                                    <td className="p-2 text-right text-sm">
                                      <span className={file.branches.percentage >= 80 ? 'text-green-600' : file.branches.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                        {formatPercentage(file.branches.percentage)}%
                                      </span>
                                      <span className="text-muted-foreground ml-1">
                                        ({file.branches.covered}/{file.branches.total})
                                      </span>
                                    </td>
                                    <td className="p-2 text-right text-sm">
                                      <span className={file.functions.percentage >= 80 ? 'text-green-600' : file.functions.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                        {formatPercentage(file.functions.percentage)}%
                                      </span>
                                      <span className="text-muted-foreground ml-1">
                                        ({file.functions.covered}/{file.functions.total})
                                      </span>
                                    </td>
                                    <td className="p-2 text-right text-sm">
                                      <span className={file.lines.percentage >= 80 ? 'text-green-600' : file.lines.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                        {formatPercentage(file.lines.percentage)}%
                                      </span>
                                      <span className="text-muted-foreground ml-1">
                                        ({file.lines.covered}/{file.lines.total})
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      ) : (
                        <CardContent>
                          <div className="grid grid-cols-5 gap-4 py-2">
                            <div>
                              <div className="text-sm text-muted-foreground">Files</div>
                              <div className="text-lg font-semibold">{summary.totalFiles}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Statements</div>
                              <div className={`text-lg font-semibold ${summary.avgStatements >= 80 ? 'text-green-600' : summary.avgStatements >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {formatPercentage(summary.avgStatements)}%
                              </div>
                              <div className="text-xs text-muted-foreground">{summary.totalStatements.covered}/{summary.totalStatements.total}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Branches</div>
                              <div className={`text-lg font-semibold ${summary.avgBranches >= 80 ? 'text-green-600' : summary.avgBranches >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {formatPercentage(summary.avgBranches)}%
                              </div>
                              <div className="text-xs text-muted-foreground">{summary.totalBranches.covered}/{summary.totalBranches.total}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Functions</div>
                              <div className={`text-lg font-semibold ${summary.avgFunctions >= 80 ? 'text-green-600' : summary.avgFunctions >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {formatPercentage(summary.avgFunctions)}%
                              </div>
                              <div className="text-xs text-muted-foreground">{summary.totalFunctions.covered}/{summary.totalFunctions.total}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Lines</div>
                              <div className={`text-lg font-semibold ${summary.avgLines >= 80 ? 'text-green-600' : summary.avgLines >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {formatPercentage(summary.avgLines)}%
                              </div>
                              <div className="text-xs text-muted-foreground">{summary.totalLines.covered}/{summary.totalLines.total}</div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
