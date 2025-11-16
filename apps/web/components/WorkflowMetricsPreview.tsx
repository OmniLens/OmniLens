"use client";

// External library imports
import React from "react";
import { CheckCircle, Clock, XCircle, TrendingUp, TrendingDown, AlertTriangle, Workflow } from 'lucide-react';
import { Bar, BarChart, PieChart, Pie, Cell, XAxis } from 'recharts';

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the WorkflowMetricsPreview component
 */
interface WorkflowMetricsPreviewProps {
  /** Duration in milliseconds for each data set cycle (deprecated - no longer used) */
  dataDuration?: number;
  /** Whether to auto-play the animation (deprecated - no longer used) */
  autoPlay?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format duration from seconds to human-readable format
 * Converts total seconds to hours, minutes, and seconds display
 * @param seconds - Total duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m", "45m 30s", "30s")
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * PassFailPieChart component
 * Displays a pie chart showing passed vs failed workflow runs
 */
function PassFailPieChart({ passed, failed }: { passed: number; failed: number }) {
  const total = passed + failed;
  const passedPercentage = (passed / total) * 100;

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
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold">
            {Math.round(passedPercentage)}%
          </span>
        </div>
      </div>
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
 * WorkflowMetricsPreview component
 * Static preview that displays all 4 metric cards simultaneously with a single data set
 * Used on the marketing page to showcase the workflow health tracking feature
 */
export default function WorkflowMetricsPreview(_props?: WorkflowMetricsPreviewProps) {
  // Single static data set for all cards
  const passFailData = { passed: 12, failed: 2 }; // ~86% success
  const overviewData = { activeWorkflows: 6, completedRuns: 14, didntRunCount: 1, totalRuntime: 9000 };
  const healthData = { consistentCount: 3, improvedCount: 2, regressedCount: 0, stillFailingCount: 1 };
  const runsByHourData = [
    { hour: 3, passed: 2, failed: 0, total: 2 },
    { hour: 4, passed: 3, failed: 1, total: 4 },
    { hour: 5, passed: 4, failed: 0, total: 4 },
    { hour: 6, passed: 2, failed: 1, total: 3 },
    { hour: 7, passed: 1, failed: 0, total: 1 },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Pass/Fail Rate */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Pass/Fail Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex-1 flex items-center justify-center">
              <PassFailPieChart passed={passFailData.passed} failed={passFailData.failed} />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Overview */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Workflow className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Workflows</span>
                </div>
                <span className="text-sm font-medium">{overviewData.activeWorkflows}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="text-sm font-medium">{overviewData.completedRuns}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Didn&apos;t run</span>
                </div>
                <span className="text-sm font-medium">{overviewData.didntRunCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Total Runtime</span>
                </div>
                <span className="text-sm font-medium">{formatDuration(overviewData.totalRuntime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Workflow Health */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Workflow Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Consistent</span>
                </div>
                <span className="text-sm font-medium">{healthData.consistentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Improved</span>
                </div>
                <span className="text-sm font-medium">{healthData.improvedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Regressed</span>
                </div>
                <span className="text-sm font-medium">{healthData.regressedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Still failing</span>
                </div>
                <span className="text-sm font-medium">{healthData.stillFailingCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Runs by Hour */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Runs by hour</CardTitle>
          </CardHeader>
          <CardContent className="w-full">
            <div className="w-full">
              <ChartContainer
                config={{
                  passed: {
                    label: "Passed",
                    color: "hsl(var(--chart-1))",
                  },
                  failed: {
                    label: "Failed", 
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-36 w-full"
              >
                <BarChart data={runsByHourData.filter(hour => hour.total > 0)} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour}:00`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Bar 
                    dataKey="passed" 
                    stackId="runs"
                    fill="var(--color-passed)" 
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="failed" 
                    stackId="runs"
                    fill="var(--color-failed)" 
                    radius={[2, 2, 0, 0]}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent labelFormatter={() => `Runs`} />}
                    cursor={false}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

