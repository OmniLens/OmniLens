import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - OmniLens",
  description: "Privacy Policy for OmniLens - GitHub Actions monitoring dashboard",
};

export default function PrivacyPolicyPage() {
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
        
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose max-w-none">
          <p className="text-sm text-muted-foreground mb-8">
            <strong>Last updated:</strong> January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              This Privacy Policy describes how OmniLens (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, and protects your information when you use our GitHub Actions monitoring dashboard. We are committed to protecting your privacy and being transparent about our data practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 mb-6">
              <li><strong>GitHub Account Information:</strong> Basic profile information from your GitHub account (username, avatar, email if public)</li>
              <li><strong>Repository Data:</strong> Information about repositories you explicitly add to the dashboard</li>
              <li><strong>Workflow Data:</strong> GitHub Actions workflow runs, status, and performance metrics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Information We Collect Automatically</h3>
            <ul className="list-disc pl-6 mb-6">
              <li><strong>Usage Analytics:</strong> Anonymous usage statistics to improve our service</li>
              <li><strong>Performance Data:</strong> Application performance metrics and error logs</li>
              <li><strong>Technical Information:</strong> Browser type, operating system, and device information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.3 Third-Party Data Collection</h3>
            <p>
              We use the following third-party services that may collect additional information:
            </p>
            <ul className="list-disc pl-6">
              <li><strong>Vercel Analytics:</strong> Website usage and performance analytics</li>
              <li><strong>Neon:</strong> PostgreSQL database hosting and data storage</li>
              <li><strong>Sentry:</strong> Error monitoring and performance tracking</li>
              <li><strong>GitHub API:</strong> Repository and workflow data (only for repositories you explicitly add)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>Provide and maintain the OmniLens service</li>
              <li>Display workflow runs and performance metrics for your repositories</li>
              <li>Generate insights and analytics about your CI/CD pipeline health</li>
              <li>Improve our service through usage analytics</li>
              <li>Monitor and fix technical issues</li>
              <li>Ensure security and prevent abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Data Storage</h3>
            <p>
              Your data is stored securely using:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li><strong>Neon PostgreSQL Database:</strong> Repository metadata and workflow definitions</li>
              <li><strong>Encrypted Storage:</strong> All data is encrypted in transit and at rest</li>
              <li><strong>Secure Hosting:</strong> Data is hosted on secure, enterprise-grade infrastructure</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.2 Security Measures</h3>
            <ul className="list-disc pl-6">
              <li>HTTPS encryption for all data transmission</li>
              <li>Secure authentication through GitHub OAuth</li>
              <li>Regular security updates and monitoring</li>
              <li>Access controls and authentication</li>
              <li>No storage of GitHub credentials or access tokens</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties, except:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li><strong>Service Providers:</strong> We may share data with trusted third-party services (Vercel, Neon, Sentry) that help us operate our service</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, user data may be transferred</li>
            </ul>
            <p className="mt-4">
              <strong>Important:</strong> We never share your repository data or workflow information with third parties for marketing or commercial purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. GitHub Integration and Permissions</h2>
            <p>
              When you connect your GitHub account to OmniLens:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>We only access repositories you explicitly add to the dashboard</li>
              <li>We request minimal permissions necessary to read workflow data</li>
              <li>You can revoke access at any time through your GitHub settings</li>
              <li>We do not access private repository content beyond workflow runs</li>
              <li>We do not modify or delete any data in your repositories</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold mb-3">7.1 Access and Control</h3>
            <ul className="list-disc pl-6 mb-6">
              <li><strong>View Your Data:</strong> You can see all data we have about you through the dashboard</li>
              <li><strong>Remove Repositories:</strong> You can remove repositories from the dashboard at any time</li>
              <li><strong>Revoke Access:</strong> You can revoke GitHub access through your GitHub settings</li>
              <li><strong>Delete Account:</strong> You can stop using the service and revoke all access</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.2 Data Retention</h3>
            <p>
              We retain your data for as long as you use the service. When you remove a repository or revoke access:
            </p>
            <ul className="list-disc pl-6">
              <li>Repository metadata is deleted from our database</li>
              <li>Workflow data is removed</li>
              <li>Analytics data may be retained in anonymized form</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Maintain your authentication session</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns (anonymized)</li>
              <li>Monitor application performance</li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings, but this may affect the functionality of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
            <p>
              OmniLens is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Posting the new Privacy Policy on this page</li>
              <li>Updating the &quot;Last updated&quot; date</li>
              <li>Sending you an email notification (if applicable)</li>
            </ul>
            <p className="mt-4">
              Your continued use of the service after any changes constitutes acceptance of the new Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us through:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>The OmniLens GitHub repository</li>
              <li>Our support channels</li>
              <li>Email (if provided in the repository)</li>
            </ul>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              By using OmniLens, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of information as described herein.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
