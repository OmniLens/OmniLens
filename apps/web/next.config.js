import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { withSentryConfig } from '@sentry/nextjs/config';

// Get the directory of this config file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);

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

export default withSentryConfig(nextConfig, {
  org: 'durable-quality',
  project: 'javascript-nextjs',
  sentryUrl: 'https://de.sentry.io',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  ...(hasSentryAuthToken
    ? { widenClientFileUpload: true }
    : {
        sourcemaps: {
          disable: true,
        },
      }),
});
