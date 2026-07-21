import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { realityBoundaryV2 } from "../agent-world/test-fixtures";
import { buildScenarioFrequencyClaimsV2 } from "./claim-builder";

describe("Stage 6 scope and ledger boundary", () => {
  it("contains only synchronous application logic and no later-stage or external infrastructure", () => {
    const directory = join(process.cwd(), "src", "lib", "v2", "claims-reports");
    const production = readdirSync(directory)
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
      .map((file) => readFileSync(join(directory, file), "utf8"))
      .join("\n");
    expect(production).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|async|await|setTimeout|setInterval)\b/);
    expect(production).not.toMatch(/supabase|database|persistence|backtesting|calibration|stripe|openai|deepseek|llm/i);
    expect(production).not.toMatch(/\.\.\/\.\.\/|src\/types\/(claim|report)/);
  });

  it("never writes Real Evidence and Simulation Events into one ledger", () => {
    const value = realityBoundaryV2();
    const boundary = {
      seedContextId: value.seedContextId, schemaVersion: value.schemaVersion, revision: value.revision,
      evidenceLedger: value.evidenceLedger, assumptionLedger: value.assumptionLedger,
      createdAt: value.createdAt, updatedAt: value.updatedAt,
    };
    expect(boundary.evidenceLedger.items.every((item) => item.id.startsWith("real_evidence_v2_"))).toBe(true);
    expect(JSON.stringify(boundary.evidenceLedger)).not.toContain("world_event_v2_");
    expect(buildScenarioFrequencyClaimsV2({ analysis: null, realityBoundary: boundary })).not.toHaveProperty("evidenceLedger");
  });
});
