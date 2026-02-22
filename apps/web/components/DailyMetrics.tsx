"use client";

// External library imports
import { useEffect, useRef } from 'react';
import { Activity, CheckCircle, TrendingUp, TrendingDown, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Internal component imports
import MetricsCard from '@/components/MetricsCard';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the DailyMetrics component
 */
interface DailyMetricsProps {
  passedRuns: number;
  failedRuns: number;
  completedRuns: number;
  consistentCount: number;
  improvedCount: number;
  regressedCount: number;
  stillFailingCount: number;
  /** Success rate 0-100 (passed/completed) */
  successRate: number;
  /** Average runtime in seconds for MetricsCard */
  avgRuntimeSeconds: number;
  /** Stability 0-100 from workflow health */
  stability: number;
  /** Success rate per hour 0-23 for sparkline */
  successTrendData: number[];
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * PassFailDonut component
 * Donut chart showing passed vs failed runs, styled to match Metrics/Health cards
 */
function PassFailDonut({ passed, failed }: { passed: number; failed: number }) {
  const total = passed + failed;
  const PASS_COLOR = "#00e5a0";
  const FAIL_COLOR = "#ef4444";

  const chartData = total === 0
    ? [{ name: "Empty", value: 1 }]
    : [{ name: "Passed", value: passed }, { name: "Failed", value: failed }];

  const passedPct = total > 0 ? Math.round((passed / total) * 100) : null;

  return (
    /* Grow to fill remaining card height; min-h-0 lets flex shrink correctly */
    <div className="relative w-full flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            strokeWidth={3}
            stroke="hsl(var(--card))"
            isAnimationActive
          >
            {total === 0
              ? <Cell fill="rgba(255,255,255,0.05)" strokeWidth={0} />
              : [
                  <Cell key="pass" fill={PASS_COLOR} />,
                  <Cell key="fail" fill={FAIL_COLOR} />,
                ]
            }
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Center label overlaid on the chart */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {passedPct !== null ? (
          <span className="text-2xl font-semibold tabular-nums" style={{ color: PASS_COLOR }}>
            {passedPct}%
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">No data</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * DailyMetrics component
 * Displays daily workflow metrics in a grid of cards
 * Shows pass/fail rates, overview stats, workflow health, and runs by hour chart
 * Used in repository dashboard to show comprehensive daily metrics
 */
export default function DailyMetrics({
  passedRuns,
  failedRuns,
  completedRuns,
  consistentCount,
  improvedCount,
  regressedCount,
  stillFailingCount,
  successRate,
  avgRuntimeSeconds,
  stability,
  successTrendData,
}: DailyMetricsProps) {
  const consistentBarRef = useRef<HTMLDivElement>(null);
  const improvedBarRef = useRef<HTMLDivElement>(null);
  const regressedBarRef = useRef<HTMLDivElement>(null);
  const stillFailingBarRef = useRef<HTMLDivElement>(null);

  // Compute proportional bar widths from total workflow count
  const totalWorkflows = consistentCount + improvedCount + regressedCount + stillFailingCount;
  const pct = (n: number) =>
    totalWorkflows > 0 ? Math.round((n / totalWorkflows) * 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (consistentBarRef.current)
        consistentBarRef.current.style.width = `${pct(consistentCount)}%`;
      if (improvedBarRef.current)
        improvedBarRef.current.style.width = `${pct(improvedCount)}%`;
      if (regressedBarRef.current)
        regressedBarRef.current.style.width = `${pct(regressedCount)}%`;
      if (stillFailingBarRef.current)
        stillFailingBarRef.current.style.width = `${pct(stillFailingCount)}%`;
    }, 380);
    return () => clearTimeout(timer);
  }, [consistentCount, improvedCount, regressedCount, stillFailingCount]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Card 1: Pass / Fail — Donut chart showing run outcomes */}
      <div className="stat-card metrics-card flex flex-col" style={{ minHeight: 260 }}>
        {/* Header */}
        <div className="sc-title flex items-center gap-2.5">
          <PieChartIcon className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground" />
          <span className="text-sm font-normal text-muted-foreground normal-case">Pass / Fail</span>
        </div>

        {/* Donut chart */}
        <PassFailDonut passed={passedRuns} failed={failedRuns} />
      </div>

      {/* Card 2: Metrics - Success, run count, avg runtime, stability, success trend */}
      <MetricsCard
        successRate={successRate}
        runCount={completedRuns}
        avgRuntimeSeconds={avgRuntimeSeconds}
        stability={stability}
        successTrendData={successTrendData}
      />

      {/* Card 3: Health - Health status breakdown (same style as Metrics card) */}
      <div className="stat-card metrics-card">
        {/* Header */}
        <div className="sc-title flex items-center gap-2.5">
          <Activity className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground" />
          <span className="text-sm font-normal text-muted-foreground normal-case">Health</span>
        </div>

        {/* Metric rows — label (icon + text), proportional bar, count */}
        <div className="metric-rows flex flex-col gap-3">
          {/* Consistent */}
          <div className="metric-row flex items-center gap-2">
            <span className="metric-label w-[110px] flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              Consistent
            </span>
            <div className="metric-bar-wrap flex-1 h-[3px] rounded-sm bg-white/5 overflow-hidden">
              <div
                ref={consistentBarRef}
                className="metric-bar-fill h-full rounded-sm bg-gradient-to-r from-[#00e5a0] to-[#00ff99] transition-[width] duration-700 ease-out"
                style={{ width: 0 }}
              />
            </div>
            <span className="metric-val w-10 text-right text-sm text-foreground">{consistentCount}</span>
          </div>

          {/* Improved */}
          <div className="metric-row flex items-center gap-2">
            <span className="metric-label w-[110px] flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              Improved
            </span>
            <div className="metric-bar-wrap flex-1 h-[3px] rounded-sm bg-white/5 overflow-hidden">
              <div
                ref={improvedBarRef}
                className="metric-bar-fill h-full rounded-sm bg-gradient-to-r from-[#4d9fff] to-[#88cfff] transition-[width] duration-700 ease-out"
                style={{ width: 0 }}
              />
            </div>
            <span className="metric-val w-10 text-right text-sm text-foreground">{improvedCount}</span>
          </div>

          {/* Regressed */}
          <div className="metric-row flex items-center gap-2">
            <span className="metric-label w-[110px] flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
              <TrendingDown className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
              Regressed
            </span>
            <div className="metric-bar-wrap flex-1 h-[3px] rounded-sm bg-white/5 overflow-hidden">
              <div
                ref={regressedBarRef}
                className="metric-bar-fill h-full rounded-sm bg-gradient-to-r from-[#f59e0b] to-[#fcd34d] transition-[width] duration-700 ease-out"
                style={{ width: 0 }}
              />
            </div>
            <span className="metric-val w-10 text-right text-sm text-foreground">{regressedCount}</span>
          </div>

          {/* Still failing */}
          <div className="metric-row flex items-center gap-2">
            <span className="metric-label w-[110px] flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              Still failing
            </span>
            <div className="metric-bar-wrap flex-1 h-[3px] rounded-sm bg-white/5 overflow-hidden">
              <div
                ref={stillFailingBarRef}
                className="metric-bar-fill h-full rounded-sm bg-gradient-to-r from-[#ef4444] to-[#f87171] transition-[width] duration-700 ease-out"
                style={{ width: 0 }}
              />
            </div>
            <span className="metric-val w-10 text-right text-sm text-foreground">{stillFailingCount}</span>
          </div>
        </div>

        {/* Reserved space for future health trend */}
        <div className="border-t border-border pt-3 mt-0.5" />
      </div>
    </div>
  );
}
