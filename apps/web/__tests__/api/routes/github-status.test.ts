import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/github-status/route';

describe('GET /api/github-status', () => {
  let response: Awaited<ReturnType<typeof GET>>;
  let data: {
    hasIssues: boolean;
    status: string;
    message: string;
    components: {
      name: string;
      status: string;
      description: string | null;
    }[];
    lastUpdated: string;
    source: string;
    error: string | null;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    response = await GET();
    data = await response.json();
  });

  it('should return operational status with correct structure', () => {
    expect(response.status).toBe(200);
    expect(data.hasIssues).toBe(false);
    expect(data.status).toBe("operational");
    expect(data.message).toBe("GitHub Actions is operational");
    expect(data.components[0].name).toBe("Actions");
    expect(data.components[0].status).toBe("operational");
    expect(data.components[0].description).toBe("Workflows, Compute and Orchestration for GitHub Actions");
    expect(data).toHaveProperty('lastUpdated');
    expect(data.source).toBe("GitHub Status API");
  });

  it('should return valid lastUpdated', () => {
    expect(new Date(data.lastUpdated).getTime()).toBeGreaterThan(0);
  });
});
