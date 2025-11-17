import { describe, it, expect } from 'vitest';
import {
  cn,
  removeEmojiFromWorkflowName,
  formatRepoDisplayName,
  duration,
  formatRunTime,
} from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });
  });

  describe('removeEmojiFromWorkflowName', () => {
    it('should remove emojis from workflow name', () => {
      expect(removeEmojiFromWorkflowName('⏱️ Thresholds')).toBe('Thresholds');
    });

    it('should handle empty string', () => {
      expect(removeEmojiFromWorkflowName('')).toBe('');
    });

    it('should handle name without emojis', () => {
      expect(removeEmojiFromWorkflowName('Test Workflow')).toBe('Test Workflow');
    });
  });

  describe('formatRepoDisplayName', () => {
    it('should format repository name', () => {
      expect(formatRepoDisplayName('owner/my-repo')).toBe('My Repo');
    });

    it('should keep nuqs lowercase', () => {
      expect(formatRepoDisplayName('owner/nuqs')).toBe('nuqs');
    });

    it('should handle underscores', () => {
      expect(formatRepoDisplayName('owner/my_repo')).toBe('My Repo');
    });
  });

  describe('duration', () => {
    it('should calculate duration correctly', () => {
      const start = '2024-01-01T10:00:00Z';
      const end = '2024-01-01T12:30:15Z';
      expect(duration(start, end)).toBe('2h 30m 15s');
    });

    it('should handle minutes only', () => {
      const start = '2024-01-01T10:00:00Z';
      const end = '2024-01-01T10:45:30Z';
      expect(duration(start, end)).toBe('45m 30s');
    });

    it('should handle seconds only', () => {
      const start = '2024-01-01T10:00:00Z';
      const end = '2024-01-01T10:00:30Z';
      expect(duration(start, end)).toBe('30s');
    });
  });

  describe('formatRunTime', () => {
    it('should format run time', () => {
      const dateString = '2024-01-01T14:30:00Z';
      const result = formatRunTime(dateString);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });
});

