"use client";

// External library imports
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { VersionIndicator } from "@/components/VersionIndicator";

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

          {/* App Name Section - Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              OmniLens
            </h1>
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
              href="https://vercel.com/blog/vercel-open-source-program-fall-2025-cohort#omnilens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block group relative rounded-xl p-5 transition-all duration-200 hover:scale-105 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #2a1a0a 0%, #3a2a1a 25%, #4a3a2a 50%, #3a2a1a 75%, #2a1a0a 100%)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(255, 215, 0, 0.15), 0 0 25px rgba(255, 165, 0, 0.2), 0 0 15px rgba(255, 20, 147, 0.15)',
              }}
            >
              {/* Foil shimmer overlay */}
              <div 
                className="absolute inset-0 opacity-30 animate-foil-shimmer rounded-xl"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                }}
              />
              {/* Rainbow holographic gradient animation */}
              <div 
                className="absolute inset-0 opacity-35 animate-foil-rotate rounded-xl"
                style={{
                  background: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #ff006e)',
                  backgroundSize: '200% 200%',
                }}
              />
              {/* Gold base overlay */}
              <div 
                className="absolute inset-0 opacity-25 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 223, 0, 0.25) 25%, rgba(255, 215, 0, 0.3) 50%, rgba(255, 223, 0, 0.25) 75%, rgba(255, 215, 0, 0.3) 100%)',
                }}
              />
              {/* Rainbow color overlay - shifting colors */}
              <div 
                className="absolute inset-0 opacity-30 rounded-xl animate-foil-rotate"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 0, 110, 0.3) 0%, rgba(131, 56, 236, 0.3) 20%, rgba(58, 134, 255, 0.3) 40%, rgba(6, 255, 165, 0.3) 60%, rgba(255, 190, 11, 0.3) 80%, rgba(255, 0, 110, 0.3) 100%)',
                  backgroundSize: '200% 200%',
                }}
              />
              {/* Badge image - on top layer */}
              <img 
                alt="Vercel OSS Program" 
                src="https://vercel.com/oss/program-badge.svg" 
                className="relative z-10 h-7 sm:h-8 transition-transform duration-200 group-hover:scale-105"
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

      {/* Version indicator - bottom left */}
      <VersionIndicator />
    </div>
  );
}
