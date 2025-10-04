import "./globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { QueryProvider } from "@/lib/query-client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import * as Sentry from '@sentry/nextjs';
import type { Metadata } from "next";

// Add or edit your "generateMetadata" to include the Sentry trace data:
export function generateMetadata(): Metadata {
  return {
    title: "OmniLens",
    description: "Monitoring GitHub workflow runs",
    icons: {
      icon: "/omnilens.jpeg",
      shortcut: "/omnilens.jpeg",
      apple: "/omnilens.jpeg",
    },
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <NuqsAdapter>
          <QueryProvider>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <main className="flex-1">
                  {children}
                </main>
                
                {/* Footer */}
                <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
                  <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        © 2025 OmniLens. All rights reserved.
                      </div>
                      <div className="flex gap-6 text-sm">
                        <a 
                          href="/legal" 
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Legal
                        </a>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            </AuthProvider>
          </QueryProvider>
        </NuqsAdapter>
        <Analytics />
        <SpeedInsights />
        
        {/* Version indicator - bottom left */}
        <div className="fixed bottom-4 left-4 z-50 text-xs text-muted-foreground font-mono">
          v0.5.0
        </div>
      </body>
    </html>
  );
}
