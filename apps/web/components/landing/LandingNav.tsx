"use client";

import Image from "next/image";
import Link from "next/link";
import { BlogIcon, GitHubIcon } from "./icons";

interface LandingNavProps {
  /** When true, hides Sign In and Get Started buttons (e.g. on login page) */
  hideAuthButtons?: boolean;
}

export function LandingNav({ hideAuthButtons = false }: LandingNavProps) {
  return (
    <nav>
      <Link href="/" className="nav-logo">
        <div className="nav-logo-mark">
          <Image
            src="/omnilens_optimized.jpeg"
            alt="OmniLens"
            width={28}
            height={28}
            className="w-full h-full object-cover rounded-[7px]"
          />
        </div>
        <span className="nav-logo-name">OmniLens</span>
      </Link>

      <ul className="nav-links">
        <li>
          <Link href="/blog" target="_blank" rel="noopener noreferrer">
            <BlogIcon />
            Blog
          </Link>
        </li>
        <li>
          <a
            href="https://github.com/omnilens/OmniLens"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
            GitHub
          </a>
        </li>
      </ul>

      {!hideAuthButtons && (
        <div className="nav-actions">
          <Link href="/login" className="btn-sm-ghost">
            Sign In
          </Link>
          <Link href="/login" className="btn-sm-primary">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
