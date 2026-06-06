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
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    env: {
      TZ: "UTC",
    },
    coverage: {
      provider: "v8",
      include: [
        "lib/utils.ts",
        "lib/github.ts",
        "lib/admin-auth.ts",
        "components/dashboard/run-ui.tsx",
      ],
      reporter: ["text", "html", "json", "lcov"],
    },
  },
});
