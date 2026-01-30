"use client";

// External library imports
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { TrendingUp, ChevronDown, Server, Monitor, Cpu } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Hook imports
import { useSession } from "@/lib/auth-client";
import { useUsageMetrics, type UsagePeriod } from "@/lib/hooks/use-usage-metrics";

// ============================================================================
// Constants
// ============================================================================

const PERIODS: { id: UsagePeriod; label: string }[] = [
  { id: "current_month", label: "Current month" },
  { id: "last_7_days", label: "Last 7 days" },
];

// ============================================================================
// Main Component
// ============================================================================

/**
 * Usage page for a specific repository
 * Displays Actions Usage Metrics: summary cards, long widget (hosted/self-hosted/majority OS), and per-workflow table.
 */
export default function RepoUsagePage() {
  const router = useRouter();
  const params = useParams();
  const repoSlug = params.slug as string;
  const { data: session, isPending } = useSession();
  const [period, setPeriod] = useState<UsagePeriod>("current_month");

  const { data, isLoading, error } = useUsageMetrics(repoSlug, { period });

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? "Current month";
  const summary = data?.summary;
  const byWorkflow = data?.byWorkflow ?? [];
  const dateRange = data?.dateRange;

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-foreground" />
            <h1 className="text-xl sm:text-2xl font-bold">Actions Usage Metrics</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {dateRange && (
              <span>
                Showing data from {dateRange.start} to {dateRange.end}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Period: {periodLabel}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {PERIODS.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => setPeriod(p.id)}>
                    {p.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">Total minutes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {isLoading ? "—" : summary != null ? summary.totalMinutes : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Total minutes across all workflows in this repository for the selected period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Long widget: Hosted / Self-hosted / Majority OS */}
        <Card className="border-muted/50">
          <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex w-full flex-wrap items-center justify-between gap-x-10 gap-y-5 sm:gap-x-14 sm:gap-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15">
                  <Server className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hosted runners</p>
                  <p className="text-lg font-semibold">
                    {isLoading ? "—" : summary != null ? summary.totalHostedJobRuns : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                  <Monitor className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Self-hosted runners</p>
                  <p className="text-lg font-semibold">
                    {isLoading ? "—" : summary != null ? summary.totalSelfHostedJobRuns : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15">
                  <Cpu className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Runtime OS</p>
                  <p className="text-lg font-semibold">
                    {isLoading ? "—" : summary?.majorityRuntimeOs ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics table */}
        <Card>
          <CardHeader>
            <CardTitle>Workflows</CardTitle>
            <p className="text-sm text-muted-foreground">Usage by workflow for the selected period</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium">Workflow</th>
                    <th className="px-4 py-3 text-right font-medium">Total minutes</th>
                    <th className="px-4 py-3 text-right font-medium">Workflow runs</th>
                    <th className="px-4 py-3 text-right font-medium">Jobs</th>
                    <th className="px-4 py-3 text-left font-medium">Runner type</th>
                    <th className="px-4 py-3 text-left font-medium">Runtime OS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  ) : byWorkflow.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No workflow runs in this period
                      </td>
                    </tr>
                  ) : (
                    byWorkflow.map((row, i) => (
                      <tr key={`${row.path}-${i}`} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{row.workflowName}</td>
                        <td className="px-4 py-3 text-right">{row.totalMinutes}</td>
                        <td className="px-4 py-3 text-right">{row.workflowRuns}</td>
                        <td className="px-4 py-3 text-right">{row.jobs}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={row.runnerType === "hosted" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {row.runnerType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.runtimeOs}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {byWorkflow.length > 0 && (
              <div className="flex items-center justify-end gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
                <span>1–{byWorkflow.length} of {byWorkflow.length}</span>
                <Button variant="ghost" size="sm" disabled className="h-7">
                  Previous
                </Button>
                <Button variant="ghost" size="sm" disabled className="h-7">
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground">
          Minutes are computed from run/job duration (not GitHub billable minutes). For official billing and
          usage, see the repository&apos;s Insights → Actions usage metrics on GitHub.
        </p>
      </div>
    </div>
  );
}
