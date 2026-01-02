// External library imports
import { LucideIcon } from "lucide-react";

// Type imports
// (No external type imports used in this component)

// Internal component imports
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

// Utility imports
// (No utility functions used in this component)

// ============================================================================
// Type Definitions
// ============================================================================

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  colorTheme: 'green' | 'blue' | 'purple' | 'orange';
}

// ============================================================================
// Component-Specific Utilities
// ============================================================================

/**
 * Get the border color class based on the color theme
 */
function getBorderColor(theme: FeatureCardProps['colorTheme']): string {
  switch (theme) {
    case 'green':
      return 'border-green-500';
    case 'blue':
      return 'border-blue-500';
    case 'purple':
      return 'border-purple-500';
    case 'orange':
      return 'border-orange-500';
    default:
      return 'border-border';
  }
}

/**
 * Get the gradient background classes based on the color theme
 */
function getGradientClasses(theme: FeatureCardProps['colorTheme']): string {
  switch (theme) {
    case 'green':
      return 'from-green-600 to-green-700 shadow-green-500/25';
    case 'blue':
      return 'from-blue-600 to-blue-700 shadow-blue-500/25';
    case 'purple':
      return 'from-purple-800 to-purple-900 shadow-purple-800/25';
    case 'orange':
      return 'from-orange-600 to-orange-700 shadow-orange-500/25';
    default:
      return 'from-gray-600 to-gray-700 shadow-gray-500/25';
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * FeatureCard component
 * Displays a feature card with icon, title, and description
 * Supports different color themes for visual variety
 */
export default function FeatureCard({ icon: Icon, title, description, colorTheme }: FeatureCardProps) {
  return (
    <Card className={`border-2 ${getBorderColor(colorTheme)} bg-card h-full`}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 bg-gradient-to-br ${getGradientClasses(colorTheme)} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-white mb-2">
              {title}
            </CardTitle>
            <p className="text-gray-300 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
