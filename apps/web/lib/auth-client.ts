import { createAuthClient } from "better-auth/react";

// Get the base URL dynamically for different environments
function getClientBaseURL(): string {
  // In browser, use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // For SSR in Vercel, use the Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For local development or custom deployments
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
});

export const { signIn, signOut, useSession, getSession } = authClient;