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

  // Set mounted to true after component mounts on client
  // This ensures server and initial client render match (both false)
  // Then client updates after hydration completes, avoiding hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {mounted && (
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
      )}
    </div>
  );
}

