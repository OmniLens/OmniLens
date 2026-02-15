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
import VercelBadge from "@/components/VercelBadge";

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
        <VercelBadge />
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
            © {new Date().getFullYear()} OmniLens. All rights reserved.
          </p>
          </div>
        </div>
      </div>

      {/* Version indicator - bottom left */}
      <VersionIndicator />
    </div>
  );
}
