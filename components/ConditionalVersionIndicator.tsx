"use client";

import { usePathname } from 'next/navigation';
import { VersionIndicator } from './VersionIndicator';

export default function ConditionalVersionIndicator() {
  const pathname = usePathname();
  
  // Hide version indicator on the landing page (root path)
  if (pathname === '/') {
    return null;
  }
  
  return <VersionIndicator version="0.7.3" />;
}
