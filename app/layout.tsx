import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { Databuddy } from "@databuddy/sdk/react";

export const metadata: Metadata = {
  title: "OmniLens",
  description: "Monitoring GitHub workflow runs",
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
        <AuthProvider>{children}</AuthProvider>
        <Databuddy
          clientId={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID!}
          trackScreenViews
          trackPerformance
          trackWebVitals={true} // Default is false, explicitly enable for quick start
          trackErrors={true} // Default is false, explicitly enable for quick start
        />
        {children}
      </body>
    </html>
  );
}
