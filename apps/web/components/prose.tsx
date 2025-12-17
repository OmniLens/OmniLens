// External library imports
import type { HTMLAttributes } from "react";

// Utility imports
import { cn } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

type ProseProps = HTMLAttributes<HTMLElement> & {
  html: string;
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Prose component
 * Renders HTML content with beautiful typography using Tailwind CSS Typography
 * Provides consistent styling for blog posts and other rich text content
 * @param html - HTML content to render (sanitized by Marble CMS)
 * @param className - Additional CSS classes to apply
 */
export function Prose({ html, className }: ProseProps) {
  return (
    <article
      className={cn(
        "prose prose-h1:font-bold prose-h1:text-xl prose-a:text-blue-600 prose-p:text-justify prose-img:rounded-xl prose-headings:font-normal mx-auto dark:prose-invert",
        className
      )}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}

