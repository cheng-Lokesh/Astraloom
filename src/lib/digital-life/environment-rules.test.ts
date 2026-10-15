import { describe, expect, it } from "vitest";
import { buildDigitalLifeModel, digitalLifeRulesSchema } from "./model";
import { canonicalModelDraftJson, saveDigitalLifeModelDraftSchema } from "./model-draft";
import { digitalLifeInput, digitalLifeRules, ids } from "./test-fixtures";

function environmentModel() {
  const input = digitalLifeInput();
  input.realityProfileSnapshot.profile.externalVariables = [{
    value: "家庭支持尚未确定", classification: "fact", evidenceSummary: "本人记录的当前安排",
  }];
  return input;
}

function environmentRules() {
  return {
    version: "digital-life-rules-v2", graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2,
    strategies: [],
    actions: [{
      key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 1 },
      operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: "家庭支持可用" },
      classification: "assumption", confirmedForSimulation: true,
      evidenceSummary: "本人声明的条件情景，不代表本人控制现实环境",
    }],
  };
}

describe("explicit environment-condition version boundary", () => {
  it("accepts a confirmed v2 environment scenario at a later legal cycle", () => {
    const rules = environmentRules();
    expect(digitalLifeRulesSchema.safeParse(rules).success).toBe(true);
    const result = buildDigitalLifeModel(environmentModel(), rules);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.version).toBe("digital-life-model-v2");
    expect(result.model.rules).toEqual(rules);
    expect(new Set(result.model.background.map(item => item.dimension)).size).toBe(14);
    expect(result.model.background.every(item => item.usage === "background_only")).toBe(true);
    expect(result.model.background.find(item => item.sourceKey === "externalVariables.1")).toMatchObject({
      value: "家庭支持尚未确定", classification: "fact", usage: "background_only",
    });
    expect(result.model.background.some(item => item.value === "家庭支持可用")).toBe(false);
  });

  it("saves v2 rules only unconfirmed against a separately versioned source context", () => {
    const rules = environmentRules();
    const request = {
      version: "digital-life-model-draft-v2", expectedRevision: 0,
      idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", horizonDays: 30,
      sourceContext: {
        version: "digital-life-model-draft-source-v2", signature: "a".repeat(64),
        modelContext: {
          graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2,
          agents: [{ key: "person-1", label: "本人", role: "user_core" }], relationships: [], resources: [],
          variables: [{ key: "external-variable-1", category: "external_variable", label: "外部变量", value: "家庭支持尚未确定", classification: "fact", evidenceSummary: "本人记录的当前安排" }],
        },
      },
      draftRules: { ...rules, actions: rules.actions.map(action => ({ ...action, confirmedForSimulation: false })) },
    };
    const parsed = saveDigitalLifeModelDraftSchema.safeParse(request);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual(request);
    expect(canonicalModelDraftJson(parsed.data)).toBe(canonicalModelDraftJson(request));
    expect(saveDigitalLifeModelDraftSchema.safeParse({ ...request, draftRules: rules }).success).toBe(false);
  });

  it.each([
    ["a condition labelled as fact", () => { const rules = environmentRules(); rules.actions[0].classification = "fact"; return rules; }],
    ["an unconfirmed condition", () => { const rules = environmentRules(); rules.actions[0].confirmedForSimulation = false; return rules; }],
    ["an NPC claiming to control the condition", () => { const rules = environmentRules(); rules.actions[0].actorKey = "person-2"; return rules; }],
    ["a missing variable", () => { const rules = environmentRules(); rules.actions[0].operation.variableKey = "external-variable-8"; return rules; }],
    ["an unchanged alternative", () => { const rules = environmentRules(); rules.actions[0].operation.value = "家庭支持尚未确定"; return rules; }],
    ["private intention disguised as environment", () => { const rules = environmentRules(); rules.actions[0].operation.value = "对方内心真实想法已经确定"; return rules; }],
    ["a new condition smuggled into v1", () => ({ ...environmentRules(), version: "digital-life-rules-v1" })],
  ])("rejects %s without mutating the source", (_label, makeRules) => {
    const input = environmentModel();
    const before = JSON.stringify(input);
    expect(buildDigitalLifeModel(input, makeRules()).ok).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("keeps a legacy v1 rule payload and model unchanged after JSON transport", () => {
    const input = environmentModel();
    const rules = digitalLifeRules();
    const before = JSON.stringify({ input, rules });
    const original = buildDigitalLifeModel(input, rules);
    const reloaded = buildDigitalLifeModel(JSON.parse(JSON.stringify(input)), JSON.parse(JSON.stringify(rules)));
    expect(original.ok).toBe(true);
    expect(reloaded).toEqual(original);
    if (!original.ok) return;
    expect(original.model.version).toBe("digital-life-model-v1");
    expect(original.model.rules).toEqual(rules);
    expect(JSON.stringify(original.model.rules)).toBe(JSON.stringify(rules));
    expect(JSON.stringify({ input, rules })).toBe(before);
  });
});
