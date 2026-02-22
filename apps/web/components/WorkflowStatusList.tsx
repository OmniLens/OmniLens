// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Unified health status type for the list view
 * Maps our internal health classifications to display states
 */
export type WorkflowDisplayHealth =
  | "consistent"
  | "improved"
  | "regressed"
  | "still_failing"
  | "idle";

/**
 * A single workflow entry rendered in the status list
 */
export interface WorkflowStatusItem {
  id: number;
  name: string;
  healthStatus: WorkflowDisplayHealth;
}

/**
 * Props for the WorkflowStatusList component
 */
interface WorkflowStatusListProps {
  workflows: WorkflowStatusItem[];
}

// ============================================================================
// Component-Specific Utilities
// ============================================================================

/**
 * Returns the dot color class and plain label for a given health status.
 * Text is always muted — only the dot carries color.
 */
function getHealthConfig(status: WorkflowDisplayHealth): {
  dotClass: string;
  label: string;
} {
  switch (status) {
    case "consistent":
      return { dotClass: "bg-green-500", label: "consistent" };
    case "improved":
      return { dotClass: "bg-blue-500", label: "improved" };
    case "regressed":
      return { dotClass: "bg-amber-500", label: "regressed" };
    case "still_failing":
      return { dotClass: "bg-red-500", label: "failing" };
    case "idle":
      return { dotClass: "bg-muted-foreground/40", label: "idle" };
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * A single card row in the workflow status list.
 * Each workflow gets its own rounded bordered card, matching the repo list mockup style.
 * Workflow name sits on the left; a colored dot + plain muted label sits on the right.
 */
function WorkflowStatusRow({ workflow }: { workflow: WorkflowStatusItem }) {
  const { dotClass, label } = getHealthConfig(workflow.healthStatus);

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30 transition-all cursor-default">
      {/* Workflow name */}
      <span className="text-sm font-semibold truncate pr-4">{workflow.name}</span>

      {/* Status indicator - colored dot only, plain muted label */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`h-2 w-2 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowStatusList renders all workflows as a compact list of individual cards,
 * each showing the workflow name and its current health state as a colored dot + label.
 * Modeled after the repository list style from the UI mockup.
 */
export default function WorkflowStatusList({
  workflows,
}: WorkflowStatusListProps) {
  if (workflows.length === 0) return null;

  return (
    <div className="space-y-2">
      {workflows.map((workflow) => (
        <WorkflowStatusRow key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
}
