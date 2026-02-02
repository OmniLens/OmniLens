// External library imports
import { CheckCircle, XCircle, Workflow } from 'lucide-react';

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the WorkflowCountsOverview component
 */
export interface WorkflowCountsOverviewProps {
  activeWorkflows: number;
  completedRuns: number;
  didntRunCount: number;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowCountsOverview component
 * Displays workflow and run count statistics
 * Shows active workflows, completed runs, and runs that didn't execute
 * Used in daily metrics dashboard to show count-based workflow statistics
 */
export default function WorkflowCountsOverview({
  activeWorkflows,
  completedRuns,
  didntRunCount
}: WorkflowCountsOverviewProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Workflow Counts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Active Workflows Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Workflow className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Workflows</span>
            </div>
            <span className="text-sm font-medium">{activeWorkflows}</span>
          </div>
          {/* Completed Runs Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Completed</span>
            </div>
            <span className="text-sm font-medium">{completedRuns}</span>
          </div>
          {/* Didn't Run Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm">Didn&apos;t run</span>
            </div>
            <span className="text-sm font-medium">{didntRunCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
