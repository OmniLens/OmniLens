"use client";

// External library imports
import React, { useState, useEffect } from "react";

// Internal component imports
import RepositoryCard from "@/components/RepositoryCard";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * State for the repository card preview
 */
type CardState = 'idle' | 'running' | 'passed' | 'warning';

/**
 * Props for the RepositoryCardPreview component
 */
interface RepositoryCardPreviewProps {
  /** Duration in milliseconds for each state (default: 3000) */
  stateDuration?: number;
  /** Whether to auto-play the animation (default: true) */
  autoPlay?: boolean;
  /** Initial state to display (used when autoPlay is false) */
  initialState?: CardState;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RepositoryCardPreview component
 * Interactive preview of the RepositoryCard that cycles through different states
 * Demonstrates repository health states: idle (no workflows) → running (in progress) → passed (successful)
 * Used on the marketing page to showcase the repository health tracking feature
 */
export default function RepositoryCardPreview({
  stateDuration = 3000,
  autoPlay = true,
  initialState = 'idle'
}: RepositoryCardPreviewProps) {
  const [currentState, setCurrentState] = useState<CardState>(initialState);

  // Mock repository data - different repos for variety
  const mockRepos = {
    idle: {
      repoSlug: "omnilens/api",
      repoPath: "omnilens/api",
      displayName: "omnilens/api",
      avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
      htmlUrl: "https://github.com/omnilens/api",
      visibility: 'public' as const,
    },
    running: {
      repoSlug: "omnilens/web",
      repoPath: "omnilens/web",
      displayName: "omnilens/web",
      avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
      htmlUrl: "https://github.com/omnilens/web",
      visibility: 'public' as const,
    },
    passed: {
      repoSlug: "omnilens/mobile",
      repoPath: "omnilens/mobile",
      displayName: "omnilens/mobile",
      avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
      htmlUrl: "https://github.com/omnilens/mobile",
      visibility: 'public' as const,
    },
    warning: {
      repoSlug: "omnilens/legacy",
      repoPath: "omnilens/legacy",
      displayName: "omnilens/legacy",
      avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
      htmlUrl: "https://github.com/omnilens/legacy",
      visibility: 'private' as const,
    },
  };

  const mockRepo = mockRepos[currentState];

  // Auto-cycle through card states
  useEffect(() => {
    if (!autoPlay) return;

    const states: CardState[] = ['idle', 'running', 'passed', 'warning'];
    let currentIndex = states.indexOf(initialState);

    const stateInterval = setInterval(() => {
      setCurrentState(states[currentIndex]);
      currentIndex = (currentIndex + 1) % states.length;
    }, stateDuration);

    return () => {
      clearInterval(stateInterval);
    };
  }, [autoPlay, stateDuration, initialState]);

  // Get metrics based on current state
  const getMetrics = () => {
    switch (currentState) {
      case 'idle':
        // Scenario 1: No workflows (leave as is)
        return {
          hasWorkflows: false,
          metrics: null
        };
      case 'running':
        // Scenario 2: Workflows exist but nothing ran - 5 workflows
        return {
          hasWorkflows: true,
          metrics: {
            totalWorkflows: 5,
            passedRuns: 0,
            failedRuns: 0,
            inProgressRuns: 0,
            successRate: 0
          }
        };
      case 'passed':
        // Scenario 3: Workflows are running - 5 workflows, 5 passed, 5 currently running
        return {
          hasWorkflows: true,
          metrics: {
            totalWorkflows: 5,
            passedRuns: 5,
            failedRuns: 0,
            inProgressRuns: 5,
            successRate: 100
          }
        };
      case 'warning':
        // Scenario 4: All workflows ran twice - 5 workflows, 10 passed
        return {
          hasWorkflows: true,
          metrics: {
            totalWorkflows: 5,
            passedRuns: 10,
            failedRuns: 0,
            inProgressRuns: 0,
            successRate: 100
          }
        };
    }
  };

  const { hasWorkflows, metrics } = getMetrics();

  return (
    <div 
      className="w-full h-full"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div 
        className="h-full"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <RepositoryCard
          {...mockRepo}
          hasError={false}
          hasWorkflows={hasWorkflows}
          metrics={metrics || undefined}
        />
      </div>
    </div>
  );
}

