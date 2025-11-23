"use client";

// External library imports
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Hook imports
import { signIn, useSession } from "@/lib/auth-client";

// ============================================================================
// Main Component
// ============================================================================

/**
 * LoginPage component
 * Authentication page for GitHub OAuth sign-in
 * Includes animated background, logo, and GitHub sign-in button
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
      router.push('/dashboard');
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
    <div className="min-h-screen bg-background flex flex-col relative">

      {/* Main Content Section - Centered login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md flex flex-col items-center space-y-8">
          {/* Logo - OmniLens brand image */}
          <div className="flex justify-center">
            <Link href="/" className="h-40 w-40 cursor-pointer transition-transform duration-200 hover:scale-105">
              <Image
                src="/omnilens.jpeg"
                alt="OmniLens"
                width={1000}
                height={1000}
                quality={100}
                className="w-full h-full object-cover rounded-3xl shadow-lg"
                priority
              />
            </Link>
          </div>

          {/* App Name Section - Title with ALPHA badge */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                OmniLens
              </h1>
              {/* ALPHA badge with shimmer animation */}
              <Badge 
                variant="secondary" 
                className="bg-muted/50 text-muted-foreground border-border/50 text-xs font-medium px-2.5 py-0.5 relative overflow-hidden"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></span>
                <span className="relative z-10">ALPHA</span>
              </Badge>
            </div>
          </div>

          {/* GitHub Sign-In Button - Primary authentication action */}
          <Button
            onClick={handleGitHubSignIn}
            variant="outline"
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Github className="h-5 w-5" />
            {isLoading ? "Signing in..." : "Continue with GitHub"}
          </Button>
        </div>

        {/* Vercel OSS Program Badge */}
        <div className="relative z-10 pt-8 pb-6 px-4">
          <div className="w-full max-w-2xl mx-auto text-center">
            <a 
              href="https://vercel.com/oss" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block group"
            >
              <img 
                alt="Vercel OSS Program" 
                src="https://vercel.com/oss/program-badge.svg" 
                className="h-7 sm:h-8 transition-transform duration-200 group-hover:scale-105"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Section - Legal links and copyright */}
      <div className="p-4 relative z-10">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center w-full max-w-md mx-auto space-y-2">
          {/* Terms and Privacy link */}
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
            <a 
              href="/legal" 
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Terms of Service and Privacy Policy
            </a>
          </p>
          {/* Copyright notice */}
          <p className="text-sm text-muted-foreground">
            © 2025 OmniLens. All rights reserved.
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
