import { describe, it, expect } from '@jest/globals';
// Import to ensure utils.ts appears in coverage
import * as utils from '@/lib/utils';

describe('utils', () => {
  it('placeholder - ensures utils.ts appears in coverage', () => {
    // This ensures lib/utils.ts is included in coverage report
    expect(utils).toBeDefined();
    expect(utils.cn).toBeDefined();
    expect(utils.removeEmojiFromWorkflowName).toBeDefined();
    expect(utils.formatRepoDisplayName).toBeDefined();
    expect(utils.duration).toBeDefined();
    expect(utils.formatRunTime).toBeDefined();
  });
});

