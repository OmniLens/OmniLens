"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Github } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

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
              variant="default"
              size="lg"
              className="w-full justify-center gap-2"
            >
              <Github className="h-5 w-5" />
              Continue with GitHub
            </Button>

            {/* <div className="relative flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div> */}

            {/* <div className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-md border border-input bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>

              <Button
                type="button"
                variant="default"
                size="lg"
                className="w-full justify-center"
              >
                Continue
              </Button>
            </div> */}
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
