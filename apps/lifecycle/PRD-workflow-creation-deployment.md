# Product Design Requirements (PDR)
## Workflow Creation & Deployment Feature

**Document Version:** 1.0  
**Date:** February 15, 2026  
**Author:** OmniLens Product Team  
**Status:** Draft for Review

---

## Executive Summary

This PDR defines the requirements for enabling users to create and deploy GitHub Actions workflows directly from OmniLens. This feature addresses the critical problem where users add repositories without existing workflows, resulting in an empty dashboard with no data to display and immediate user churn.

**Key Objectives:**
- Enable users without workflows to create their first workflow in under 60 seconds
- Transform OmniLens from passive monitor to active CI/CD enabler
- Dramatically increase user activation and retention rates
- Provide educational value about GitHub Actions best practices

**Success Criteria:**
- 70%+ of users who encounter "no workflows" state attempt workflow creation
- 50%+ completion rate for workflow creation flow
- 30%+ of created workflows run successfully on first attempt
- Measurable increase in 7-day retention for users who create workflows

---

## Problem Area

### Current State

When users add repositories to OmniLens, they frequently encounter one of two scenarios:

1. **Repository has workflows:** Dashboard displays workflow runs, metrics, and insights → User experiences value
2. **Repository has no workflows:** Dashboard shows empty state with no data → User sees no value and churns

**Problem Metrics:**
- Estimated 60-70% of added repositories have no GitHub Actions workflows
- These users experience zero value from OmniLens
- No pathway to recovery - users hit a dead end
- Immediate churn with no opportunity to demonstrate product value

### Root Causes

1. **Market Reality:** Many solo developers haven't adopted GitHub Actions yet
2. **Knowledge Gap:** Users may not understand CI/CD or how to set up workflows
3. **Setup Friction:** Creating workflows manually requires:
   - Understanding YAML syntax
   - Knowing GitHub Actions patterns
   - Navigating to repository, creating directories, committing files
   - High cognitive load and time investment

### User Impact

**For users without workflows:**
- No dashboard data to view
- No metrics or insights to explore
- No value realization from OmniLens
- High likelihood of abandonment

**For OmniLens:**
- Low activation rate
- High early-stage churn
- Unable to demonstrate product value
- Negative word-of-mouth from frustrated users
- Reduced growth potential

### Business Impact

- **Activation:** Low percentage of sign-ups become active users
- **Retention:** Users who don't see value don't return
- **Growth:** Product can't achieve 1-5 DAU goal without solving this
- **Revenue:** Can't convert users who don't experience value
- **Market Perception:** Product appears incomplete or poorly designed

---

## Requirements

### Functional Requirements

#### FR1: Empty State Detection
**Priority:** P0 (Critical)

The system must detect when a repository has no GitHub Actions workflows and present a clear, actionable empty state.

**Acceptance Criteria:**
- System checks for `.github/workflows/` directory in repository
- If directory doesn't exist OR exists but contains no `.yml` or `.yaml` files, empty state is shown
- Empty state appears within 2 seconds of repository being added
- Empty state messaging is clear and action-oriented

**Implementation Details:**
- GitHub API: `GET /repos/{owner}/{repo}/contents/.github/workflows`
- Handle 404 (directory doesn't exist) vs 200 with empty array
- Cache result to avoid repeated API calls

---

#### FR2: User Permissions Request
**Priority:** P0 (Critical)

The system must request GitHub write permissions upfront during initial authentication to avoid permission issues during workflow deployment.

**Acceptance Criteria:**
- OAuth flow requests `repo` scope (write access to public repositories)
- Permission request happens during sign-in, before any repository operations
- Clear explanation of why write permissions are needed
- User can see what permissions are granted
- System handles permission denial gracefully

**Rationale (from open questions):**
- Avoids weird permission issues during workflow creation
- Reduces friction at deployment time
- Users have clear context about why permissions are needed
- Simplifies deployment flow

**Implementation Details:**
- Update GitHub OAuth scope from `public_repo` to `repo`
- Add permission explanation screen before OAuth redirect
- Store granted permissions in user session
- Handle users who initially declined and later want to create workflows

---

#### FR3: Framework & Package Manager Detection
**Priority:** P1 (High)

The system should automatically detect the programming language, framework, and package manager of the repository to recommend relevant workflow templates with correct configuration.

**Acceptance Criteria:**
- System scans repository root for framework indicator files
- System scans for package manager lockfiles
- Detection happens asynchronously after repository is added
- Results guide template recommendations and configuration
- Fallback to generic templates if no framework detected
- Detection completes within 5 seconds

**Detection Logic:**

| Framework Indicators | Package Manager Indicators | Recommended Templates |
|---------------------|----------------------------|---------------------|
| `package.json` | `bun.lockb` → bun | Node.js CI (bun), Build (bun) |
| `package.json` | `pnpm-lock.yaml` → pnpm | Node.js CI (pnpm), Build (pnpm) |
| `package.json` | `yarn.lock` → yarn | Node.js CI (yarn), Build (yarn) |
| `package.json` | `package-lock.json` → npm | Node.js CI (npm), Build (npm) |
| `package.json` | No lockfile → npm (default) | Node.js CI (npm), Build (npm) |
| `package.json` + `"react"` in deps | Any of above | + Vercel deploy |

**Critical for Node.js:**
Package manager detection is mandatory for Node.js templates. Without detecting the correct package manager (npm/yarn/pnpm/bun), workflows will fail. This is a P0 requirement for Node.js support.

**Implementation Details:**
- GitHub API: `GET /repos/{owner}/{repo}/contents/` for root files
- Check for lockfiles in parallel: `bun.lockb`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`
- `GET /repos/{owner}/{repo}/contents/package.json` to check dependencies
- Priority order if multiple lockfiles exist: bun > pnpm > yarn > npm
- Framework and package manager detection stored in database for future reference
- Templates pre-configured with detected package manager

---

#### FR4: Workflow Template Selection
**Priority:** P0 (Critical)

Users must be able to choose from a curated library of pre-built workflow templates appropriate for their project.

**Acceptance Criteria:**
- Template library includes **minimum 4 templates (MVP)** - one per category:
  - **Testing:** Node.js CI with multi-package-manager support
  - **Build:** Node.js Build workflow
  - **Deploy:** Vercel Deployment
  - **Quality:** ESLint/Prettier Code Quality
- Node.js templates MUST support all major package managers:
  - npm (default)
  - yarn
  - pnpm
  - bun
- Package manager detection happens automatically based on lockfile presence
- Templates are organized by category (Testing, Build, Deploy, Quality)
- Each template includes:
  - Clear name and description
  - "What it does" explanation
  - Trigger conditions (when it runs)
  - Expected prerequisites (e.g., "requires test script in package.json")
  - Package manager compatibility notes
- Framework-detected templates appear at top of list
- Templates load within 1 second

**Critical Requirement:**
Without multi-package-manager support, OmniLens is "dead in the water" for Node.js developers. The templates must intelligently detect and use the correct package manager.

**Package Manager Detection Logic:**
```
Check for lockfiles in repository root:
- bun.lockb → Use bun
- pnpm-lock.yaml → Use pnpm
- yarn.lock → Use yarn
- package-lock.json → Use npm
- No lockfile → Default to npm with warning
```

**Template Structure:**
```json
{
  "id": "nodejs-ci",
  "name": "Node.js CI",
  "category": "testing",
  "description": "Run tests with automatic package manager detection",
  "frameworks": ["nodejs", "react", "vue", "nextjs"],
  "package_managers": ["npm", "yarn", "pnpm", "bun"],
  "prerequisites": ["test script in package.json"],
  "triggers": ["push", "pull_request"],
  "file_name": "ci.yml",
  "yaml_content": "...",
  "icon": "test-tube"
}
```

**Future Monetization Opportunity:**
Template packs (e.g., "Advanced Node.js Pack", "Full-Stack Deploy Pack") can be sold as premium add-ons. MVP provides core free templates; paid packs offer specialized workflows.

---

#### FR5: Workflow Preview
**Priority:** P0 (Critical)

Users must be able to preview the exact workflow file that will be created before deploying it to their repository.

**Acceptance Criteria:**
- Preview shows complete YAML file with syntax highlighting
- Preview includes inline explanations of what each section does
- Preview is read-only (no editing in MVP based on open questions)
- Users can switch between different templates from preview
- Preview displays estimated file path: `.github/workflows/{filename}.yml`
- "What this workflow does" summary displayed above YAML
- "When it runs" trigger explanation clearly visible

**Preview Layout:**
```
┌─────────────────────────────────────────────┐
│  Node.js CI Workflow                        │
│  ────────────────────────────────────────   │
│                                             │
│  📋 What this does:                        │
│  Runs your test suite on every push and    │
│  pull request to ensure code quality       │
│                                             │
│  ⚡ When it runs:                          │
│  • On every push to any branch             │
│  • On every pull request                   │
│                                             │
│  📄 File will be created at:               │
│  .github/workflows/ci.yml                  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ name: Node.js CI                    │  │
│  │ on: [push, pull_request]            │  │
│  │ jobs:                               │  │
│  │   test:                             │  │
│  │     runs-on: ubuntu-latest          │  │
│  │     ...                             │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  [Choose Different Template]  [Deploy]     │
└─────────────────────────────────────────────┘
```

---

#### FR6: Pull Request Creation
**Priority:** P0 (Critical)

The system must create a pull request (PR) containing the workflow file rather than committing directly to the default branch.

**Acceptance Criteria:**
- System creates a new branch with naming pattern: `omnilens/add-{workflow-name}-workflow`
- Workflow file is committed to new branch
- Pull request is created from new branch to default branch
- PR title: "Add {Workflow Name} workflow"
- PR body includes:
  - Description of what the workflow does
  - Link to OmniLens documentation about the workflow
  - Instructions for user to review and merge
- PR is created with OmniLens as the author (via GitHub token)
- User is redirected to PR URL on GitHub for review
- System provides link back to OmniLens dashboard

**Rationale (from open questions):**
- Users must review workflows before they run
- No blind acceptance of auto-generated code
- Follows GitHub best practices
- Provides safety and transparency
- Allows users to make modifications before merging

**PR Body Template:**
```markdown
# 🤖 OmniLens: Add {Workflow Name}

This pull request adds a GitHub Actions workflow created through OmniLens.

## What this workflow does

{Template description}

## When it runs

{Trigger conditions}

## Next Steps

1. **Review the workflow file** to ensure it matches your project structure
2. **Make any necessary adjustments** (test commands, dependencies, etc.)
3. **Merge this PR** to activate the workflow
4. **Return to OmniLens** to start monitoring your workflow runs

[View in OmniLens]({omnilens_dashboard_url})

---

*Created by [OmniLens](https://omnilens.xyz) - Monitor, analyze, and optimize your GitHub workflows*
```

**Implementation Details:**
- GitHub API: 
  - `GET /repos/{owner}/{repo}` to get default branch
  - `POST /repos/{owner}/{repo}/git/refs` to create branch
  - `PUT /repos/{owner}/{repo}/contents/{path}` to create file
  - `POST /repos/{owner}/{repo}/pulls` to create PR
- Error handling for branch name conflicts (append timestamp if needed)
- Store PR URL in database for tracking

---

#### FR7: Manual Workflow Trigger
**Priority:** P1 (High)

After the PR is merged, users should be able to manually trigger the workflow immediately from OmniLens.

**Acceptance Criteria:**
- "Trigger Workflow Now" button appears after PR is merged
- Button calls GitHub workflow dispatch API
- User receives confirmation that workflow was triggered
- Link to view workflow run on GitHub
- Button is disabled while workflow is running
- Appropriate error messaging if trigger fails

**Rationale (from open questions):**
- Provides immediate value after workflow creation
- Users don't have to wait for natural trigger (push/PR)
- Validates that workflow works correctly
- Closes the loop on the creation experience

**Implementation Details:**
- GitHub API: `POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`
- Requires workflow to have `workflow_dispatch` trigger
- Templates must include this trigger by default
- Poll for workflow run status after triggering

---

#### FR8: Success State & Dashboard Refresh
**Priority:** P0 (Critical)

After the workflow is created and optionally triggered, the dashboard must update to show the new workflow.

**Acceptance Criteria:**
- Dashboard automatically refreshes after PR creation
- New workflow appears in workflow list (even if not run yet)
- If workflow is triggered, run appears in dashboard within 10 seconds
- Clear success messaging: "Workflow created successfully!"
- CTA to view PR on GitHub
- CTA to return to dashboard
- Empty state is replaced with actual workflow data

**Success State UI:**
```
┌─────────────────────────────────────────────┐
│  ✅ Workflow Created Successfully!          │
│                                             │
│  Your Node.js CI workflow has been added   │
│  to your repository via pull request.      │
│                                             │
│  Next steps:                               │
│  1. Review the PR on GitHub                │
│  2. Merge the PR to activate the workflow  │
│  3. Come back to see your workflow runs    │
│                                             │
│  [View PR on GitHub]  [Back to Dashboard]  │
└─────────────────────────────────────────────┘
```

---

#### FR9: Error Handling
**Priority:** P0 (Critical)

The system must gracefully handle all failure scenarios with clear, actionable error messages.

**Error Scenarios:**

**E1: Insufficient Permissions**
- User hasn't granted write permissions
- Error: "We need permission to create files in your repository"
- Action: "Grant permissions" button that re-initiates OAuth

**E2: Branch Already Exists**
- Branch name collision
- Error: "A workflow with this name already exists"
- Action: Offer to try different name or view existing

**E3: File Creation Failed**
- GitHub API error during file creation
- Error: "Unable to create workflow file. Please try again."
- Action: Retry button, link to support

**E4: PR Creation Failed**
- Branch created but PR failed
- Error: "Workflow file created but PR failed. View branch on GitHub."
- Action: Link to branch, retry PR creation

**E5: Workflow Trigger Failed**
- PR merged but manual trigger failed
- Error: "Workflow created but trigger failed. It will run on next push."
- Action: Link to workflow on GitHub

**E6: Framework Detection Timeout**
- Detection takes >5 seconds
- Behavior: Show generic templates, continue detection in background
- No user-facing error

**E7: Template Loading Failed**
- Template library can't be loaded
- Error: "Unable to load templates. Please refresh."
- Action: Refresh button

**General Error Handling:**
- All errors logged for debugging
- User-friendly error messages (no technical jargon)
- Clear next steps for user
- Support contact option
- Retry mechanisms where appropriate

---

### Non-Functional Requirements

#### NFR1: Performance
**Priority:** P0 (Critical)

- Empty state detection: < 2 seconds
- Framework detection: < 5 seconds
- Template list loading: < 1 second
- Workflow preview rendering: < 500ms
- PR creation: < 10 seconds (excluding GitHub API)
- Dashboard refresh: < 3 seconds

#### NFR2: Reliability
**Priority:** P0 (Critical)

- 99% success rate for PR creation (excluding user errors)
- Graceful degradation if GitHub API is slow/unavailable
- No data loss during workflow creation process
- Idempotent operations (safe to retry)

#### NFR3: Security
**Priority:** P0 (Critical)

- All GitHub API calls use user's OAuth token (no global token)
- Tokens never logged or exposed in error messages
- YAML templates sanitized (no code injection)
- Rate limiting to prevent abuse
- PR author correctly attributed to OmniLens, not impersonating user

#### NFR4: Usability
**Priority:** P1 (High)

- Workflow creation flow completable in < 60 seconds
- Mobile-responsive UI
- Keyboard navigation support
- Clear progress indicators at each step
- Contextual help tooltips
- Accessible (WCAG 2.1 AA standards)

#### NFR5: Observability
**Priority:** P1 (High)

- All workflow creations logged with:
  - User ID
  - Repository
  - Template used
  - Success/failure status
  - Error details if failed
- Analytics events:
  - Empty state shown
  - Template selected
  - Preview viewed
  - Deployment initiated
  - PR created successfully
  - PR creation failed
  - Workflow triggered

#### NFR6: Maintainability
**Priority:** P1 (High)

- Template library stored as JSON (easy to add new templates)
- YAML templates version controlled
- Template metadata clearly documented
- Easy to update individual templates without code changes
- Test coverage for workflow creation flow

---

### Out of Scope

The following features are explicitly **not** included in the MVP but may be considered for future iterations:

#### OS1: Custom Workflow Editing
- In-line YAML editing within preview
- Visual workflow builder/designer
- Custom workflow creation from scratch

**Rationale:** MVP focuses on pre-built templates to reduce complexity and ensure quality. Custom editing can be added later based on user demand.

#### OS2: Workflow Template Marketplace
- Community-submitted templates
- Template ratings and reviews
- Template versioning and updates
- Template search and filtering

**Rationale:** Requires moderation infrastructure and governance. Focus MVP on curated, high-quality templates maintained by OmniLens.

#### OS3: Multi-Workflow Deployment
- Batch creation of multiple workflows at once
- Workflow dependencies and orchestration
- Pre-configured workflow sets for common scenarios

**Rationale:** Adds significant UI and API complexity. Most users need to start with one workflow.

#### OS4: Advanced Framework Detection
- Deep dependency analysis (e.g., detecting testing frameworks)
- Detection of CI/CD patterns already in use
- Migration from other CI systems (Jenkins, CircleCI, etc.)

**Rationale:** Basic framework detection is sufficient for MVP. Advanced detection can come later.

#### OS5: Workflow Validation & Testing
- Syntax validation before PR creation
- Dry-run simulation of workflow
- Workflow testing in isolated environment
- Breaking change detection

**Rationale:** GitHub Actions itself validates workflows. Adding pre-validation increases complexity without proportional value.

#### OS6: AI-Powered Workflow Generation
- Natural language workflow descriptions
- AI suggests optimizations for existing workflows
- Failure prediction and auto-healing

**Rationale:** Part of future agentic strategy, not MVP requirement.

#### OS7: Integration with CI/CD Platforms
- Import workflows from other platforms
- Export OmniLens workflows to other systems
- Cross-platform workflow compatibility

**Rationale:** OmniLens is GitHub Actions-specific in MVP.

#### OS8: Team Collaboration Features
- Workflow approval workflows
- Template sharing between team members
- Collaborative workflow editing

**Rationale:** MVP targets solo developers. Team features are future considerations.

---

## Solution

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                     │
│                                                              │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Empty State  │  │   Template   │  │    Preview &    │ │
│  │   Detection   │─▶│   Selection  │─▶│  Confirmation   │ │
│  └───────────────┘  └──────────────┘  └─────────────────┘ │
│                                               │              │
└───────────────────────────────────────────────┼──────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Next.js API Routes)            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Workflow Creation Service                     │  │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │  │
│  │  │   Framework    │  │   Template Library        │   │  │
│  │  │   Detector     │  │   Manager                 │   │  │
│  │  └────────────────┘  └──────────────────────────┘   │  │
│  │                                                       │  │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │  │
│  │  │   GitHub API   │  │   Deployment Engine       │   │  │
│  │  │   Client       │  │   (PR Creation)           │   │  │
│  │  └────────────────┘  └──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Analytics & Logging Service              │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────────────────┬──────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │   GitHub API     │  │   PostgreSQL Database         │    │
│  │   (v3 REST)      │  │   (Template & Analytics)      │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Details

#### 1. Empty State Detection Component

**Location:** Frontend (`components/EmptyWorkflowState.tsx`)

**Responsibilities:**
- Displays when repository has no workflows
- Provides clear messaging about workflows and their benefits
- CTA button to start workflow creation
- Educational content about GitHub Actions

**Props:**
```typescript
interface EmptyWorkflowStateProps {
  repoSlug: string;
  repoPath: string;
  onCreateWorkflow: () => void;
}
```

#### 2. Framework Detection Service

**Location:** Backend (`services/framework-detector.ts`)

**Responsibilities:**
- Scans repository for framework indicator files
- Returns detected frameworks with confidence scores
- Caches results to avoid repeated API calls

**API:**
```typescript
interface FrameworkDetectionResult {
  frameworks: string[];  // e.g., ["nodejs", "react"]
  confidence: number;     // 0-1
  indicators: {
    file: string;
    framework: string;
  }[];
}

async function detectFramework(
  owner: string,
  repo: string,
  githubToken: string
): Promise<FrameworkDetectionResult>
```

#### 3. Template Library Manager

**Location:** Backend (`data/workflow-templates.json` + `services/template-manager.ts`)

**Template Storage:**
```json
{
  "templates": [
    {
      "id": "nodejs-ci",
      "name": "Node.js CI",
      "category": "testing",
      "description": "Run tests on every push and pull request",
      "frameworks": ["nodejs"],
      "prerequisites": ["npm test script"],
      "triggers": ["push", "pull_request"],
      "fileName": "ci.yml",
      "yamlContent": "...",
      "explanations": {
        "what": "Runs your test suite automatically",
        "when": "On every push and pull request",
        "expects": "A test command in package.json"
      }
    }
  ]
}
```

**API:**
```typescript
interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  frameworks: string[];
  prerequisites: string[];
  triggers: string[];
  fileName: string;
  yamlContent: string;
  explanations: {
    what: string;
    when: string;
    expects: string;
  };
}

class TemplateManager {
  getTemplates(framework?: string): WorkflowTemplate[];
  getTemplate(id: string): WorkflowTemplate | null;
  renderTemplate(id: string, context: object): string;
}
```

#### 4. Deployment Engine

**Location:** Backend (`services/workflow-deployer.ts`)

**Responsibilities:**
- Creates branch
- Commits workflow file
- Creates pull request
- Handles errors and retries

**API:**
```typescript
interface DeploymentResult {
  success: boolean;
  branchName: string;
  prUrl: string;
  prNumber: number;
  error?: string;
}

async function deployWorkflow(
  owner: string,
  repo: string,
  template: WorkflowTemplate,
  githubToken: string
): Promise<DeploymentResult>
```

**Implementation Steps:**
1. Get default branch: `GET /repos/{owner}/{repo}`
2. Get latest commit SHA: `GET /repos/{owner}/{repo}/git/ref/heads/{default_branch}`
3. Create new branch: `POST /repos/{owner}/{repo}/git/refs`
4. Create workflow file: `PUT /repos/{owner}/{repo}/contents/.github/workflows/{filename}`
5. Create pull request: `POST /repos/{owner}/{repo}/pulls`
6. Return PR URL and details

#### 5. Analytics & Logging Service

**Location:** Backend (`services/analytics.ts`)

**Events to Track:**
- `workflow_empty_state_shown`
- `workflow_template_selected`
- `workflow_preview_viewed`
- `workflow_deployment_started`
- `workflow_pr_created`
- `workflow_pr_creation_failed`
- `workflow_triggered_manually`

**Database Schema:**
```sql
CREATE TABLE workflow_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  repo_slug TEXT NOT NULL,
  template_id TEXT NOT NULL,
  framework_detected TEXT,
  pr_url TEXT,
  pr_number INTEGER,
  branch_name TEXT,
  status TEXT NOT NULL,  -- 'pending', 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE workflow_deployment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID REFERENCES workflow_deployments(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### User Flow Implementation

**Step 1: Empty State Detection**
```
User adds repository → Repository validated
→ System checks for workflows
→ No workflows found
→ Empty state component renders
→ Event logged: workflow_empty_state_shown
```

**Step 2: Framework Detection (Background)**
```
Repository added → Framework detection starts asynchronously
→ Scans for indicator files
→ Results cached in database
→ Results used for template recommendations
```

**Step 3: Template Selection**
```
User clicks "Create Workflow"
→ Modal/page opens with template list
→ Templates filtered by detected framework (if any)
→ User views template options
→ Event logged: workflow_template_selected
```

**Step 4: Preview**
```
User selects template
→ Preview component renders
→ Shows YAML with syntax highlighting
→ Shows explanations
→ Shows file path
→ Event logged: workflow_preview_viewed
```

**Step 5: Deployment**
```
User clicks "Deploy"
→ Event logged: workflow_deployment_started
→ Permission check (has repo scope?)
→ If no: Redirect to OAuth
→ If yes: Continue

→ Generate branch name
→ Create branch via GitHub API
→ Commit workflow file
→ Create pull request
→ Event logged: workflow_pr_created

→ Success state shown
→ Link to PR
→ Link back to dashboard
```

**Step 6: Post-Deployment**
```
User views PR on GitHub
→ Reviews workflow
→ Merges PR (outside OmniLens)
→ Returns to OmniLens

→ Dashboard auto-refreshes
→ New workflow appears
→ Option to trigger manually appears
→ Event logged: workflow_triggered_manually (if triggered)
```

### API Endpoints

```
POST /api/workflow/detect-framework
Request: { repoSlug: string }
Response: { frameworks: string[], confidence: number }

GET /api/workflow/templates
Query: ?framework=nodejs
Response: { templates: WorkflowTemplate[] }

GET /api/workflow/templates/:id
Response: { template: WorkflowTemplate }

POST /api/workflow/deploy
Request: {
  repoSlug: string,
  templateId: string
}
Response: {
  success: boolean,
  prUrl: string,
  prNumber: number,
  branchName: string
}

POST /api/workflow/trigger
Request: {
  repoSlug: string,
  workflowId: string
}
Response: {
  success: boolean,
  runUrl: string
}
```

### Database Schema Updates

```sql
-- Store framework detection results
CREATE TABLE repository_frameworks (
  repo_slug TEXT PRIMARY KEY,
  frameworks TEXT[] NOT NULL,
  confidence DECIMAL(3,2),
  indicators JSONB,
  detected_at TIMESTAMP DEFAULT NOW()
);

-- Track workflow deployments
CREATE TABLE workflow_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  repo_slug TEXT NOT NULL,
  template_id TEXT NOT NULL,
  framework_detected TEXT,
  pr_url TEXT,
  pr_number INTEGER,
  branch_name TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Track workflow deployment analytics
CREATE TABLE workflow_deployment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID REFERENCES workflow_deployments(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deployments_user_id ON workflow_deployments(user_id);
CREATE INDEX idx_deployments_repo_slug ON workflow_deployments(repo_slug);
CREATE INDEX idx_deployments_status ON workflow_deployments(status);
CREATE INDEX idx_deployment_events_type ON workflow_deployment_events(event_type);
```

---

## Success Metrics

### Primary Metrics

**Activation Metrics:**
- **Workflow Creation Attempt Rate:** % of users who see empty state and click "Create Workflow"
  - Target: 70%+
- **Workflow Creation Completion Rate:** % of users who start creation and successfully create PR
  - Target: 50%+
- **First Workflow Success Rate:** % of created workflows that run successfully on first attempt
  - Target: 30%+

**Engagement Metrics:**
- **7-Day Retention (With Workflow):** % of users who create workflows and return within 7 days
  - Target: 40%+
- **7-Day Retention (Without Workflow):** % of users who don't create workflows and return within 7 days
  - Baseline: ~5% (current estimate)
- **Retention Lift:** Percentage point increase in retention for workflow creators
  - Target: +35 percentage points

**Conversion Metrics:**
- **Activation Rate:** % of signups who become active users (add repo + have workflow data)
  - Current estimate: 30-40%
  - Target: 60%+

### Secondary Metrics

**Template Adoption:**
- Most popular templates
- Template success rate (% that run successfully)
- Template modification rate (% of PRs modified before merge)

**User Behavior:**
- Time from signup to workflow creation
- Number of templates previewed before selection
- PR review time (time from PR creation to merge)
- Manual trigger adoption rate

**Technical Performance:**
- API success rates for each step
- Average deployment time
- Error rates by type
- Framework detection accuracy

### Business Impact Metrics

**DAU Goal Progress:**
- Daily active users
- Weekly active users
- Monthly active users
- Path to 1-5 DAU goal

**Qualitative Feedback:**
- User satisfaction surveys
- Feature request themes
- Support ticket reduction
- User testimonials

---
# Website Update Section for PDR

**Section:** Marketing & Launch Preparation  
**Location in Document:** After Success Metrics, before Timeline & Milestones

---

## Website Updates for Workflow Creation Launch

### Overview

The workflow creation feature transforms OmniLens from a passive monitoring tool into an active CI/CD enabler. The website must reflect this expanded value proposition to attract users who don't have workflows yet.

**Current website messaging:** "Visualizing and tracking GitHub Actions workflow health"  
**Problem:** Implies users must already have workflows  
**Solution:** Add new section highlighting workflow creation capability

---

## New Website Section: "From Zero to CI/CD"

### Placement
Insert between **"Core Capabilities"** and **"Start Monitoring Your Workflows"**

### Purpose
- Address the "no workflows" user segment (60-70% of potential users)
- Position OmniLens as CI/CD enabler, not just monitor
- Reduce perceived setup friction
- Increase conversion by expanding addressable market

---

## Section Design Spec

### Section Title
```
From Zero to CI/CD in 60 Seconds
```

**Alternative titles:**
- "No Workflows Yet? We've Got You Covered"
- "Start Your CI/CD Journey Today"
- "Build Your First Workflow"

### Hero Copy

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## From Zero to CI/CD in 60 Seconds

Don't have GitHub Actions workflows yet? No problem.
OmniLens helps you create your first workflow with 
pre-built templates for testing, building, and deploying.

[Create Your First Workflow]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Visual Design Concept

### Layout: Three-Column Feature Grid

```
┌─────────────────────────────────────────────────────────┐
│          From Zero to CI/CD in 60 Seconds               │
│                                                         │
│   Don't have GitHub Actions workflows yet? No problem.  │
│   OmniLens helps you create your first workflow with    │
│   pre-built templates for testing, building, deploying. │
│                                                         │
│         [Create Your First Workflow →]                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐      │
│  │           │    │           │    │           │      │
│  │     1     │    │     2     │    │     3     │      │
│  │  Choose   │ ─→ │  Preview  │ ─→ │  Deploy   │      │
│  │ Template  │    │ Workflow  │    │    via    │      │
│  │           │    │           │    │     PR    │      │
│  └───────────┘    └───────────┘    └───────────┘      │
│                                                         │
│  Pick from pre-    See exactly       Review and        │
│  built templates   what you're       activate with     │
│  for Node.js,      creating before   a single merge.   │
│  testing, deploy   deploying         No manual setup.  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Design Details

**Visual Style:**
- Clean, modern, approachable
- Use OmniLens brand colors (blues/purples from logo)
- Subtle gradient background for this section
- Icons for each step (template icon, preview icon, PR icon)

**Step Cards:**
- Equal width, centered
- Subtle shadow or border
- Icon at top
- Number badge (1, 2, 3)
- Short title (2-3 words)
- Description text (1-2 sentences)
- Arrow connectors between cards

---

## Detailed Copy for Each Step

### Step 1: Choose Template

**Icon:** 📋 or template/grid icon  
**Number Badge:** 1

**Title:**
```
Choose Template
```

**Body Copy:**
```
Pick from pre-built templates for Node.js 
testing, building, deployment, and code quality. 
Supports npm, yarn, pnpm, and bun.
```

**Alternative Copy:**
- "Select from battle-tested workflow templates"
- "Start with proven CI/CD patterns"
- "Pick a template that matches your stack"

---

### Step 2: Preview Workflow

**Icon:** 👁️ or eye/preview icon  
**Number Badge:** 2

**Title:**
```
Preview Workflow
```

**Body Copy:**
```
See exactly what you're creating before 
deploying. Preview the complete workflow 
file with inline explanations.
```

**Alternative Copy:**
- "Review before you deploy"
- "See what's getting added to your repo"
- "Understand every step before committing"

---

### Step 3: Deploy via PR

**Icon:** ✓ or checkmark/merge icon  
**Number Badge:** 3

**Title:**
```
Deploy via PR
```

**Body Copy:**
```
Review and activate with a single merge. 
We create a pull request—you stay in control. 
No blind automation.
```

**Alternative Copy:**
- "Merge when you're ready"
- "Deploy safely with pull requests"
- "Review, approve, activate"

---

## Supporting Elements

### Template Preview Cards (Below Steps)

Show 4 template cards horizontally:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Popular Templates:                                  │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │ 🧪      │  │ 🏗️      │  │ 🚀      │  │ ✨      ││
│  │         │  │         │  │         │  │         ││
│  │ Node.js │  │ Build & │  │ Deploy  │  │  Code   ││
│  │   CI    │  │ Package │  │ Vercel  │  │ Quality ││
│  │         │  │         │  │         │  │         ││
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘│
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Each card:**
- Icon/emoji
- Template name
- Hover: Show "View Template" tooltip
- Click: Opens modal with template preview (future enhancement)

---

## Alternative Design: Visual Workflow Builder Preview

Instead of 3 steps, show an animated or static screenshot:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│       From Zero to CI/CD in 60 Seconds              │
│                                                     │
│   Don't have workflows yet? We'll create one for    │
│   you based on your project. Just review and merge. │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  │   [Screenshot/Animation of Template Select] │  │
│  │                                              │  │
│  │   - Template selection UI                   │  │
│  │   - Preview pane with YAML                  │  │
│  │   - Deploy button                           │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│         [Create Your First Workflow →]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Pros:**
- Shows actual product
- More engaging than text
- Builds confidence

**Cons:**
- Requires screenshot/animation work
- May not work well on mobile
- Needs updating if UI changes

**Recommendation:** Start with 3-step cards (easier to implement), add screenshot later as enhancement

---

## Technical Implementation

### HTML Structure

```html
<section class="workflow-creation-section">
  <div class="container">
    <!-- Hero -->
    <div class="section-header">
      <h2>From Zero to CI/CD in 60 Seconds</h2>
      <p class="subtitle">
        Don't have GitHub Actions workflows yet? No problem.
        OmniLens helps you create your first workflow with 
        pre-built templates for testing, building, and deploying.
      </p>
      <a href="/login" class="cta-button">
        Create Your First Workflow →
      </a>
    </div>

    <!-- Steps -->
    <div class="steps-grid">
      <div class="step-card">
        <div class="step-number">1</div>
        <div class="step-icon">📋</div>
        <h3>Choose Template</h3>
        <p>
          Pick from pre-built templates for Node.js 
          testing, building, deployment, and code quality. 
          Supports npm, yarn, pnpm, and bun.
        </p>
      </div>

      <div class="step-connector">→</div>

      <div class="step-card">
        <div class="step-number">2</div>
        <div class="step-icon">👁️</div>
        <h3>Preview Workflow</h3>
        <p>
          See exactly what you're creating before 
          deploying. Preview the complete workflow 
          file with inline explanations.
        </p>
      </div>

      <div class="step-connector">→</div>

      <div class="step-card">
        <div class="step-number">3</div>
        <div class="step-icon">✓</div>
        <h3>Deploy via PR</h3>
        <p>
          Review and activate with a single merge. 
          We create a pull request—you stay in control. 
          No blind automation.
        </p>
      </div>
    </div>

    <!-- Template Preview Cards -->
    <div class="template-preview">
      <h4>Popular Templates:</h4>
      <div class="template-cards">
        <div class="template-card">
          <span class="template-icon">🧪</span>
          <span class="template-name">Node.js CI</span>
        </div>
        <div class="template-card">
          <span class="template-icon">🏗️</span>
          <span class="template-name">Build & Package</span>
        </div>
        <div class="template-card">
          <span class="template-icon">🚀</span>
          <span class="template-name">Deploy to Vercel</span>
        </div>
        <div class="template-card">
          <span class="template-icon">✨</span>
          <span class="template-name">Code Quality</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

### CSS/Styling Notes

```css
.workflow-creation-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 20px;
  margin: 60px 0;
}

.section-header {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 60px;
}

.steps-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 20px;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.step-card {
  background: white;
  color: #333;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
}

.step-connector {
  font-size: 32px;
  color: white;
  opacity: 0.6;
}

.template-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  max-width: 800px;
  margin: 30px auto 0;
}

/* Responsive */
@media (max-width: 768px) {
  .steps-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .step-connector {
    transform: rotate(90deg);
  }
  
  .template-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## Content Hierarchy & Flow

**Updated Website Structure:**

1. **Hero Section** (Existing)
   - "An open-source platform for visualizing and tracking GitHub Actions workflow health"
   - Get Started CTA

2. **Core Capabilities** (Existing)
   - Repository Management
   - Signal Ingestion
   - Metrics & State Visualization

3. **🆕 From Zero to CI/CD** (NEW SECTION)
   - Workflow creation capability
   - 3-step process
   - Template preview cards

4. **Start Monitoring Your Workflows** (Existing)
   - Final CTA
   - Sign up flow

**Rationale for Placement:**
- After Core Capabilities: Shows what OmniLens can do, then shows how easy it is to start
- Before final CTA: Removes objections ("I don't have workflows yet") right before asking for signup
- Logical flow: What → How → Action

---

## Copy Variations for A/B Testing

### Variation A: Benefit-Focused
```
## Skip the YAML Learning Curve

Create production-ready workflows without writing a single line of code.
Choose from battle-tested templates and start monitoring in minutes.
```

### Variation B: Problem-Focused
```
## No Workflows? No Problem.

60% of repos don't have CI/CD yet. OmniLens makes it 
ridiculously easy to get started with pre-built templates.
```

### Variation C: Time-Focused
```
## From Signup to First Workflow in 60 Seconds

Connect GitHub. Pick a template. Deploy via PR.
The fastest way to add CI/CD to your project.
```

**Recommendation:** Start with "From Zero to CI/CD in 60 Seconds" (clear benefit + time claim), A/B test others later.

---

## Social Proof Elements (Optional Enhancement)

Add below the template cards:

```
┌────────────────────────────────────────────┐
│  "Finally, a tool that doesn't assume      │
│   I already have everything set up."       │
│                                            │
│   — Alex K., Solo Developer                │
└────────────────────────────────────────────┘
```

Or show statistics:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1,200+              500+              98%
 Workflows          Templates         Success
  Created            Deployed          Rate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Note:** Only add if we have real data to back these claims. Don't fake numbers.

---

## Mobile Responsiveness

**Desktop (>768px):**
- 3 columns for step cards
- Horizontal arrow connectors
- 4 template preview cards in a row

**Tablet (768px-1024px):**
- 3 columns but smaller cards
- Smaller font sizes
- 2x2 grid for template cards

**Mobile (<768px):**
- Single column stack
- Vertical arrow connectors (rotated 90°)
- 2x2 grid for template cards
- Larger touch targets for CTA button

---

## Animation & Interactions (Optional)

### On Scroll Animation
- Fade in section header
- Stagger reveal step cards (1 → 2 → 3)
- Fade in template cards

### Hover States
- Step cards: Subtle lift + shadow increase
- Template cards: Border glow or scale up slightly
- CTA button: Background color shift

### Click Interactions
- CTA button: Smooth navigation to /login
- Template cards: Could open modal with full preview (Phase 2)

---

## SEO & Accessibility

### SEO Considerations
**Keywords to include:**
- "Create GitHub Actions workflow"
- "CI/CD templates"
- "GitHub Actions for beginners"
- "Automated testing workflow"

**Meta Description Update:**
```
OmniLens helps you create and monitor GitHub Actions workflows. 
Pre-built templates for testing, building, and deploying. 
No YAML experience required. Get started in 60 seconds.
```

### Accessibility
- Semantic HTML (h2, h3 for headers)
- Alt text for any images/icons
- Sufficient color contrast (WCAG AA)
- Keyboard navigation support
- Screen reader friendly descriptions

---

## Implementation Checklist

### Design Phase
- [ ] Finalize copy variations
- [ ] Create high-fidelity mockups (desktop + mobile)
- [ ] Get stakeholder approval on design
- [ ] Prepare icon assets (SVG preferred)

### Development Phase
- [ ] Implement HTML structure
- [ ] Add CSS styling
- [ ] Add responsive breakpoints
- [ ] Implement animations (if included)
- [ ] Test on multiple devices/browsers

### Content Phase
- [ ] Write final copy
- [ ] Create/source icons
- [ ] Add tracking events (section views, CTA clicks)
- [ ] Update meta tags and descriptions

### Launch Phase
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Performance testing
- [ ] Deploy to production
- [ ] Monitor analytics

---

## Success Metrics for Website Update

### Primary Metrics
- **Section Engagement:** % of visitors who scroll to this section
- **CTA Click Rate:** % who click "Create Your First Workflow"
- **Conversion Lift:** Increase in signup rate after adding section

### Secondary Metrics
- **Time on Page:** Increase in average session duration
- **Bounce Rate:** Decrease in bounce rate
- **Template Card Interactions:** Hover/click events on template cards

### Targets
- 60%+ of visitors scroll to this section
- 15-20% CTA click rate from this section
- 5-10% lift in overall conversion rate

---

## Future Enhancements

### Phase 2 (Post-MVP)
- Interactive template preview modal
- Animated workflow creation demo
- Video walkthrough
- Customer testimonials/case studies

### Phase 3 (Scale)
- Personalized template recommendations
- "Most popular" badge on templates
- Filter templates by framework
- Search functionality

---

## Summary

**What to Build:**
A new website section between "Core Capabilities" and "Start Monitoring Your Workflows" that:

1. **Explains workflow creation** in 3 simple steps
2. **Shows template options** with preview cards
3. **Removes friction** for users without workflows
4. **Drives conversions** with clear CTA

**Key Message:**
"You don't need to have workflows to use OmniLens—we'll help you create them."

**Visual Approach:**
Clean, modern 3-step process with template preview cards. Gradient background to differentiate from other sections.

**Implementation Priority:**
Should be deployed BEFORE or ALONGSIDE the workflow creation feature launch to maximize conversion of new users who land on the homepage.

---

*This section transforms the website from "for users with workflows" to "for anyone who wants workflows," significantly expanding the addressable market.*
-e 
---


## Timeline & Milestones

### MVP Development: 3 Weeks

**Week 1: Core Infrastructure**
- Day 1-2: Database schema updates and migrations
- Day 2-3: Framework detection service
- Day 3-4: Template library setup (6 templates)
- Day 4-5: GitHub API client improvements (PR creation)

**Week 2: UI & Integration**
- Day 1-2: Empty state component
- Day 2-3: Template selection modal/page
- Day 3-4: Preview component with syntax highlighting
- Day 4-5: Deployment flow integration

**Week 3: Testing & Polish**
- Day 1-2: End-to-end testing
- Day 2-3: Error handling and edge cases
- Day 3-4: Analytics integration
- Day 4-5: Documentation and launch prep

### Post-MVP Iterations

**Month 2: Enhancement & Expansion**
- Additional workflow templates (expand to 15+)
- Template quality improvements based on feedback
- UI/UX refinements
- Performance optimizations

**Month 3: Advanced Features**
- Workflow triggering from dashboard
- Template categories and search
- Custom template recommendations
- A/B testing for template variations

---

## Risks & Mitigation

### Technical Risks

**R1: GitHub API Rate Limits**
- **Risk:** Heavy API usage during framework detection and deployment
- **Impact:** High - Feature becomes unusable
- **Mitigation:**
  - Cache framework detection results
  - Implement request queuing
  - Monitor rate limit headers
  - Graceful degradation

**R2: Permission Issues**
- **Risk:** Users decline write permissions
- **Impact:** Medium - Can't create workflows
- **Mitigation:**
  - Request permissions upfront with clear explanation
  - Provide alternative: "Copy YAML and create manually"
  - Make permissions revocable/re-requestable

**R3: Template Quality**
- **Risk:** Templates don't work for user's specific setup
- **Impact:** Medium - User frustration, failed workflows
- **Mitigation:**
  - Test templates thoroughly across different project types
  - Clear prerequisites in template descriptions
  - Provide troubleshooting guides
  - Iterate based on user feedback

### Product Risks

**R4: Feature Complexity**
- **Risk:** Feature too complex for users to understand
- **Impact:** Medium - Low adoption despite solving problem
- **Mitigation:**
  - Simple, guided flow
  - Clear explanations at each step
  - Educational content
  - User testing before launch

**R5: Low Adoption**
- **Risk:** Users don't use feature even when offered
- **Impact:** High - Problem remains unsolved
- **Mitigation:**
  - Prominent empty state
  - Clear value proposition
  - Smooth, frictionless experience
  - A/B test messaging and UI

**R6: Template Maintenance Burden**
- **Risk:** Templates become outdated as Actions ecosystem evolves
- **Impact:** Medium - Templates stop working
- **Mitigation:**
  - Version control for templates
  - Regular template reviews
  - User feedback loop
  - Community contributions (future)

### Business Risks

**R7: Feature Doesn't Solve Retention**
- **Risk:** Users create workflows but still churn
- **Impact:** High - Investment doesn't achieve goal
- **Mitigation:**
  - Measure retention metrics closely
  - Quick iteration based on data
  - User interviews to understand why
  - Have backup retention strategies

---

## Open Questions & Decisions

### ✅ Resolved

1. **Permissions timing?** → Upfront during initial auth
2. **Template editing?** → Preview only (no editing in MVP)
3. **Track deployments?** → Yes, definitely
4. **Direct commit or PR?** → PR (users must review)
5. **Manual trigger button?** → Yes, definitely
6. **Template Naming Convention** → Use template names for consistency (e.g., `ci.yml`, `deploy.yml`)
7. **Multiple Workflows** → One-at-a-time in MVP, add batch creation later if needed
8. **Template Updates** → Not in MVP scope, consider for Phase 2
9. **Error Recovery** → Provide retry button with exponential backoff
10. **Analytics Opt-out** → Always track (privacy-compliant), expose aggregate stats to users in future

---

# Appendix A: MVP Template Library (Updated)

## Overview

**Minimum Viable Product: 4 Templates**
- One template per category (Testing, Build, Deploy, Quality)
- All Node.js templates support npm, yarn, pnpm, AND bun
- Auto-detection of package manager based on lockfiles
- Future monetization via template packs

---

## Template 1: Node.js CI (Testing Category)

**Category:** Testing  
**ID:** `nodejs-ci`  
**File Name:** `test.yml`  
**Package Managers:** npm, yarn, pnpm, bun (auto-detected)

**Description:**  
Automatically runs your test suite on every push and pull request. Detects your package manager (npm, yarn, pnpm, or bun) and uses the appropriate commands.

**Prerequisites:**
- `test` script defined in `package.json`
- Node.js project with dependencies

**When it runs:**
- On every push to main/develop branches
- On every pull request
- Manual trigger via workflow_dispatch

**YAML Content:**
```yaml
name: Test
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Detect package manager
        id: detect-pm
        run: |
          if [ -f "bun.lockb" ]; then
            echo "manager=bun" >> $GITHUB_OUTPUT
            echo "install-cmd=bun install" >> $GITHUB_OUTPUT
            echo "test-cmd=bun test" >> $GITHUB_OUTPUT
          elif [ -f "pnpm-lock.yaml" ]; then
            echo "manager=pnpm" >> $GITHUB_OUTPUT
            echo "install-cmd=pnpm install --frozen-lockfile" >> $GITHUB_OUTPUT
            echo "test-cmd=pnpm test" >> $GITHUB_OUTPUT
          elif [ -f "yarn.lock" ]; then
            echo "manager=yarn" >> $GITHUB_OUTPUT
            echo "install-cmd=yarn install --frozen-lockfile" >> $GITHUB_OUTPUT
            echo "test-cmd=yarn test" >> $GITHUB_OUTPUT
          else
            echo "manager=npm" >> $GITHUB_OUTPUT
            echo "install-cmd=npm ci" >> $GITHUB_OUTPUT
            echo "test-cmd=npm test" >> $GITHUB_OUTPUT
          fi
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: ${{ steps.detect-pm.outputs.manager }}
      
      - name: Setup Bun (if using Bun)
        if: steps.detect-pm.outputs.manager == 'bun'
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Setup pnpm (if using pnpm)
        if: steps.detect-pm.outputs.manager == 'pnpm'
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: ${{ steps.detect-pm.outputs.install-cmd }}
      
      - name: Run tests
        run: ${{ steps.detect-pm.outputs.test-cmd }}
```

**Explanation for users:**
- Automatically detects whether you use npm, yarn, pnpm, or bun
- Installs dependencies using the correct package manager
- Runs your test suite
- Tests on both Node 18 and Node 20 to catch compatibility issues

---

## Template 2: Node.js Build (Build Category)

**Category:** Build  
**ID:** `nodejs-build`  
**File Name:** `build.yml`  
**Package Managers:** npm, yarn, pnpm, bun (auto-detected)

**Description:**  
Builds your Node.js application and uploads the build artifacts. Perfect for libraries, applications, or any project with a build step.

**Prerequisites:**
- `build` script defined in `package.json`
- Build output directory (usually `dist/`, `build/`, or `out/`)

**When it runs:**
- On every push to main branch
- Manual trigger via workflow_dispatch

**YAML Content:**
```yaml
name: Build
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Detect package manager
        id: detect-pm
        run: |
          if [ -f "bun.lockb" ]; then
            echo "manager=bun" >> $GITHUB_OUTPUT
            echo "install-cmd=bun install" >> $GITHUB_OUTPUT
            echo "build-cmd=bun run build" >> $GITHUB_OUTPUT
          elif [ -f "pnpm-lock.yaml" ]; then
            echo "manager=pnpm" >> $GITHUB_OUTPUT
            echo "install-cmd=pnpm install --frozen-lockfile" >> $GITHUB_OUTPUT
            echo "build-cmd=pnpm build" >> $GITHUB_OUTPUT
          elif [ -f "yarn.lock" ]; then
            echo "manager=yarn" >> $GITHUB_OUTPUT
            echo "install-cmd=yarn install --frozen-lockfile" >> $GITHUB_OUTPUT
            echo "build-cmd=yarn build" >> $GITHUB_OUTPUT
          else
            echo "manager=npm" >> $GITHUB_OUTPUT
            echo "install-cmd=npm ci" >> $GITHUB_OUTPUT
            echo "build-cmd=npm run build" >> $GITHUB_OUTPUT
          fi
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: ${{ steps.detect-pm.outputs.manager }}
      
      - name: Setup Bun (if using Bun)
        if: steps.detect-pm.outputs.manager == 'bun'
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Setup pnpm (if using pnpm)
        if: steps.detect-pm.outputs.manager == 'pnpm'
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: ${{ steps.detect-pm.outputs.install-cmd }}
      
      - name: Build application
        run: ${{ steps.detect-pm.outputs.build-cmd }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: |
            dist/
            build/
            out/
            .next/
          retention-days: 7
```

**Explanation for users:**
- Detects your package manager automatically
- Builds your application
- Uploads build artifacts so you can download them or use in other workflows
- Useful for CI/CD pipelines or creating release builds

---

## Template 3: Deploy to Vercel (Deploy Category)

**Category:** Deploy  
**ID:** `vercel-deploy`  
**File Name:** `deploy.yml`  
**Package Managers:** npm, yarn, pnpm, bun (auto-detected)

**Description:**  
Automatically deploys your application to Vercel when you push to the main branch. Vercel's built-in detection handles package managers, so this workflow is streamlined.

**Prerequisites:**
- Vercel account and project set up
- Repository secrets configured:
  - `VERCEL_TOKEN` - Your Vercel API token
  - `VERCEL_ORG_ID` - Your Vercel organization ID
  - `VERCEL_PROJECT_ID` - Your Vercel project ID

**When it runs:**
- On every push to main branch
- Manual trigger via workflow_dispatch

**YAML Content:**
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Comment deployment URL
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Deployed to Vercel: [View Deployment](https://vercel.com)'
            })
```

**Explanation for users:**
- Automatically deploys your app to Vercel on every push to main
- Vercel detects your package manager (npm, yarn, pnpm, bun) automatically
- Requires Vercel secrets to be configured in your repository settings
- Adds deployment URL comments on pull requests

**Setup Instructions (included in PR body):**
1. Go to https://vercel.com/account/tokens to create an API token
2. Find your Org ID and Project ID in Vercel project settings
3. Add these as secrets in your GitHub repository:
   - Settings > Secrets and variables > Actions > New repository secret
   - Add: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

---

## Template 4: Code Quality (Quality Category)

**Category:** Quality  
**ID:** `code-quality`  
**File Name:** `quality.yml`  
**Package Managers:** npm, yarn, pnpm, bun (auto-detected)

**Description:**  
Runs ESLint to check code quality and optionally Prettier to check formatting. Helps maintain consistent, high-quality code across your project.

**Prerequisites:**
- ESLint configured in your project (`eslint` in devDependencies)
- `lint` script in `package.json`
- Optional: Prettier configured with `format:check` script

**When it runs:**
- On every push to any branch
- On every pull request
- Manual trigger via workflow_dispatch

**YAML Content:**
```yaml
name: Code Quality
on:
  push:
    branches: [ '**' ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:

jobs:
  lint:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Detect package manager
        id: detect-pm
        run: |
          if [ -f "bun.lockb" ]; then
            echo "manager=bun" >> $GITHUB_OUTPUT
            echo "install-cmd=bun install" >> $GITHUB_OUTPUT
            echo "lint-cmd=bun run lint" >> $GITHUB_OUTPUT
            echo "format-cmd=bun run format:check" >> $GITHUB_OUTPUT
          elif [ -f "pnpm-lock.yaml" ]; then
            echo "manager=pnpm" >> $GITHUB_OUTPUT
            echo "install-cmd=pnpm install --frozen-lockfile" >> $GITHUB_OUTPUT
            echo "lint-cmd=pnpm lint" >> $GITHUB_OUTPUT
            echo "format-cmd=pnpm format:check" >> $GITHUB_OUTPUT
          elif [ -f "yarn.lock" ]; then
            echo "manager=yarn" >> $GITHUB_OUTPUT
            echo "install-cmd=yarn install --frozen-lockfile" >> $GITHUB_OUTPUT
            echo "lint-cmd=yarn lint" >> $GITHUB_OUTPUT
            echo "format-cmd=yarn format:check" >> $GITHUB_OUTPUT
          else
            echo "manager=npm" >> $GITHUB_OUTPUT
            echo "install-cmd=npm ci" >> $GITHUB_OUTPUT
            echo "lint-cmd=npm run lint" >> $GITHUB_OUTPUT
            echo "format-cmd=npm run format:check" >> $GITHUB_OUTPUT
          fi
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: ${{ steps.detect-pm.outputs.manager }}
      
      - name: Setup Bun (if using Bun)
        if: steps.detect-pm.outputs.manager == 'bun'
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Setup pnpm (if using pnpm)
        if: steps.detect-pm.outputs.manager == 'pnpm'
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: ${{ steps.detect-pm.outputs.install-cmd }}
      
      - name: Run ESLint
        run: ${{ steps.detect-pm.outputs.lint-cmd }}
      
      - name: Check formatting (if Prettier configured)
        continue-on-error: true
        run: ${{ steps.detect-pm.outputs.format-cmd }}
```

**Explanation for users:**
- Automatically detects your package manager
- Runs ESLint to catch code quality issues
- Optionally checks Prettier formatting (won't fail if not configured)
- Runs on every push and pull request to catch issues early

---

## Future Template Packs (Monetization Strategy)

### Free Tier (4 Core Templates)
- ✅ Testing (Node.js CI)
- ✅ Build (Node.js Build)
- ✅ Deploy (Vercel)
- ✅ Quality (ESLint)

### Paid Template Packs

**Advanced Testing Pack** ($5/month)
- Playwright E2E tests
- Jest with coverage reporting
- Visual regression testing
- Performance testing
- Multi-browser testing matrix

**Full-Stack Deploy Pack** ($7/month)
- Deploy to AWS (ECS, Lambda, S3)
- Deploy to Google Cloud
- Deploy to Azure
- Docker build and push
- Kubernetes deployment

**Security & Compliance Pack** ($10/month)
- Dependency vulnerability scanning
- SAST (Static Application Security Testing)
- License compliance checking
- Secret scanning
- Security audit reports

**Advanced Quality Pack** ($5/month)
- Type checking (TypeScript)
- Bundle size analysis
- Lighthouse CI (performance)
- Accessibility testing
- Code coverage enforcement

**Multi-Language Pack** ($7/month)
- Python (pytest, flake8, mypy)
- Go (go test, golangci-lint)
- Rust (cargo test, clippy)
- Java (Maven/Gradle)
- Ruby (RSpec, Rubocop)

### Template Pack Benefits
- **For users:** Access to specialized, battle-tested workflows
- **For OmniLens:** Recurring revenue stream that scales with value
- **For ecosystem:** Encourages best practices and quality standards

---

## Template Metadata Structure

```json
{
  "id": "nodejs-ci",
  "name": "Node.js CI",
  "category": "testing",
  "tier": "free",
  "description": "Run tests with automatic package manager detection",
  "long_description": "Automatically runs your test suite on every push and pull request. Detects your package manager (npm, yarn, pnpm, or bun) and uses the appropriate commands.",
  "frameworks": ["nodejs", "react", "vue", "nextjs", "svelte", "angular"],
  "package_managers": ["npm", "yarn", "pnpm", "bun"],
  "prerequisites": [
    "test script in package.json",
    "Node.js project with dependencies"
  ],
  "triggers": ["push", "pull_request", "workflow_dispatch"],
  "file_name": "test.yml",
  "estimated_runtime": "2-5 minutes",
  "difficulty": "beginner",
  "yaml_content": "...",
  "setup_instructions": "Ensure you have a 'test' script defined in your package.json",
  "troubleshooting": {
    "no_test_script": "Add a test script to your package.json: \"test\": \"jest\" or similar",
    "tests_failing": "Run tests locally first to ensure they pass",
    "wrong_node_version": "Update the matrix.node-version in the workflow file"
  },
  "icon": "test-tube",
  "tags": ["testing", "ci", "node", "javascript", "typescript"]
}
```

---

## Testing Strategy for Templates

### Before Launch
1. **Test each template on sample repositories:**
   - npm-based project (standard React app)
   - yarn-based project (Next.js default)
   - pnpm-based project (Vue/Vite)
   - bun-based project (Bun template)

2. **Verify package manager detection:**
   - With single lockfile
   - With multiple lockfiles (priority order)
   - With no lockfile (defaults to npm)

3. **Test trigger conditions:**
   - Push to main
   - Pull request
   - Manual workflow_dispatch

4. **Edge cases:**
   - Missing test script → workflow fails with clear error
   - Missing build output → upload-artifact gracefully handles
   - Missing Vercel secrets → clear error message

### After Launch
- Monitor workflow success rates
- Track which templates are most popular
- Collect user feedback on template quality
- Iterate based on real-world usage

---

## Next Steps

1. **Implement template library manager**
   - Store templates in JSON format
   - API to fetch templates by category/framework
   - Template rendering with variable substitution

2. **Add package manager detection service**
   - Check repository for lockfiles
   - Return detected package manager
   - Cache results to avoid repeated API calls

3. **Build template preview component**
   - Syntax highlighting for YAML
   - Explanatory annotations
   - Package manager compatibility badge

4. **Launch MVP with 4 core templates**
   - Monitor adoption and success rates
   - Gather user feedback
   - Iterate on template quality

5. **Plan template pack monetization**
   - Design pricing tiers
   - Build template pack UI
   - Integrate with billing system

---

*This appendix supersedes the previous template list and reflects the updated MVP requirements with multi-package-manager support.*
## Appendix B: UI Mockups

### Empty State
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    📭 No Workflows Found                │
│                                                         │
│     This repository doesn't have any GitHub Actions     │
│     workflows yet. Workflows automate testing,          │
│     building, and deployment.                           │
│                                                         │
│     OmniLens can help you create your first workflow    │
│     in under 60 seconds.                                │
│                                                         │
│     ┌─────────────────────────────────────────┐        │
│     │      Create Your First Workflow         │        │
│     └─────────────────────────────────────────┘        │
│                                                         │
│              Learn more about workflows →              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Template Selection
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Dashboard          Create Workflow       ✕   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  We detected: Node.js + React                          │
│  Choose a workflow template:                            │
│                                                         │
│  ┌─ Recommended ────────────────────────────────────┐  │
│  │                                                   │  │
│  │  🧪 Node.js CI                      [Select]     │  │
│  │  Run tests on every push                         │  │
│  │                                                   │  │
│  │  🎨 ESLint + Prettier              [Select]     │  │
│  │  Enforce code quality standards                  │  │
│  │                                                   │  │
│  │  🚀 Deploy to Vercel               [Select]     │  │
│  │  Auto-deploy on every push to main              │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Other Templates ────────────────────────────────┐  │
│  │                                                   │  │
│  │  👋 Hello World (Learning)         [Select]     │  │
│  │  🐍 Python CI                      [Select]     │  │
│  │  🔵 Go CI                          [Select]     │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | OmniLens Team | Initial PDR |

---

**Review & Approval**

This document should be reviewed and approved by:
- [ ] Product Lead
- [ ] Engineering Lead
- [ ] Design Lead
- [ ] User Research (optional)

**Next Steps:**
1. Review and approve PDR
2. Create technical implementation plan
3. Design UI mockups (high-fidelity)
4. Break down into development tasks
5. Estimate effort and set sprint goals
6. Begin development

---

*End of Product Design Requirements Document*
