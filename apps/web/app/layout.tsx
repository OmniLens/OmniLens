import "./globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { QueryProvider } from "@/lib/query-client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import ConditionalVersionIndicator from "@/components/ConditionalVersionIndicator";
import * as Sentry from '@sentry/nextjs';
import type { Metadata } from "next";

// Add or edit your "generateMetadata" to include the Sentry trace data:
export function generateMetadata(): Metadata {
  return {
    title: "OmniLens",
    description: "Monitoring GitHub workflow runs",
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      shortcut: "/favicon-32x32.png",
      apple: "/apple-touch-icon.png",
    },
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          src="https://cdn.databuddy.cc/databuddy.js"
          data-client-id="3FFXvSXO052ueGEMJSSdE"
          data-enable-batching="true"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NuqsAdapter>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </NuqsAdapter>
        <Analytics />
        <SpeedInsights />
        
        {/* Version indicator - bottom left (hidden on landing page) */}
        <ConditionalVersionIndicator />
      </body>
    </html>
  );
}
