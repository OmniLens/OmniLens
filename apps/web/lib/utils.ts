import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================================================
// CSS/ClassName Utilities
// ============================================================================

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * Combines conditional classes and resolves conflicts using tailwind-merge
 * @param inputs - Variable number of class values (strings, objects, arrays)
 * @returns Merged class string with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Remove emojis and extra whitespace from the beginning of a workflow name
 * Useful for displaying clean workflow names without emoji prefixes
 * @param name - The workflow name that may contain emojis
 * @returns Clean workflow name without leading emojis or whitespace
 * @example
 * removeEmojiFromWorkflowName("⏱️ Thresholds") // Returns "Thresholds"
 */
export function removeEmojiFromWorkflowName(name: string): string {
  if (!name) return '';
  return name.replace(/^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}\s]+/gu, '').trim();
}

/**
 * Format repository name for display
 * Converts repository paths like "owner/repo-name" to "Repo Name"
 * Handles special cases (e.g., "nuqs" stays lowercase)
 * @param repoName - Repository path in format "owner/repo-name"
 * @returns Formatted display name
 * @example
 * formatRepoDisplayName("owner/my-repo") // Returns "My Repo"
 * formatRepoDisplayName("owner/nuqs") // Returns "nuqs"
 */
export function formatRepoDisplayName(repoName: string): string {
  const repoNamePart = repoName.split('/').pop() || repoName;
  
  // Special case for nuqs - keep it lowercase
  if (repoNamePart.toLowerCase() === 'nuqs') {
    return 'nuqs';
  }
  
  return repoNamePart
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

/**
 * Get the first letter of the repository name for avatar display
 * Uses the repo part of owner/repo (e.g. "owner/core" → "C")
 * @param displayNameOrPath - Repository display name or path (e.g. "owner/core" or "Core")
 * @returns Single uppercase letter for avatar
 * @example
 * getAvatarLetter("owner/core") // Returns "C"
 * getAvatarLetter("omnilens/core") // Returns "C"
 */
export function getAvatarLetter(displayNameOrPath: string): string {
  if (!displayNameOrPath) return '?';
  const repoPart = displayNameOrPath.split('/').pop() || displayNameOrPath;
  const first = repoPart.charAt(0);
  return first ? first.toUpperCase() : '?';
}

/** Palette for deterministic avatar colors (matches mockup) */
const AVATAR_COLORS = [
  '#00e5a0', // var(--accent)
  '#4d9fff', // var(--accent2)
  '#c084fc', // var(--accent3)
  '#f59e0b',
  '#ef4444',
  '#6366f1',
];

/**
 * Get a deterministic color for avatar background based on string
 * Uses simple hash to pick from mockup palette
 * @param str - String to hash (e.g. repo path or display name)
 * @returns Hex color string
 * @example
 * getAvatarColor("owner/core") // Returns consistent color for same input
 */
export function getAvatarColor(str: string): string {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// ============================================================================
// Time/Date Utilities
// ============================================================================

/**
 * Calculate the duration between two timestamps and format as human-readable string
 * Returns format like "2h 30m 15s", "45m 30s", or "30s"
 * Uses absolute value to handle cases where end < start (data inconsistencies or clock skew)
 * @param start - Start timestamp (ISO string or date string)
 * @param end - End timestamp (ISO string or date string)
 * @returns Formatted duration string
 * @example
 * duration("2024-01-01T10:00:00Z", "2024-01-01T12:30:15Z") // Returns "2h 30m 15s"
 * duration("2024-01-01T12:00:00Z", "2024-01-01T10:00:00Z") // Returns "2h 0m 0s" (handles reversed order)
 */
export function duration(start: string, end: string): string {
  const startTime = new Date(start);
  const endTime = new Date(end);
  // Use absolute value to handle cases where end < start (data inconsistencies or clock skew)
  const diff = Math.abs(endTime.getTime() - startTime.getTime());

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format a date string to a localized time string (HH:MM format)
 * Used for displaying run times in a user-friendly format
 * @param dateString - ISO date string or date string to format
 * @returns Localized time string in HH:MM format (e.g., "14:30")
 * @example
 * formatRunTime("2024-01-01T14:30:00Z") // Returns "14:30" (or localized equivalent)
 */
export function formatRunTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// Feature Flag Utilities
// ============================================================================

/**
 * Check if a feature is enabled based on environment variables
 * Checks NEXT_PUBLIC_ENABLE_<FEATURE> environment variable
 * Falls back to NODE_ENV !== 'production' if env var not set
 * Returns true in development, false in production by default
 * @param feature - Feature name (e.g., 'UNIT_TESTS', 'LOCAL_REMOTE_SWITCHER')
 * @returns true if feature is enabled, false otherwise
 * @example
 * isFeatureEnabled('UNIT_TESTS') // Checks NEXT_PUBLIC_ENABLE_UNIT_TESTS
 * isFeatureEnabled('LOCAL_REMOTE_SWITCHER') // Checks NEXT_PUBLIC_ENABLE_LOCAL_REMOTE_SWITCHER
 */
export function isFeatureEnabled(feature: string): boolean {
  const envVarName = `NEXT_PUBLIC_ENABLE_${feature}`;
  const envValue = process.env[envVarName];
  
  // If environment variable is explicitly set, use its value
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }
  
  // Default behavior: enabled in development, disabled in production
  return process.env.NODE_ENV !== 'production';
}

