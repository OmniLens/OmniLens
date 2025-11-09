'use client';

// External library imports
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading API documentation...</div>
});

// Import Swagger UI CSS
import 'swagger-ui-react/swagger-ui.css';

// ============================================================================
// API Documentation Page
// ============================================================================

/**
 * API Documentation Page
 * 
 * Displays interactive API documentation using Swagger UI.
 * Fetches OpenAPI specification from /api/openapi endpoint.
 */
export default function ApiDocsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
          <p className="text-muted-foreground">
            Interactive API documentation for OmniLens. Explore endpoints, try requests, and view responses.
          </p>
        </div>
        
        {mounted && (
          <div className="swagger-container">
            <SwaggerUI 
              url="/api/openapi"
              deepLinking={true}
              displayRequestDuration={true}
              tryItOutEnabled={true}
              requestInterceptor={(request: {
                url: string;
                method: string;
                headers: Record<string, string>;
                body?: string;
              }) => {
                // Add any custom request interceptors here if needed
                return request;
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

