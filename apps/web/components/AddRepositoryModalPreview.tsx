"use client";

// External library imports
import React, { useState, useEffect } from "react";
import { Loader, CheckCircle } from "lucide-react";

// Internal component imports
import { Button } from "@/components/ui/button";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Step state for the add repository modal flow
 */
type ModalStep = 'idle' | 'validating' | 'adding' | 'getting-data' | 'added';

/**
 * Props for the AddRepositoryModalPreview component
 */
interface AddRepositoryModalPreviewProps {
  /** Duration in milliseconds for each step (default: 3000) */
  stepDuration?: number;
  /** Whether to auto-play the animation (default: true) */
  autoPlay?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AddRepositoryModalPreview component
 * Interactive preview of the Add Repository modal that cycles through states
 * Demonstrates the repository addition flow: idle → validating → adding → getting-data
 * Used on the marketing page to showcase the GitHub integration feature
 */
export default function AddRepositoryModalPreview({
  stepDuration = 250,
  autoPlay = true
}: AddRepositoryModalPreviewProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('idle');
  const [newRepoUrl, setNewRepoUrl] = useState("");

  // Auto-cycle through modal states
  useEffect(() => {
    if (!autoPlay) return;

    const mockUrl = "omnilens/OmniLens";
    let timeoutId: NodeJS.Timeout;
    let charIndex = 0;
    let stepIndex = 0;
    const steps: ModalStep[] = ['idle', 'validating', 'adding', 'getting-data', 'added'];

    const cycle = () => {
      if (stepIndex === 0) {
        // Idle state - type the URL
        setCurrentStep('idle');
        setNewRepoUrl("");
        charIndex = 0;
        
        const typeChar = () => {
          if (charIndex < mockUrl.length) {
            setNewRepoUrl(mockUrl.slice(0, charIndex + 1));
            charIndex++;
            timeoutId = setTimeout(typeChar, 40);
          } else {
            // After typing, wait a bit then move to validating
            timeoutId = setTimeout(() => {
              stepIndex = 1;
              setCurrentStep('validating');
              timeoutId = setTimeout(cycle, stepDuration);
            }, 200);
          }
        };
        
        typeChar();
      } else {
        // Move to next step
        stepIndex = (stepIndex + 1) % steps.length;
        if (stepIndex === 0) {
          // Reset cycle - go back to idle
          setCurrentStep('idle');
          setNewRepoUrl("");
          timeoutId = setTimeout(cycle, 800);
        } else if (steps[stepIndex] === 'added') {
          // Show "Added" state, then restart after a delay
          setCurrentStep('added');
          timeoutId = setTimeout(() => {
            stepIndex = 0;
            setCurrentStep('idle');
            setNewRepoUrl("");
            timeoutId = setTimeout(cycle, 500);
          }, 600);
        } else {
          setCurrentStep(steps[stepIndex]);
          timeoutId = setTimeout(cycle, stepDuration);
        }
      }
    };

    // Start the cycle
    cycle();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [autoPlay, stepDuration]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Modal Preview - Inline version for preview context */}
      <div className="w-full rounded-lg border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Add repository</h2>
        </div>
        {/* Content */}
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={newRepoUrl}
                readOnly
                placeholder="owner/repo or GitHub URL"
                disabled={currentStep !== 'idle'}
                className="w-full px-3 py-2 rounded-md bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            {/* Progress Indicator - Shows validation, adding, and data fetching steps */}
            {currentStep !== 'idle' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {currentStep === 'validating' ? (
                    <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : currentStep === 'adding' || currentStep === 'getting-data' || currentStep === 'added' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={`text-sm ${currentStep === 'validating' ? 'text-blue-600' : currentStep === 'adding' || currentStep === 'getting-data' || currentStep === 'added' ? 'text-green-600' : 'text-gray-500'}`}>
                    Validating repository
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  {currentStep === 'adding' ? (
                    <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : currentStep === 'getting-data' || currentStep === 'added' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={`text-sm ${currentStep === 'adding' ? 'text-blue-600' : currentStep === 'getting-data' || currentStep === 'added' ? 'text-green-600' : 'text-gray-500'}`}>
                    Adding to dashboard
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  {currentStep === 'getting-data' ? (
                    <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : currentStep === 'added' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={`text-sm ${currentStep === 'getting-data' ? 'text-blue-600' : currentStep === 'added' ? 'text-green-600' : 'text-gray-500'}`}>
                    Getting workflow data
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={(currentStep !== 'idle' && currentStep !== 'added') || (currentStep === 'idle' && !newRepoUrl.trim())}
            >
              {currentStep === 'added' ? 'Added' : currentStep !== 'idle' ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

