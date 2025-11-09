// External library imports
import React, { useEffect } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the Modal component
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
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
 * Supports closing via backdrop click or ESC key
 * Renders nothing when isOpen is false
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback function to close the modal
 * @param title - Modal title text
 * @param children - Modal content
 * @param footer - Optional footer content (typically action buttons)
 */
export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle backdrop click (but not modal content clicks)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-md rounded-lg border border-border bg-background shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
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
