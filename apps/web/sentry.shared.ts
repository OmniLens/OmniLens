/**
 * Shared Sentry configuration for client, server, and edge runtimes.
 */

/** Public DSN (safe to commit as fallback). */
export const SENTRY_DSN_FALLBACK =
  "https://73133ba25d569f57f6a2ae0af9c96335@o4510091891769344.ingest.de.sentry.io/4510091896815696";

/**
 * Resolves the Sentry DSN from env vars with a committed fallback.
 */
export function getSentryDsn(): string {
  return (
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    process.env.SENTRY_DSN ??
    SENTRY_DSN_FALLBACK
  );
}

/**
 * Whether events should be sent to Sentry (production only).
 * Vercel preview/development and local dev are excluded.
 */
export function isSentryEnabled(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) {
    return vercelEnv === "production";
  }
  return process.env.NODE_ENV === "production";
}

/**
 * Sentry environment tag (Vercel env on Vercel, otherwise NODE_ENV).
 */
export function getSentryEnvironment(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

/**
 * Release identifier for grouping deploys in Sentry.
 */
export function getSentryRelease(): string | undefined {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.SENTRY_RELEASE ??
    process.env.GIT_COMMIT ??
    process.env.COMMIT_SHA ??
    undefined
  );
}

/** Common {@link @sentry/nextjs} init options for all runtimes. */
export function getBaseSentryInitOptions() {
  const enabled = isSentryEnabled();
  return {
    dsn: enabled ? getSentryDsn() : undefined,
    enabled,
    environment: getSentryEnvironment(),
    release: getSentryRelease(),
    tracesSampleRate: enabled ? 0.2 : 0,
  };
}
