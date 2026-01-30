// External library imports
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Internal utility imports
import { getUserRepo } from "@/lib/db-storage";
import { getUsageMetrics, type UsageMetricsResult } from "@/lib/usage-metrics";
import { withAuth } from "@/lib/auth-middleware";

// ============================================================================
// Validation
// ============================================================================

const slugSchema = z.string().min(1, "Repository slug is required");

const PERIODS = ["current_month", "last_7_days", "current_year"] as const;
const periodSchema = z.enum(PERIODS).optional().default("current_month");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ============================================================================
// Date range resolution
// ============================================================================

function getDateRange(period: string, startParam?: string | null, endParam?: string | null): { startDate: Date; endDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (startParam && endParam) {
    const start = new Date(startParam + "T00:00:00Z");
    const end = new Date(endParam + "T23:59:59Z");
    return { startDate: start, endDate: end > today ? today : end };
  }

  switch (period) {
    case "last_7_days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: today };
    }
    case "current_year": {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { startDate: start, endDate: today };
    }
    case "current_month":
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { startDate: start, endDate: today };
    }
  }
}

// ============================================================================
// In-memory cache (TTL 10 minutes)
// ============================================================================

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { data: UsageMetricsResult; expires: number }>();

function cacheKey(slug: string, start: Date, end: Date): string {
  return `${slug}:${start.toISOString().slice(0, 10)}:${end.toISOString().slice(0, 10)}`;
}

function getCached(key: string): UsageMetricsResult | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: UsageMetricsResult): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

// ============================================================================
// GET /api/usage/[slug]
// ============================================================================

export const dynamic = "force-dynamic";

export const GET = withAuth(async (request: NextRequest, context, authData) => {
  try {
    const params = await context.params;
    const validatedSlug = slugSchema.parse(params.slug);

    const repo = await getUserRepo(validatedSlug, authData.user.id);
    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    const period = periodParam ? periodSchema.parse(periodParam) : "current_month";
    const startParamValid = startParam ? dateSchema.safeParse(startParam).success : false;
    const endParamValid = endParam ? dateSchema.safeParse(endParam).success : false;

    const { startDate, endDate } = getDateRange(
      period,
      startParamValid ? startParam : null,
      endParamValid ? endParam : null
    );

    const key = cacheKey(validatedSlug, startDate, endDate);
    let result = getCached(key);
    if (!result) {
      result = await getUsageMetrics(validatedSlug, authData.user.id, startDate, endDate);
      setCached(key, result);
    }

    // Debug: log what we return so we can verify usage bar gets real data
    console.log("[usage API]", validatedSlug, period, {
      totalHostedJobRuns: result.summary.totalHostedJobRuns,
      totalSelfHostedJobRuns: result.summary.totalSelfHostedJobRuns,
      majorityRuntimeOs: result.summary.majorityRuntimeOs,
    });

    return NextResponse.json({
      summary: result.summary,
      byWorkflow: result.byWorkflow,
      period,
      dateRange: {
        start: startDate.toISOString().slice(0, 10),
        end: endDate.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("GitHub API")) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage metrics" },
      { status: 500 }
    );
  }
});
