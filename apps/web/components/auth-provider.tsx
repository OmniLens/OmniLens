"use client";

// External library imports
import { ReactNode } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AuthProvider component
 * Simple wrapper component for authentication context
 * Currently a pass-through component that may be extended with auth logic in the future
 * @param children - React children to be rendered
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}
