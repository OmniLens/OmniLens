// External library imports
import type { LucideIcon } from "lucide-react";

// Internal component imports
import { Card, CardContent } from "@/components/ui/card";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the StatCard component.
 * Single reusable component displaying one stat: icon, title, and data point.
 */
export interface StatCardProps {
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
 * StatCard component
 * Single reusable card displaying one stat: icon in colored rounded box, title, and data value.
 * Matches the visual style of items in WorkflowYearSummaryBar.
 */
export default function StatCard({
  icon: Icon,
  iconBgClass,
  iconColorClass,
  title,
  value,
  className,
}: StatCardProps) {
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
