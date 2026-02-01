// External library imports
import type { LucideIcon } from "lucide-react";

// Internal component imports
import { Card, CardContent } from "@/components/ui/card";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the OverviewStatCard component.
 * Matches the single-style layout used in WorkflowYearSummaryBar
 * (icon in colored box + title + value).
 */
export interface OverviewStatCardProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind classes for the icon wrapper background (e.g. "bg-amber-500/15") */
  iconBgClass: string;
  /** Tailwind classes for the icon color (e.g. "text-amber-600 dark:text-amber-400") */
  iconColorClass: string;
  /** Label shown above the value (e.g. "Failure Streak", "Since Last Fail") */
  title: string;
  /** Main stat value (number, string, or "—") */
  value: React.ReactNode;
  /** Optional class name for the card root */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * OverviewStatCard component
 * Single-style card: icon in colored rounded box, title, and data value.
 * Same layout as each item in WorkflowYearSummaryBar (Hosted runners, Self-hosted, Runtime OS).
 * Used for Failure Streak, Since Last Fail, and Median Time on the workflow overview.
 */
export default function OverviewStatCard({
  icon: Icon,
  iconBgClass,
  iconColorClass,
  title,
  value,
  className,
}: OverviewStatCardProps) {
  return (
    <Card className={`w-full min-w-0 flex flex-col ${className ?? ""}`}>
      <CardContent className="px-3 py-3 sm:px-4 sm:py-4 flex flex-col justify-center min-h-[4rem] min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${iconBgClass}`}
          >
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColorClass}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-sm font-semibold truncate tabular-nums">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
