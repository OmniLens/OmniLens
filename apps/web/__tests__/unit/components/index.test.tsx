import { describe, it, expect } from '@jest/globals';
// Import components to ensure they appear in coverage
import RepositoryCard from '@/components/RepositoryCard';
import WorkflowCard from '@/components/WorkflowCard';
import DailyMetrics from '@/components/DailyMetrics';
import CompactMetricsOverview from '@/components/CompactMetricsOverview';
import { AppSidebar } from '@/components/AppSidebar';
import Header from '@/components/Header';
import { SidebarLayout } from '@/components/SidebarLayout';
import BackButton from '@/components/BackButton';
import GetStartedButton from '@/components/GetStartedButton';
import { AuthProvider } from '@/components/auth-provider';
import AddRepositoryModalPreview from '@/components/AddRepositoryModalPreview';
import RepositoryCardPreview from '@/components/RepositoryCardPreview';
import RepositoryCardSkeleton from '@/components/RepositoryCardSkeleton';
import { RepoSwitcher } from '@/components/RepoSwitcher';
import BlogPostCard from '@/components/BlogPostCard';
import FeatureCard from '@/components/FeatureCard';
import { DatePicker } from '@/components/DatePicker';
import GitHubStatusBanner from '@/components/GitHubStatusBanner';
import { VersionIndicator } from '@/components/VersionIndicator';
// import ConditionalVersionIndicator from '@/components/ConditionalVersionIndicator';
import VercelBadge from '@/components/VercelBadge';
import WorkflowMetricsPreview from '@/components/WorkflowMetricsPreview';

describe('components', () => {
  it('placeholder - ensures components appear in coverage', () => {
    expect(RepositoryCard).toBeDefined();
    expect(WorkflowCard).toBeDefined();
    expect(DailyMetrics).toBeDefined();
    expect(CompactMetricsOverview).toBeDefined();
    expect(AppSidebar).toBeDefined();
    expect(Header).toBeDefined();
    expect(SidebarLayout).toBeDefined();
    expect(BackButton).toBeDefined();
    expect(GetStartedButton).toBeDefined();
    expect(AuthProvider).toBeDefined();
    expect(AddRepositoryModalPreview).toBeDefined();
    expect(RepositoryCardPreview).toBeDefined();
    expect(RepositoryCardSkeleton).toBeDefined();
    expect(RepoSwitcher).toBeDefined();
    expect(BlogPostCard).toBeDefined();
    expect(FeatureCard).toBeDefined();
    expect(DatePicker).toBeDefined();
    expect(GitHubStatusBanner).toBeDefined();
    expect(VersionIndicator).toBeDefined();
    // expect(ConditionalVersionIndicator).toBeDefined();
    expect(VercelBadge).toBeDefined();
    expect(WorkflowMetricsPreview).toBeDefined();
  });
});

