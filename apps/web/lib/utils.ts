import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function removeEmojiFromWorkflowName(name: string): string {
  // Remove emojis and extra whitespace from the beginning of a workflow name
  // E.g., "⏱️ Thresholds" becomes "Thresholds"
  if (!name) return '';
  return name.replace(/^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}\s]+/gu, '').trim();
}

