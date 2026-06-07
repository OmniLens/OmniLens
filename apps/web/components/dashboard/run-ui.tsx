"use client";

// Shared UI primitives for the repository + workflow dashboards.
// Keeps the two pages visually identical: run-strips, live "running" spotlight,
// the stat-chip + 24h activity overview panel, and the live-elapsed ticker.

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, Radio } from "lucide-react";

import { formatDuration, formatRunTime } from "@/lib/utils";
import type { WorkflowRun } from "@/lib/hooks/use-repository-dashboard";

// ============================================================================
// Run label helpers
// ============================================================================

export type RunLabel = "PASS" | "FAIL" | "RUN" | "SKIP";

/** Derive the display label for a run based on status + conclusion. */
export function getRunLabel(run: WorkflowRun): RunLabel {
  if (run.status === "in_progress" || run.status === "queued") return "RUN";
  if (run.conclusion === "success") return "PASS";
  if (run.conclusion === "cancelled" || run.conclusion === "skipped") return "SKIP";
  return "FAIL";
}

/** Text-color class for a run label. */
export function getLabelColor(label: RunLabel): string {
  switch (label) {
    case "PASS": return "text-[#00e5a0]";
    case "FAIL": return "text-red-500";
    case "RUN":  return "text-[#4d9fff]";
    case "SKIP": return "text-amber-400";
  }
}

/** Background class for a single run segment in a run-strip. */
export function getRunSegmentClass(label: RunLabel): string {
  switch (label) {
    case "PASS": return "bg-[#00e5a0]/80";
    case "FAIL": return "bg-red-500/90";
    case "RUN":  return "bg-[#4d9fff] animate-pulse";
    case "SKIP": return "bg-amber-400/80";
  }
}

/** Shorten GitHub event names for compact display. */
export function shortenTrigger(event: string): string {
  switch (event) {
    case "pull_request":      return "PR";
    case "schedule":          return "cron";
    case "workflow_dispatch": return "manual";
    case "push":              return "push";
    default:                  return event;
  }
}

/** Live elapsed seconds since a run started, clamped to >= 0. */
export function elapsedSeconds(startedAt: string, now: number): number {
  const started = new Date(startedAt).getTime();
  return Math.max(0, Math.floor((now - started) / 1000));
}

// ============================================================================
// useNowTick — re-renders every second while `active`, for live timers
// ============================================================================

export function useNowTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

// ============================================================================
// RunStrip — a workflow's runs for the day as colored segments
// ============================================================================

/**
 * Compact horizontal strip of a workflow's runs for the selected day.
 * Oldest → newest, left → right. Each segment is colored by outcome so the
 * day's pattern (and any failures) reads at a glance. In-progress runs pulse.
 */
export function RunStrip({
  runs,
  max = 16,
}: {
  runs: WorkflowRun[];
  max?: number;
}) {
  const ordered = useMemo(
    () =>
      [...runs]
        .sort(
          (a, b) =>
            new Date(a.run_started_at).getTime() - new Date(b.run_started_at).getTime()
        )
        .slice(-max),
    [runs, max]
  );

  if (ordered.length === 0) {
    return (
      <div className="flex items-center gap-px h-4 w-full opacity-40">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="flex-1 h-[3px] rounded-full bg-white/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-px h-4 w-full">
      {ordered.map((run) => {
        const label = getRunLabel(run);
        const time = run.run_started_at ? formatRunTime(run.run_started_at) : "--:--";
        return (
          <span
            key={run.id}
            title={`${label} · ${time} · ${run.head_branch || "—"}`}
            className={`flex-1 min-w-[3px] h-full rounded-[1px] ${getRunSegmentClass(label)}`}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// StatChip — compact labelled stat for overview strips
// ============================================================================

export function StatChip({
  label,
  value,
  valueClass = "text-foreground",
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5 border-r border-border last:border-0 min-w-[88px]">
      <span className="text-xs text-muted-foreground/60 whitespace-nowrap">{label}</span>
      <span className={`text-lg font-bold tabular-nums font-mono ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

// ============================================================================
// RunningSpotlight — prominent live banner for in-progress runs
// ============================================================================

export interface RunningSpotlightItem {
  id: string | number;
  /** Primary label (workflow name or run identifier). */
  name: string;
  /** Secondary mono meta line, e.g. "main · push · run #123". */
  meta: string;
  /** ISO timestamp the active run started — drives the live elapsed timer. */
  startedAt: string;
  /** Today's runs for this entry, rendered as a run-strip. */
  todayRuns: WorkflowRun[];
  /** Drill-down target. */
  href: string;
  /** When true, opens in a new tab and shows an external-link affordance. */
  external?: boolean;
}

function RunningRow({ item, now }: { item: RunningSpotlightItem; now: number }) {
  const elapsed = formatDuration(elapsedSeconds(item.startedAt, now));

  return (
    <Link
      href={item.href}
      {...(item.external ? { target: "_blank" } : {})}
      className="group relative flex items-center gap-4 px-4 py-3 rounded-md border border-[#4d9fff]/20 bg-[#4d9fff]/[0.04] hover:bg-[#4d9fff]/[0.08] hover:border-[#4d9fff]/35 transition-colors overflow-hidden"
    >
      {/* Animated progress shimmer — signals "actively working" */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-[#4d9fff]/15 overflow-hidden">
        <span className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#4d9fff] to-transparent animate-shimmer" />
      </span>

      {/* Live pulse dot */}
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#4d9fff]/60 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4d9fff]" />
      </span>

      {/* Name + meta */}
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="text-sm font-semibold truncate text-foreground group-hover:text-white transition-colors">
          {item.name}
        </span>
        <span className="text-xs text-muted-foreground/50 font-mono truncate">
          {item.meta}
        </span>
      </div>

      {/* Today's run-strip */}
      <div className="hidden md:block w-28 flex-shrink-0">
        <RunStrip runs={item.todayRuns} max={12} />
      </div>

      {/* Live elapsed timer */}
      <div className="flex items-center gap-1.5 flex-shrink-0 w-24 justify-end">
        <Radio className="h-3.5 w-3.5 text-[#4d9fff] animate-pulse" />
        <span className="text-sm font-mono tabular-nums text-[#4d9fff]">{elapsed}</span>
      </div>

      {item.external ? (
        <ExternalLink className="h-4 w-4 flex-shrink-0 text-[#4d9fff]/40 group-hover:text-[#4d9fff] transition-colors" />
      ) : (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#4d9fff]/40 group-hover:text-[#4d9fff] transition-colors" />
      )}
    </Link>
  );
}

/**
 * RUNNING NOW spotlight — render only when `items` is non-empty. The loudest
 * element on the page when active: live elapsed timers + animated shimmer.
 */
export function RunningSpotlight({
  items,
  now,
}: {
  items: RunningSpotlightItem[];
  now: number;
}) {
  return (
    <div className="rounded-lg border border-[#4d9fff]/25 bg-[#4d9fff]/[0.02] overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-300">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#4d9fff]/15 bg-[#4d9fff]/[0.04]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#4d9fff]/60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4d9fff]" />
          </span>
          <span className="text-xs font-mono uppercase tracking-widest text-[#4d9fff]">
            Running now
          </span>
        </div>
        <span className="text-xs font-mono text-[#4d9fff]/60 tabular-nums">
          {items.length} active
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {items.map((item) => (
          <RunningRow key={item.id} item={item} now={now} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// OverviewPanel — stat chips stacked above a 24h activity histogram
// ============================================================================

interface HourStat {
  hour: number;
  total: number;
  passed: number;
  failed: number;
}

// Bar area height in px — determines max bar height for the timeline
const TIMELINE_BAR_HEIGHT = 44;

/**
 * Overview panel — a compact stat strip stacked above the 24-hour activity
 * histogram. Bars are colored by pass rate: green (≥80%), amber (mixed),
 * red (failing), muted (no runs). Prefers API-provided hourly data, falling
 * back to computing from raw runs.
 */
export function OverviewPanel({
  runs,
  overviewHourData,
  passedRuns,
  failedRuns,
  successRate,
  completedRuns,
  totalRuns,
  avgRuntimeSec,
}: {
  runs: WorkflowRun[];
  overviewHourData: Array<{ hour: number; passed: number; total: number }>;
  passedRuns: number;
  failedRuns: number;
  successRate: number;
  completedRuns: number;
  totalRuns: number;
  avgRuntimeSec: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  const hourStats: HourStat[] = useMemo(() => {
    const map = new Map<number, HourStat>();
    for (let h = 0; h < 24; h++) map.set(h, { hour: h, total: 0, passed: 0, failed: 0 });

    if (overviewHourData.length > 0) {
      overviewHourData.forEach(({ hour, passed, total }) => {
        if (hour >= 0 && hour < 24) {
          map.set(hour, { hour, total, passed, failed: total - passed });
        }
      });
    } else {
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

  return (
    <div className="rounded-lg border border-border bg-card flex-1 min-w-0 flex flex-col">
      {/* Stat strip */}
      <div className="flex overflow-x-auto border-b border-border">
        <StatChip
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
        <StatChip label="Passed" value={passedRuns} valueClass="text-[#00e5a0]" />
        <StatChip
          label="Failed"
          value={failedRuns}
          valueClass={failedRuns > 0 ? "text-red-500" : "text-muted-foreground/50"}
        />
        <StatChip label="Runs" value={totalRuns} />
        <StatChip
          label="Avg runtime"
          value={avgRuntimeSec > 0 ? formatDuration(avgRuntimeSec) : "—"}
          valueClass="text-[#c084fc]"
        />
      </div>

      {/* Histogram header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50">
          Activity · 24h
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
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

      {/* Histogram */}
      <div className="px-4 pt-3 pb-3 flex-1 flex flex-col justify-end">
        <div className="flex items-end gap-px" style={{ height: TIMELINE_BAR_HEIGHT + 14 }}>
          {hourStats.map((stat) => {
            const barPx =
              mounted && stat.total > 0
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
              <div
                key={stat.hour}
                className="flex flex-col items-center flex-1"
                style={{ height: TIMELINE_BAR_HEIGHT + 14 }}
                title={`${String(stat.hour).padStart(2, "0")}:00 — ${stat.total} runs, ${stat.passed} passed`}
              >
                <div className="flex-1 flex flex-col justify-end relative w-full">
                  <div
                    className={`w-full rounded-[2px] ${barColor} transition-[height] duration-700 ease-out`}
                    style={{ height: barPx }}
                  />
                </div>
                <span
                  className={`text-xs tabular-nums mt-1 leading-none flex-shrink-0 ${
                    stat.hour % 6 === 0 ? "text-muted-foreground/40" : "invisible"
                  }`}
                >
                  {String(stat.hour).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
