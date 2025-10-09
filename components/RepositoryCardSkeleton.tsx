import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface RepositoryCardSkeletonProps {
  count?: number;
}

export function RepositoryCardSkeleton({ count = 6 }: RepositoryCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <Card className="relative h-full border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar skeleton */}
                  <div className="h-6 w-6 rounded-full bg-muted"></div>
                  {/* Title skeleton */}
                  <div className="h-5 w-32 bg-muted rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  {/* GitHub icon skeleton */}
                  <div className="h-4 w-4 bg-muted rounded"></div>
                  {/* Delete icon skeleton */}
                  <div className="h-4 w-4 bg-muted rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Metrics skeleton */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-muted rounded"></div>
                    <div className="h-4 w-12 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-muted rounded"></div>
                    <div className="h-4 w-12 bg-muted rounded"></div>
                  </div>
                </div>
                {/* Progress bar skeleton */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-muted rounded"></div>
                  <div className="flex justify-between">
                    <div className="h-3 w-8 bg-muted rounded"></div>
                    <div className="h-3 w-8 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  );
}

export default RepositoryCardSkeleton;
