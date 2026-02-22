"use client";

// External library imports
import { useEffect, useRef } from 'react';
import { Activity, CheckCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import MetricsCard from '@/components/MetricsCard';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build SVG polyline path from data values (0-100)
 * @param data - array of 0-100 values
 * @param width - SVG viewBox width
 * @param height - SVG viewBox height
 */
function buildSparklinePath(
  data: number[],
  width: number,
  height: number
): { linePath: string; areaPath: string } {
  if (data.length === 0) return { linePath: "", areaPath: "" };
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const coords = data.map((v, i) => ({
    x: i * stepX,
    y: height - (v / 100) * height,
  }));
  const linePath = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  return { linePath, areaPath };
}

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
 * PassFailPieChart component
 * Displays a pie chart showing passed vs failed workflow runs
 * Shows "No Data" state when no runs occurred
 * @param passed - Number of passed runs
 * @param failed - Number of failed runs
 */
function PassFailPieChart({ passed, failed }: { passed: number; failed: number }) {
  const total = passed + failed;
  
  // Show "No Data" state when no runs occurred
  if (total === 0) {
    return (
      <div className="flex items-center gap-6">
        {/* Empty State - Circular placeholder */}
        <div className="relative">
          <div className="h-32 w-32 bg-muted/20 rounded-full flex items-center justify-center border-2 border-dashed border-muted">
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">No Data</div>
              <div className="text-xs text-muted-foreground">No runs today</div>
            </div>
          </div>
        </div>
        {/* Legend - Empty state indicator */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-muted rounded-full"></div>
            <span className="text-sm text-muted-foreground">No runs today</span>
          </div>
        </div>
      </div>
    );
  }

  const passedPercentage = (passed / total) * 100;

  // Prepare data for the pie chart
  const chartData = [
    {
      name: "Passed",
      value: passed,
      fill: "hsl(var(--chart-1))"
    },
    {
      name: "Failed", 
      value: failed,
      fill: "hsl(var(--chart-2))"
    }
  ];

  // Chart configuration for tooltips and styling
  const chartConfig = {
    Passed: {
      label: "Passed",
      color: "hsl(var(--chart-1))",
    },
    Failed: {
      label: "Failed", 
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="flex items-center gap-6">
      {/* Pie Chart - Donut chart with percentage in center */}
      <div className="relative">
        <ChartContainer
          config={chartConfig}
          className="h-32 w-32"
        >
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold">
            {Math.round(passedPercentage)}%
          </span>
        </div>
      </div>
      {/* Legend - Pass/Fail counts */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm">Pass: {passed}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm">Fail: {failed}</span>
        </div>
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

  // Failure trend is the inverse of the success trend
  const failureTrendData = successTrendData.map((v) => 100 - v);
  const hasFailureTrend = failureTrendData.some((v) => v > 0);
  const { linePath: failLinePath, areaPath: failAreaPath } = buildSparklinePath(
    failureTrendData.length > 0 ? failureTrendData : Array(24).fill(0),
    260,
    36
  );

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
      {/* Card 1: Pass/Fail Rate - Pie chart showing success rate */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Pass/Fail Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex-1 flex items-center justify-center">
            <PassFailPieChart passed={passedRuns} failed={failedRuns} />
          </div>
        </CardContent>
      </Card>

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

        {/* Failure trend sparkline */}
        <div className="spark-wrap border-t border-border pt-2.5 mt-0.5">
          <div className="spark-label text-sm text-muted-foreground mb-1.5">
            Failure trend
          </div>
          {hasFailureTrend && failLinePath ? (
            <svg
              className="spark-svg w-full h-9 overflow-visible"
              viewBox="0 0 260 36"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="healthFailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={failAreaPath} fill="url(#healthFailGrad)" />
              <path
                className="fill-none stroke-[#ef4444] stroke-[1.5] stroke-linecap-round stroke-linejoin-round"
                d={failLinePath}
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
    </div>
  );
}
