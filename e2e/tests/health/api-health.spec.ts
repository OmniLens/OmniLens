import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('should load health endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});
