import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  let response: Awaited<ReturnType<typeof GET>>;
  let data: {
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    response = await GET();
    data = await response.json();
  });

  it('should return healthy status with correct structure', () => {
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(typeof data.timestamp).toBe('string');
    expect(typeof data.uptime).toBe('number');
    expect(typeof data.version).toBe('string');
  });

  it('should return valid timestamp', () => {
    expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should return valid uptime', () => {
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should return non-empty version', () => {
    expect(data.version.length).toBeGreaterThan(0);
  });
});
