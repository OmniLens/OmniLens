"use client";

import { usePathname } from 'next/navigation';
import { VersionIndicator } from './VersionIndicator';
import packageJson from 'package.json';

export default function ConditionalVersionIndicator() {
  const pathname = usePathname();

  // Hide version indicator on the landing page (root path)
  if (pathname === '/') {
    return null;
  }

  // Get version directly from package.json
  const version = packageJson.version;

  return <VersionIndicator version={version} />;
}
