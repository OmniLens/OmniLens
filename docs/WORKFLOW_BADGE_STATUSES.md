# Workflow Badge Statuses

This document outlines all possible statuses a workflow badge can have in the OmniLens application.

## Currently Implemented Badge Statuses

Based on the `WorkflowCard.tsx` component, the application currently displays the following badge statuses:

### 1. **Idle**
- **Condition**: `status === 'no_runs'`
- **Badge Variant**: `secondary`
- **Description**: Workflow exists but has no runs yet
- **Display**: Gray/secondary badge

### 2. **Pass**
- **Condition**: `conclusion === 'success'`
- **Badge Variant**: `success`
- **Description**: Workflow completed successfully
- **Display**: Green badge

### 3. **Running**
- **Condition**: `status === 'in_progress' || status === 'queued'`
- **Badge Variant**: `destructive` (with custom blue styling)
- **Description**: Workflow is currently executing or waiting in queue
- **Display**: Blue badge (custom className: `bg-blue-500 hover:bg-blue-600 text-white`)

### 4. **Fail**
- **Condition**: All other cases (default fallback)
- **Badge Variant**: `destructive`
- **Description**: Workflow failed or has an error state
- **Display**: Red badge

## GitHub Actions API Status Values

According to the GitHub Actions API, workflow runs can have the following status and conclusion values:

### Status Values (workflow run state)
- `queued` - Workflow is waiting to start
- `in_progress` - Workflow is currently running
- `completed` - Workflow has finished (requires a conclusion value)

### Conclusion Values (workflow run result)
- `success` - Workflow completed successfully
- `failure` - Workflow failed
- `neutral` - Workflow completed with neutral result
- `cancelled` - Workflow was cancelled
- `skipped` - Workflow was skipped
- `timed_out` - Workflow timed out
- `action_required` - Workflow requires manual action
- `null` - No conclusion (workflow is still running or queued)

## Status Mapping Logic

The current implementation uses this logic (from `WorkflowCard.tsx` lines 73-76):

```typescript
const status = run.conclusion ?? run.status;
const isSuccess = status === "success";
const isInProgress = status === "in_progress" || status === 'queued';
const hasNoRuns = status === 'no_runs';
```

### Current Status Resolution
1. Uses `conclusion` if available, otherwise falls back to `status`
2. Checks for success: `conclusion === 'success'`
3. Checks for in-progress: `status === 'in_progress' || status === 'queued'`
4. Checks for no runs: `status === 'no_runs'` (custom application state)
5. Everything else defaults to "Fail"

## Potential Additional Statuses (Not Currently Implemented)

Based on GitHub Actions API, the following statuses could be added:

### 5. **Cancelled**
- **Condition**: `conclusion === 'cancelled'`
- **Suggested Badge Variant**: `secondary` or custom `warning`
- **Description**: Workflow was cancelled before completion

### 6. **Skipped**
- **Condition**: `conclusion === 'skipped'`
- **Suggested Badge Variant**: `secondary`
- **Description**: Workflow was skipped (e.g., due to conditions not being met)

### 7. **Timed Out**
- **Condition**: `conclusion === 'timed_out'`
- **Suggested Badge Variant**: `destructive` or custom `warning`
- **Description**: Workflow exceeded its maximum execution time

### 8. **Action Required**
- **Condition**: `conclusion === 'action_required'`
- **Suggested Badge Variant**: `warning`
- **Description**: Workflow requires manual intervention

### 9. **Neutral**
- **Condition**: `conclusion === 'neutral'`
- **Suggested Badge Variant**: `secondary`
- **Description**: Workflow completed with a neutral result

## Badge Variants Available

From `components/ui/badge.tsx`, the following variants are available:

- `default` - Primary color
- `secondary` - Secondary/muted color
- `destructive` - Red/destructive color
- `success` - Green/success color
- `warning` - Yellow/warning color
- `outline` - Outlined style

## Individual Run Badge Statuses

In the popover showing all runs for a workflow (lines 148-159 of `WorkflowCard.tsx`), individual runs use the same logic:

- **Pass**: `conclusion === 'success'` → Green badge
- **Running**: `status === 'in_progress' || status === 'queued'` → Blue badge
- **Fail**: All other cases → Red badge

## Summary

**Currently Displayed Badge Statuses:**
1. Idle (no runs)
2. Pass (success)
3. Running (in_progress/queued)
4. Fail (all other cases)

**GitHub API Supports (but not currently differentiated):**
- Cancelled
- Skipped
- Timed Out
- Action Required
- Neutral

**Recommendation**: Consider adding explicit handling for cancelled, skipped, timed_out, action_required, and neutral conclusions to provide more granular status information to users.

