import { readFileSync } from 'fs';
import { join } from 'path';

export function VersionIndicator() {
  // Read package.json at build time
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  return (
    <div className="fixed bottom-4 left-4 z-50 text-xs text-muted-foreground font-mono">
      v{version}
    </div>
  );
}
