// External library imports
import { CheckCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Bar, BarChart, PieChart, Pie, Cell, XAxis } from 'recharts';

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import WorkflowCountsOverview from '@/components/WorkflowCountsOverview';
import RuntimeOverview from '@/components/RuntimeOverview';

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
  totalRuntime: number;
  didntRunCount: number;
  activeWorkflows: number;
  consistentCount: number;
  improvedCount: number;
  regressedCount: number;
  stillFailingCount: number;
  runsByHour?: Array<{ hour: number; passed: number; failed: number; total: number }>;
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
  totalRuntime,
  didntRunCount,
  activeWorkflows,
  consistentCount,
  improvedCount,
  regressedCount,
  stillFailingCount,
  runsByHour
}: DailyMetricsProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

      {/* Card 2: Workflow Counts - Workflow and run count statistics */}
      <WorkflowCountsOverview
        activeWorkflows={activeWorkflows}
        completedRuns={completedRuns}
        didntRunCount={didntRunCount}
      />

      {/* Card 3: Runtime - Total runtime statistics */}
      <RuntimeOverview totalRuntime={totalRuntime} />

      {/* Card 4: Workflow Health - Health status breakdown */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Workflow Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Consistent Workflows - Stable, passing workflows */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Consistent</span>
              </div>
              <span className="text-sm font-medium">{consistentCount}</span>
            </div>
            
            {/* Improved Workflows - Workflows that got better */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Improved</span>
              </div>
              <span className="text-sm font-medium">{improvedCount}</span>
            </div>
            
            {/* Regressed Workflows - Workflows that got worse */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Regressed</span>
              </div>
              <span className="text-sm font-medium">{regressedCount}</span>
            </div>
            
            {/* Still Failing Workflows - Continuously failing workflows */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Still failing</span>
              </div>
              <span className="text-sm font-medium">{stillFailingCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 5: Runs by Hour - Bar chart showing hourly run distribution */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Runs by hour</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Empty State - No runs data */}
          {!runsByHour || runsByHour.length === 0 || runsByHour.every(hour => hour.total === 0) ? (
            <div className="flex items-center justify-center h-36">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">No Data</div>
                <div className="text-xs text-muted-foreground">No runs today</div>
              </div>
            </div>
          ) : (
            /* Bar Chart - Stacked bars showing passed/failed runs per hour */
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
              className="h-36 aspect-none"
            >
              <BarChart data={runsByHour.filter(hour => hour.total > 0)} margin={{ left: 0, right: 12, top: 5, bottom: 5 }}>
                {/* X-Axis - Hour labels */}
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                {/* Passed Runs Bar - Bottom stack */}
                <Bar 
                  dataKey="passed" 
                  stackId="runs"
                  fill="var(--color-passed)" 
                  radius={[0, 0, 0, 0]}
                />
                {/* Failed Runs Bar - Top stack */}
                <Bar 
                  dataKey="failed" 
                  stackId="runs"
                  fill="var(--color-failed)" 
                  radius={[2, 2, 0, 0]}
                />
                {/* Tooltip - Shows run details on hover */}
                <ChartTooltip 
                  content={<ChartTooltipContent labelFormatter={() => `Runs`} />}
                  cursor={false}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
