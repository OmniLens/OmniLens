"use client";

// External library imports
import React, { useMemo, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import GitHubStatusBanner from "@/components/GitHubStatusBanner";
import {
  RunStrip,
  RunningSpotlight,
  OverviewPanel,
  useNowTick,
  getRunLabel,
  getLabelColor,
  shortenTrigger,
  elapsedSeconds,
  type RunningSpotlightItem,
} from "@/components/dashboard/run-ui";

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

type RepoHealth = "healthy" | "degraded" | "failing" | "idle";

/**
 * Unified per-workflow row state combining health classification with a
 * live "running" flag. Drives sort order, the status label, and accent colors
 * in the triage list. Lower priority = surfaced higher (more urgent).
 */
type RowState =
  | "failing"
  | "regressed"
  | "running"
  | "improved"
  | "consistent"
  | "idle";

// ============================================================================
// Helper Functions
// ============================================================================

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
        label: "HEALTHY",
        pillClass: "border-[#00e5a0]/20 bg-[#00e5a0]/5 text-[#00e5a0]/80",
      };
    case "degraded":
      return {
        dotClass: "bg-amber-500",
        label: "DEGRADED",
        pillClass: "border-amber-500/20 bg-amber-500/5 text-amber-400/80",
      };
    case "failing":
      return {
        dotClass: "bg-red-500 animate-pulse",
        label: "FAILING",
        pillClass: "border-red-500/20 bg-red-500/5 text-red-400/80",
      };
    case "idle":
      return {
        dotClass: "bg-white/30",
        label: "IDLE",
        pillClass: "border-white/10 bg-white/5 text-white/40",
      };
  }
}

/** Visual config for each row state — dot, label, and accent text. */
function getRowStateConfig(state: RowState): {
  dotClass: string;
  label: string;
  textClass: string;
  priority: number;
} {
  switch (state) {
    case "failing":
      return { dotClass: "bg-red-500", label: "FAILING", textClass: "text-red-500", priority: 0 };
    case "regressed":
      return { dotClass: "bg-amber-500", label: "REGRESSED", textClass: "text-amber-400", priority: 1 };
    case "running":
      return { dotClass: "bg-[#4d9fff] animate-pulse", label: "RUNNING", textClass: "text-[#4d9fff]", priority: 2 };
    case "improved":
      return { dotClass: "bg-[#4d9fff]", label: "IMPROVED", textClass: "text-[#4d9fff]", priority: 3 };
    case "consistent":
      return { dotClass: "bg-[#00e5a0]", label: "HEALTHY", textClass: "text-[#00e5a0]/80", priority: 4 };
    case "idle":
      return { dotClass: "bg-muted-foreground/40", label: "IDLE", textClass: "text-muted-foreground/50", priority: 5 };
  }
}

// ============================================================================
// Sub-Components — Overview Ribbon
// ============================================================================

/**
 * Needs Attention card — the primary triage signal. Red-accented with a big
 * count when failing/regressed workflows exist; calm "all clear" otherwise.
 * Lists the worst offenders as quick drill-down links.
 */
function NeedsAttention({
  failing,
  regressed,
  offenders,
  slug,
}: {
  failing: number;
  regressed: number;
  offenders: Workflow[];
  slug: string;
}) {
  const total = failing + regressed;
  const clear = total === 0;

  return (
    <div
      className={`rounded-lg border bg-card flex flex-col flex-shrink-0 w-full lg:w-[300px] overflow-hidden ${
        clear ? "border-[#00e5a0]/20" : "border-red-500/30"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
        {clear ? (
          <ShieldCheck className="h-4 w-4 text-[#00e5a0]" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm font-normal text-muted-foreground">
          {clear ? "All clear" : "Needs attention"}
        </span>
      </div>

      {clear ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 py-6 text-center">
          <span className="text-3xl font-bold font-mono text-[#00e5a0]">0</span>
          <span className="text-xs text-muted-foreground/60">
            No failing or regressed workflows
          </span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-4 py-4 gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold font-mono text-red-500 leading-none tabular-nums">
              {total}
            </span>
            <div className="flex flex-col text-xs font-mono">
              {failing > 0 && (
                <span className="text-red-400/80">{failing} failing</span>
              )}
              {regressed > 0 && (
                <span className="text-amber-400/80">{regressed} regressed</span>
              )}
            </div>
          </div>

          {/* Worst offenders — direct drill-down */}
          <div className="flex flex-col gap-1">
            {offenders.slice(0, 3).map((w) => (
              <Link
                key={w.id}
                href={`/dashboard/${slug}/workflow/${w.id}`}
                className="flex items-center gap-2 text-xs text-foreground/70 hover:text-foreground transition-colors group"
              >
                <ChevronRight className="h-3 w-3 flex-shrink-0 text-red-500/50 group-hover:text-red-500 transition-colors" />
                <span className="truncate">{w.name}</span>
              </Link>
            ))}
            {offenders.length > 3 && (
              <span className="text-xs text-muted-foreground/40 pl-5">
                +{offenders.length - 3} more below
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components — Workflow Triage List
// ============================================================================

/** A single workflow row in the severity-sorted triage list. */
function TriageRow({
  workflow,
  state,
  todayRuns,
  activeRun,
  slug,
  now,
}: {
  workflow: Workflow;
  state: RowState;
  todayRuns: WorkflowRun[];
  activeRun: WorkflowRun | null;
  slug: string;
  now: number;
}) {
  const cfg = getRowStateConfig(state);
  const isRunning = state === "running" || activeRun !== null;

  // Most recent run for last-seen time + duration
  const latest = useMemo(() => {
    if (todayRuns.length === 0) return null;
    return [...todayRuns].sort(
      (a, b) =>
        new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
    )[0];
  }, [todayRuns]);

  const passed = todayRuns.filter((r) => r.conclusion === "success").length;
  const completed = todayRuns.filter((r) => r.status === "completed").length;

  const lastTime = activeRun
    ? "now"
    : latest?.run_started_at
    ? formatRunTime(latest.run_started_at)
    : "—";

  const lastDur = activeRun
    ? formatDuration(elapsedSeconds(activeRun.run_started_at, now))
    : latest && latest.run_started_at && latest.updated_at
    ? duration(latest.run_started_at, latest.updated_at)
    : "—";

  return (
    <Link
      href={`/dashboard/${slug}/workflow/${workflow.id}`}
      className={`group flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-white/[0.03] last:border-0 transition-colors ${
        isRunning
          ? "bg-[#4d9fff]/[0.035] hover:bg-[#4d9fff]/[0.07] border-l-2 border-l-[#4d9fff]"
          : "hover:bg-white/[0.025] border-l-2 border-l-transparent"
      }`}
    >
      {/* Health / running dot */}
      {isRunning ? (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#4d9fff]/60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4d9fff]" />
        </span>
      ) : (
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dotClass}`} />
      )}

      {/* Name */}
      <span className="text-sm font-semibold flex-1 min-w-0 truncate text-foreground/85 group-hover:text-foreground transition-colors">
        {workflow.name}
      </span>

      {/* Run-strip — the day's pattern at a glance */}
      <div className="hidden sm:block w-28 md:w-36 flex-shrink-0">
        <RunStrip runs={todayRuns} />
      </div>

      {/* Status label */}
      <span
        className={`text-xs font-mono w-24 flex-shrink-0 text-right ${
          isRunning ? "text-[#4d9fff]" : cfg.textClass
        }`}
      >
        {isRunning ? "RUNNING" : cfg.label}
      </span>

      {/* Pass count */}
      <span className="hidden md:block text-xs font-mono tabular-nums text-muted-foreground/60 w-12 flex-shrink-0 text-right">
        {todayRuns.length > 0 ? `${passed}/${completed || todayRuns.length}` : "—"}
      </span>

      {/* Last run time */}
      <span
        className={`hidden lg:block text-xs font-mono tabular-nums w-12 flex-shrink-0 text-right ${
          isRunning ? "text-[#4d9fff]/70" : "text-muted-foreground/50"
        }`}
      >
        {lastTime}
      </span>

      {/* Duration */}
      <span
        className={`text-xs font-mono tabular-nums w-16 flex-shrink-0 text-right ${
          isRunning ? "text-[#4d9fff]/70 animate-pulse" : "text-muted-foreground/45"
        }`}
      >
        {lastDur}
      </span>

      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/25 group-hover:text-muted-foreground/70 transition-colors" />
    </Link>
  );
}

interface TriageEntry {
  workflow: Workflow;
  state: RowState;
  todayRuns: WorkflowRun[];
  activeRun: WorkflowRun | null;
}

/** Severity-sorted list of every tracked workflow — the page's triage core. */
function WorkflowTriageList({
  entries,
  slug,
  now,
}: {
  entries: TriageEntry[];
  slug: string;
  now: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card flex flex-col">
      {/* Header + column labels */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-normal text-muted-foreground">Workflows</span>
        <span className="text-xs font-mono text-muted-foreground/50">
          {entries.length} tracked · sorted by severity
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-3 sm:gap-4 px-4 py-1.5 border-b border-white/[0.04]">
        <span className="w-2 flex-shrink-0" />
        <span className="text-xs text-muted-foreground/40 flex-1">workflow</span>
        <span className="text-xs text-muted-foreground/40 w-28 md:w-36 flex-shrink-0">today</span>
        <span className="text-xs text-muted-foreground/40 w-24 flex-shrink-0 text-right">status</span>
        <span className="hidden md:block text-xs text-muted-foreground/40 w-12 flex-shrink-0 text-right">pass</span>
        <span className="hidden lg:block text-xs text-muted-foreground/40 w-12 flex-shrink-0 text-right">last</span>
        <span className="text-xs text-muted-foreground/40 w-16 flex-shrink-0 text-right">dur</span>
        <span className="w-4 flex-shrink-0" />
      </div>

      {/* Rows */}
      {entries.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-muted-foreground/40 font-mono">no workflows</span>
        </div>
      ) : (
        <div>
          {entries.map((entry) => (
            <TriageRow
              key={entry.workflow.id}
              workflow={entry.workflow}
              state={entry.state}
              todayRuns={entry.todayRuns}
              activeRun={entry.activeRun}
              slug={slug}
              now={now}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components — Signal Feed (secondary)
// ============================================================================

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
  const dur = isActive
    ? "..."
    : run.run_started_at && run.updated_at
    ? duration(run.run_started_at, run.updated_at)
    : "—";
  const branch = run.head_branch || "—";
  const trigger = shortenTrigger(run.event || "");

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.025] last:border-0 font-mono text-sm animate-in fade-in-0 slide-in-from-bottom-1 hover:bg-white/[0.04] transition-colors"
      style={{
        animationDelay: `${index * 0.06}s`,
        animationFillMode: "forwards",
        animationDuration: "0.18s",
      }}
    >
      <span className="text-muted-foreground/40 w-11 flex-shrink-0 tabular-nums">{time}</span>
      <span className={`font-bold w-10 flex-shrink-0 ${labelColor}`}>{label}</span>
      <Link
        href={`/dashboard/${slug}/workflow/${workflowId}`}
        className="text-foreground/60 hover:text-foreground/90 transition-colors truncate w-64 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {workflowName}
      </Link>
      <span className="text-foreground/50 truncate flex-1 min-w-0">{branch}</span>
      {/* Width chosen so the trigger column's left edge aligns with the
          Workflows table "today" column (≈512px from the card's right edge). */}
      <span className="text-muted-foreground/30 w-[368px] flex-shrink-0 text-left truncate">{trigger}</span>
      <span
        className={`w-20 flex-shrink-0 text-right tabular-nums ${
          isActive ? "text-[#4d9fff]/60 animate-pulse" : "text-muted-foreground/35"
        }`}
      >
        {dur}
      </span>
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
    <div className="rounded-lg border border-border bg-card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-normal text-muted-foreground">Signal Feed</span>
          <span className="text-[10px] text-muted-foreground/30 font-mono">—</span>
          <span className="text-xs text-muted-foreground/40">
            {isLoading ? "…" : `${runs.length} events`}
          </span>
        </div>
        {isIngesting ? (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
            <span className="text-xs text-[#00e5a0]/70">ingesting</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#4d9fff]/40" />
            <span className="text-xs text-muted-foreground/40">live</span>
          </div>
        )}
      </div>

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
        // Horizontal-scroll container so the wide fixed-width columns never force
        // the card (and the whole page) wider than the available viewport when
        // the sidebar expands. Header + rows share one scroll region to stay aligned.
        <div className="overflow-x-auto [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          <div className="min-w-[1024px]">
            <div className="flex items-center gap-3 px-4 py-1.5 border-b border-white/[0.035]">
              <span className="text-xs text-muted-foreground/40 w-11 flex-shrink-0">time</span>
              <span className="text-xs text-muted-foreground/40 w-10 flex-shrink-0">type</span>
              <span className="text-xs text-muted-foreground/40 w-64 flex-shrink-0">workflow</span>
              <span className="text-xs text-muted-foreground/40 flex-1">branch</span>
              <span className="text-xs text-muted-foreground/40 w-[368px] flex-shrink-0 text-left">trigger</span>
              <span className="text-xs text-muted-foreground/40 w-20 flex-shrink-0 text-right">duration</span>
              <span className="w-6 flex-shrink-0" />
            </div>

            <div
              className="overflow-y-auto max-h-[420px] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
            >
              {sorted.slice(0, 20).map((run, i) => (
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
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * DashboardPage — hybrid triage repository dashboard.
 *
 * Layout (top → bottom):
 *  1. Header — back, title, repo health, live "running" pill, date controls
 *  2. Running Spotlight — only when workflows are in progress (live timers)
 *  3. Overview ribbon — Needs Attention card + stats/activity panel
 *  4. Workflow Triage list — every workflow, severity-sorted, with run-strips
 *  5. Signal Feed — secondary chronological run log
 */
export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: session, isPending } = useSession();
  const { selectedDate, setSelectedDate } = useDateState();

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

  /** workflowId → run[] map for run counts, run-strips, and health */
  const groupedRuns = useMemo(() => {
    const map = new Map<number, WorkflowRun[]>();
    workflowRuns.forEach((r) => {
      const list = map.get(r.workflow_id) ?? [];
      list.push(r);
      map.set(r.workflow_id, list);
    });
    return map;
  }, [workflowRuns]);

  /** workflowId → active (in-progress/queued) run, if any */
  const activeRunMap = useMemo(() => {
    const map = new Map<number, WorkflowRun>();
    workflowRuns.forEach((r) => {
      if ((r.status === "in_progress" || r.status === "queued") && !map.has(r.workflow_id)) {
        map.set(r.workflow_id, r);
      }
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
      const currentlyRunning = activeRunMap.has(workflowId);
      const todayRuns = groupedRuns.get(workflowId) ?? [];

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
    [activeRunMap, groupedRuns, yesterdayRuns, getLastRunResult]
  );

  /** Map a workflow to its unified RowState (health + live running flag) */
  const getRowState = useCallback(
    (workflowId: number): RowState => {
      const health = classifyWorkflowHealth(workflowId);
      if (health === "still_failing") return "failing";
      if (health === "regressed") return "regressed";
      if (activeRunMap.has(workflowId)) return "running";
      if (health === "improved") return "improved";
      if (health === "consistent") return "consistent";
      return "idle";
    },
    [classifyWorkflowHealth, activeRunMap]
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

  /** Severity-sorted triage entries for the workflow list */
  const triageEntries: TriageEntry[] = useMemo(() => {
    return workflows
      .map((workflow) => {
        const state = getRowState(workflow.id);
        return {
          workflow,
          state,
          todayRuns: groupedRuns.get(workflow.id) ?? [],
          activeRun: activeRunMap.get(workflow.id) ?? null,
          priority: getRowStateConfig(state).priority,
        };
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.workflow.name.localeCompare(b.workflow.name);
      })
      .map(({ priority: _priority, ...rest }) => rest);
  }, [workflows, getRowState, groupedRuns, activeRunMap]);

  /** Workflows actively running — drives the spotlight */
  const runningItems: RunningSpotlightItem[] = useMemo(() => {
    return workflows
      .filter((w) => activeRunMap.has(w.id))
      .map((workflow) => {
        const activeRun = activeRunMap.get(workflow.id)!;
        return {
          id: workflow.id,
          name: workflow.name,
          meta: `${activeRun.head_branch || "—"} · ${shortenTrigger(activeRun.event || "")} · run #${activeRun.run_number}`,
          startedAt: activeRun.run_started_at,
          todayRuns: groupedRuns.get(workflow.id) ?? [],
          href: `/dashboard/${slug}/workflow/${workflow.id}`,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
      );
  }, [workflows, activeRunMap, groupedRuns, slug]);

  /** Failing + regressed workflows for the Needs Attention offender list */
  const offenders: Workflow[] = useMemo(
    () =>
      triageEntries
        .filter((e) => e.state === "failing" || e.state === "regressed")
        .map((e) => e.workflow),
    [triageEntries]
  );

  const isIngesting = activeRunMap.size > 0;
  const now = useNowTick(isIngesting);

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
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <h1 className="text-xl sm:text-2xl font-bold truncate">Workflows</h1>

            {/* Repo health pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest flex-shrink-0 ${healthConfig.pillClass}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${healthConfig.dotClass}`} />
              {healthConfig.label}
            </div>

            {/* Live running pill — only when something is in progress */}
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

        {/* ── Overview Ribbon: Needs Attention + Stats/Activity ── */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch">
          <NeedsAttention
            failing={healthCounts.stillFailing}
            regressed={healthCounts.regressed}
            offenders={offenders}
            slug={slug}
          />
          <OverviewPanel
            runs={workflowRuns}
            overviewHourData={overviewData?.runsByHour ?? []}
            passedRuns={passedRuns}
            failedRuns={failedRuns}
            successRate={successRate}
            completedRuns={completedRuns}
            totalRuns={workflowRuns.length}
            avgRuntimeSec={avgRuntimeSec}
          />
        </div>

        {/* ── Workflow Triage List ── */}
        <WorkflowTriageList entries={triageEntries} slug={slug} now={now} />

        {/* ── Signal Feed (secondary) ── */}
        <SignalFeed
          runs={workflowRuns}
          workflowMap={workflowMap}
          slug={slug}
          isIngesting={isIngesting}
          isLoading={isLoadingRuns}
        />
      </div>
    </div>
  );
}
