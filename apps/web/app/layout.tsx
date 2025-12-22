import "./globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { QueryProvider } from "@/lib/query-client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { SidebarLayout } from "@/components/SidebarLayout";
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
        <script data-site="dHJhY2tfcDVkbzY2ZWE=" src="https://oculisanalytics.com/js/script.js"></script>
        <NuqsAdapter>
          <QueryProvider>
            <AuthProvider>
              <SidebarLayout>
                {children}
              </SidebarLayout>
            </AuthProvider>
          </QueryProvider>
        </NuqsAdapter>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
