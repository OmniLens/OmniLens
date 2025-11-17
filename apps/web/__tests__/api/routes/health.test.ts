import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('version');
  });

  it('should return valid timestamp', async () => {
    const response = await GET();
    const data = await response.json();

    expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should return valid uptime', async () => {
    const response = await GET();
    const data = await response.json();

    expect(typeof data.uptime).toBe('number');
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });
});

