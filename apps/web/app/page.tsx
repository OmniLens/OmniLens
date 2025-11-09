"use client";

// External library imports
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Github, GitBranch, BarChart3, Activity, Eye } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      {/* Navigation Section - Header with logo, badge, GitHub link, and sign-in button */}
      <nav className="relative z-10 px-6 py-4">
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
            {/* ALPHA badge with shimmer animation */}
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 text-slate-200 border-slate-600/40 text-xs font-medium px-2.5 py-0.5 relative overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></span>
              <span className="relative z-10">ALPHA</span>
            </Badge>
          </div>
          {/* Actions - Right side navigation (GitHub link and Sign In button) */}
          <div className="flex items-center gap-3">
            <a 
              href="https://github.com/omnilens/OmniLens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors"
            >
              <Github className="h-6 w-6" />
            </a>
            <Link href="/login">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Main landing content with logo, headline, and CTA */}
      <div className="relative px-6 py-20">
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
                GitHub Actions monitoring dashboard for tracking workflow runs and performance metrics.
              </p>
            </div>

            {/* CTA Buttons - Primary call-to-action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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

      {/* Features Section - Three feature cards with animated backgrounds */}
      <div className="relative px-6 py-20 overflow-hidden">
        {/* Animated Background Elements - Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        <div className="w-full max-w-[1920px] mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Monitor Your GitHub Workflows
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Track workflow runs, success rates, and performance metrics across your GitHub repositories.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: GitHub Integration */}
            <div className="group bg-slate-900/30 backdrop-blur-sm border border-slate-800/40 rounded-2xl p-8 hover:bg-slate-800/30 transition-all duration-500 relative overflow-hidden">
              {/* Animated background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                  <GitBranch className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-200 transition-colors duration-300">GitHub Integration</h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  Connect your GitHub repositories and monitor workflow runs in real-time.
                </p>
              </div>
            </div>

            {/* Feature 2: Workflow Tracking */}
            <div className="group bg-slate-900/30 backdrop-blur-sm border border-slate-800/40 rounded-2xl p-8 hover:bg-slate-800/30 transition-all duration-500 relative overflow-hidden">
              {/* Animated background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/25">
                  <Activity className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-yellow-200 transition-colors duration-300">Workflow Tracking</h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  Track success rates, run times, and identify failing workflows across your projects.
                </p>
              </div>
            </div>

            {/* Feature 3: Performance Metrics */}
            <div className="group bg-slate-900/30 backdrop-blur-sm border border-slate-800/40 rounded-2xl p-8 hover:bg-slate-800/30 transition-all duration-500 relative overflow-hidden">
              {/* Animated background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-800/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-800 to-purple-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-800/25">
                  <BarChart3 className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-purple-200 transition-colors duration-300">Performance Metrics</h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  View detailed metrics and analytics for your GitHub Actions workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Open Source Section - Community information and repository stats */}
      <div className="relative px-6 py-20">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Content and GitHub link */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <Github className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white">
                    Open Source
                  </h2>
                  <p className="text-green-400 text-sm font-medium">Community Driven</p>
                </div>
              </div>
              
              <p className="text-lg text-gray-300 leading-relaxed">
                OmniLens is open source and built for the community.<br />
                Contribute, report issues, and star us on GitHub.
              </p>
              
              {/* GitHub Repository Link */}
              <a 
                href="https://github.com/omnilens/OmniLens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25"
              >
                View on GitHub
              </a>
            </div>
            
            {/* Right Side - Repository stats card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-8 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-green-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-lg animate-pulse delay-1000"></div>
                
                <div className="relative z-10 space-y-6">
                  {/* Repository Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">GitHub Repository</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400">
                      <span className="text-sm">●</span>
                      <span className="text-xs">Active</span>
                    </div>
                  </div>
                  
                  {/* Repository Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Contributors</span>
                      <span className="text-white font-semibold">1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Language</span>
                      <span className="text-white font-semibold">TypeScript</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">License</span>
                      <span className="text-white font-semibold">MIT</span>
                    </div>
                  </div>
                  
                  {/* Footer Message */}
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>Made with</span>
                      <span className="text-red-400">❤️</span>
                      <span>by the community</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Final call-to-action with animated background */}
      <div className="relative px-6 py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-1/4 w-40 h-40 bg-gradient-to-r from-slate-500/10 to-slate-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-1/4 w-36 h-36 bg-gradient-to-r from-slate-400/10 to-slate-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-r from-slate-600/10 to-slate-700/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
        
        <div className="w-full max-w-[1920px] mx-auto text-center relative z-10">
          <div className="group bg-gradient-to-br from-slate-900/50 to-slate-800/60 backdrop-blur-sm border border-slate-700/40 rounded-3xl p-12 relative overflow-hidden hover:border-slate-600/60 transition-all duration-500">
            {/* Animated Gradient Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-slate-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-slate-500/25">
                  <Eye className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              
              {/* Heading and Description */}
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Start Monitoring Your Workflows
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto group-hover:text-gray-200 transition-colors duration-500">
                Connect your GitHub repositories and begin tracking your workflow performance today.
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
        </div>
      </div>

      {/* Footer Section - Copyright and legal links */}
      <footer className="relative px-6 py-12 border-t border-slate-800/40">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 mb-4 md:mb-0">
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