"use client";

// External library imports
import React, { useMemo, useEffect, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, ExternalLink } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import GitHubStatusBanner from "@/components/GitHubStatusBanner";

// Hook imports
import { useSession } from "@/lib/auth-client";
import {
  useDateState,
  useRepositoryWorkflows,
  useWorkflowRuns,
  useWorkflowOverview,
  useYesterdayWorkflowRuns,
  type WorkflowRun,
  type Workflow,
} from "@/lib/hooks/use-repository-dashboard";

// Utility imports
import { duration, formatRunTime, formatDuration } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

type RunLabel = "PASS" | "FAIL" | "RUN" | "SKIP";
type RepoHealth = "healthy" | "degraded" | "failing" | "idle";
type WorkflowHealth = "consistent" | "improved" | "regressed" | "still_failing" | "idle";

interface HourStat {
  hour: number;
  total: number;
  passed: number;
  failed: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRunLabel(run: WorkflowRun): RunLabel {
  if (run.status === "in_progress" || run.status === "queued") return "RUN";
  if (run.conclusion === "success") return "PASS";
  if (run.conclusion === "cancelled" || run.conclusion === "skipped") return "SKIP";
  return "FAIL";
}

function getLabelColor(label: RunLabel): string {
  switch (label) {
    case "PASS": return "text-[#00e5a0]";
    case "FAIL": return "text-red-500";
    case "RUN":  return "text-[#4d9fff]";
    case "SKIP": return "text-amber-400";
  }
}

function shortenTrigger(event: string): string {
  switch (event) {
    case "pull_request":      return "PR";
    case "schedule":          return "cron";
    case "workflow_dispatch": return "manual";
    case "push":              return "push";
    default:                  return event;
  }
}

/** Map internal health status to a simplified display health for workflow rows */
function mapToWorkflowHealth(
  status: "consistent" | "improved" | "regressed" | "still_failing" | "no_runs_today"
): WorkflowHealth {
  return status === "no_runs_today" ? "idle" : status;
}

/** Dot color for a workflow health status */
function getWorkflowDotClass(health: WorkflowHealth): string {
  switch (health) {
    case "consistent":    return "bg-[#00e5a0]";
    case "improved":      return "bg-[#4d9fff]";
    case "regressed":     return "bg-amber-500";
    case "still_failing": return "bg-red-500";
    case "idle":          return "bg-white/20";
  }
}

/** Label text for a workflow health status */
function getWorkflowHealthLabel(health: WorkflowHealth): string {
  switch (health) {
    case "consistent":    return "consistent";
    case "improved":      return "improved";
    case "regressed":     return "regressed";
    case "still_failing": return "failing";
    case "idle":          return "idle";
  }
}

/**
 * Compute the overall repo health from workflow health counts.
 * Only considers workflows that actually ran today — idle workflows
 * do not contribute to or penalise the repo health score.
 */
function computeRepoHealth(
  consistent: number,
  improved: number,
  regressed: number,
  stillFailing: number,
  _idle: number
): RepoHealth {
  const activeTotal = consistent + improved + regressed + stillFailing;
  if (activeTotal === 0) return "idle";
  const healthy = consistent + improved;
  if (healthy / activeTotal >= 0.7) return "healthy";
  if (stillFailing / activeTotal >= 0.4) return "failing";
  return "degraded";
}

function getRepoHealthConfig(health: RepoHealth): {
  dotClass: string;
  label: string;
  pillClass: string;
} {
  switch (health) {
    case "healthy":
      return {
        dotClass: "bg-[#00e5a0] animate-pulse",
        label: "healthy",
        pillClass: "border-[#00e5a0]/20 bg-[#00e5a0]/5 text-[#00e5a0]/80",
      };
    case "degraded":
      return {
        dotClass: "bg-amber-500",
        label: "degraded",
        pillClass: "border-amber-500/20 bg-amber-500/5 text-amber-400/80",
      };
    case "failing":
      return {
        dotClass: "bg-red-500 animate-pulse",
        label: "failing",
        pillClass: "border-red-500/20 bg-red-500/5 text-red-400/80",
      };
    case "idle":
      return {
        dotClass: "bg-white/30",
        label: "idle",
        pillClass: "border-white/10 bg-white/5 text-white/40",
      };
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * A single stat in the top strip.
 * Compact: label above, big number below.
 */
function StatBox({
  label,
  value,
  valueClass = "text-foreground",
  border = true,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  border?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 px-5 py-4 ${border ? "border-r border-border" : ""} last:border-0`}>
      <span className="text-[9px] text-muted-foreground/60 font-mono uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <span className={`text-xl font-bold tabular-nums font-mono ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

/**
 * A single row in the cross-workflow signal feed.
 * Shows: time · type · workflow name · branch · trigger · duration · GitHub link
 */
function FeedRow({
  run,
  workflowName,
  workflowId,
  slug,
  index,
}: {
  run: WorkflowRun;
  workflowName: string;
  workflowId: number;
  slug: string;
  index: number;
}) {
  const label = getRunLabel(run);
  const labelColor = getLabelColor(label);
  const isActive = label === "RUN";
  const time = run.run_started_at ? formatRunTime(run.run_started_at) : "--:--";
  const dur =
    isActive
      ? "running..."
      : run.run_started_at && run.updated_at
      ? duration(run.run_started_at, run.updated_at)
      : "—";
  const branch  = run.head_branch || "—";
  const trigger = shortenTrigger(run.event || "");

  return (
    <div
      className="flex items-center gap-3 py-2 border-b border-white/[0.025] last:border-0 font-mono text-xs animate-in fade-in-0 slide-in-from-bottom-1"
      style={{
        animationDelay: `${index * 0.06}s`,
        animationFillMode: "forwards",
        animationDuration: "0.18s",
      }}
    >
      {/* Timestamp */}
      <span className="text-muted-foreground/40 w-11 flex-shrink-0 tabular-nums">{time}</span>

      {/* Type */}
      <span className={`font-bold w-7 flex-shrink-0 ${labelColor}`}>{label}</span>

      {/* Workflow name — links to workflow detail */}
      <Link
        href={`/dashboard/${slug}/workflow/${workflowId}`}
        className="text-foreground/60 hover:text-foreground/90 transition-colors truncate w-36 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {workflowName}
      </Link>

      {/* Branch */}
      <span className="text-foreground/50 truncate flex-1 min-w-0">{branch}</span>

      {/* Trigger */}
      <span className="text-muted-foreground/30 w-12 flex-shrink-0 text-right">{trigger}</span>

      {/* Duration */}
      <span
        className={`w-16 flex-shrink-0 text-right tabular-nums ${
          isActive ? "text-[#4d9fff]/60 animate-pulse" : "text-muted-foreground/35"
        }`}
      >
        {dur}
      </span>

      {/* GitHub link */}
      {run.html_url && (
        <Link
          href={run.html_url}
          target="_blank"
          className="text-muted-foreground/20 hover:text-muted-foreground/60 transition-colors flex-shrink-0"
        >
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      )}
    </div>
  );
}

/**
 * Cross-workflow signal feed — the hero panel of V2.
 * Shows every workflow run for the day in reverse-chron order,
 * with the workflow name as a column so users see the full picture at once.
 */
function SignalFeed({
  runs,
  workflowMap,
  slug,
  isIngesting,
  isLoading,
}: {
  runs: WorkflowRun[];
  workflowMap: Map<number, string>;
  slug: string;
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
    <div className="rounded-lg border border-border bg-card flex flex-col h-full">
      {/* Feed header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            Signal Feed
          </span>
          <span className="text-[10px] text-muted-foreground/30 font-mono">—</span>
          <span className="text-[10px] text-muted-foreground/40 font-mono">
            {isLoading ? "…" : `${runs.length} events`}
          </span>
        </div>
        {isIngesting ? (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
            <span className="text-[10px] font-mono text-[#00e5a0]/70 uppercase tracking-widest">ingesting</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#4d9fff]/40" />
            <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">live</span>
          </div>
        )}
      </div>

      {/* Column labels */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-white/[0.035] flex-shrink-0">
        <span className="text-[8px] text-muted-foreground/25 font-mono uppercase tracking-wider w-11 flex-shrink-0">time</span>
        <span className="text-[8px] text-muted-foreground/25 font-mono uppercase tracking-wider w-7 flex-shrink-0">type</span>
        <span className="text-[8px] text-muted-foreground/25 font-mono uppercase tracking-wider w-36 flex-shrink-0">workflow</span>
        <span className="text-[8px] text-muted-foreground/25 font-mono uppercase tracking-wider flex-1">branch</span>
        <span className="text-[8px] text-muted-foreground/25 font-mono uppercase tracking-wider w-12 flex-shrink-0 text-right">trigger</span>
        <span className="text-[8px] text-muted-foreground/25 font-mono uppercase tracking-wider w-16 flex-shrink-0 text-right">dur</span>
        <span className="w-2.5 flex-shrink-0" />
      </div>

      {/* Feed body — three distinct states so overflow never shows on empty/loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 px-4">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-[#4d9fff]/30 border-t-[#4d9fff] animate-spin" />
            <span className="text-xs text-muted-foreground/40 font-mono">loading runs...</span>
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex items-center justify-center py-16 px-4">
          <span className="text-sm text-muted-foreground/40 font-mono">— no signal —</span>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[520px] px-4 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
          {sorted.map((run, i) => (
            <FeedRow
              key={run.id}
              run={run}
              workflowName={workflowMap.get(run.workflow_id) ?? `#${run.workflow_id}`}
              workflowId={run.workflow_id}
              slug={slug}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Single workflow row in the sidebar.
 * Health dot + name (links to workflow detail) + status label.
 */
function SidebarWorkflowRow({
  workflow,
  health,
  slug,
  runCount,
}: {
  workflow: Workflow;
  health: WorkflowHealth;
  slug: string;
  runCount: number;
}) {
  const dotClass = getWorkflowDotClass(health);
  const healthLabel = getWorkflowHealthLabel(health);

  return (
    <Link
      href={`/dashboard/${slug}/workflow/${workflow.id}`}
      className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.025] last:border-0 hover:bg-white/[0.02] transition-colors group"
    >
      {/* Health dot */}
      <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotClass}`} />

      {/* Workflow name */}
      <span className="text-sm font-semibold flex-1 truncate group-hover:text-foreground transition-colors text-foreground/80">
        {workflow.name}
      </span>

      {/* Run count badge */}
      {runCount > 0 && (
        <span className="text-[10px] font-mono text-muted-foreground/40 flex-shrink-0 tabular-nums">
          {runCount}
        </span>
      )}

      {/* Status label */}
      <span className="text-[10px] font-mono text-muted-foreground/50 flex-shrink-0 w-16 text-right">
        {healthLabel}
      </span>
    </Link>
  );
}

/**
 * Workflow sidebar — right panel listing all tracked workflows with health status.
 */
function WorkflowSidebar({
  workflows,
  getHealth,
  getRunCount,
  slug,
}: {
  workflows: Workflow[];
  getHealth: (id: number) => WorkflowHealth;
  getRunCount: (id: number) => number;
  slug: string;
}) {
  const sorted = useMemo(() => {
    const order: Record<WorkflowHealth, number> = {
      still_failing: 0,
      regressed: 1,
      consistent: 2,
      improved: 3,
      idle: 4,
    };
    return [...workflows].sort(
      (a, b) => order[getHealth(a.id)] - order[getHealth(b.id)]
    );
  }, [workflows, getHealth]);

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col h-full">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
          Workflows
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {workflows.length} tracked
        </span>
      </div>

      {/* Workflow rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-xs text-muted-foreground/40 font-mono">no workflows</span>
          </div>
        ) : (
          sorted.map((w) => (
            <SidebarWorkflowRow
              key={w.id}
              workflow={w}
              health={getHealth(w.id)}
              slug={slug}
              runCount={getRunCount(w.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Bar area height in px — determines max bar height for the timeline
const TIMELINE_BAR_HEIGHT = 48;

/**
 * 24-hour activity timeline — a histogram of runs across the day.
 * Bars are colored by pass rate: green (≥80%), amber (mixed), red (failing), muted (no runs).
 * All bars animate up simultaneously on mount using a single useState trigger,
 * avoiding the per-ref timing issues of individual useEffect timers.
 */
function ActivityTimeline({
  runs,
  overviewHourData,
}: {
  runs: WorkflowRun[];
  overviewHourData: Array<{ hour: number; passed: number; total: number }>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 350);
    return () => clearTimeout(t);
  }, []);

  // Rebuild hourStats whenever either data source changes
  const hourStats: HourStat[] = useMemo(() => {
    const map = new Map<number, HourStat>();
    for (let h = 0; h < 24; h++) map.set(h, { hour: h, total: 0, passed: 0, failed: 0 });

    // Prefer the API's pre-computed hourly breakdown
    if (overviewHourData.length > 0) {
      overviewHourData.forEach(({ hour, passed, total }) => {
        if (hour >= 0 && hour < 24) {
          map.set(hour, { hour, total, passed, failed: total - passed });
        }
      });
    } else {
      // Fall back to computing from raw runs
      runs.forEach((r) => {
        if (!r.run_started_at) return;
        const hour = new Date(r.run_started_at).getHours();
        const s = map.get(hour)!;
        s.total++;
        if (r.conclusion === "success") s.passed++;
        if (r.conclusion === "failure") s.failed++;
      });
    }

    return Array.from(map.values());
  }, [runs, overviewHourData]);

  const maxRuns = Math.max(...hourStats.map((s) => s.total), 1);
  const peakHour = hourStats.find((s) => s.total === maxRuns && s.total > 0)?.hour ?? -1;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
          Activity — 24h
        </span>
        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground/40">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-3 rounded-[1px] bg-[#00e5a0]/70" /> pass
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-3 rounded-[1px] bg-amber-500/70" /> mixed
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-3 rounded-[1px] bg-red-500/70" /> fail
          </span>
        </div>
      </div>

      {/* Histogram — bars grow from bottom using px heights driven by mounted state */}
      <div className="px-4 pt-8 pb-3">
        <div className="flex items-end gap-px" style={{ height: TIMELINE_BAR_HEIGHT + 14 }}>
          {hourStats.map((stat) => {
            const barPx = mounted && stat.total > 0
              ? Math.max(Math.round((stat.total / maxRuns) * TIMELINE_BAR_HEIGHT), 2)
              : 0;
            const barColor =
              stat.total === 0
                ? "bg-white/[0.04]"
                : stat.passed / stat.total >= 0.8
                ? "bg-[#00e5a0]/70"
                : stat.passed / stat.total >= 0.4
                ? "bg-amber-500/70"
                : "bg-red-500/70";

            return (
              <div key={stat.hour} className="flex flex-col items-center flex-1" style={{ height: TIMELINE_BAR_HEIGHT + 14 }}>
                {/* Peak label */}
                <div className="flex-1 flex flex-col justify-end relative w-full">
                  {stat.hour === peakHour && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-muted-foreground/40 whitespace-nowrap">
                      peak
                    </span>
                  )}
                  <div
                    className={`w-full rounded-[2px] ${barColor} transition-[height] duration-700 ease-out`}
                    style={{ height: barPx }}
                  />
                </div>
                {/* Hour label — every 6 hours */}
                <span className="text-[8px] font-mono text-muted-foreground/25 tabular-nums mt-1 leading-none flex-shrink-0">
                  {stat.hour % 6 === 0 ? String(stat.hour).padStart(2, "0") : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RepoDashboardV2 — a signal-feed-first redesign of the repository dashboard.
 *
 * Layout:
 *  ┌ Stat Strip ────────────────────────────────────────────┐
 *  ├ Signal Feed (60%) ─────┬ Workflow Sidebar (40%) ───────┤
 *  └ Activity Timeline ─────────────────────────────────────┘
 *
 * The signal feed is the hero: a cross-workflow terminal showing every run
 * for the day in reverse-chronological order, modelled on the signal ingestion
 * mockup from index.html. Metrics are collapsed into a compact strip rather
 * than the full DailyMetrics card grid.
 */
export default function RepoDashboardV2() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: session, isPending } = useSession();
  const { selectedDate, setSelectedDate } = useDateState();

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (!isPending && !session) router.push("/login");
  }, [session, isPending, router]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const { data: workflows = [], isLoading: isLoadingWorkflows } =
    useRepositoryWorkflows(slug);

  const { data: workflowRuns = [], isLoading: isLoadingRuns } =
    useWorkflowRuns(slug, selectedDate);

  const { data: overviewData } = useWorkflowOverview(slug, selectedDate);

  const { data: yesterdayRuns = [] } = useYesterdayWorkflowRuns(slug, selectedDate);

  // ============================================================================
  // Computed Values
  // ============================================================================

  /** workflowId → name map for the feed */
  const workflowMap = useMemo(() => {
    const map = new Map<number, string>();
    workflows.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [workflows]);

  /** workflowId → run[] map for run counts and health */
  const groupedRuns = useMemo(() => {
    const map = new Map<number, WorkflowRun[]>();
    workflowRuns.forEach((r) => {
      const list = map.get(r.workflow_id) ?? [];
      list.push(r);
      map.set(r.workflow_id, list);
    });
    return map;
  }, [workflowRuns]);

  /** Get last run result for yesterday comparison */
  const getLastRunResult = useCallback(
    (workflowId: number, runs: WorkflowRun[]): "success" | "failure" | null => {
      const wfRuns = runs.filter((r) => r.workflow_id === workflowId);
      if (wfRuns.length === 0) return null;
      const sorted = [...wfRuns].sort(
        (a, b) =>
          new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
      );
      return sorted[0].conclusion === "success" ? "success" : "failure";
    },
    []
  );

  /** Classify a workflow's health for the selected date */
  const classifyWorkflowHealth = useCallback(
    (
      workflowId: number
    ): "consistent" | "improved" | "regressed" | "still_failing" | "no_runs_today" => {
      const currentlyRunning = workflowRuns.find(
        (r) =>
          r.workflow_id === workflowId &&
          (r.status === "in_progress" || r.status === "queued")
      );
      const todayRuns = workflowRuns.filter((r) => r.workflow_id === workflowId);

      if (currentlyRunning) return todayRuns.length === 0 ? "no_runs_today" : "consistent";
      if (todayRuns.length === 0) return "no_runs_today";

      const allSuccessfulToday = todayRuns.every((r) => r.conclusion === "success");
      const allFailedToday = todayRuns.every((r) => r.conclusion === "failure");
      const yesterdayLastResult = getLastRunResult(workflowId, yesterdayRuns);

      if (allSuccessfulToday) {
        return yesterdayLastResult === "failure" ? "improved" : "consistent";
      }
      if (allFailedToday) {
        return yesterdayLastResult === "success" ? "regressed" : "still_failing";
      }

      // Mixed results
      const todayLastResult = getLastRunResult(workflowId, todayRuns);
      if (yesterdayLastResult === null) {
        const s = todayRuns.filter((r) => r.conclusion === "success").length;
        const f = todayRuns.filter((r) => r.conclusion === "failure").length;
        return s > f ? "improved" : "regressed";
      }
      if (yesterdayLastResult === "failure" && todayLastResult === "success") return "improved";
      if (yesterdayLastResult === "success" && todayLastResult === "failure") return "regressed";
      const s = todayRuns.filter((r) => r.conclusion === "success").length;
      const f = todayRuns.filter((r) => r.conclusion === "failure").length;
      if (yesterdayLastResult === "success") return s > f ? "consistent" : "regressed";
      return s > f ? "improved" : "still_failing";
    },
    [workflowRuns, yesterdayRuns, getLastRunResult]
  );

  /** getHealth returns the simplified WorkflowHealth for sidebar display */
  const getHealth = useCallback(
    (workflowId: number): WorkflowHealth =>
      mapToWorkflowHealth(classifyWorkflowHealth(workflowId)),
    [classifyWorkflowHealth]
  );

  /** getRunCount returns how many runs a workflow had today */
  const getRunCount = useCallback(
    (workflowId: number): number => groupedRuns.get(workflowId)?.length ?? 0,
    [groupedRuns]
  );

  /** Aggregate health counts across all workflows */
  const healthCounts = useMemo(() => {
    let consistent = 0, improved = 0, regressed = 0, stillFailing = 0, idle = 0;
    workflows.forEach((w) => {
      switch (classifyWorkflowHealth(w.id)) {
        case "consistent":    consistent++; break;
        case "improved":      improved++;   break;
        case "regressed":     regressed++;  break;
        case "still_failing": stillFailing++; break;
        case "no_runs_today": idle++;        break;
      }
    });
    return { consistent, improved, regressed, stillFailing, idle };
  }, [workflows, classifyWorkflowHealth]);

  const repoHealth = useMemo(
    () =>
      computeRepoHealth(
        healthCounts.consistent,
        healthCounts.improved,
        healthCounts.regressed,
        healthCounts.stillFailing,
        healthCounts.idle
      ),
    [healthCounts]
  );

  const isIngesting = useMemo(
    () =>
      workflowRuns.some(
        (r) => r.status === "in_progress" || r.status === "queued"
      ),
    [workflowRuns]
  );

  // Derived stats for the strip
  const passedRuns    = overviewData?.passedRuns    ?? 0;
  const failedRuns    = overviewData?.failedRuns    ?? 0;
  const completedRuns = overviewData?.completedRuns ?? 0;
  const successRate =
    completedRuns > 0 ? Math.round((passedRuns / completedRuns) * 100) : 0;
  const avgRuntimeSec =
    completedRuns > 0
      ? Math.floor((overviewData?.totalRuntime ?? 0) / completedRuns)
      : 0;

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      setSelectedDate(`${y}-${m}-${d}`);
    },
    [setSelectedDate]
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const healthConfig = getRepoHealthConfig(repoHealth);

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

        <GitHubStatusBanner className="mb-2" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {/* Repo slug */}
            <h1 className="text-xl sm:text-2xl font-bold font-mono truncate">{slug}</h1>

            {/* Overall repo health pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest flex-shrink-0 ${healthConfig.pillClass}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${healthConfig.dotClass}`} />
              {healthConfig.label}
            </div>
          </div>

          {/* Controls + V1 toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/dashboard/${slug}`}
              className="text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors px-2 py-1 rounded border border-border hover:border-muted-foreground/20"
            >
              ← v1
            </Link>
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

        {/* ── Stat Strip ── */}
        <div className="rounded-lg border border-border bg-card flex overflow-x-auto">
          <StatBox
            label="Pass rate"
            value={completedRuns > 0 ? `${successRate}%` : "—"}
            valueClass={
              successRate >= 80
                ? "text-[#00e5a0]"
                : successRate >= 50
                ? "text-amber-400"
                : completedRuns > 0
                ? "text-red-500"
                : "text-muted-foreground/50"
            }
          />
          <StatBox label="Passed" value={passedRuns} valueClass="text-[#00e5a0]" />
          <StatBox label="Failed" value={failedRuns} valueClass={failedRuns > 0 ? "text-red-500" : "text-muted-foreground/50"} />
          <StatBox label="Total runs" value={workflowRuns.length} />
          <StatBox
            label="Avg runtime"
            value={avgRuntimeSec > 0 ? formatDuration(avgRuntimeSec) : "—"}
            valueClass="text-[#c084fc]"
          />
          <StatBox
            label="Workflows"
            value={workflows.length}
            valueClass="text-[#4d9fff]"
          />
          <StatBox
            label="Failing"
            value={healthCounts.stillFailing + healthCounts.regressed}
            valueClass={
              healthCounts.stillFailing + healthCounts.regressed > 0
                ? "text-red-500"
                : "text-muted-foreground/50"
            }
            border={false}
          />
        </div>

        {/* ── Main Grid: Feed (left) + Sidebar (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <SignalFeed
            runs={workflowRuns}
            workflowMap={workflowMap}
            slug={slug}
            isIngesting={isIngesting}
            isLoading={isLoadingRuns}
          />
          <WorkflowSidebar
            workflows={workflows}
            getHealth={getHealth}
            getRunCount={getRunCount}
            slug={slug}
          />
        </div>

        {/* ── Activity Timeline ── */}
        {!isLoadingRuns && (
          <ActivityTimeline
            runs={workflowRuns}
            overviewHourData={overviewData?.runsByHour ?? []}
          />
        )}

      </div>
    </div>
  );
}
