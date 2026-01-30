// Internal component imports
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowsPageSkeleton component
 * Displays a loading skeleton that mirrors the workflows page layout:
 * heatmap (left) + three overview widgets + runner/OS bar (right), then Workflows section with cards.
 * Used while workflows and run data are loading.
 */
export default function WorkflowsPageSkeleton() {
  const HEATMAP_WEEKS = 53;
  const HEATMAP_DAYS = 7;

  return (
    <div className="space-y-8">
      {/* Top row – same structure as page: flex gap-6 items-stretch, left shrink-0, right flex-1 min-w-0 */}
      <div className="flex gap-6 w-full items-stretch">
        {/* Left: same as page – shrink-0 wrapper for Runs This Year heatmap */}
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
                <div className="flex flex-col gap-1 pr-2 shrink-0">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-2.5 w-3 rounded-[2px]" />
                  ))}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: HEATMAP_WEEKS }).map((_, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1 shrink-0">
                      {Array.from({ length: HEATMAP_DAYS }).map((_, dayIndex) => (
                        <Skeleton key={dayIndex} className="h-2.5 w-2.5 rounded-[2px] shrink-0" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
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

        {/* Right: same as page – flex-1 min-w-0 wrapper; inner div matches WorkflowRunsHistoryMonth exactly */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 w-full h-full min-h-0">
            {/* Three widgets row – same classes as WorkflowRunsHistoryMonth: flex gap-6 items-start shrink-0, first min-w-[7.5rem] */}
            <div className="flex gap-6 w-full items-start shrink-0">
              <div className="flex-1 min-w-[7.5rem]">
                <Card className="w-full min-w-0 flex flex-col">
                  <CardHeader className="pb-1.5 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Skeleton className="h-4 w-4 rounded shrink-0" />
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <Skeleton className="h-4 w-8 rounded" />
                  </CardContent>
                </Card>
              </div>
              <div className="flex-1 min-w-0">
                <Card className="w-full min-w-0 flex flex-col">
                  <CardHeader className="pb-1.5 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Skeleton className="h-4 w-4 rounded shrink-0" />
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <Skeleton className="h-4 w-12 rounded" />
                  </CardContent>
                </Card>
              </div>
              <div className="flex-1 min-w-0">
                <Card className="w-full min-w-0 flex flex-col">
                  <CardHeader className="pb-1.5 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Skeleton className="h-4 w-4 rounded shrink-0" />
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <Skeleton className="h-4 w-12 rounded" />
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* Long bar wrapper – same as WorkflowRunsHistoryMonth: w-full min-h-0 flex-1 flex */}
            <div className="w-full min-h-0 flex-1 flex">
              {/* Card – same classes as WorkflowYearSummaryBar exactly */}
              <Card className="w-full flex-1 min-h-0 flex flex-col min-w-0">
                <CardContent className="px-3 py-3 sm:px-5 sm:py-4 flex-1 flex flex-col justify-center min-h-[4rem] min-w-0">
                  <div className="grid grid-cols-3 w-full min-w-0 gap-2 sm:gap-4 items-center">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2 min-w-0">
                        <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg shrink-0" />
                        <div className="min-w-0 space-y-1">
                          <Skeleton className="h-3 w-20 rounded" />
                          <Skeleton className="h-3.5 w-10 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows section – matches YearlyWorkflowCards (single section, header + grid) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
    </div>
  );
}
