"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { signIn, useSession } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [isGithubHovered, setIsGithubHovered] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { data: session } = useSession();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

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

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col items-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="h-40 w-40">
              <Image
                src="/omnilens.jpeg"
                alt="OmniLens"
                width={1000}
                height={1000}
                quality={100}
                className="w-full h-full object-cover rounded-3xl shadow-lg"
                priority
              />
            </div>
          </div>

          {/* App Name */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              OmniLens
            </h1>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleGitHubSignIn}
            variant={isGithubHovered ? "default" : "outline"}
            size="lg"
            disabled={isLoading}
            onMouseEnter={() => setIsGithubHovered(true)}
            onMouseLeave={() => setIsGithubHovered(false)}
            className={cn(
              "w-full max-w-xs flex items-center justify-center gap-2 px-6 transition-all duration-200",
              !isGithubHovered && "shadow-none"
            )}
          >
            <Github className="h-5 w-5" />
            {isLoading ? "Signing in..." : "Continue with GitHub"}
          </Button>
        </div>
      </div>

      {/* Footer - Bottom */}
      <div className="p-4">
        <div className="text-center w-full max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}