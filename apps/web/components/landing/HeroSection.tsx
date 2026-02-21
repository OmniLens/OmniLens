"use client";

import Link from "next/link";
import { ArrowRightIcon, GitHubIcon } from "./icons";
import { HeroDashboard } from "./HeroDashboard";

export function HeroSection() {
  return (
    <section className="hero landing-hero">
      <div className="hero-glow" />

      <h1 className="hero-title">
        Workflow health,
        <br />
        <em>finally visible.</em>
      </h1>

      <p className="hero-sub">
        An open-source platform for visualizing and tracking GitHub Actions
        workflow health.
      </p>

      <div className="hero-actions">
        <Link href="/login" className="btn-lg-primary">
          <ArrowRightIcon width={14} height={14} />
          Get Started — it&apos;s free
        </Link>
        <a
          href="https://github.com/omnilens/OmniLens"
          className="btn-lg-ghost btn-login-ghost"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubIcon width={14} height={14} />
          View on GitHub
        </a>
      </div>

      <HeroDashboard />
    </section>
  );
}
