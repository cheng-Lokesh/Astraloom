import { describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "./runtime";
import { projectFormalSandboxResult } from "./result-projection.server";

describe("formal digital-life path integration", () => {
  it("runs main action, confirmed conditional NPC response and independent strategy worlds through canonical transitions", async () => {
    const result = await buildFormalSandboxRunV2({ ...digitalLifeInput(), digitalLifeRules: digitalLifeRules() });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bundle = result.bundle as typeof result.bundle & { strategyPaths: { paths: Array<{ key: string; bundle: typeof result.bundle }> } };
    const baseline = bundle.worldSnapshots[0];
    expect(bundle.events.map(event => event.eventType)).toContain("request_information");
    const response = bundle.events.find(event => event.eventType === "update_relation_signal");
    expect(response?.deltas).toContainEqual(expect.objectContaining({ valueType: "relation", before: "neutral", after: "positive" }));
    expect(response?.priorWorldEventIds.length).toBeGreaterThan(0);
    expect(response?.causalAssumptionIds.length).toBeGreaterThan(0);
    const variant = bundle.strategyPaths.paths[0].bundle;
    expect(variant.worldSnapshots[0].resources[0].available).toBe(6);
    expect(baseline.resources[0].available).toBe(7);
    expect(variant.events.map(event => event.eventType)).toContain("update_commitment");
    expect(variant.events.map(event => event.eventType)).not.toContain("request_information");
    const baselineEventIds = new Set(bundle.events.map(event => event.id));
    expect(variant.events.every(event => !baselineEventIds.has(event.id))).toBe(true);
    expect(variant.claims.every(claim => claim.simulationEventIds.every(id => variant.events.some(event => event.id === id)))).toBe(true);
    const projection = projectFormalSandboxResult(bundle);
    expect(projection).not.toBeNull();
    expect(JSON.stringify(projection)).toContain("承担长期照护责任");
    expect(JSON.stringify(projection)).toContain("simulation_change");
    expect(JSON.stringify(projection)).not.toMatch(/11111111-1111|seed:self|seed:person|agent_definition_v2_/);
    const damaged = structuredClone(bundle);
    damaged.strategyPaths.paths[0].bundle.claims[0].simulationEventIds = [bundle.events[0].id];
    expect(projectFormalSandboxResult(damaged)).toBeNull();
  }, 60_000);

  it("freezes digital life for legacy resource-only requests and retains old-result compatibility", async () => {
    const input = digitalLifeInput();
    input.agents = input.agents.slice(0, 2);
    const result = await buildFormalSandboxRunV2(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const projection = projectFormalSandboxResult(result.bundle);
    expect(projection).not.toBeNull();
    expect(JSON.stringify(projection)).toContain("background_only");
    const legacy = structuredClone(result.bundle);
    delete (legacy.inputSnapshot as Record<string, unknown>).digitalLifeModel;
    delete (legacy as Record<string, unknown>).strategyPaths;
    expect(JSON.stringify(projectFormalSandboxResult(legacy))).toContain("not_recorded");
  }, 30_000);
});
