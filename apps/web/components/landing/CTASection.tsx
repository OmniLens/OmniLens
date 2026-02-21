"use client";

import Link from "next/link";
import { ArrowRightIcon, GitHubIcon, GreenDotIcon } from "./icons";

export function CTASection() {
  return (
    <div className="cta-section">
      <div className="cta-glow" />
      <div className="cta-inner">
        <div className="cta-badge">
          <GreenDotIcon width={10} height={10} />
          Free & open source
        </div>
        <h2 className="cta-title">
          Start monitoring
          <br />
          your workflows <em>today.</em>
        </h2>
        <p className="cta-sub">
          Connect your GitHub account and get full visibility into workflow
          health across every repository.
        </p>
        <div className="cta-actions">
          <Link href="/login" className="btn-lg-primary">
            <ArrowRightIcon width={14} height={14} />
            Get Started Free
          </Link>
          <a
            href="https://github.com/omnilens/OmniLens"
            className="btn-lg-ghost btn-login-ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon width={14} height={14} />
            Star on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
