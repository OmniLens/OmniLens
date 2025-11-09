/**
 * Type declarations for swagger-ui-react
 * 
 * Since @types/swagger-ui-react doesn't exist, we provide our own type definitions
 */
declare module 'swagger-ui-react' {
  import { Component } from 'react';

  export interface SwaggerUIProps {
    url?: string;
    spec?: object;
    deepLinking?: boolean;
    displayRequestDuration?: boolean;
    tryItOutEnabled?: boolean;
    requestInterceptor?: (request: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body?: string;
    }) => {
      url: string;
      method: string;
      headers: Record<string, string>;
      body?: string;
    };
    onComplete?: (system: unknown) => void;
    plugins?: unknown[];
    layout?: string;
    filter?: boolean | string;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    supportedSubmitMethods?: string[];
    validatorUrl?: string | null;
    withCredentials?: boolean;
    requestSnippetsEnabled?: boolean;
    requestSnippets?: unknown;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    defaultModelRendering?: 'example' | 'model';
    displayOperationId?: boolean;
    showMutatedRequest?: boolean;
    maxDisplayedTags?: number;
    persistAuthorization?: boolean;
  }

  export default class SwaggerUI extends Component<SwaggerUIProps> {}
}

