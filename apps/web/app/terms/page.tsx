import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - OmniLens",
  description: "Terms of Service for OmniLens - GitHub Actions monitoring dashboard",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/legal">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose max-w-none">
          <p className="text-sm text-muted-foreground mb-8">
            <strong>Last updated:</strong> January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using OmniLens (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              OmniLens is a GitHub Actions monitoring dashboard that provides insights into your CI/CD pipeline health. The Service allows you to:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Connect and monitor GitHub repositories</li>
              <li>View workflow runs and their status</li>
              <li>Track success rates and performance metrics</li>
              <li>Analyze CI/CD pipeline bottlenecks</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and GitHub Integration</h2>
            <p>
              To use OmniLens, you must authenticate through GitHub OAuth. By connecting your GitHub account:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>You grant us permission to access your GitHub repositories that you explicitly add to the dashboard</li>
              <li>We will only access repositories you have explicitly authorized</li>
              <li>You are responsible for maintaining the security of your GitHub account</li>
              <li>You can revoke access at any time through your GitHub settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Collection and Usage</h2>
            <p>
              We collect and process the following data:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li><strong>Repository Information:</strong> Names, URLs, and metadata of repositories you add to the dashboard</li>
              <li><strong>Workflow Data:</strong> Workflow run information, status, and performance metrics</li>
              <li><strong>Usage Analytics:</strong> Anonymous usage statistics to improve the service</li>
              <li><strong>Account Information:</strong> Basic GitHub profile information for authentication</li>
            </ul>
            <p className="mt-4">
              We do not store your GitHub credentials or access tokens. All GitHub API access is performed through secure OAuth authentication.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>Use the Service only for lawful purposes</li>
              <li>Not attempt to gain unauthorized access to the Service</li>
              <li>Not use the Service to violate any applicable laws or regulations</li>
              <li>Respect GitHub&apos;s Terms of Service when using the Service</li>
              <li>Not share your account credentials with others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Service Availability</h2>
            <p>
              While we strive to provide reliable service, OmniLens is provided &quot;as is&quot; without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Uninterrupted service availability</li>
              <li>Error-free operation</li>
              <li>Compatibility with all GitHub repositories</li>
              <li>Real-time data synchronization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
            <p>
              OmniLens integrates with several third-party services:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li><strong>GitHub:</strong> For repository and workflow data access</li>
              <li><strong>Vercel:</strong> For hosting and analytics</li>
              <li><strong>Neon:</strong> For PostgreSQL database hosting and management</li>
              <li><strong>Sentry:</strong> For error monitoring and performance tracking</li>
            </ul>
            <p className="mt-4">
              Your use of these services is subject to their respective terms of service and privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Encrypted data transmission (HTTPS)</li>
              <li>Secure database storage</li>
              <li>Regular security updates</li>
              <li>Access controls and authentication</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p>
              In no event shall OmniLens, its developers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="mt-4">
              You may stop using the Service at any time by revoking GitHub access through your GitHub settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be interpreted and governed by the laws of the jurisdiction in which the Service is operated, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through the OmniLens GitHub repository or support channels.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              By using OmniLens, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
