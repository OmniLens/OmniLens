import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "OmniLens - GitHub Workflows Dashboard",
  description: "A dashboard for monitoring GitHub workflow runs",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0D0D0D] font-sans antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
} 