// External library imports
import { useMemo } from "react";
import type { WorkflowRun } from "@/lib/github";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ============================================================================
// Type Definitions
// ============================================================================

interface WorkflowRunsHistoryProps {
  runs: WorkflowRun[];
  startDate: Date;
  endDate: Date;
  /** Display mode: 'count' shows run count intensity (overview page), 'result' shows workflow result per day (summary page) */
  mode?: "count" | "result";
}

/** Result for a single day: derived from the most recent run that day */
type DayResult = "success" | "failure" | "none";

interface DayData {
  date: Date;
  count: number;
  result: DayResult;
  dateString: string;
  isInRange: boolean; // Whether this day is within the startDate-endDate range
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all days in the date range
 */
function getAllDaysInRange(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

/**
 * Format date to YYYY-MM-DD string using local time (not UTC)
 * This prevents timezone issues where dates can appear one day ahead
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Get intensity level for a day based on run count
 * Returns 0-4 where 0 = no runs, 4 = most runs
 */
function getIntensityLevel(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;
  
  const percentage = count / maxCount;
  if (percentage >= 0.75) return 4;
  if (percentage >= 0.5) return 3;
  if (percentage >= 0.25) return 2;
  return 1;
}

/**
 * Get workflow result for a day from its runs (most recent run wins).
 * Runs should be sorted by run_started_at descending.
 * Note: Does not include "running" state - only success/failure/none.
 */
function getDayResult(runs: WorkflowRun[]): DayResult {
  if (runs.length === 0) return "none";
  const latest = runs[0];
  if (latest.conclusion === "success") return "success";
  if (latest.conclusion === "failure") return "failure";
  // For other statuses (running, cancelled, skipped, etc.), treat as none
  return "none";
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowRunsHistory component
 * Displays workflow runs per day in a GitHub commit history-style grid.
 * 
 * Two modes:
 * - 'count' (default): Colors by run count intensity (for overview page)
 * - 'result': Colors by workflow result per day - Passed (green), Failed (red), or No runs (muted) (for summary page)
 */
export default function WorkflowRunsHistory({
  runs,
  startDate,
  endDate,
  mode = "count"
}: WorkflowRunsHistoryProps) {
  // Group runs by day and compute data per day
  const runsPerDay = useMemo(() => {
    const runsByDayMap = new Map<string, WorkflowRun[]>();
    runs.forEach(run => {
      const runDate = new Date(run.run_started_at);
      const dateKey = formatDateString(runDate);
      if (!runsByDayMap.has(dateKey)) runsByDayMap.set(dateKey, []);
      runsByDayMap.get(dateKey)!.push(run);
    });
    // Sort each day's runs by run_started_at descending (most recent first)
    runsByDayMap.forEach(dayRuns => {
      dayRuns.sort(
        (a, b) =>
          new Date(b.run_started_at).getTime() -
          new Date(a.run_started_at).getTime()
      );
    });

    const allDays = getAllDaysInRange(startDate, endDate);
    const dayData: DayData[] = allDays.map(day => {
      const dateKey = formatDateString(day);
      const dayRuns = runsByDayMap.get(dateKey) || [];
      const result = mode === "result" ? getDayResult(dayRuns) : "none";
      return {
        date: day,
        count: dayRuns.length,
        result,
        dateString: dateKey,
        isInRange: true
      };
    });
    return dayData;
  }, [runs, startDate, endDate, mode]);
  
  // Calculate max count for intensity scaling (only used in count mode)
  const maxCount = useMemo(() => {
    if (mode !== "count") return 1;
    return Math.max(...runsPerDay.map(d => d.count), 1);
  }, [runsPerDay, mode]);
  
  // Group days by week (Sunday to Saturday)
  // Only show data squares for days within the current year (startDate to endDate)
  const weeks = useMemo(() => {
    const weekGroups: DayData[][] = [];
    let currentWeek: DayData[] = [];
    
    // Find the Sunday of the week containing startDate
    const firstSunday = new Date(startDate);
    const firstDayOfWeek = getDayOfWeek(startDate);
    firstSunday.setDate(firstSunday.getDate() - firstDayOfWeek);
    
    // Find the Saturday of the week containing endDate
    const lastSaturday = new Date(endDate);
    const lastDayOfWeek = getDayOfWeek(endDate);
    lastSaturday.setDate(lastSaturday.getDate() + (6 - lastDayOfWeek));
    
    // Create a map of date strings to DayData for quick lookup
    const dayMap = new Map<string, DayData>();
    runsPerDay.forEach(day => {
      dayMap.set(day.dateString, day);
    });
    
    // Iterate through all weeks from first Sunday to last Saturday
    const currentDate = new Date(firstSunday);
    
    while (currentDate <= lastSaturday) {
      const dayOfWeek = getDayOfWeek(currentDate);
      const dateString = formatDateString(currentDate);
      
      // Check if this day is within the range (startDate to endDate)
      const isInRange = currentDate >= startDate && currentDate <= endDate;
      
      if (isInRange) {
        // Use actual data if available, otherwise create empty day
        const dayData = dayMap.get(dateString) || {
          date: new Date(currentDate),
          count: 0,
          result: "none" as DayResult,
          dateString,
          isInRange: true
        };
        currentWeek.push(dayData);
      } else {
        // Day is outside range - add placeholder that won't be shown as data square
        currentWeek.push({
          date: new Date(currentDate),
          count: 0,
          result: "none" as DayResult,
          dateString,
          isInRange: false
        });
      }
      
      // If it's Saturday, close the week
      if (dayOfWeek === 6) {
        weekGroups.push(currentWeek);
        currentWeek = [];
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add any remaining days (shouldn't happen, but just in case)
    if (currentWeek.length > 0) {
      weekGroups.push(currentWeek);
    }
    
    return weekGroups;
  }, [runsPerDay, startDate, endDate]);
  
  // Calculate month labels - show all 12 months evenly distributed
  const monthLabels = useMemo(() => {
    const labels = new Map<number, string>();
    const currentYear = startDate.getFullYear();
    
    // For each month (0-11), find the first week that contains it
    for (let month = 0; month < 12; month++) {
      const monthStartDate = new Date(currentYear, month, 1);
      const monthName = monthStartDate.toLocaleDateString('en-US', { month: 'short' });
      
      // Find the first week that contains this month
      for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
        const week = weeks[weekIndex];
        const hasMonth = week.some(day => {
          const dayMonth = day.date.getMonth();
          return dayMonth === month;
        });
        
        if (hasMonth && !labels.has(weekIndex)) {
          labels.set(weekIndex, monthName);
          break;
        }
      }
    }
    
    return labels;
  }, [weeks, startDate]);
  
  return (
    <Card className="w-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Runs This Year</CardTitle>
          {mode === "count" ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-[10px]">Less</span>
              <div className="flex items-center gap-0.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-muted border border-border" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#40c463] dark:bg-[#006d32]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#216e39] dark:bg-[#39d353]" />
              </div>
              <span className="text-[10px]">More</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-muted border border-border" title="No runs" />
                <span className="text-[10px]">No runs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#22c55e] dark:bg-[#16a34a]" title="Passed" />
                <span className="text-[10px]">Passed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#ef4444] dark:bg-[#dc2626]" title="Failed" />
                <span className="text-[10px]">Failed</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <TooltipProvider>
          <div className="flex gap-1 pb-2">
            {/* Day labels (Sun, Mon, Tue, etc.) */}
            <div className="flex flex-col gap-1 pr-2 shrink-0">
              {['', 'M', '', 'W', '', 'F', ''].map((day, index) => (
                <div key={index} className="h-2.5 w-3 flex items-center justify-center text-xs text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Weeks grid - compact layout based on actual weeks */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1 shrink-0">
                  {week.map((day, dayIndex) => {
                    // Only show data squares for days within the current year range
                    if (!day.isInRange) {
                      // Return invisible placeholder to maintain grid alignment
                      return <div key={`${day.dateString}-${dayIndex}`} className="w-2.5 h-2.5 opacity-0 pointer-events-none" />;
                    }
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dayDate = new Date(day.date);
                    dayDate.setHours(0, 0, 0, 0);
                    const isFuture = dayDate > today;
                    const isToday = formatDateString(day.date) === formatDateString(new Date());
                    
                    // Determine color and label based on mode
                    let colorClass: string;
                    let tooltipLabel: string;
                    
                    if (mode === "count") {
                      // Count mode: use intensity-based coloring
                      const intensity = isFuture ? 0 : getIntensityLevel(day.count, maxCount);
                      const colorClasses = [
                        "bg-muted border border-border", // 0 runs or future
                        "bg-[#9be9a8] dark:bg-[#0e4429]", // 1 (low)
                        "bg-[#40c463] dark:bg-[#006d32]", // 2 (medium-low)
                        "bg-[#30a14e] dark:bg-[#26a641]", // 3 (medium-high)
                        "bg-[#216e39] dark:bg-[#39d353]"  // 4 (high)
                      ];
                      colorClass = colorClasses[intensity];
                      tooltipLabel = isFuture 
                        ? "No runs" 
                        : `${day.count} ${day.count === 1 ? "run" : "runs"}`;
                    } else {
                      // Result mode: use result-based coloring
                      const displayResult = isFuture ? "none" : day.result;
                      const resultColorClasses: Record<DayResult, string> = {
                        none: "bg-muted border border-border",
                        success: "bg-[#22c55e] dark:bg-[#16a34a]",
                        failure: "bg-[#ef4444] dark:bg-[#dc2626]"
                      };
                      const resultLabels: Record<DayResult, string> = {
                        none: "No runs",
                        success: "Passed",
                        failure: "Failed"
                      };
                      colorClass = resultColorClasses[displayResult];
                      const resultLabel = resultLabels[displayResult];
                      tooltipLabel = isFuture
                        ? "No runs"
                        : day.count > 0
                          ? `${resultLabel} — ${day.count} ${day.count === 1 ? "run" : "runs"}`
                          : resultLabel;
                    }

                    return (
                      <Tooltip key={`${day.dateString}-${dayIndex}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-2.5 h-2.5 rounded-[2px] ${colorClass} ${
                              isToday ? "ring-1 ring-primary ring-offset-1" : ""
                            } ${isFuture ? "opacity-50" : "cursor-pointer hover:ring-1 hover:ring-primary hover:ring-offset-1"} transition-all`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700">
                          <div className="text-xs">
                            {isFuture ? (
                              <>
                                <div className="font-semibold text-white">No runs</div>
                                <div className="text-gray-300">
                                  {day.date.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric"
                                  })}{" "}
                                  (Future)
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-semibold text-white">{tooltipLabel}</div>
                                <div className="text-gray-300">
                                  {day.date.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric"
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>
        
        {/* Month labels - evenly distributed for all 12 months */}
        <div className="flex gap-1 mt-2 ml-7">
          <div className="w-3 shrink-0" /> {/* Spacer for day labels */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => {
              // Show month label if this week is the first occurrence of that month
              const monthLabel = monthLabels.get(weekIndex);
              
              if (monthLabel) {
                return (
                  <div key={weekIndex} className="text-xs text-muted-foreground shrink-0 w-2.5">
                    {monthLabel}
                  </div>
                );
              }
              return <div key={weekIndex} className="shrink-0 w-2.5" />;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
