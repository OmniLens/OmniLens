import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation | OmniLens',
  description: 'Interactive API documentation for OmniLens - Explore endpoints, try requests, and view responses',
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

