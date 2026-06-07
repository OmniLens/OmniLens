import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

// Integration-test config: exercises the real lib/db-storage.ts query layer
// against a live PostgreSQL instance. Kept SEPARATE from vitest.config.ts so the
// pure-unit suite (test:unit) stays fast and database-free in CI.
//
// Locally this reads DB_* from apps/web/.env; in CI the workflow injects them
// (dotenv does not override already-set process.env vars).
loadEnv({ path: resolve(__dirname, ".env") });

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" -> "./*" path mapping (apps/web root).
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    // DB round-trips (the 12-repo limit test inserts 12 rows) plus cold CI
    // Postgres start-up need more headroom than the 5s default.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Integration tests share one Postgres instance and seed/clean by user id;
    // run files serially to avoid cross-file contention on a cold connection.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["lib/db-storage.ts"],
      reporter: ["text", "html", "json", "lcov"],
    },
  },
});
