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
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </NuqsAdapter>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
