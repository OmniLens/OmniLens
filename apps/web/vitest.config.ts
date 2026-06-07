import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Unit-test config for pure logic in lib/ and component helpers.
// Node environment + a pinned timezone so locale/time-based assertions
// (formatRunTime, calculateHourlyBreakdown) are deterministic across machines/CI.
process.env.TZ = "UTC";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" -> "./*" path mapping (apps/web root).
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // Integration tests (*.integration.test.ts) need a live DB and run under
    // vitest.integration.config.ts — keep them out of the fast, DB-free unit run.
    exclude: ["node_modules/**", "e2e/**", ".next/**", "**/*.integration.test.ts"],
    env: {
      TZ: "UTC",
    },
    coverage: {
      provider: "v8",
      include: [
        "lib/utils.ts",
        "lib/github.ts",
        "lib/admin-auth.ts",
        "lib/auth-middleware.ts",
        "components/dashboard/run-ui.tsx",
        "app/api/**/route.ts",
      ],
      reporter: ["text", "html", "json", "lcov"],
    },
  },
});
