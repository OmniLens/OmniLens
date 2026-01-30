"use client";

// External library imports
import Image from "next/image";
import Link from "next/link";
import { Radio, FolderOpen, BarChart3 } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import VercelBadge from "@/components/VercelBadge";
import FeatureCard from "@/components/FeatureCard";
import GetStartedButton from "@/components/GetStartedButton";

// ============================================================================
// Main Component
// ============================================================================

/**
 * LandingPage component
 * Main landing page for OmniLens application
 * Includes navigation, hero section, features, open source info, CTA, and footer
 * Client component with static content and navigation links
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Section - Header with logo, badge, GitHub link, and sign-in button */}
      <nav className="relative z-10 px-6 md:px-12 lg:px-16 xl:px-24 py-4">
        <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between">
          {/* Logo and Brand - Left side navigation */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8">
              <Image
                src="/omnilens.jpeg"
                alt="OmniLens"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <span className="text-xl font-bold text-white">OmniLens</span>
          </div>
          {/* Actions - Right side navigation (Blog link, GitHub link, and Sign In button) */}
          <div className="flex items-center gap-2">
            <Link 
              href="/blog"
              className="text-white hover:text-gray-300 transition-colors px-4 py-2 rounded-md hover:bg-white/10 text-sm font-medium"
            >
              Blog
            </Link>
            <a 
              href="https://github.com/omnilens/OmniLens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors px-4 py-2 rounded-md hover:bg-white/10 text-sm font-medium"
            >
              GitHub
            </a>
            <Link href="/login">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Main landing content with logo, headline, and CTA */}
      <div className="relative px-6 md:px-12 lg:px-16 xl:px-24 pt-20 pb-12">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="text-center space-y-8">
            {/* Logo - Large OmniLens brand image */}
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

            {/* Main Headline - Title and description */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                OmniLens
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                An open-source platform for visualizing and tracking GitHub Actions workflow health.
              </p>
            </div>

            {/* CTA Buttons - Primary call-to-action */}
            <div className="flex flex-col gap-4 justify-center items-center">
              <GetStartedButton />
            </div>
          </div>
        </div>
      </div>

      {/* Vercel OSS Program Badge */}
      <VercelBadge />

      {/* Features Section - Unified feature cards */}
      <div className="relative px-6 md:px-12 lg:px-16 xl:px-24 py-12">
        <div className="w-full max-w-[1920px] mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Core Capabilities
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The building blocks behind workflow health visibility.
            </p>
          </div>

          {/* Feature Cards - Three major product areas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={FolderOpen}
              title="Repository Management"
              description="Add and manage repositories from a central dashboard."
              colorTheme="green"
            />
            <FeatureCard
              icon={Radio}
              title="Signal Ingestion"
              description="Ingest workflow signals from tests, checks, and jobs. Collect comprehensive data from all your GitHub Actions workflows."
              colorTheme="blue"
            />
            <FeatureCard
              icon={BarChart3}
              title="Metrics & State Visualization"
              description="Track workflow health using success rates, run counts, runtimes, and stability trends."
              colorTheme="purple"
            />
          </div>
        </div>
      </div>


      {/* CTA Section - Final call-to-action */}
      <div className="relative px-6 md:px-12 lg:px-16 xl:px-24 py-12">
        <div className="w-full max-w-[1920px] mx-auto text-center relative z-10">
          
          {/* Heading and Description */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Monitoring Your Workflows
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect your GitHub account and start tracking your workflow performance today.
          </p>
          
          {/* CTA Button */}
          <GetStartedButton />
        </div>
      </div>

      {/* Footer Section - Copyright and legal links */}
      <footer className="relative px-6 md:px-12 lg:px-16 xl:px-24 py-12 border-t border-slate-800/40">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Copyright */}
            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2025 OmniLens. All rights reserved.</p>
            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <Link href="/legal" className="hover:text-white transition-colors">Legal</Link>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}