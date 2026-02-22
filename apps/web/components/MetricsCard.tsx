"use client";

// External library imports
import React, { useEffect, useRef } from "react";

// Internal utility imports
import { formatDuration } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the MetricsCard component
 * Displays success, run count, avg runtime, stability, and success trend
 */
export interface MetricsCardProps {
  /** Success rate 0-100 (passed/completed) */
  successRate: number;
  /** Total completed run count */
  runCount: number;
  /** Average runtime in seconds (totalRuntime / completedRuns) */
  avgRuntimeSeconds: number;
  /** Stability 0-100 derived from workflow health (consistentCount/totalWorkflows) */
  stability: number;
  /** Success rate per hour 0-23 for sparkline (100 = top, 0 = bottom) */
  successTrendData: number[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Max run count for bar normalization (10 runs = 100%) */
const RUN_COUNT_MAX = 10;

/** Max avg runtime in seconds for bar normalization (5 min = 100%) */
const AVG_RUNTIME_MAX_SECONDS = 300;

/**
 * Compute bar width 0-100 for run count
 */
function runCountBarWidth(count: number): number {
  return Math.min(100, (count / RUN_COUNT_MAX) * 100);
}

/**
 * Compute bar width 0-100 for avg runtime
 */
function avgRuntimeBarWidth(seconds: number): number {
  return Math.min(100, (seconds / AVG_RUNTIME_MAX_SECONDS) * 100);
}

/**
 * Build SVG path for sparkline from hourly success rates
 * @param data - 24 values (0-100) for hours 0-23
 * @param width - SVG width
 * @param height - SVG height
 */
function buildSparklinePath(
  data: number[],
  width: number,
  height: number
): { linePath: string; areaPath: string } {
  if (data.length === 0) {
    return { linePath: "", areaPath: "" };
  }
  const points = data.length;
  const stepX = points > 1 ? width / (points - 1) : 0;
  const coords: Array<{ x: number; y: number }> = data.map((rate, i) => {
    const x = i * stepX;
    // Invert: 100% = top (y=0), 0% = bottom (y=height)
    const y = height - (rate / 100) * height;
    return { x, y };
  });
  const linePath = coords
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  return { linePath, areaPath };
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MetricsCard component
 * Displays success, run count, avg runtime, stability, and success trend
 * Matches the mockup stat-card style from index.html
 */
export default function MetricsCard({
  successRate,
  runCount,
  avgRuntimeSeconds,
  stability,
  successTrendData,
}: MetricsCardProps) {
  const successBarRef = useRef<HTMLDivElement>(null);
  const runCountBarRef = useRef<HTMLDivElement>(null);
  const avgRuntimeBarRef = useRef<HTMLDivElement>(null);
  const stabilityBarRef = useRef<HTMLDivElement>(null);

  // Animate bar widths on mount (matching mockup behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (successBarRef.current)
        successBarRef.current.style.width = `${successRate}%`;
      if (runCountBarRef.current)
        runCountBarRef.current.style.width = `${runCountBarWidth(runCount)}%`;
      if (avgRuntimeBarRef.current)
        avgRuntimeBarRef.current.style.width = `${avgRuntimeBarWidth(avgRuntimeSeconds)}%`;
      if (stabilityBarRef.current)
        stabilityBarRef.current.style.width = `${stability}%`;
    }, 380);
    return () => clearTimeout(timer);
  }, [successRate, runCount, avgRuntimeSeconds, stability]);

  const hasTrendData =
    successTrendData.length > 0 && successTrendData.some((v) => v > 0);
  const { linePath, areaPath } = buildSparklinePath(
    successTrendData.length > 0 ? successTrendData : Array(24).fill(0),
    260,
    36
  );

  return (
    <div className="stat-card metrics-card">
      <div className="sc-title flex items-center gap-2.5">
        <svg
          width="18"
          height="18"
          viewBox="0 0 11 11"
          fill="none"
          className="flex-shrink-0"
        >
          <rect
            x="1"
            y="4"
            width="2"
            height="6"
            rx="0.5"
            fill="currentColor"
            opacity="0.4"
          />
          <rect
            x="4.5"
            y="2"
            width="2"
            height="8"
            rx="0.5"
            fill="currentColor"
            opacity="0.65"
          />
          <rect
            x="8"
            y="5"
            width="2"
            height="5"
            rx="0.5"
            fill="currentColor"
            opacity="0.4"
          />
        </svg>
        <span className="text-sm font-normal text-muted-foreground normal-case">Metrics</span>
      </div>

      <div className="metric-rows flex flex-col gap-2">
        {/* Success */}
        <div className="metric-row flex items-center gap-2">
          <span className="metric-label w-[80px] flex-shrink-0 text-sm text-muted-foreground">
            Success
          </span>
          <div className="metric-bar-wrap flex-1 h-[3px] rounded-sm bg-white/5 overflow-hidden">
            <div
              ref={successBarRef}
              className="metric-bar-fill h-full rounded-sm bg-gradient-to-r from-[#00e5a0] to-[#00ff99] transition-[width] duration-700 ease-out"
              style={{ width: 0 }}
            />
          </div>
          <span className="metric-val w-10 text-right text-sm text-foreground">
            {runCount > 0 ? `${Math.round(successRate)}%` : "—"}
          </span>
        </div>

        {/* Run count */}
        <div className="metric-row flex items-center gap-2">
          <span className="metric-label w-[80px] flex-shrink-0 text-sm text-muted-foreground">
            Run count
          </span>
          <div className="metric-bar-wrap flex-1 h-[3px] rounded-sm bg-white/5 overflow-hidden">
            <div
              ref={runCountBarRef}
              className="metric-bar-fill h-full rounded-sm bg-gradient-to-r from-[#4d9fff] to-[#88cfff] transition-[width] duration-700 ease-out"
              style={{ width: 0 }}
            />
          </div>
          <span className="metric-val w-10 text-right text-sm text-foreground">
            {runCount}
          </span>
        </div>

        {/* Avg runtime */}
        <div className="metric-row flex items-center gap-2">
          <span className="metric-label w-[80px] flex-shrink-0 text-sm text-muted-foreground">
            Avg runtime
          </span>
          <div className="metric-bar-wrap flex-1 h-[3px] rounded-sm bg-white/5 overflow-hidden">
            <div
              ref={avgRuntimeBarRef}
              className="metric-bar-fill h-full rounded-sm bg-gradient-to-r from-[#c084fc] to-[#e879f9] transition-[width] duration-700 ease-out"
              style={{ width: 0 }}
            />
          </div>
          <span className="metric-val w-10 text-right text-sm text-foreground">
            {runCount > 0 ? formatDuration(avgRuntimeSeconds) : "—"}
          </span>
        </div>

        {/* Stability */}
        <div className="metric-row flex items-center gap-2">
          <span className="metric-label w-[80px] flex-shrink-0 text-sm text-muted-foreground">
            Stability
          </span>
          <div className="metric-bar-wrap flex-1 h-[3px] rounded-sm bg-white/5 overflow-hidden">
            <div
              ref={stabilityBarRef}
              className="metric-bar-fill h-full rounded-sm bg-gradient-to-r from-[#f59e0b] to-[#fcd34d] transition-[width] duration-700 ease-out"
              style={{ width: 0 }}
            />
          </div>
          <span className="metric-val w-10 text-right text-sm text-foreground">
            {Math.round(stability)}%
          </span>
        </div>
      </div>

      {/* Success trend sparkline */}
      <div className="spark-wrap border-t border-border pt-2.5 mt-0.5">
        <div className="spark-label text-sm text-muted-foreground mb-1.5">
          Success trend
        </div>
        {hasTrendData && linePath ? (
          <svg
            className="spark-svg w-full h-9 overflow-visible"
            viewBox="0 0 260 36"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="metricsSparkGrad"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              className="spark-area"
              d={areaPath}
              fill="url(#metricsSparkGrad)"
            />
            <path
              className="spark-path fill-none stroke-[#c084fc] stroke-[1.5] stroke-linecap-round stroke-linejoin-round"
              d={linePath}
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: 1000,
                animation: "draw-line 1.8s ease-out 0.5s forwards",
              }}
            />
          </svg>
        ) : (
          <div className="h-9 flex items-center justify-center text-sm text-muted-foreground">
            No trend data
          </div>
        )}
      </div>
    </div>
  );
}
