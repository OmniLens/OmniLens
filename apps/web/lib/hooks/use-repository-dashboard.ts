import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";

export interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface Commit {
  id: string;
  tree_id: string;
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
  };
  committer: {
    name: string;
    email: string;
  };
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  mirror_url: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  } | null;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
}

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

export interface WorkflowOverview {
  totalWorkflows: number;
  totalRuns: number;
  completedRuns: number;
  passedRuns: number;
  failedRuns: number;
  inProgressRuns: number;
  successRate: number;
  passRate?: number;
  totalRuntime?: number;
  didntRunCount?: number;
  avgRunsPerHour?: number;
  minRunsPerHour?: number;
  maxRunsPerHour?: number;
  runsByHour?: Array<{ hour: number; passed: number; failed: number; total: number }>;
}

// Hook to manage date state with URL persistence
export function useDateState() {
  const [selectedDate, setSelectedDate] = useQueryState(
    'date',
    parseAsString.withDefault(new Date().toISOString().slice(0, 10))
  );

  return {
    selectedDate,
    setSelectedDate,
  };
}

// Fetch workflows for a repository
export function useRepositoryWorkflows(slug: string) {
  return useQuery({
    queryKey: ['repository-workflows', slug],
    queryFn: async (): Promise<Workflow[]> => {
      const response = await fetch(`/api/workflow/${slug}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows for ${slug}`);
      }
      
      const data = await response.json();
      return (data.workflows || []).sort((a: Workflow, b: Workflow) => {
        const nameA = a.name?.replace(/[^\w\s]/g, '') || '';
        const nameB = b.name?.replace(/[^\w\s]/g, '') || '';
        return nameA.localeCompare(nameB);
      });
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes - workflows don't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
}

// Fetch workflow runs for a specific date
export function useWorkflowRuns(slug: string, date: string) {
  return useQuery({
    queryKey: ['workflow-runs', slug, date],
    queryFn: async (): Promise<WorkflowRun[]> => {
      const response = await fetch(`/api/workflow/${slug}?date=${date}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow runs for ${slug} on ${date}`);
      }
      
      const data = await response.json();
      return data.workflowRuns || [];
    },
    enabled: !!slug && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
  });
}

// Fetch workflow overview data for a specific date
export function useWorkflowOverview(slug: string, date: string) {
  return useQuery({
    queryKey: ['workflow-overview', slug, date],
    queryFn: async (): Promise<WorkflowOverview> => {
      const response = await fetch(`/api/workflow/${slug}?date=${date}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow overview for ${slug} on ${date}`);
      }
      
      const data = await response.json();
      return data.overviewData || {
        totalWorkflows: 0,
        totalRuns: 0,
        completedRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        inProgressRuns: 0,
        successRate: 0
      };
    },
    enabled: !!slug && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
  });
}

// Fetch yesterday's data for comparison
export function useYesterdayWorkflowRuns(slug: string, date: string) {
  // Temporarily disable to test if this is causing the issue
  return useQuery({
    queryKey: ['yesterday-disabled', slug, date],
    queryFn: async (): Promise<WorkflowRun[]> => {
      return []; // Return empty array
    },
    enabled: false, // Disable completely
    staleTime: Infinity,
    gcTime: 0,
  });
}
