"use client";

// External library imports
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Radio, Eye, FolderOpen, BarChart3 } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-white/25"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Vercel OSS Program Badge */}
      <div className="relative z-10 py-12 px-6 md:px-12 lg:px-16 xl:px-24">
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
            {/* Feature 1: Repository Management - Green */}
            <Card className="border-2 border-green-500 bg-card h-full">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25 flex-shrink-0">
                    <FolderOpen className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-white mb-2">
                      Repository Management
                    </CardTitle>
                    <p className="text-gray-300 leading-relaxed">
                      Add, validate, and manage repositories from a central dashboard. Keep track of all your GitHub repositories in one place.
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Feature 2: Signal Ingestion - Blue */}
            <Card className="border-2 border-blue-500 bg-card h-full">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                    <Radio className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-white mb-2">
                      Signal Ingestion
                    </CardTitle>
                    <p className="text-gray-300 leading-relaxed">
                      Ingest workflow signals from tests, checks, and jobs. Collect comprehensive data from all your GitHub Actions workflows.
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Feature 3: Visualization of Metrics and State - Purple */}
            <Card className="border-2 border-purple-500 bg-card h-full">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-800 to-purple-900 rounded-xl flex items-center justify-center shadow-lg shadow-purple-800/25 flex-shrink-0">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-white mb-2">
                      Metrics & State Visualization
                    </CardTitle>
                    <p className="text-gray-300 leading-relaxed">
                      Track workflow health using success rates, run counts, runtimes, and stability trends.
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section - Final call-to-action */}
      <div className="relative px-6 md:px-12 lg:px-16 xl:px-24 py-12">
        <div className="w-full max-w-[1920px] mx-auto text-center relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-lg shadow-slate-500/25">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>
          
          {/* Heading and Description */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Monitoring Your Workflows
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect your GitHub account and start tracking your workflow performance today.
          </p>
          
          {/* CTA Button */}
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-white/25"
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </Link>
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