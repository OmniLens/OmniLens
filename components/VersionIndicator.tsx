interface VersionIndicatorProps {
  version?: string;
}

export function VersionIndicator({ version = '0.7.5' }: VersionIndicatorProps) {
  return (
    <div className="fixed bottom-4 left-4 z-50 text-xs text-muted-foreground font-mono">
      v{version}
    </div>
  );
}
