import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of this config file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Set Turbopack root to workspace root to avoid lockfile detection warning
  // This is a monorepo with lockfiles at both root and app level
  turbopack: {
    root: resolve(__dirname, '../../'),
  },
  images: {
    qualities: [100, 75],
  },
};

export default nextConfig;