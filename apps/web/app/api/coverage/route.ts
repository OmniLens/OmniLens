import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * API route to serve Jest coverage data
 * Reads coverage-final.json and returns structured coverage data
 */
export async function GET() {
  try {
    const coveragePath = join(process.cwd(), 'coverage', 'coverage-final.json');
    const coverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));

    // Transform coverage data into a more usable format
    const summary = {
      statements: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      lines: { total: 0, covered: 0, percentage: 0 },
    };

    const files: Array<{
      path: string;
      statements: { total: number; covered: number; percentage: number };
      branches: { total: number; covered: number; percentage: number };
      functions: { total: number; covered: number; percentage: number };
      lines: { total: number; covered: number; percentage: number };
    }> = [];

    // Process each file in coverage data
    for (const [filePath, fileData] of Object.entries(coverageData)) {
      const data = fileData as {
        s: Record<number, number>; // statements - hit count per statement
        b: Record<number, number[]>; // branches - array of hit counts per branch
        f: Record<number, number>; // functions - hit count per function
        l: Record<number, number>; // lines - hit count per line
        statementMap: Record<number, { start: { line: number } }>;
        branchMap: Record<number, { line: number; locations: unknown[] }>;
        fnMap: Record<number, { name: string; line: number }>;
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

    return NextResponse.json({
      summary,
      files: files.sort((a, b) => a.path.localeCompare(b.path)),
    });
  } catch (error) {
    console.error('Error reading coverage data:', error);
    return NextResponse.json(
      { error: 'Failed to read coverage data' },
      { status: 500 }
    );
  }
}

