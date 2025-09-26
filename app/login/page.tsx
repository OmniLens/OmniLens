"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Github } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [isGithubHovered, setIsGithubHovered] = React.useState(false);

  const handleGitHubSignIn = () => {
    // TODO: Implement GitHub OAuth with Better Auth
    console.log("GitHub sign in clicked - implement with Better Auth");
    // For now, navigate to dashboard as if logged in
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-start p-4 pt-20">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="h-[18rem] w-[18rem]">
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
        <div className="flex flex-col items-center text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-white mb-4">
            OmniLens
          </h1>
        </div>

        {/* Login Card */}
        <Card className="border-border/20 bg-card/60 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGitHubSignIn}
              variant={isGithubHovered ? "default" : "outline"}
              size="lg"
              onMouseEnter={() => setIsGithubHovered(true)}
              onMouseLeave={() => setIsGithubHovered(false)}
              className={cn(
                "mx-auto flex items-center gap-2 px-6 transition-all duration-200",
                !isGithubHovered && "shadow-none"
              )}
            >
              <Github className="h-5 w-5" />
              Continue with GitHub
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
