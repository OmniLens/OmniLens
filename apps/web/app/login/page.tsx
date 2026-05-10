"use client";

// External library imports
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";

// Internal component imports
import { LandingNav } from "@/components/landing";
import { VersionIndicator } from "@/components/VersionIndicator";

// Hook imports
import { signIn, useSession } from "@/lib/auth-client";

// Styles - landing aesthetic
import "../landing.css";

// ============================================================================
// Main Component
// ============================================================================

/**
 * LoginPage component
 * Authentication page for GitHub OAuth sign-in
 * Matches landing page aesthetic with grid overlay, hero layout, and consistent styling
 * Automatically redirects authenticated users to dashboard
 */
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const { data: session } = useSession();

  // ============================================================================
  // Effects
  // ============================================================================

  // Authentication redirect - send authenticated users to dashboard
  React.useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle GitHub OAuth sign-in
   * Initiates GitHub social authentication flow and redirects to dashboard on success
   */
  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });
      // Keep loading state active - it will be reset when component unmounts on navigation
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="landing-root login-page min-h-screen flex flex-col relative">
      <LandingNav hideAuthButtons />

      {/* Hero-style login section */}
      <section className="hero login-hero flex-1">
        <div className="hero-glow" />

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link
            href="/"
            className="h-32 w-32 cursor-pointer transition-transform duration-200 hover:scale-105 block"
          >
            <Image
              src="/omnilens_optimized.jpeg"
              alt="OmniLens"
              width={256}
              height={256}
              quality={100}
              className="w-full h-full object-cover rounded-2xl shadow-lg"
              priority
            />
          </Link>
        </div>

        {/* App name */}
        <h1 className="hero-title text-4xl mb-6">OmniLens</h1>

        {/* GitHub Sign-In - outline style (not green) */}
        <div className="hero-actions">
          <button
            type="button"
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="btn-lg-ghost btn-login-ghost inline-flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Github className="h-5 w-5" strokeWidth={2} />
            {isLoading ? "Signing in..." : "Continue with GitHub"}
          </button>
        </div>
      </section>

      {/* Footer - matches landing footer style */}
      <footer>
        <div className="footer-inner flex-col !items-stretch gap-4 !py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="footer-brand">
              <span className="footer-copy">
                © {new Date().getFullYear()} OmniLens. All rights reserved.
              </span>
            </div>
            <ul className="footer-links">
              <li>
                <Link href="/legal">Legal</Link>
              </li>
              <li>
                <Link href="/legal/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/legal/terms">Terms</Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      <VersionIndicator />
    </div>
  );
}
