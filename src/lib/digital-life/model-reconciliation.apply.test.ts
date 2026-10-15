import { describe, expect, it } from "vitest";
import { applyModelReconciliation, type ModelReconciliationInput } from "./model-reconciliation";
import { digitalLifeModelDraftSchema, preparedModelDraftSourceSchema, modelReconciliationSchema } from "./model-draft";
import { ids } from "./test-fixtures";

function fixture(): ModelReconciliationInput {
  const context = { graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, agents: [{ key: "person-1", label: "本人", role: "user_core" }, { key: "person-2", label: "谨慎分身", role: "user_variant" }], relationships: [], resources: [{ key: "resource-1", label: "可投入时间", available: 8, minimum: 1, maximum: 20, unit: "小时", usePerTick: null, classification: "fact", evidenceSummary: "本人记录" }], variables: [{ key: "external-variable-1", category: "external_variable", label: "外部变量", value: "安排待定", classification: "fact", evidenceSummary: "本人记录" }] };
  const base = { classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人声明的情景条件" };
  const rules = { version: "digital-life-rules-v2", graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, strategies: [{ participantKey: "person-2", label: "谨慎准备", confirmedForSimulation: false, evidenceSummary: "本人明确选择的平行策略" }], actions: [
    { ...base, key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: "支持可用" } },
    { ...base, key: "rule-2", pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: "rule-1" }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: 7 } },
    { ...base, key: "rule-3", pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: "rule-2" }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留本人原承诺", status: "active", profileEntryKey: "goals.1" } },
    { ...base, key: "rule-4", pathKey: "person-2", actorKey: "person-2", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: 2 } },
  ] };
  const oldSource = { version: "digital-life-model-draft-source-v2", signature: "a".repeat(64), modelContext: context };
  const preparedSourceContext = preparedModelDraftSourceSchema.parse({ ...oldSource, signature: "b".repeat(64), modelContext: { ...context, profileRevision: 3, resources: [{ ...context.resources[0], label: "新增休息时间", available: 4 }, { ...context.resources[0], key: "resource-2", available: 6 }], variables: [{ ...context.variables[0], value: "支持仍待协调" }] } });
  const draft = digitalLifeModelDraftSchema.parse({ version: "digital-life-model-draft-v2", status: "stale", currentRevision: 3, horizonDays: 30, sourceContext: oldSource, currentSourceContext: preparedSourceContext, draftRules: rules });
  const reconciliation = modelReconciliationSchema.parse({ version: "digital-life-model-reconciliation-v1", draftRevision: 3, horizonDays: 30, sourceRules: rules, requirements: [{ ruleKey: "rule-1", kind: "variable", previousSelector: "external-variable-1" }, { ruleKey: "rule-2", kind: "resource", previousSelector: "resource-1" }, { ruleKey: "rule-3", kind: "detach_profile_entry", previousSelector: "goals.1" }, { ruleKey: "rule-4", kind: "resource", previousSelector: "resource-1" }], permissionsReset: { planning: true, symbolic: true, outcomeCalibration: true, requestIdentity: true } });
  return { draft, reconciliation, preparedSourceContext, resolutions: { "rule-1": { kind: "variable", variableKey: "external-variable-1", value: "支持已经安排" }, "rule-2": { kind: "resource", resourceKey: "resource-2", amount: 2 }, "rule-3": { kind: "detach_profile_entry" }, "rule-4": { kind: "resource", resourceKey: "resource-2", amount: 2 } } };
}

describe("explicit model reconciliation application", () => {
  it("uses only explicit selectors after reordering, preserves strategies and text, resets every permission and leaves old draft immutable", () => {
    const input = fixture(); const before = JSON.stringify(input);
    const result = applyModelReconciliation(input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.errorCode);
    expect(result.expectedRevision).toBe(3);
    expect(result.draftRules.profileRevision).toBe(3);
    expect(result.draftRules.actions[1].operation).toEqual({ actionType: "allocate_resource", resourceKey: "resource-2", amount: 2 });
    expect(result.draftRules.actions[2].operation).toEqual({ actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留本人原承诺", status: "active" });
    expect(result.draftRules.actions.every(action => action.confirmedForSimulation === false)).toBe(true);
    expect(result.draftRules.strategies).toEqual(input.draft.draftRules!.strategies);
    expect(result.permissionsReset).toEqual(input.reconciliation.permissionsReset);
    expect(JSON.stringify(input)).toBe(before);
  });
  it("does not infer current ordinal or name from a missing explicit resource choice", () => {
    const input = fixture(); delete input.resolutions["rule-2"];
    expect(applyModelReconciliation(input)).toMatchObject({ ok: false, errorCode: "reconciliation_incomplete", unresolvedRuleKeys: ["rule-2"] });
  });
  it.each(["budget", "baseline", "empty", "unknown", "unknown_variable", "wrong_kind"])("fails closed for %s resolutions", kind => {
    const input = fixture();
    if (kind === "budget") input.resolutions["rule-2"] = { kind: "resource", resourceKey: "resource-2", amount: 7 };
    if (kind === "baseline") input.resolutions["rule-1"] = { kind: "variable", variableKey: "external-variable-1", value: "支持仍待协调" };
    if (kind === "empty") input.resolutions["rule-2"] = { kind: "resource", resourceKey: "resource-2", amount: Number.NaN };
    if (kind === "unknown") input.resolutions["rule-99"] = { kind: "remove" };
    if (kind === "unknown_variable") input.resolutions["rule-1"] = { kind: "variable", variableKey: "pressure-8", value: "当前未记录的条件" };
    if (kind === "wrong_kind") input.resolutions["rule-3"] = { kind: "resource", resourceKey: "resource-2", amount: 1 };
    expect(applyModelReconciliation(input)).toMatchObject({ ok: false, errorCode: "invalid_reconciliation" });
  });
  it("cascades removed predecessors and drops a variant strategy when its final self action is removed", () => {
    const input = fixture(); input.resolutions = { "rule-1": { kind: "remove" }, "rule-4": { kind: "remove" } };
    const result = applyModelReconciliation(input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.errorCode);
    expect(result.draftRules.actions).toEqual([]); expect(result.draftRules.strategies).toEqual([]);
  });
  it("rejects a forged or mismatched unresolved plan instead of trusting a skipped requirement", () => {
    const input = fixture(); input.reconciliation.requirements = []; input.resolutions = {};
    expect(applyModelReconciliation(input)).toMatchObject({ ok: false, errorCode: "invalid_reconciliation" });
  });
  it.each(["revision", "source_rules", "graph", "agents", "relationships", "profile", "current_source"])("rejects a forged %s binding without creating a saveable draft", kind => {
    const input = fixture();
    if (kind === "revision") input.reconciliation.draftRevision++;
    if (kind === "source_rules") input.reconciliation.sourceRules.actions[0].evidenceSummary = "已经改写旧意图";
    if (kind === "graph") input.preparedSourceContext.modelContext.graphSnapshotId = ids.npc;
    if (kind === "agents") input.preparedSourceContext.modelContext.agents.reverse();
    if (kind === "relationships") input.preparedSourceContext.modelContext.relationships.push({ key: "relation-1", label: "新增关系", fromPersonKey: "person-1", toPersonKey: "person-2" });
    if (kind === "profile") input.preparedSourceContext.modelContext.profileRevision = 2;
    if (kind === "current_source") input.preparedSourceContext.signature = "c".repeat(64);
    expect(applyModelReconciliation(input)).toMatchObject({ ok: false, errorCode: "invalid_reconciliation" });
  });
  it("explicitly carries a saved v1 intention into v2 without changing or inventing its old background fields", () => {
    const input = fixture();
    const legacy = (source: NonNullable<typeof input.draft.sourceContext>) => {
      const modelContext = { ...source.modelContext }; delete (modelContext as { variables?: unknown }).variables;
      return { signature: source.signature, modelContext };
    };
    const rules = structuredClone(input.reconciliation.sourceRules);
    rules.version = "digital-life-rules-v1";
    rules.actions = rules.actions.filter(action => action.key !== "rule-1");
    rules.actions[0].when = { kind: "at_tick", tickIndex: 0 };
    input.draft = digitalLifeModelDraftSchema.parse({ ...input.draft, version: "digital-life-model-draft-v1", sourceContext: legacy(input.draft.sourceContext!), currentSourceContext: legacy(input.preparedSourceContext), draftRules: rules });
    input.reconciliation.sourceRules = rules;
    input.reconciliation.requirements = input.reconciliation.requirements.filter(item => item.ruleKey !== "rule-1");
    delete input.resolutions["rule-1"];
    const before = JSON.stringify(input.draft);
    const result = applyModelReconciliation(input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.errorCode);
    expect(result.draftRules.version).toBe("digital-life-rules-v2");
    expect(JSON.stringify(input.draft)).toBe(before);
    expect(result.draftRules.actions[1].operation).not.toHaveProperty("profileEntryKey");
  });
});
