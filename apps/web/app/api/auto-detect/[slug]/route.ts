// External library imports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal utility imports
import { getUserRepo } from '@/lib/db-storage';
import { withAuth } from '@/lib/auth-middleware';
import { 
  fetchCoverageFromRepository, 
  detectFrameworkFromMonorepo, 
  detectFrameworkFromLocal,
  type CoverageFileAttempt
} from '@/lib/auto-detect';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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

interface DataSourceAttempt {
  source: 'repository';
  path: string;
  success: boolean;
  error?: string;
}

interface CoverageResponse {
  summary: CoverageSummary;
  files: CoverageFile[];
  framework: FrameworkInfo;
  hasCoverageData: boolean;
  dataSource: {
    attempted: DataSourceAttempt[];
    used: 'repository' | 'none';
  };
  error?: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Zod schema for repository slug parameter validation
 */
const slugSchema = z.string().min(1, 'Repository slug is required');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect test framework from repository (supports monorepos)
 * Uses detectFrameworkFromMonorepo which checks root and workspace package.json files
 * Returns framework info: Jest (supported) or detected unsupported framework
 */
async function detectFrameworkFromRepository(
  owner: string,
  repo: string,
  userId: string
): Promise<FrameworkInfo> {
  return await detectFrameworkFromMonorepo(owner, repo, userId);
}

/**
 * Process coverage data and calculate summary statistics
 */
function processCoverageData(coverageData: Record<string, unknown>): {
  summary: CoverageSummary;
  files: CoverageFile[];
} {
  const summary: CoverageSummary = {
    statements: { total: 0, covered: 0, percentage: 0 },
    branches: { total: 0, covered: 0, percentage: 0 },
    functions: { total: 0, covered: 0, percentage: 0 },
    lines: { total: 0, covered: 0, percentage: 0 },
  };

  const files: CoverageFile[] = [];

  // Process each file in coverage data
  for (const [filePath, fileData] of Object.entries(coverageData)) {
    const data = fileData as {
      s?: Record<number, number>; // statements - hit count per statement
      b?: Record<number, number[]>; // branches - array of hit counts per branch
      f?: Record<number, number>; // functions - hit count per function
      l?: Record<number, number>; // lines - hit count per line
    };

    // Calculate coverage for this file
    // Statements: count total statements and how many were hit (>0)
    const statements = Object.keys(data.s || {}).length;
    const statementsCovered = Object.values(data.s || {}).filter((v) => v > 0).length;
    const statementsPct = statements > 0 ? (statementsCovered / statements) * 100 : 0;

    // Branches: count total branches (each branch can have multiple hit counts)
    let branches = 0;
    let branchesCovered = 0;
    if (data.b) {
      for (const branchHits of Object.values(data.b)) {
        if (Array.isArray(branchHits)) {
          branches += branchHits.length;
          branchesCovered += branchHits.filter((h) => h > 0).length;
        }
      }
    }
    const branchesPct = branches > 0 ? (branchesCovered / branches) * 100 : 0;

    // Functions: count total functions and how many were hit (>0)
    const functions = Object.keys(data.f || {}).length;
    const functionsCovered = Object.values(data.f || {}).filter((v) => v > 0).length;
    const functionsPct = functions > 0 ? (functionsCovered / functions) * 100 : 0;

    // Lines: count total lines and how many were hit (>0)
    const lines = Object.keys(data.l || {}).length;
    const linesCovered = Object.values(data.l || {}).filter((v) => v > 0).length;
    const linesPct = lines > 0 ? (linesCovered / lines) * 100 : 0;

    // Add to summary totals
    summary.statements.total += statements;
    summary.statements.covered += statementsCovered;
    summary.branches.total += branches;
    summary.branches.covered += branchesCovered;
    summary.functions.total += functions;
    summary.functions.covered += functionsCovered;
    summary.lines.total += lines;
    summary.lines.covered += linesCovered;

    files.push({
      path: filePath,
      statements: { total: statements, covered: statementsCovered, percentage: statementsPct },
      branches: { total: branches, covered: branchesCovered, percentage: branchesPct },
      functions: { total: functions, covered: functionsCovered, percentage: functionsPct },
      lines: { total: lines, covered: linesCovered, percentage: linesPct },
    });
  }

  // Calculate overall percentages
  summary.statements.percentage =
    summary.statements.total > 0
      ? (summary.statements.covered / summary.statements.total) * 100
      : 0;
  summary.branches.percentage =
    summary.branches.total > 0 ? (summary.branches.covered / summary.branches.total) * 100 : 0;
  summary.functions.percentage =
    summary.functions.total > 0 ? (summary.functions.covered / summary.functions.total) * 100 : 0;
  summary.lines.percentage =
    summary.lines.total > 0 ? (summary.lines.covered / summary.lines.total) * 100 : 0;

  return { summary, files };
}

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/auto-detect/[slug]
 * 
 * Auto-detect endpoint for repository analysis
 * Fetches coverage data for a repository from GitHub and detects framework from package.json
 * 
 * @openapi
 * /api/auto-detect/{slug}:
 *   get:
 *     summary: Get coverage data for a repository
 *     description: Fetches coverage data from repository files and detects test framework
 *     tags:
 *       - Coverage
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository slug identifier
 *     responses:
 *       200:
 *         description: Successfully retrieved coverage data
 *       400:
 *         description: Bad request - Invalid slug format
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Repository not found in dashboard
 *       500:
 *         description: Internal server error
 */
export const GET = withAuth(async (
  request: NextRequest,
  context,
  authData
) => {
  try {
    // Validate slug parameter
    const params = await context.params;
    const validatedSlug = slugSchema.parse(params.slug);
    
    // Check for source query parameter (local or remote)
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'remote'; // Default to remote
    const frameworkOnly = searchParams.get('frameworkOnly') === 'true'; // Skip coverage fetching if true
    
    let framework: FrameworkInfo;
    
    if (source === 'local') {
      // Local mode: read from file system
      framework = await detectFrameworkFromLocal();
      
      // Skip coverage fetching if only framework is needed
      if (frameworkOnly) {
        return NextResponse.json<CoverageResponse>({
          summary: {
            statements: { total: 0, covered: 0, percentage: 0 },
            branches: { total: 0, covered: 0, percentage: 0 },
            functions: { total: 0, covered: 0, percentage: 0 },
            lines: { total: 0, covered: 0, percentage: 0 },
          },
          files: [],
          framework,
          hasCoverageData: false,
          dataSource: {
            attempted: [],
            used: 'none',
          },
        });
      }
      
      // Try to read local coverage file
      const coveragePath = join(process.cwd(), 'coverage', 'coverage-final.json');
      
      if (!existsSync(coveragePath)) {
        return NextResponse.json<CoverageResponse>({
          summary: {
            statements: { total: 0, covered: 0, percentage: 0 },
            branches: { total: 0, covered: 0, percentage: 0 },
            functions: { total: 0, covered: 0, percentage: 0 },
            lines: { total: 0, covered: 0, percentage: 0 },
          },
          files: [],
          framework,
          hasCoverageData: false,
          dataSource: {
            attempted: [{
              source: 'repository',
              path: 'coverage/coverage-final.json',
              success: false,
              error: 'File not found (local mode)',
            }],
            used: 'none',
          },
        });
      }
      
      // Read and process local coverage data
      const coverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));
      const { summary, files } = processCoverageData(coverageData);
      
      return NextResponse.json<CoverageResponse>({
        summary,
        files: files.sort((a, b) => a.path.localeCompare(b.path)),
        framework,
        hasCoverageData: true,
        dataSource: {
          attempted: [{
            source: 'repository',
            path: 'coverage/coverage-final.json',
            success: true,
          }],
          used: 'repository',
        },
      });
    }
    
    // Remote mode: read from GitHub repository
    // Check if the repository exists in our database for this user
    const repo = await getUserRepo(validatedSlug, authData.user.id);
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found in dashboard' },
        { status: 404 }
      );
    }

    // Extract owner and repo name from repository path
    const [owner, repoName] = repo.repoPath.split('/');
    if (!owner || !repoName) {
      return NextResponse.json(
        { error: 'Invalid repository path format' },
        { status: 400 }
      );
    }

    // Detect framework from repository package.json
    framework = await detectFrameworkFromRepository(owner, repoName, authData.user.id);

    // Skip coverage fetching if only framework is needed
    if (frameworkOnly) {
      return NextResponse.json<CoverageResponse>({
        summary: {
          statements: { total: 0, covered: 0, percentage: 0 },
          branches: { total: 0, covered: 0, percentage: 0 },
          functions: { total: 0, covered: 0, percentage: 0 },
          lines: { total: 0, covered: 0, percentage: 0 },
        },
        files: [],
        framework,
        hasCoverageData: false,
        dataSource: {
          attempted: [],
          used: 'none',
        },
      });
    }

    // Fetch coverage data from repository
    const coverageResult = await fetchCoverageFromRepository(owner, repoName, authData.user.id);

    // Convert attempts to response format
    const attempted: DataSourceAttempt[] = coverageResult.attempts.map((attempt: CoverageFileAttempt) => ({
      source: 'repository',
      path: attempt.path,
      success: attempt.success,
      error: attempt.error,
    }));

    // If no coverage data found, return empty response with framework info
    if (!coverageResult.coverageData) {
      return NextResponse.json<CoverageResponse>({
        summary: {
          statements: { total: 0, covered: 0, percentage: 0 },
          branches: { total: 0, covered: 0, percentage: 0 },
          functions: { total: 0, covered: 0, percentage: 0 },
          lines: { total: 0, covered: 0, percentage: 0 },
        },
        files: [],
        framework,
        hasCoverageData: false,
        dataSource: {
          attempted,
          used: 'none',
        },
      });
    }

    // Process coverage data
    const { summary, files } = processCoverageData(coverageResult.coverageData);

    return NextResponse.json<CoverageResponse>({
      summary,
      files: files.sort((a, b) => a.path.localeCompare(b.path)),
      framework,
      hasCoverageData: true,
      dataSource: {
        attempted,
        used: 'repository',
      },
    });
  } catch (error) {
    console.error('Error fetching coverage data:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid repository slug',
          details: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        },
        { status: 400 }
      );
    }

    // Try to return framework info even on error
    try {
      const params = await context.params;
      const validatedSlug = slugSchema.parse(params.slug);
      const repo = await getUserRepo(validatedSlug, authData.user.id);
      
      if (repo) {
        const [owner, repoName] = repo.repoPath.split('/');
        if (owner && repoName) {
          const framework = await detectFrameworkFromRepository(owner, repoName, authData.user.id);
          return NextResponse.json<CoverageResponse>({
            error: 'Failed to read coverage data',
            summary: {
              statements: { total: 0, covered: 0, percentage: 0 },
              branches: { total: 0, covered: 0, percentage: 0 },
              functions: { total: 0, covered: 0, percentage: 0 },
              lines: { total: 0, covered: 0, percentage: 0 },
            },
            files: [],
            framework,
            hasCoverageData: false,
            dataSource: {
              attempted: [],
              used: 'none',
            },
          }, { status: 200 });
        }
      }
    } catch {
      // Ignore errors in fallback
    }

    return NextResponse.json(
      { error: 'Failed to fetch coverage data' },
      { status: 500 }
    );
  }
});

