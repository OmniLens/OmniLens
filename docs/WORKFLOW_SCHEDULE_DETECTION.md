# Workflow Schedule Detection

This document outlines how to determine if a workflow is scheduled in the OmniLens application.

## Current Status

**❌ Not Currently Available**: The application does not currently have a way to determine if a workflow is scheduled.

## Why It's Not Available

### The Problem

1. **GitHub API Provides the Data**: The GitHub Actions API returns an `event` field for each workflow run that indicates what triggered it (e.g., `"schedule"`, `"push"`, `"pull_request"`, `"workflow_dispatch"`).

2. **Interface Doesn't Capture It**: The `WorkflowRun` interface in `apps/web/lib/github.ts` (lines 3-22) does not include the `event` field, even though the GitHub API response contains it.

3. **Data Loss During Type Casting**: When the API response is cast to `WorkflowRun[]` (line 179 in `github.ts`), the `event` field is present in the raw JSON but not accessible through the typed interface.

### Code References

**Current WorkflowRun Interface** (`apps/web/lib/github.ts`):
```3:22:apps/web/lib/github.ts
export interface WorkflowRun {
  id: number;
  name: string;
  workflow_id: number;
  workflow_name?: string; // Made optional since GitHub API doesn't provide this
  path?: string; // Added path field from GitHub API
  conclusion: string | null;
  status: string;
  html_url: string;
  run_started_at: string;
  updated_at: string;
  run_count?: number; // Number of times this workflow was run on this date
  all_runs?: Array<{
    id: number;
    conclusion: string | null;
    status: string;
    html_url: string;
    run_started_at: string;
  }>; // All runs for this workflow on this date
}
```

**Note**: The `event` field is missing from this interface.

**API Response Casting** (`apps/web/lib/github.ts`):
```178:179:apps/web/lib/github.ts
      const json = await res.json();
      const pageRuns = json.workflow_runs as WorkflowRun[];
```

The raw GitHub API response includes the `event` field, but it's not accessible because the interface doesn't define it.

**Alternative Interface** (`apps/web/lib/hooks/use-repository-dashboard.ts`):
```128:154:apps/web/lib/hooks/use-repository-dashboard.ts
export interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
  event: string;
  status: string;
  conclusion: string | null;
  workflow_id: number;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_attempt: number;
  run_started_at: string;
  jobs_url: string;
  logs_url: string;
  check_suite_url: string;
  artifacts_url: string;
  cancel_url: string;
  rerun_url: string;
  workflow_url: string;
  head_commit: Commit;
  repository: Repository;
  head_repository: Repository;
}
```

**Note**: This interface includes `event: string` (line 134), but it's not used because the actual data comes from `github.ts`, which doesn't capture the `event` field.

## GitHub API Event Types

According to the GitHub Actions API, workflow runs can be triggered by various events. The `event` field in the API response contains one of these values:

### Common Event Types

- **`schedule`** - Workflow triggered by a scheduled event (cron)
- **`push`** - Workflow triggered by a push event
- **`pull_request`** - Workflow triggered by a pull request event
- **`workflow_dispatch`** - Workflow manually triggered by a user
- **`repository_dispatch`** - Workflow triggered by a repository dispatch event
- **`pull_request_target`** - Workflow triggered by a pull request target event
- **`issue_comment`** - Workflow triggered by an issue comment
- **`issues`** - Workflow triggered by an issue event
- **`release`** - Workflow triggered by a release event
- **`create`** - Workflow triggered by a branch/tag creation
- **`delete`** - Workflow triggered by a branch/tag deletion
- **`gollum`** - Workflow triggered by a wiki page event
- **`watch`** - Workflow triggered by a watch event
- **`fork`** - Workflow triggered by a fork event
- **`public`** - Workflow triggered when a repository is made public

### Scheduled Workflows

A workflow is considered "scheduled" when:
- The workflow YAML file contains a `schedule` event with a cron expression
- The workflow run's `event` field equals `"schedule"`
- The workflow must be on the default branch to run on schedule

**Example Scheduled Workflow YAML**:
```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Runs every day at midnight UTC
```

## How to Add Schedule Detection

### Step 1: Update the WorkflowRun Interface

Add the `event` field to the `WorkflowRun` interface in `apps/web/lib/github.ts`:

```typescript
export interface WorkflowRun {
  id: number;
  name: string;
  workflow_id: number;
  workflow_name?: string;
  path?: string;
  conclusion: string | null;
  status: string;
  event?: string; // The event that triggered the workflow (schedule, push, pull_request, etc.)
  html_url: string;
  run_started_at: string;
  updated_at: string;
  run_count?: number;
  all_runs?: Array<{
    id: number;
    conclusion: string | null;
    status: string;
    event?: string; // Also add to all_runs array items
    html_url: string;
    run_started_at: string;
  }>;
}
```

### Step 2: Update the all_runs Collection

When collecting runs in `getLatestWorkflowRuns()`, include the `event` field:

```typescript
allRunsForWorkflow.set(workflowKey, [{
  id: run.id,
  conclusion: run.conclusion,
  status: run.status,
  event: run.event, // Add this
  html_url: run.html_url,
  run_started_at: run.run_started_at
}]);
```

### Step 3: Use the Event Field

Once the `event` field is available, you can check if a workflow is scheduled:

```typescript
// Check if a workflow run was triggered by schedule
const isScheduled = run.event === 'schedule';

// Filter scheduled workflows
const scheduledRuns = workflowRuns.filter(run => run.event === 'schedule');

// Check if a workflow has any scheduled runs
const hasScheduledRuns = workflowRuns.some(run => run.event === 'schedule');
```

## Potential Use Cases

Once schedule detection is implemented, you could:

1. **Filter Scheduled Workflows**: Show only scheduled workflows in a separate view
2. **Badge Indicators**: Add a badge or icon to indicate scheduled workflows
3. **Metrics**: Track scheduled vs. manual workflow runs separately
4. **Notifications**: Different notification rules for scheduled workflows
5. **UI Grouping**: Group workflows by trigger type (scheduled, push, manual, etc.)

## Implementation Notes

### Why It's Optional

The `event` field should be optional (`event?: string`) because:
- Older workflow runs might not have this field
- The GitHub API might not always return it in all contexts
- It provides backward compatibility

### Type Safety

The `event` field is a string, but you can create a type union for better type safety:

```typescript
type WorkflowEvent = 
  | 'schedule'
  | 'push'
  | 'pull_request'
  | 'workflow_dispatch'
  | 'repository_dispatch'
  | 'pull_request_target'
  | 'issue_comment'
  | 'issues'
  | 'release'
  | 'create'
  | 'delete'
  | 'gollum'
  | 'watch'
  | 'fork'
  | 'public'
  | string; // Fallback for unknown events

export interface WorkflowRun {
  // ... other fields
  event?: WorkflowEvent;
}
```

### Testing

After implementation, verify:
1. Scheduled workflows show `event === 'schedule'`
2. Push-triggered workflows show `event === 'push'`
3. Manually triggered workflows show `event === 'workflow_dispatch'`
4. The field is available in both the main run and `all_runs` array

## Summary

**Current State**: ❌ Schedule detection is not available

**Root Cause**: The `event` field from the GitHub API is not captured in the `WorkflowRun` interface

**Solution**: Add `event?: string` to the `WorkflowRun` interface in `apps/web/lib/github.ts`

**Impact**: Low - The data is already in the API response, just needs to be exposed through the interface

**Effort**: Minimal - Single field addition to interface and optional updates to data collection

