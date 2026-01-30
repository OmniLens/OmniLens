// External library imports
import { BarChart3 } from "lucide-react";

// Type imports
import type { Workflow } from "@/lib/hooks/use-repository-dashboard";
import type { WorkflowRun } from "@/lib/hooks/use-workflows";

// Internal component imports
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ============================================================================
// Type Definitions
// ============================================================================

interface YearlyWorkflowTableProps {
  workflows: Workflow[];
  groupedRuns: Map<number, WorkflowRun[]>;
  repoSlug: string;
}

interface WorkflowYearlyMetrics {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  successRate: number;
  avgDuration: number;
  totalDuration: number;
  mostRecentStatus: 'success' | 'failure' | 'running' | 'unknown';
  runsByMonth: number[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate yearly metrics for a workflow
 */
function calculateYearlyMetrics(runs: WorkflowRun[]): WorkflowYearlyMetrics {
  const totalRuns = runs.length;
  const passedRuns = runs.filter(r => r.conclusion === 'success').length;
  const failedRuns = runs.filter(r => r.conclusion === 'failure').length;
  const successRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;
  
  // Calculate durations
  const completedRuns = runs.filter(r => r.status === 'completed' && r.run_started_at && r.updated_at);
  const totalDuration = completedRuns.reduce((sum, run) => {
    const start = new Date(run.run_started_at).getTime();
    const end = new Date(run.updated_at).getTime();
    return sum + (end - start) / 1000; // seconds
  }, 0);
  const avgDuration = completedRuns.length > 0 ? totalDuration / completedRuns.length : 0;
  
  // Most recent status
  const sortedRuns = [...runs].sort((a, b) => 
    new Date(b.run_started_at).getTime() - new Date(a.run_started_at).getTime()
  );
  const mostRecent = sortedRuns[0];
  let mostRecentStatus: 'success' | 'failure' | 'running' | 'unknown' = 'unknown';
  if (mostRecent) {
    if (mostRecent.status === 'in_progress' || mostRecent.status === 'queued') {
      mostRecentStatus = 'running';
    } else if (mostRecent.conclusion === 'success') {
      mostRecentStatus = 'success';
    } else if (mostRecent.conclusion === 'failure') {
      mostRecentStatus = 'failure';
    }
  }
  
  // Runs by month (0-11 for Jan-Dec)
  const runsByMonth = new Array(12).fill(0);
  runs.forEach(run => {
    const month = new Date(run.run_started_at).getMonth();
    runsByMonth[month]++;
  });
  
  return {
    totalRuns,
    passedRuns,
    failedRuns,
    successRate,
    avgDuration: Math.round(avgDuration),
    totalDuration: Math.round(totalDuration),
    mostRecentStatus,
    runsByMonth
  };
}

/**
 * Format duration from seconds to human-readable format
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

/**
 * Get health color class based on success rate
 */
function getHealthColor(successRate: number): string {
  if (successRate >= 90) return 'text-green-500';
  if (successRate >= 70) return 'text-yellow-500';
  if (successRate >= 50) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Get health label based on success rate
 */
function getHealthLabel(successRate: number): string {
  if (successRate >= 90) return 'Excellent';
  if (successRate >= 70) return 'Good';
  if (successRate >= 50) return 'Fair';
  return 'Poor';
}

/**
 * Construct GitHub workflow URL from repoSlug and workflow path
 */
function getGitHubWorkflowUrl(repoSlug: string, workflowPath: string): string {
  // Convert repoSlug (owner-repo-name) to repoPath (owner/repo-name)
  // Split on first hyphen to separate owner from repo name
  const firstHyphenIndex = repoSlug.indexOf('-');
  const repoPath = firstHyphenIndex > 0 
    ? `${repoSlug.substring(0, firstHyphenIndex)}/${repoSlug.substring(firstHyphenIndex + 1)}`
    : repoSlug;
  // Extract workflow filename from path (e.g., ".github/workflows/ci.yml" -> "ci.yml")
  const workflowFilename = workflowPath.split('/').pop() || workflowPath;
  return `https://github.com/${repoPath}/actions/workflows/${workflowFilename}`;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Displays yearly workflow overview as a table for all active workflows in the repository
 * Shows workflow name, health score, success rate, total runs, passed/failed runs, and average duration
 */
export default function YearlyWorkflowTable({ workflows, groupedRuns, repoSlug }: YearlyWorkflowTableProps) {
  const activeWorkflows = workflows.filter(w => (groupedRuns.get(w.id) || []).length > 0);
  
  if (activeWorkflows.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Workflows</h2>
        <Badge variant="secondary" className="ml-2">
          {activeWorkflows.length}
        </Badge>
      </div>
      
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Workflow
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Health Score
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                  Total Runs
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                  Passed
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                  Failed
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                  Success Rate
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                  Avg Duration
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {activeWorkflows.map((workflow) => {
                const runs = groupedRuns.get(workflow.id) || [];
                const metrics = calculateYearlyMetrics(runs);
                const healthScore = metrics.successRate;
                
                return (
                  <tr key={workflow.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="font-medium">{workflow.name}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
                          {healthScore}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getHealthLabel(healthScore)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center align-middle">
                      <span className="font-semibold">{metrics.totalRuns}</span>
                    </td>
                    <td className="p-4 text-center align-middle">
                      <span className="text-green-600 font-medium">{metrics.passedRuns}</span>
                    </td>
                    <td className="p-4 text-center align-middle">
                      <span className="text-red-600 font-medium">{metrics.failedRuns}</span>
                    </td>
                    <td className="p-4 text-center align-middle">
                      <span className={`font-semibold ${getHealthColor(healthScore)}`}>
                        {healthScore}%
                      </span>
                    </td>
                    <td className="p-4 text-center align-middle">
                      <span className="text-sm">{formatDuration(metrics.avgDuration)}</span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" size="sm" asChild className="text-xs">
                          <a 
                            href={getGitHubWorkflowUrl(repoSlug, workflow.path)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            GitHub
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="text-xs">
                          <a href={`/dashboard/${repoSlug}/workflows/${workflow.id}`}>
                            Details
                          </a>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
