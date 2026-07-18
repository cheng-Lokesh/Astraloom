import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: [
        "src/lib/seed-context/storage.ts",
        "src/lib/people/extract.ts",
        "src/lib/agents/build.ts",
        "src/lib/relations/build.ts",
        "src/lib/simulation/branch-policy.ts",
        "src/lib/simulation/tick-policy.ts",
        "src/lib/simulation/edge-update-rules.ts",
        "src/lib/simulation/event-policy.ts",
        "src/lib/simulation/confidence-scoring.ts",
        "src/lib/simulation/simulation-engine.ts",
        "src/lib/claims/build.ts",
        "src/lib/reports/free-preview-policy.ts",
        "src/lib/reports/paid-report-policy.ts",
        "src/lib/reports/strategy-builder.ts",
        "src/lib/reports/report-engine.ts",
        "src/lib/safety/safety-rules.ts",
        "src/lib/safety/safety-verifier.ts",
        "src/lib/calibration/apply-feedback-to-next-run.ts",
      ],
      reporter: ["text", "json-summary"],
      reportsDirectory: "coverage/v1-baseline",
    },
  },
});
