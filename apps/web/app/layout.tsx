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
    title: "OmniLens — GitHub Actions Workflow Health",
    description: "An open-source platform for visualizing and tracking GitHub Actions workflow health.",
    icons: {
      icon: "/omnilens.jpeg",
      shortcut: "/omnilens.jpeg",
      apple: "/omnilens.jpeg",
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ scrollBehavior: "smooth" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
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
