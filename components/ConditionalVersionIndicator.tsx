"use client";

import { usePathname } from 'next/navigation';
import { VersionIndicator } from './VersionIndicator';

export default function ConditionalVersionIndicator() {
  const pathname = usePathname();

  // Hide version indicator on the landing page (root path)
  if (pathname === '/') {
    return null;
  }

  // Get version from package.json
  const version = process.env.npm_package_version;

  return <VersionIndicator version={version} />;
}
