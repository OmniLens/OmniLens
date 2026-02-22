"use client";

// External library imports
import React, { useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw, GitBranch } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";

// Hook imports
import { useSession } from "@/lib/auth-client";
import {
  useDateState,
  useRepositoryWorkflows,
  useWorkflowRuns,
  type WorkflowRun,
} from "@/lib/hooks/use-repository-dashboard";

// Utility imports
import { duration, formatRunTime } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

type RunLabel = "PASS" | "FAIL" | "RUN" | "SKIP";

interface BranchStat {
  name: string;
  total: number;
  passed: number;
  failed: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Derive the display label for a run based on status + conclusion */
function getRunLabel(run: WorkflowRun): RunLabel {
  if (run.status === "in_progress" || run.status === "queued") return "RUN";
  if (run.conclusion === "success") return "PASS";
  if (run.conclusion === "cancelled" || run.conclusion === "skipped") return "SKIP";
  return "FAIL";
}

/** Tailwind text-color class for each label */
function getLabelColor(label: RunLabel): string {
  switch (label) {
    case "PASS": return "text-[#00e5a0]";
    case "FAIL": return "text-red-500";
    case "RUN":  return "text-[#4d9fff]";
    case "SKIP": return "text-amber-400";
  }
}

/** Shorten GitHub event names for the feed */
function shortenTrigger(event: string): string {
  switch (event) {
    case "pull_request":      return "PR";
    case "schedule":          return "cron";
    case "workflow_dispatch": return "manual";
    case "push":              return "push";
    default:                  return event;
  }
}

/**
 * Extract the GitHub repo base URL from a run's html_url
 * e.g. "https://github.com/owner/repo/actions/runs/123" → "https://github.com/owner/repo"
 */
function extractRepoUrl(htmlUrl: string): string {
  const match = htmlUrl.match(/^(https:\/\/github\.com\/[^/]+\/[^/]+)/);
  return match ? match[1] : "";
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * A single row in the live feed terminal.
 * Animates in with a staggered fade-up effect matching the signal ingestion mockup.
 */
function FeedRow({ run, index }: { run: WorkflowRun; index: number }) {
  const label = getRunLabel(run);
  const labelColor = getLabelColor(label);
  const time = run.run_started_at ? formatRunTime(run.run_started_at) : "--:--";
  const isActive = label === "RUN";

  const dur =
    isActive
      ? "..."
      : run.run_started_at && run.updated_at
      ? duration(run.run_started_at, run.updated_at)
      : "—";

  const branch = run.head_branch || "unknown";
  const trigger = shortenTrigger(run.event || "");

  return (
    <div
      className="flex items-center gap-3 py-2.5 border-b border-white/[0.03] last:border-0 font-mono text-xs animate-in fade-in-0 slide-in-from-bottom-1"
      style={{
        animationDelay: `${index * 0.08}s`,
        animationFillMode: "forwards",
        animationDuration: "0.2s",
      }}
    >
      {/* Timestamp */}
      <span className="text-muted-foreground/50 w-12 flex-shrink-0 tabular-nums">{time}</span>

      {/* Type label */}
      <span className={`font-bold w-8 flex-shrink-0 tracking-wide ${labelColor}`}>{label}</span>

      {/* Run number */}
      <span className="text-muted-foreground/40 w-10 flex-shrink-0 tabular-nums">#{run.run_number}</span>

      {/* Branch */}
      <span className="text-foreground/70 truncate flex-1 min-w-0">{branch}</span>

      {/* Trigger */}
      <span className="text-muted-foreground/40 w-14 flex-shrink-0 text-right">{trigger}</span>

      {/* Duration */}
      <span
        className={`w-20 flex-shrink-0 text-right tabular-nums ${
          isActive ? "text-[#4d9fff]/60 animate-pulse" : "text-muted-foreground/40"
        }`}
      >
        {dur}
      </span>

      {/* GitHub link */}
      {run.html_url && (
        <Link
          href={run.html_url}
          target="_blank"
          className="text-muted-foreground/25 hover:text-muted-foreground/70 transition-colors flex-shrink-0"
        >
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/**
 * Terminal-style live feed panel.
 * Shows all workflow runs for the selected date in reverse chronological order,
 * with a pulsing "ingesting" indicator when a run is active.
 * Distinct loading / empty / data states prevent the scrollbar from appearing
 * when there is no content, and distinguish "loading" from "no runs".
 */
function LiveFeed({
  runs,
  isIngesting,
  isLoading,
}: {
  runs: WorkflowRun[];
  isIngesting: boolean;
  isLoading: boolean;
}) {
  const sorted = useMemo(
    () =>
      [...runs].sort(
        (a, b) =>
          new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
      ),
    [runs]
  );

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col">
      {/* Feed header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            Live Feed
          </span>
          <span className="text-[10px] text-muted-foreground/30 font-mono">—</span>
          <span className="text-[10px] text-muted-foreground/40 font-mono">
            {isLoading ? "…" : `${runs.length} runs`}
          </span>
        </div>
        {isIngesting ? (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
            <span className="text-[10px] font-mono text-[#00e5a0]/80 uppercase tracking-widest">
              ingesting
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#4d9fff]/50" />
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
              live
            </span>
          </div>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04] flex-shrink-0">
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider w-12 flex-shrink-0">time</span>
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider w-8 flex-shrink-0">type</span>
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider w-10 flex-shrink-0">run</span>
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider flex-1">branch</span>
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider w-14 flex-shrink-0 text-right">trigger</span>
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider w-20 flex-shrink-0 text-right">duration</span>
        <span className="w-3 flex-shrink-0" />
      </div>

      {/* Feed body — three distinct states so overflow never shows on loading/empty */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 px-4">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-[#4d9fff]/30 border-t-[#4d9fff] animate-spin" />
            <span className="text-xs text-muted-foreground/40 font-mono">loading runs...</span>
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex items-center justify-center py-16 px-4">
          <span className="text-sm text-muted-foreground/50 font-mono">— no runs recorded —</span>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[480px] px-4 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
          {sorted.map((run, i) => (
            <FeedRow key={run.id} run={run} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * An animated metric row: label + fill bar + value.
 * Matches the style of MetricsCard from the main dashboard.
 */
function MetricRow({
  label,
  value,
  barWidth,
  barColor,
}: {
  label: string;
  value: string | number;
  barWidth: number;
  barColor: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${barWidth}%`;
    }, 420);
    return () => clearTimeout(t);
  }, [barWidth]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground font-mono w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-[3px] rounded-full bg-white/5 overflow-hidden">
        <div
          ref={barRef}
          className={`h-full rounded-full ${barColor} transition-[width] duration-700 ease-out`}
          style={{ width: 0 }}
        />
      </div>
      <span className="text-xs text-foreground font-mono w-14 text-right flex-shrink-0 tabular-nums">
        {value}
      </span>
    </div>
  );
}

/**
 * Stats panel — big pass-rate number + metric bars + totals.
 * Sits alongside the live feed as a compact at-a-glance health summary.
 */
function StatsPanel({ runs }: { runs: WorkflowRun[] }) {
  const completedRuns = runs.filter((r) => r.status === "completed");
  const passedRuns    = runs.filter((r) => r.conclusion === "success");
  const failedRuns    = runs.filter((r) => r.conclusion === "failure");

  const successRate =
    completedRuns.length > 0
      ? Math.round((passedRuns.length / completedRuns.length) * 100)
      : 0;

  // Average runtime across completed runs
  const avgRuntimeSec = useMemo(() => {
    const totalMs = completedRuns.reduce((sum, r) => {
      if (r.run_started_at && r.updated_at) {
        return sum + Math.abs(
          new Date(r.updated_at).getTime() - new Date(r.run_started_at).getTime()
        );
      }
      return sum;
    }, 0);
    return completedRuns.length > 0 ? totalMs / completedRuns.length / 1000 : 0;
  }, [completedRuns]);

  // Consecutive pass streak from the latest run backwards
  const streak = useMemo(() => {
    const sorted = [...completedRuns].sort(
      (a, b) => new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
    );
    let count = 0;
    for (const r of sorted) {
      if (r.conclusion === "success") count++;
      else break;
    }
    return count;
  }, [completedRuns]);

  const formatAvg = (sec: number) => {
    if (sec === 0) return "—";
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
          Metrics
        </span>
      </div>

      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Pass rate — the hero number */}
        <div className="text-center pb-5 border-b border-border">
          <p className="text-5xl font-bold tabular-nums tracking-tight">
            {runs.length === 0 ? "—" : `${successRate}%`}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono mt-1.5 uppercase tracking-widest">
            pass rate
          </p>
        </div>

        {/* Metric bars */}
        <div className="flex flex-col gap-4">
          <MetricRow
            label="Passed"
            value={passedRuns.length}
            barWidth={runs.length > 0 ? (passedRuns.length / runs.length) * 100 : 0}
            barColor="bg-gradient-to-r from-[#00e5a0] to-[#00ff99]"
          />
          <MetricRow
            label="Failed"
            value={failedRuns.length}
            barWidth={runs.length > 0 ? (failedRuns.length / runs.length) * 100 : 0}
            barColor="bg-gradient-to-r from-red-500 to-red-400"
          />
          <MetricRow
            label="Avg runtime"
            value={formatAvg(avgRuntimeSec)}
            barWidth={Math.min(100, (avgRuntimeSec / 300) * 100)}
            barColor="bg-gradient-to-r from-[#c084fc] to-[#e879f9]"
          />
          <MetricRow
            label="Pass streak"
            value={streak > 0 ? `${streak} runs` : "—"}
            barWidth={Math.min(100, (streak / 10) * 100)}
            barColor="bg-gradient-to-r from-[#4d9fff] to-[#88cfff]"
          />
        </div>

        {/* Total count footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Total runs
          </span>
          <span className="text-sm font-semibold font-mono tabular-nums">{runs.length}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Branch breakdown — groups runs by branch and shows per-branch pass/fail with an inline bar.
 * Only rendered when there are runs with branch data.
 */
function BranchBreakdown({ runs }: { runs: WorkflowRun[] }) {
  const branches: BranchStat[] = useMemo(() => {
    const map = new Map<string, BranchStat>();
    runs.forEach((r) => {
      const b = r.head_branch || "unknown";
      const entry = map.get(b) ?? { name: b, total: 0, passed: 0, failed: 0 };
      entry.total++;
      if (r.conclusion === "success") entry.passed++;
      if (r.conclusion === "failure") entry.failed++;
      map.set(b, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [runs]);

  if (branches.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
          Branch Breakdown
        </span>
      </div>

      {/* Column labels */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/[0.04]">
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider flex-1">branch</span>
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider w-10 text-center">runs</span>
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider w-10 text-center">pass</span>
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider w-10 text-center">fail</span>
        <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider w-28 text-right">pass rate</span>
      </div>

      {/* Branch rows */}
      <div className="px-4 py-1">
        {branches.map((b) => {
          const rate = b.total > 0 ? Math.round((b.passed / b.total) * 100) : 0;
          return (
            <div
              key={b.name}
              className="flex items-center gap-4 py-2.5 border-b border-white/[0.025] last:border-0"
            >
              <span className="text-sm font-mono text-foreground/80 flex-1 truncate">{b.name}</span>
              <span className="text-sm font-mono text-muted-foreground/60 w-10 text-center tabular-nums">{b.total}</span>
              <span className="text-sm font-mono text-[#00e5a0] w-10 text-center tabular-nums">{b.passed}</span>
              <span className="text-sm font-mono text-red-500 w-10 text-center tabular-nums">{b.failed}</span>
              <div className="w-28 flex items-center gap-2">
                <div className="flex-1 h-[2px] rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00e5a0] transition-[width] duration-700 ease-out"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground/50 w-8 text-right tabular-nums">
                  {rate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowDetailPage — a focused dashboard for a single GitHub Actions workflow.
 *
 * Displays a signal-ingestion-style live feed of runs for the selected date,
 * alongside a metrics panel (pass rate, avg runtime, streak) and a branch
 * breakdown table. Design follows the OmniLens signal ingestion mockup.
 */
export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const workflowId = parseInt(params.workflowId as string, 10);

  const { data: session, isPending } = useSession();
  const { selectedDate, setSelectedDate } = useDateState();

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const { data: workflows = [], isLoading: isLoadingWorkflows } =
    useRepositoryWorkflows(slug);

  const { data: allRuns = [], isLoading: isLoadingRuns } =
    useWorkflowRuns(slug, selectedDate);

  // ============================================================================
  // Computed Values
  // ============================================================================

  /** The workflow definition for this page */
  const workflow = useMemo(
    () => workflows.find((w) => w.id === workflowId) ?? null,
    [workflows, workflowId]
  );

  /** Only the runs that belong to this workflow */
  const runs = useMemo(
    () => allRuns.filter((r) => r.workflow_id === workflowId),
    [allRuns, workflowId]
  );

  /** True when any run is currently in progress or queued */
  const isIngesting = useMemo(
    () => runs.some((r) => r.status === "in_progress" || r.status === "queued"),
    [runs]
  );


  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const year  = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day   = String(date.getDate()).padStart(2, "0");
      setSelectedDate(`${year}-${month}-${day}`);
    },
    [setSelectedDate]
  );

  // ============================================================================
  // Render Logic — Early Returns
  // ============================================================================

  if (isPending || isLoadingWorkflows) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            {/* Back to repo dashboard */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex-shrink-0 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Link href={`/dashboard/${slug}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>

            {/* Workflow identity */}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {workflow?.name ?? `Workflow #${workflowId}`}
              </h1>
            </div>

            {/* Live ingestion badge */}
            {isIngesting && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#00e5a0]/20 bg-[#00e5a0]/5 flex-shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
                <span className="text-[10px] font-mono text-[#00e5a0]/80 uppercase tracking-widest">
                  running
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className={
                selectedDate === new Date().toISOString().slice(0, 10)
                  ? "bg-primary text-primary-foreground"
                  : ""
              }
            >
              Today
            </Button>
            <DatePicker
              date={new Date(selectedDate)}
              onDateChange={handleDateChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Main grid: Live Feed (left) + Metrics (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <LiveFeed runs={runs} isIngesting={isIngesting} isLoading={isLoadingRuns} />
          <StatsPanel runs={runs} />
        </div>

        {/* ── Branch Breakdown ── */}
        {!isLoadingRuns && <BranchBreakdown runs={runs} />}

      </div>
    </div>
  );
}
