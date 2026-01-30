// External library imports
import { BarChart3 } from "lucide-react";

// Type imports
import type { Workflow } from "@/lib/hooks/use-repository-dashboard";
import type { WorkflowRun } from "@/lib/hooks/use-workflows";

// Internal component imports
import { Badge } from "@/components/ui/badge";
import YearlyWorkflowCard from "@/components/YearlyWorkflowCard";

// ============================================================================
// Type Definitions
// ============================================================================

interface YearlyWorkflowCardsProps {
  workflows: Workflow[];
  groupedRuns: Map<number, WorkflowRun[]>;
  repoSlug: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Displays yearly workflow cards for all active workflows in the repository
 * Uses the YearlyWorkflowCard component for consistent styling
 */
export default function YearlyWorkflowCards({ workflows, groupedRuns, repoSlug }: YearlyWorkflowCardsProps) {
  const activeWorkflows = workflows.filter(w => (groupedRuns.get(w.id) || []).length > 0);
  
  if (activeWorkflows.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Workflows</h2>
        <Badge variant="secondary" className="ml-2">
          {activeWorkflows.length}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeWorkflows.map((workflow) => {
          const runs = groupedRuns.get(workflow.id) || [];
          return <YearlyWorkflowCard key={workflow.id} workflow={workflow} runs={runs} repoSlug={repoSlug} />;
        })}
      </div>
    </div>
  );
}
