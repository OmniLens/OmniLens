import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-2xl mx-4">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="p-4">
          {children}
        </div>
        {footer && (
          <div className="p-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex justify-end gap-2">
      {children}
    </div>
  );
}
