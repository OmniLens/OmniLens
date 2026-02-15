import "./globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { QueryProvider } from "@/lib/query-client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { SidebarLayout } from "@/components/SidebarLayout";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "OmniLens",
    description: "OmniLens helps you create and monitor GitHub Actions workflows. Pre-built templates for testing, building, and deploying. No YAML experience required. Get started in 60 seconds.",
    icons: {
      icon: "/omnilens.jpeg",
      shortcut: "/omnilens.jpeg",
      apple: "/omnilens.jpeg",
    },
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
