import { describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "./runtime";

describe("formal durable outcome prerequisite", () => {
  it("returns the complete canonical pre-lock history for atomic durable storage", async () => {
    const result = await buildFormalSandboxRunV2({ ...digitalLifeInput(), digitalLifeRules: digitalLifeRules() });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bundle = result.bundle as unknown as { forecastPersistenceHistory?: Array<{ artifact: { kind: string; value: { sourceSnapshots: unknown } }; version: number }> };
    expect(bundle.forecastPersistenceHistory).toHaveLength(1);
    expect(bundle.forecastPersistenceHistory?.[0]?.artifact.kind).toBe("forecast_lock");
    expect(bundle.forecastPersistenceHistory?.[0]?.version).toBe(1);
  }, 60_000);
});
