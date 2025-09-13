import { Clock, Eye, CheckCircle, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { WorkflowRun } from "@/lib/github";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function duration(start: string, end: string): string {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diff = endTime.getTime() - startTime.getTime();

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatRunTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface WorkflowCardProps {
  run: WorkflowRun;
  repoSlug: string; // Repository slug for config context
  isHighlighted?: boolean;
  highlightColor?: string;
  rightAction?: React.ReactNode; // Optional right-side action button (e.g., delete)
  healthStatus?: 'consistent' | 'improved' | 'regressed' | 'still_failing' | 'no_runs_today';
  healthMetrics?: {
    status: 'consistent' | 'improved' | 'regressed' | 'still_failing' | 'no_runs_today';
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
  };
}

export default function WorkflowCard({
  run,
  repoSlug,
  isHighlighted = false,
  highlightColor = '',
  rightAction,
  healthStatus,
  healthMetrics
}: WorkflowCardProps) {
  const status = run.conclusion ?? run.status;
  const isSuccess = status === "success";
  const isInProgress = status === "in_progress" || status === 'queued';
  const hasNoRuns = status === 'no_runs';

  // Determine border classes
  const getBorderClass = () => {
    if (isHighlighted && highlightColor) {
      return `${highlightColor} border-2 shadow-lg`;
    }
    return 'border-2 border-border'; // Use the default border color with consistent width
  };

  // Determine card height - use natural sizing
  const cardHeightClass = 'h-auto';

  // Use workflow name directly, preserving emojis
  const getDisplayName = (): string => {
    // Use the workflow name directly from the API (preserve emojis)
    if (run.name) {
      return run.name;
    }
    
    // Fallback to workflow_name if available
    if ((run as any).workflow_name) {
      return (run as any).workflow_name;
    }
    
    // Last resort: extract from path
    if (run.path) {
      const last = run.path.split('/').pop() || run.path;
      const noExt = last.replace(/\.ya?ml$/i, '');
      const cleaned = noExt.replace(/[-_]/g, ' ').trim();
      return cleaned.replace(/\b\w/g, (l) => l.toUpperCase());
    }
    
    return 'Unknown Workflow';
  };

  return (
    <Card className={`${cardHeightClass} ${getBorderClass()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm leading-tight truncate pr-2">
            {getDisplayName()}
          </h3>
          <div className="flex items-center gap-2">
            {/* Show run count badge if workflow was run multiple times */}
            {(() => {
              console.log(`🔍 WorkflowCard ${run.name}: run_count=${run.run_count}, all_runs=${run.all_runs?.length}`);
              return run.run_count && run.run_count > 1 ? (
                <Popover>
                <PopoverTrigger asChild>
                  <Badge variant="secondary" className="shrink-0 text-xs cursor-pointer hover:opacity-80">
                    {run.run_count}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-80" side="bottom" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">All Runs</h4>
                    <div className="space-y-1">
                      {run.all_runs && run.all_runs.length > 0 ? (
                        run.all_runs.map((runDetail, index) => (
                          <div key={runDetail.id} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 text-xs">
                            <span className="text-muted-foreground w-16">
                              {formatRunTime(runDetail.run_started_at)}
                            </span>
                            <span className="font-mono w-24">
                              #{runDetail.id}
                            </span>
                            {(() => {
                              const isDetailRunning = (runDetail.status === 'in_progress' || runDetail.status === 'queued') && (runDetail.conclusion === null || runDetail.conclusion === undefined);
                              const isDetailSuccess = runDetail.conclusion === 'success';
                              const label = isDetailSuccess ? 'Pass' : isDetailRunning ? 'Running' : 'Fail';
                              const variant = isDetailSuccess ? 'success' : 'destructive';
                              const runningClass = isDetailRunning ? 'bg-orange-500 hover:bg-orange-600 text-white' : '';
                              return (
                                <Badge variant={variant} className={`text-xs justify-self-start ${runningClass}`}>
                                  {label}
                                </Badge>
                              );
                            })()}
                            <Button variant="ghost" size="sm" asChild className="h-6 px-1">
                              <Link href={runDetail.html_url} target="_blank">
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">No run details available</div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : null;
            })()}
            <Badge
              variant={
                hasNoRuns ? "secondary" :
                isSuccess ? "success" : 
                isInProgress ? "destructive" : 
                "destructive"
              }
              className={`shrink-0 ${isInProgress ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
            >
              {hasNoRuns ? "No Runs" :
               isSuccess ? "Pass" : 
               isInProgress ? "Running" : 
               "Fail"}
            </Badge>
            {rightAction}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Health Status Section - Show placeholder when running to maintain spacing */}
        {healthStatus && (
          <div className="flex items-center gap-2">
            {isInProgress ? (
              /* Placeholder content for running workflows to maintain spacing */
              <>
                <div className="h-4 w-4" /> {/* Invisible icon spacer */}
                <span className="text-sm font-medium text-transparent select-none">
                  Placeholder
                </span>
              </>
            ) : (
              (() => {
                const getHealthIcon = () => {
                  switch (healthStatus) {
                    case 'consistent':
                      return <CheckCircle className="h-4 w-4 text-green-500" />;
                    case 'improved':
                      return <TrendingUp className="h-4 w-4 text-blue-500" />;
                    case 'regressed':
                      return <TrendingDown className="h-4 w-4 text-orange-500" />;
                    case 'still_failing':
                      return <AlertTriangle className="h-4 w-4 text-red-500" />;
                    case 'no_runs_today':
                      return <Clock className="h-4 w-4 text-muted-foreground" />;
                    default:
                      return null;
                  }
                };

                const getHealthLabel = () => {
                  switch (healthStatus) {
                    case 'consistent':
                      return 'Consistent';
                    case 'improved':
                      return 'Improved';
                    case 'regressed':
                      return 'Regressed';
                    case 'still_failing':
                      return 'Still Failing';
                    case 'no_runs_today':
                      return 'No Runs Today';
                    default:
                      return '';
                  }
                };

                const getHealthColor = () => {
                  switch (healthStatus) {
                    case 'consistent':
                      return 'text-green-500';
                    case 'improved':
                      return 'text-blue-500';
                    case 'regressed':
                      return 'text-orange-500';
                    case 'still_failing':
                      return 'text-red-500';
                    case 'no_runs_today':
                      return 'text-muted-foreground';
                    default:
                      return 'text-muted-foreground';
                  }
                };

                return (
                  <>
                    {getHealthIcon()}
                    <span className={`text-sm font-medium ${getHealthColor()}`}>
                      {getHealthLabel()}
                    </span>
                  </>
                );
              })()
            )}
          </div>
        )}
        
        {/* Duration and View Button */}
        {healthStatus !== 'no_runs_today' && !hasNoRuns && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {isInProgress ? "Running" : 
                 (run.run_started_at && run.updated_at ? duration(run.run_started_at, run.updated_at) : "No duration")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {run.html_url && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={run.html_url} target="_blank">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 