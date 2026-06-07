"use client";

// External library imports
import React, { useMemo, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw, GitBranch } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import {
  RunStrip,
  RunningSpotlight,
  OverviewPanel,
  useNowTick,
  getRunLabel,
  getLabelColor,
  shortenTrigger,
  elapsedSeconds,
  type RunLabel,
  type RunningSpotlightItem,
} from "@/components/dashboard/run-ui";

// Hook imports
import { useSession } from "@/lib/auth-client";
import {
  useDateState,
  useRepositoryWorkflows,
  useWorkflowRuns,
  type WorkflowRun,
} from "@/lib/hooks/use-repository-dashboard";

// Utility imports
import {
  duration,
  formatRunTime,
  formatDuration,
  getWorkflowDotClass,
  getWorkflowHealthLabel,
  getWorkflowPillClass,
  type WorkflowHealth,
} from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

interface BranchStat {
  name: string;
  total: number;
  passed: number;
  failed: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Accent treatment for the Latest Run card, keyed by the run's outcome. */
function getRunAccent(label: RunLabel | null): {
  border: string;
  text: string;
  dot: string;
  word: string;
} {
  switch (label) {
    case "PASS": return { border: "border-[#00e5a0]/25", text: "text-[#00e5a0]", dot: "bg-[#00e5a0]", word: "PASSED" };
    case "FAIL": return { border: "border-red-500/30", text: "text-red-500", dot: "bg-red-500", word: "FAILED" };
    case "RUN":  return { border: "border-[#4d9fff]/30", text: "text-[#4d9fff]", dot: "bg-[#4d9fff]", word: "RUNNING" };
    case "SKIP": return { border: "border-amber-400/25", text: "text-amber-400", dot: "bg-amber-400", word: "SKIPPED" };
    default:     return { border: "border-border", text: "text-muted-foreground/60", dot: "bg-muted-foreground/40", word: "—" };
  }
}

// ============================================================================
// Sub-Components — Latest Run card
// ============================================================================

/**
 * Latest Run card — the single-workflow analog of the repo "Needs Attention"
 * card. Surfaces the most recent run's outcome big and accent-colored, with a
 * live elapsed timer while running, today's run-strip, pass streak, and a
 * direct GitHub link to drill into the run.
 */
function LatestRun({ runs, now }: { runs: WorkflowRun[]; now: number }) {
  const latest = useMemo(() => {
    if (runs.length === 0) return null;
    return [...runs].sort(
      (a, b) =>
        new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
    )[0];
  }, [runs]);

  // Consecutive pass streak from the latest completed run backwards
  const streak = useMemo(() => {
    const completed = [...runs]
      .filter((r) => r.status === "completed")
      .sort((a, b) => new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime());
    let count = 0;
    for (const r of completed) {
      if (r.conclusion === "success") count++;
      else break;
    }
    return count;
  }, [runs]);

  const label = latest ? getRunLabel(latest) : null;
  const accent = getRunAccent(label);
  const isRunning = label === "RUN";

  const dur = latest
    ? isRunning
      ? formatDuration(elapsedSeconds(latest.run_started_at, now))
      : latest.run_started_at && latest.updated_at
      ? duration(latest.run_started_at, latest.updated_at)
      : "—"
    : "—";

  return (
    <div
      className={`rounded-lg border bg-card flex flex-col flex-shrink-0 w-full lg:w-[300px] overflow-hidden ${accent.border}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <span className="text-sm font-normal text-muted-foreground">Latest run</span>
        {isRunning && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#4d9fff]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#4d9fff]/60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#4d9fff]" />
            </span>
            live
          </span>
        )}
      </div>

      {latest === null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 py-6 text-center">
          <span className="text-2xl font-bold font-mono text-muted-foreground/50">—</span>
          <span className="text-xs text-muted-foreground/60">No runs on this date</span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-4 py-4 gap-3">
          {/* Outcome headline */}
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${accent.dot} ${isRunning ? "animate-pulse" : ""}`} />
            <span className={`text-2xl font-bold font-mono tracking-tight ${accent.text}`}>
              {accent.word}
            </span>
            <span
              className={`ml-auto text-sm font-mono tabular-nums ${
                isRunning ? "text-[#4d9fff] animate-pulse" : "text-muted-foreground/60"
              }`}
            >
              {dur}
            </span>
          </div>

          {/* Meta */}
          <div className="flex flex-col gap-0.5 text-xs font-mono text-muted-foreground/60">
            <span>
              run #{latest.run_number} ·{" "}
              {latest.run_started_at ? formatRunTime(latest.run_started_at) : "--:--"}
            </span>
            <span className="truncate">
              {(latest.head_branch || "—") + " · " + shortenTrigger(latest.event || "")}
            </span>
          </div>

          {/* Today's run-strip */}
          <RunStrip runs={runs} />

          {/* Footer — streak + GitHub link */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-mono text-muted-foreground/50">
              {streak > 0 ? (
                <span className="text-[#00e5a0]/80">{streak} pass streak</span>
              ) : (
                "no streak"
              )}
            </span>
            {latest.html_url && (
              <Link
                href={latest.html_url}
                target="_blank"
                className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                GitHub <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components — Live Feed
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
      className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] last:border-0 font-mono text-sm animate-in fade-in-0 slide-in-from-bottom-1 hover:bg-white/[0.04] transition-colors"
      style={{
        animationDelay: `${index * 0.08}s`,
        animationFillMode: "forwards",
        animationDuration: "0.2s",
      }}
    >
      {/* Timestamp */}
      <span className="text-muted-foreground/50 w-12 flex-shrink-0 tabular-nums">{time}</span>

      {/* Type label */}
      <span className={`font-bold w-10 flex-shrink-0 tracking-wide ${labelColor}`}>{label}</span>

      {/* Run number */}
      <span className="text-muted-foreground/40 w-10 flex-shrink-0 tabular-nums">#{run.run_number}</span>

      {/* Branch */}
      <span className="text-foreground/70 truncate flex-1 min-w-0">{branch}</span>

      {/* Trigger */}
      <span className="text-muted-foreground/40 w-36 flex-shrink-0 text-left truncate">{trigger}</span>

      {/* Duration */}
      <span
        className={`w-20 flex-shrink-0 text-right tabular-nums ${
          isActive ? "text-[#4d9fff]/60 animate-pulse" : "text-muted-foreground/40"
        }`}
      >
        {dur}
      </span>

      {/* GitHub link */}
      {run.html_url ? (
        <Link
          href={run.html_url}
          target="_blank"
          className="text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors flex-shrink-0 p-1 rounded hover:bg-white/5"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      ) : (
        <span className="w-6 flex-shrink-0" />
      )}
    </div>
  );
}

/**
 * Terminal-style live feed panel.
 * Shows all workflow runs for the selected date in reverse chronological order,
 * with a pulsing "ingesting" indicator when a run is active.
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
          <span className="text-sm font-normal text-muted-foreground">Live Feed</span>
          <span className="text-[10px] text-muted-foreground/30 font-mono">—</span>
          <span className="text-xs text-muted-foreground/40">
            {isLoading ? "…" : `${runs.length} runs`}
          </span>
        </div>
        {isIngesting ? (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
            <span className="text-xs text-[#00e5a0]/80">ingesting</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#4d9fff]/50" />
            <span className="text-xs text-muted-foreground/50">live</span>
          </div>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04] flex-shrink-0">
        <span className="text-xs text-muted-foreground/40 w-12 flex-shrink-0">time</span>
        <span className="text-xs text-muted-foreground/40 w-10 flex-shrink-0">type</span>
        <span className="text-xs text-muted-foreground/40 w-10 flex-shrink-0">run</span>
        <span className="text-xs text-muted-foreground/40 flex-1">branch</span>
        <span className="text-xs text-muted-foreground/40 w-36 flex-shrink-0 text-left">trigger</span>
        <span className="text-xs text-muted-foreground/40 w-20 flex-shrink-0 text-right">duration</span>
        <span className="w-6 flex-shrink-0" />
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
        <div className="overflow-y-auto max-h-[480px] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
          {sorted.map((run, i) => (
            <FeedRow key={run.id} run={run} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components — Branch Breakdown
// ============================================================================

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
        <span className="text-sm font-normal text-muted-foreground">Branch Breakdown</span>
      </div>

      {/* Column labels */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/[0.04]">
        <span className="text-xs text-muted-foreground/40 flex-1">branch</span>
        <span className="text-xs text-muted-foreground/40 w-10 text-center">runs</span>
        <span className="text-xs text-muted-foreground/40 w-10 text-center">pass</span>
        <span className="text-xs text-muted-foreground/40 w-10 text-center">fail</span>
        <span className="text-xs text-muted-foreground/40 w-28 text-right">pass rate</span>
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
              <span className="text-sm text-foreground/80 flex-1 truncate">{b.name}</span>
              <span className="text-sm text-muted-foreground/60 w-10 text-center tabular-nums">{b.total}</span>
              <span className="text-sm text-[#00e5a0] w-10 text-center tabular-nums">{b.passed}</span>
              <span className="text-sm text-red-500 w-10 text-center tabular-nums">{b.failed}</span>
              <div className="w-28 flex items-center gap-2">
                <div className="flex-1 h-[2px] rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00e5a0] transition-[width] duration-700 ease-out"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground/60 w-10 text-right tabular-nums">
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
 * Mirrors the repository dashboard's hybrid triage layout:
 *  1. Header — back, name, health pill, live "running" pill, date controls
 *  2. Running Spotlight — only when a run is in progress (live elapsed timers)
 *  3. Ribbon — Latest Run card + stat-chip/24h activity Overview panel
 *  4. Live Feed — full-width run log for the selected date
 *  5. Branch Breakdown — per-branch pass/fail table
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

  /** Active (in-progress / queued) runs, oldest first */
  const activeRuns = useMemo(
    () =>
      runs
        .filter((r) => r.status === "in_progress" || r.status === "queued")
        .sort(
          (a, b) =>
            new Date(a.run_started_at).getTime() - new Date(b.run_started_at).getTime()
        ),
    [runs]
  );

  const isIngesting = activeRuns.length > 0;
  const now = useNowTick(isIngesting);

  /** Running spotlight items — one per active run of this workflow */
  const runningItems: RunningSpotlightItem[] = useMemo(
    () =>
      activeRuns.map((run) => ({
        id: run.id,
        name: `Run #${run.run_number}`,
        meta: `${run.head_branch || "—"} · ${shortenTrigger(run.event || "")}`,
        startedAt: run.run_started_at,
        todayRuns: runs,
        href: run.html_url,
        external: true,
      })),
    [activeRuns, runs]
  );

  /** Classify workflow health from today's completed runs */
  const workflowHealth = useMemo((): WorkflowHealth => {
    const completed = runs.filter((r) => r.status === "completed");
    if (completed.length === 0) return "idle";
    const passed = completed.filter((r) => r.conclusion === "success").length;
    const failed = completed.filter((r) => r.conclusion === "failure").length;
    if (passed === completed.length) return "consistent";
    if (failed === completed.length) return "still_failing";
    return passed >= failed ? "improved" : "regressed";
  }, [runs]);

  /** Derived stats for the overview panel */
  const stats = useMemo(() => {
    const completed = runs.filter((r) => r.status === "completed");
    const passed = runs.filter((r) => r.conclusion === "success").length;
    const failed = runs.filter((r) => r.conclusion === "failure").length;
    const successRate =
      completed.length > 0 ? Math.round((passed / completed.length) * 100) : 0;
    const totalMs = completed.reduce((sum, r) => {
      if (r.run_started_at && r.updated_at) {
        return (
          sum +
          Math.abs(new Date(r.updated_at).getTime() - new Date(r.run_started_at).getTime())
        );
      }
      return sum;
    }, 0);
    const avgRuntimeSec =
      completed.length > 0 ? Math.floor(totalMs / completed.length / 1000) : 0;
    return { passed, failed, completed: completed.length, successRate, avgRuntimeSec };
  }, [runs]);

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

  const todayStr = new Date().toISOString().slice(0, 10);

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
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back to repo dashboard */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Link href={`/dashboard/${slug}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            {/* Workflow identity */}
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {workflow?.name ?? `Workflow #${workflowId}`}
            </h1>

            {/* Workflow health pill */}
            {!isLoadingRuns && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest flex-shrink-0 ${getWorkflowPillClass(workflowHealth)}`}
              >
                <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${getWorkflowDotClass(workflowHealth)}`} />
                {getWorkflowHealthLabel(workflowHealth)}
              </div>
            )}

            {/* Live running pill — only when a run is in progress */}
            {runningItems.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#4d9fff]/30 bg-[#4d9fff]/10 text-[10px] font-mono uppercase tracking-widest flex-shrink-0 text-[#4d9fff] animate-in fade-in-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#4d9fff]/60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#4d9fff]" />
                </span>
                {runningItems.length} running
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(todayStr)}
              className={selectedDate === todayStr ? "bg-primary text-primary-foreground" : ""}
            >
              Today
            </Button>
            <div className="hidden sm:block">
              <DatePicker date={new Date(selectedDate)} onDateChange={handleDateChange} />
            </div>
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

        {/* ── Running Spotlight (conditional) ── */}
        {runningItems.length > 0 && (
          <RunningSpotlight items={runningItems} now={now} />
        )}

        {/* ── Ribbon: Latest Run + Stats/Activity ── */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch">
          <LatestRun runs={runs} now={now} />
          <OverviewPanel
            runs={runs}
            overviewHourData={[]}
            passedRuns={stats.passed}
            failedRuns={stats.failed}
            successRate={stats.successRate}
            completedRuns={stats.completed}
            totalRuns={runs.length}
            avgRuntimeSec={stats.avgRuntimeSec}
          />
        </div>

        {/* ── Branch Breakdown ── */}
        {!isLoadingRuns && <BranchBreakdown runs={runs} />}

        {/* ── Live Feed (full width) ── */}
        <LiveFeed runs={runs} isIngesting={isIngesting} isLoading={isLoadingRuns} />

      </div>
    </div>
  );
}
