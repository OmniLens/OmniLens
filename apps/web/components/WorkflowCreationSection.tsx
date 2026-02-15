"use client";

// External library imports
import { LayoutTemplate, Scan, GitMerge, ChevronRight } from "lucide-react";

// Internal component imports
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import GetStartedButton from "@/components/GetStartedButton";

// ============================================================================
// Type Definitions
// ============================================================================

type StepColorTheme = "amber" | "sky" | "emerald";

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorTheme: StepColorTheme;
}

const STEP_BORDER_COLORS: Record<StepColorTheme, string> = {
  amber: "border-amber-500",
  sky: "border-sky-500",
  emerald: "border-emerald-500",
};

const STEP_GRADIENT_CLASSES: Record<StepColorTheme, string> = {
  amber: "from-amber-600 to-amber-700 shadow-amber-500/25",
  sky: "from-sky-500 to-sky-600 shadow-sky-500/25",
  emerald: "from-emerald-600 to-emerald-700 shadow-emerald-500/25",
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * StepCard - Displays a single step in the workflow creation process
 * Uses amber, sky, emerald to differentiate from Core Capabilities (green, blue, purple)
 */
function StepCard({ icon, title, description, colorTheme }: StepCardProps) {
  return (
    <Card className={`border-2 ${STEP_BORDER_COLORS[colorTheme]} bg-card h-full`}>
      <CardHeader>
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={`w-14 h-14 bg-gradient-to-br ${STEP_GRADIENT_CLASSES[colorTheme]} rounded-xl flex items-center justify-center flex-shrink-0 text-white [&_svg]:text-white shadow-lg`}
          >
            {icon}
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              {title}
            </CardTitle>
            <p className="text-gray-300 leading-relaxed">{description}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowCreationSection component
 * Marketing section for "From Zero to CI/CD" - targets users without workflows
 * Placed between Core Capabilities and Start Monitoring CTA sections
 */
export default function WorkflowCreationSection() {
  const steps = [
    {
      icon: <LayoutTemplate className="h-7 w-7" />,
      title: "Choose Template",
      description:
        "Pick from pre-built templates for Node.js testing, building, deployment, and code quality. Supports npm, yarn, pnpm, and bun.",
      colorTheme: "amber" as const,
    },
    {
      icon: <Scan className="h-7 w-7" />,
      title: "Preview Workflow",
      description:
        "See exactly what you're creating before deploying. Preview the complete workflow file with inline explanations.",
      colorTheme: "sky" as const,
    },
    {
      icon: <GitMerge className="h-7 w-7" />,
      title: "Deploy via PR",
      description:
        "Review and activate with a single merge. We create a pull request—you stay in control. No blind automation.",
      colorTheme: "emerald" as const,
    },
  ];

  return (
    <section
      className="relative px-6 md:px-12 lg:px-16 xl:px-24 py-12"
      aria-labelledby="workflow-creation-heading"
    >
      <div className="w-full max-w-[1920px] mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            id="workflow-creation-heading"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            From Zero to CI/CD in 60 Seconds
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Don&apos;t have GitHub Actions workflows yet? No problem. OmniLens
            helps you create your first workflow with pre-built templates for
            testing, building, and deploying.
          </p>
          <GetStartedButton
            href="/login"
            variant="workflow"
            className="inline-flex"
          >
            Create Your First Workflow
          </GetStartedButton>
        </div>

        {/* Steps Grid - Full width like Core Capabilities, with arrow connectors */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-8 items-stretch">
          {steps.map((step, index) => (
            <div key={index} className="contents">
              <StepCard
                icon={step.icon}
                title={step.title}
                description={step.description}
                colorTheme={step.colorTheme}
              />
              {index < steps.length - 1 && (
                <div
                  className="hidden lg:flex items-center justify-center text-gray-500 flex-shrink-0"
                  aria-hidden
                >
                  <ChevronRight className="h-6 w-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
