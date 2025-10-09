import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import packageJson from "../package.json";

interface VersionIndicatorProps {
  version?: string;
}

export function VersionIndicator({ version = packageJson.version }: VersionIndicatorProps) {
  return (
    <Link 
      href="/changelog"
      className="fixed bottom-4 left-4 z-50 transition-all duration-200 hover:scale-105"
      title="View changelog"
    >
      <Badge 
        variant="outline" 
        className="bg-background/80 backdrop-blur-sm border-border/50 text-muted-foreground hover:text-foreground hover:border-border font-mono text-xs px-2 py-1"
      >
        v{version}-alpha
      </Badge>
    </Link>
  );
}
