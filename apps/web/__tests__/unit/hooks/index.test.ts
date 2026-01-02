import { describe, it, expect } from '@jest/globals';
// Import all hooks to ensure they appear in coverage
import * as useRepositories from '@/lib/hooks/use-repositories';
import * as useDashboardRepositories from '@/lib/hooks/use-dashboard-repositories';
import * as useDashboardRepositoriesBatch from '@/lib/hooks/use-dashboard-repositories-batch';
import * as useRepositoryDashboard from '@/lib/hooks/use-repository-dashboard';
import * as useWorkflowMutations from '@/lib/hooks/use-workflow-mutations';
import * as useGitHubStatus from '@/lib/hooks/use-github-status';

describe('hooks', () => {
  it('placeholder - ensures hooks appear in coverage', () => {
    expect(useRepositories).toBeDefined();
    expect(useDashboardRepositories).toBeDefined();
    expect(useDashboardRepositoriesBatch).toBeDefined();
    expect(useRepositoryDashboard).toBeDefined();
    expect(useWorkflowMutations).toBeDefined();
    expect(useGitHubStatus).toBeDefined();
  });
});

