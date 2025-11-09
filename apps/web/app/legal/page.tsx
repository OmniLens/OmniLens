// Type imports
import type { Metadata } from "next";

// External library imports
import Link from "next/link";
import { FileText, Shield, ArrowLeft } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "Legal - OmniLens",
  description: "Legal documents for OmniLens - Terms of Service and Privacy Policy",
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * LegalPage component
 * Main legal page providing navigation to Terms of Service and Privacy Policy
 * Server component that displays legal document cards and contact information
 */
export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Back Button - Returns to home page */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        
        {/* Header Section - Page title and description */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Legal</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Important legal information about using OmniLens.<br />
            Please review these documents carefully.
          </p>
        </div>

        {/* Legal Document Cards - Grid layout with Terms and Privacy cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Terms of Service Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-blue-500" />
                <CardTitle className="text-xl">Terms of Service</CardTitle>
              </div>
              <CardDescription>
                Our terms and conditions for using OmniLens, including user responsibilities, service availability, and limitations.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                By using OmniLens, you agree to our terms covering GitHub integration, data usage, service availability, and user responsibilities.
              </p>
              <Link href="/legal/terms">
                <Button variant="outline" className="w-full">
                  Read Terms of Service
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Privacy Policy Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-6 w-6 text-green-500" />
                <CardTitle className="text-xl">Privacy Policy</CardTitle>
              </div>
              <CardDescription>
                How we collect, use, and protect your data when you use OmniLens, including GitHub integration details.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                Learn about our data practices, what information we collect, how we use it, and your privacy rights.
              </p>
              <Link href="/legal/privacy">
                <Button variant="outline" className="w-full">
                  Read Privacy Policy
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer Section - Contact information and last updated date */}
        <div className="mt-12 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3">Questions?</h3>
          <p className="text-muted-foreground mb-4">
            If you have any questions about our legal documents or need clarification on any terms, please contact us through our GitHub repository or support channels.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: October 2025
          </p>
        </div>
      </div>
    </div>
  );
}
