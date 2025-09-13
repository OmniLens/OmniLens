import Link from 'next/link';
import Image from 'next/image';
import { Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - App icon and name */}
          <div className="flex items-center gap-4">
            {/* App icon */}
            <div className="h-12 w-12 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="OmniLens"
                width={48}
                height={48}
                className="w-full h-full object-contain rounded-lg"
                priority
              />
            </div>
            
            {/* App name */}
            <h1 className="text-3xl font-bold tracking-tight">OmniLens</h1>
          </div>

          {/* Right side - Social links */}
          <div className="flex items-center gap-4">
            <Link 
              href="https://github.com/OmniLens/OmniLens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-6 w-6" />
            </Link>
            <Link 
              href="https://x.com/Omni_Lens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="X (formerly Twitter)"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
