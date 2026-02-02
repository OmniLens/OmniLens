// External library imports
import type { LucideIcon } from "lucide-react";

// Internal component imports
import { Card, CardContent } from "@/components/ui/card";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for a single stat item
 */
export interface StatConfig {
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  value: React.ReactNode;
  valueColorClass?: string; // Optional: color class for value text (defaults to default text color)
}

/**
 * Props for the WorkflowHealthStats component
 */
export interface WorkflowHealthStatsProps {
  /** Array of 3 stat configurations to display horizontally */
  stats: StatConfig[];
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowHealthStats component
 * Single card with three health stats displayed horizontally in one row.
 * Matches the layout style of WorkflowYearSummaryBar (icon box + title + value for each stat).
 * Used on the workflow overview page next to the commit history heatmap.
 */
export default function WorkflowHealthStats({
  stats,
}: WorkflowHealthStatsProps) {
  return (
    <Card className="w-full flex-1 min-h-0 flex flex-col min-w-0">
      <CardContent className="px-3 py-3 sm:px-5 sm:py-4 flex-1 flex flex-col justify-center min-h-[4rem] min-w-0">
        <div className="grid grid-cols-3 w-full min-w-0 gap-2 sm:gap-4 items-center">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="flex items-center gap-2 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${stat.iconBgClass}`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColorClass}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  <p className={`text-sm font-semibold truncate tabular-nums ${stat.valueColorClass ?? ""}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
