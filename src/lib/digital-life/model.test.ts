import { describe, expect, it } from "vitest";
import { buildDigitalLifeModel, digitalLifeRulesSchema, digitalLifeModelSchema } from "./model";
import { digitalLifeInput, digitalLifeRules, ids } from "./test-fixtures";

describe("versioned digital-life model boundary", () => {
  it("freezes all fourteen profile dimensions and preserves roles, classifications and safe sources", () => {
    const input = digitalLifeInput();
    const result = buildDigitalLifeModel(input, digitalLifeRules());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(digitalLifeModelSchema.safeParse(result.model).success).toBe(true);
    expect(new Set(result.model.background.map(item => item.dimension)).size).toBe(14);
    expect(result.model.background).toContainEqual(expect.objectContaining({ sourceKey: "lifeModelDomains.identity.1", classification: "fact", value: "承担长期照护责任", usage: "background_only" }));
    expect(result.model.agents.map(item => item.role)).toEqual(["user_core", "npc", "user_variant"]);
    expect(result.model.agents[2].strategyStatus).toBe("explicit");
    input.realityProfileSnapshot.profile.lifeModelDomains.identity[0].value = "后来的修订";
    expect(JSON.stringify(result.model)).not.toContain("后来的修订");
  });

  it("does not invent strategies, commitments or causal rules from free profile text", () => {
    const result = buildDigitalLifeModel(digitalLifeInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.rules.actions).toEqual([]);
    expect(result.model.agents[2].strategyStatus).toBe("not_defined");
    expect(result.model.background.every(item => item.usage === "background_only")).toBe(true);
  });

  it.each([
    ["unconfirmed NPC response", () => { const rules = digitalLifeRules(); rules.actions[1].confirmedForSimulation = false; return rules; }],
    ["third-party intention as fact", () => { const rules = digitalLifeRules(); rules.actions[1].classification = "fact"; return rules; }],
    ["unknown action", () => ({ ...digitalLifeRules(), symbolicAction: "control_world" })],
    ["foreign graph", () => ({ ...digitalLifeRules(), graphSnapshotId: ids.seed })],
    ["stale profile", () => ({ ...digitalLifeRules(), profileRevision: 1 })],
    ["dangling participant", () => { const rules = digitalLifeRules(); rules.actions[0].actorKey = "person-9"; return rules; }],
    ["cross-path response", () => { const rules = digitalLifeRules(); rules.actions[1].pathKey = "person-3"; return rules; }],
    ["NPC strategy", () => { const rules = digitalLifeRules(); rules.strategies[0].participantKey = "person-2"; return rules; }],
    ["private source text", () => { const rules = digitalLifeRules(); rules.actions[0].evidenceSummary = "secret api_key"; return rules; }],
  ])("rejects %s atomically", (_label, rules) => {
    expect(buildDigitalLifeModel(digitalLifeInput(), rules()).ok).toBe(false);
  });

  it("rejects unknown schema versions and more than two strategy worlds", () => {
    expect(digitalLifeRulesSchema.safeParse({ ...digitalLifeRules(), version: "next" }).success).toBe(false);
    expect(digitalLifeRulesSchema.safeParse({ ...digitalLifeRules(), strategies: Array(3).fill(digitalLifeRules().strategies[0]) }).success).toBe(false);
  });
});
