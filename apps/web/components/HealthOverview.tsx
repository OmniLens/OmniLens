// External library imports
import { Activity } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Utility imports
import { cn } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the HealthOverview component
 */
export interface HealthOverviewProps {
  healthScore: number;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * HealthOverview component
 * Displays health status word (Excellent/Good/Fair/Poor) based on health score
 * Used in workflow summary to show overall health status
 */
export default function HealthOverview({
  healthScore
}: HealthOverviewProps) {
  const getHealthLabel = () => {
    if (healthScore >= 90) return 'Excellent';
    if (healthScore >= 70) return 'Good';
    if (healthScore >= 50) return 'Fair';
    return 'Poor';
  };

  const getHealthColor = () => {
    if (healthScore >= 90) return 'text-green-500';
    if (healthScore >= 70) return 'text-yellow-500';
    if (healthScore >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-1.5 shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-4 w-4 text-white shrink-0" />
          <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap truncate min-w-0">
            Health
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className={cn("text-base font-semibold", getHealthColor())}>
          {getHealthLabel()}
        </div>
      </CardContent>
    </Card>
  );
}
