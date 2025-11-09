// External library imports
import React from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the Modal component
 */
interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Props for the ModalFooter component
 */
interface ModalFooterProps {
  children: React.ReactNode;
}

// ============================================================================
// Main Components
// ============================================================================

/**
 * Modal component
 * Simple modal dialog with title, content, and optional footer
 * Renders nothing when isOpen is false
 */
export function Modal({ isOpen, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-2xl mx-4">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {/* Content */}
        <div className="p-4">
          {children}
        </div>
        {/* Footer - Optional */}
        {footer && (
          <div className="p-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ModalFooter component
 * Footer container for modal actions
 * Right-aligns children with gap spacing
 */
export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex justify-end gap-2">
      {children}
    </div>
  );
}
