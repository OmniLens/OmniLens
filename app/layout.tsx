import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "OmniLens - GitHub Workflows Dashboard",
  description: "A dashboard for monitoring GitHub workflow runs",
  icons: {
    icon: "/omnilens.jpeg",
    shortcut: "/omnilens.jpeg",
    apple: "/omnilens.jpeg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
} 