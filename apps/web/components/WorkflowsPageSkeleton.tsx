// Internal component imports
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowsPageSkeleton component
 * Displays a loading skeleton that mirrors the workflows page layout:
 * heatmap + overview row, yearly workflow cards grid, idle workflows section.
 * Used while workflows and run data are loading.
 */
export default function WorkflowsPageSkeleton() {
  const HEATMAP_WEEKS = 53;
  const HEATMAP_DAYS = 7;

  return (
    <div className="space-y-6">
      {/* Top row - heatmap (left) + overview widgets (right) */}
      <div className="flex gap-6 w-full items-stretch">
        {/* Left: Runs This Year heatmap card skeleton */}
        <div className="shrink-0">
          <Card className="w-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-6 rounded-[2px]" />
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-2.5 w-2.5 rounded-[2px]" />
                    ))}
                  </div>
                  <Skeleton className="h-3 w-6 rounded-[2px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="flex gap-1 pb-2">
                {/* Day labels column */}
                <div className="flex flex-col gap-1 pr-2 shrink-0">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-2.5 w-3 rounded-[2px]" />
                  ))}
                </div>
                {/* Heatmap grid - 53 weeks × 7 days */}
                <div className="flex gap-1">
                  {Array.from({ length: HEATMAP_WEEKS }).map((_, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1 shrink-0">
                      {Array.from({ length: HEATMAP_DAYS }).map((_, dayIndex) => (
                        <Skeleton
                          key={dayIndex}
                          className="h-2.5 w-2.5 rounded-[2px] shrink-0"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* Month labels row */}
              <div className="flex gap-1 mt-2 ml-7">
                <div className="w-3 shrink-0" />
                <div className="flex gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-5 rounded-[2px] shrink-0" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Three overview cards + summary bar */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="flex gap-6 w-full items-start shrink-0">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex-1 min-w-0">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="w-full flex-1 min-h-[4rem]">
            <CardContent className="px-5 py-5 sm:px-6 sm:py-6 flex-1 flex flex-wrap items-center justify-between gap-x-10 gap-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workflows section */}
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 flex-1 max-w-[80%]" />
                    <Skeleton className="h-8 w-8 shrink-0 rounded" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Idle Workflows section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 flex-1 max-w-[85%]" />
                    <Skeleton className="h-8 w-8 shrink-0 rounded" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
