"use client";

import Image from "next/image";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="nav-logo-mark">
            <Image
              src="/omnilens_optimized.jpeg"
              alt="OmniLens"
              width={28}
              height={28}
              className="w-full h-full object-cover rounded-[7px]"
            />
          </div>
          <span className="footer-copy">
            © 2026 OmniLens. All rights reserved.
          </span>
        </div>

        <ul className="footer-links">
          <li>
            <Link href="/legal">Legal</Link>
          </li>
          <li>
            <Link href="/legal/privacy">Privacy</Link>
          </li>
          <li>
            <Link href="/legal/terms">Terms</Link>
          </li>
          <li>
            <a
              href="https://github.com/omnilens/OmniLens"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
