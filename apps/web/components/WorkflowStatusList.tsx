// External library imports
import Link from "next/link";

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
  /** Repository slug — used to build the link to each workflow's detail page */
  slug: string;
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
      return { dotClass: "bg-green-500", label: "HEALTHY" };
    case "improved":
      return { dotClass: "bg-blue-500", label: "IMPROVED" };
    case "regressed":
      return { dotClass: "bg-amber-500", label: "REGRESSED" };
    case "still_failing":
      return { dotClass: "bg-red-500", label: "FAILING" };
    case "idle":
      return { dotClass: "bg-muted-foreground/40", label: "IDLE" };
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * A single card row in the workflow status list.
 * Rendered as a Next.js Link so clicking navigates to the workflow detail page.
 * Each workflow gets its own rounded bordered card, matching the repo list mockup style.
 * Workflow name sits on the left; a colored dot + plain muted label sits on the right.
 */
function WorkflowStatusRow({ workflow, slug }: { workflow: WorkflowStatusItem; slug: string }) {
  const { dotClass, label } = getHealthConfig(workflow.healthStatus);

  return (
    <Link
      href={`/dashboard/${slug}/workflow/${workflow.id}`}
      className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30 transition-all"
    >
      {/* Workflow name */}
      <span className="text-sm font-semibold truncate pr-4">{workflow.name}</span>

      {/* Status indicator - colored dot only, plain muted label */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`h-2 w-2 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </Link>
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
  slug,
}: WorkflowStatusListProps) {
  if (workflows.length === 0) return null;

  return (
    <div className="space-y-2">
      {workflows.map((workflow) => (
        <WorkflowStatusRow key={workflow.id} workflow={workflow} slug={slug} />
      ))}
    </div>
  );
}
