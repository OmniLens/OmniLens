import { CheckCircle, Clock, XCircle, TrendingUp, TrendingDown, AlertTriangle, Workflow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, PieChart, Pie, Cell, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';


interface DailyMetricsProps {
  successRate: number;
  passRate: number;
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
  avgRunsPerHour: number;
  minRunsPerHour: number;
  maxRunsPerHour: number;
  runsByHour?: Array<{ hour: number; passed: number; failed: number; total: number }>;
  selectedDate: Date;
}

// Format duration from seconds to human readable format
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

// Pass/Fail Pie Chart Component
function PassFailPieChart({ passed, failed }: { passed: number; failed: number }) {
  const total = passed + failed;
  
  // Show "No Data" state when no runs occurred
  if (total === 0) {
    return (
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="h-32 w-32 bg-muted/20 rounded-full flex items-center justify-center border-2 border-dashed border-muted">
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">No Data</div>
              <div className="text-xs text-muted-foreground">No runs today</div>
            </div>
          </div>
        </div>
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

  // Prepare data for the radial bar chart
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

export default function DailyMetrics({
  successRate,
  passRate,
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
  avgRunsPerHour,
  minRunsPerHour,
  maxRunsPerHour,
  runsByHour,
  selectedDate
}: DailyMetricsProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Pass/Fail Section */}
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

      {/* Overview Section */}
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
              <span className="text-sm font-medium">{activeWorkflows}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="text-sm font-medium">{completedRuns}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Didn&apos;t run</span>
              </div>
              <span className="text-sm font-medium">{didntRunCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Total Runtime</span>
              </div>
              <span className="text-sm font-medium">{formatDuration(totalRuntime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Section */}
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
              <span className="text-sm font-medium">{consistentCount}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Improved</span>
              </div>
              <span className="text-sm font-medium">{improvedCount}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Regressed</span>
              </div>
              <span className="text-sm font-medium">{regressedCount}</span>
            </div>
            
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

      {/* Runs by hour Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Runs by hour</CardTitle>
        </CardHeader>
        <CardContent>
          {!runsByHour || runsByHour.length === 0 || runsByHour.every(hour => hour.total === 0) ? (
            <div className="flex items-center justify-center h-36">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">No Data</div>
                <div className="text-xs text-muted-foreground">No runs today</div>
              </div>
            </div>
          ) : (
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
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  width={30}
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
                  content={<ChartTooltipContent labelFormatter={(value) => `${value}:00`} />}
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
