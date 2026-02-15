// External library imports
import Link from "next/link";

// Type imports
// (No external type imports used in this component)

// Internal component imports
// (No internal components used in this component)

// Utility imports
import { cn } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

export type GetStartedButtonVariant = "hero" | "workflow" | "cta" | "core" | "gold" | "default";

export interface GetStartedButtonProps {
  className?: string;
  href?: string;
  children?: React.ReactNode;
  variant?: GetStartedButtonVariant;
}

// ============================================================================
// Component-Specific Utilities
// ============================================================================

/**
 * Get variant-specific classes for GetStartedButton
 * Hero: bold gradient with glow, larger size
 * CTA: pill shape, stronger emphasis
 * Default: original styling
 */
function getVariantClasses(variant: GetStartedButtonVariant): string {
  const base =
    "inline-flex items-center gap-2 text-white font-semibold transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  switch (variant) {
    case "hero":
      return cn(
        base,
        "bg-gradient-to-r from-white/25 via-white/15 to-white/10 border border-white/30",
        "px-8 py-4 rounded-xl text-base shadow-lg shadow-white/10",
        "hover:from-white/30 hover:via-white/20 hover:to-white/15 hover:shadow-xl hover:shadow-white/20 hover:scale-[1.02]"
      );
    case "cta":
      return cn(
        base,
        "bg-white/15 border-2 border-white/25 rounded-full",
        "px-10 py-4 text-base shadow-lg shadow-white/10",
        "hover:bg-white/25 hover:border-white/40 hover:shadow-xl hover:shadow-white/20"
      );
    case "workflow":
      return cn(
        base,
        "bg-gradient-to-r from-amber-500/30 via-sky-500/20 to-emerald-500/30 border border-white/25",
        "px-10 py-4 rounded-xl text-base shadow-lg",
        "hover:from-amber-500/40 hover:via-sky-500/30 hover:to-emerald-500/40 hover:shadow-amber-500/20"
      );
    case "core":
      return cn(
        base,
        "bg-gradient-to-r from-green-500/30 via-blue-500/25 to-purple-500/30 border border-white/25",
        "px-10 py-4 rounded-xl text-base shadow-lg",
        "hover:from-green-500/40 hover:via-blue-500/35 hover:to-purple-500/40 hover:shadow-green-500/15"
      );
    case "gold":
      return cn(
        base,
        "bg-gradient-to-r from-amber-400/40 via-yellow-300/30 to-amber-400/40 border-2 border-amber-300/50",
        "px-10 py-4 rounded-xl text-base text-white shadow-lg shadow-amber-500/25",
        "hover:from-amber-400/60 hover:via-white/40 hover:to-amber-400/60 hover:border-amber-200/70 hover:shadow-xl hover:shadow-amber-400/30"
      );
    default:
      return cn(
        base,
        "bg-white/10 border border-white/20 px-6 py-3 rounded-lg shadow-lg hover:bg-white/20 hover:shadow-white/25"
      );
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * GetStartedButton component
 * Displays a styled "Get Started" button that links to the login page
 * Supports section-specific variants (hero, cta, workflow) for visual differentiation
 * Hero and CTA variants include foil shimmer animation (same as Vercel OSS badge)
 */
export default function GetStartedButton({
  className = "",
  href = "/login",
  children,
  variant = "default"
}: GetStartedButtonProps) {
  const hasFoilAnimation = variant === "hero" || variant === "cta" || variant === "workflow" || variant === "core" || variant === "gold";

  return (
    <Link
      href={href}
      className={cn(
        getVariantClasses(variant),
        hasFoilAnimation && "relative overflow-hidden group/btn",
        className
      )}
    >
      {/* Foil shimmer overlay - same animation as Vercel OSS badge */}
      {hasFoilAnimation && (
        <>
          <div
            className="absolute inset-0 opacity-20 animate-foil-shimmer pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
            }}
          />
          {/* Holographic gradient animation */}
          <div
            className="absolute inset-0 opacity-15 animate-foil-rotate pointer-events-none"
            style={{
              background:
                variant === "workflow"
                  ? "linear-gradient(45deg, #f59e0b, #0ea5e9, #10b981, #f59e0b)"
                  : variant === "core"
                    ? "linear-gradient(45deg, #22c55e, #3b82f6, #a855f7, #22c55e)"
                    : variant === "gold"
                      ? "linear-gradient(45deg, #fbbf24, #ffffff, #f59e0b, #fbbf24)"
                      : "linear-gradient(45deg, rgba(255,255,255,0.4), rgba(148,163,184,0.3), rgba(255,255,255,0.4))",
              backgroundSize: "200% 200%",
            }}
          />
        </>
      )}
      <span
        className={cn(
          "inline-flex items-center gap-2",
          hasFoilAnimation && "relative z-10"
        )}
      >
        {children || "Get Started"}
      </span>
    </Link>
  );
}
