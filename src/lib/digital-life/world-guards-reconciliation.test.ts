import { describe, expect, it } from "vitest";
import { digitalLifeModelDraftSchema, modelReconciliationSchema, preparedModelDraftSourceSchema } from "./model-draft";
import { applyModelReconciliation, buildModelReconciliation, type ModelReconciliationInput } from "./model-reconciliation";
import { ids } from "./test-fixtures";

function fixture() {
  const resource = { minimum: 1, maximum: 12, unit: "小时", usePerTick: null, classification: "fact", evidenceSummary: "本人记录的当前额度" };
  const context = { graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, agents: [{ key: "person-1", label: "本人", role: "user_core" }], relationships: [], variables: [], resources: [{ ...resource, key: "resource-1", label: "投入时间", available: 8 }, { ...resource, key: "resource-2", label: "休息时间", available: 10 }] };
  const rules = { version: "digital-life-rules-v3", graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, strategies: [], actions: [{ key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: 2 }, guard: { kind: "resource_balance", resourceKey: "resource-2", operator: "gte", value: 8 }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人明确声明投入及休息底线" }, { key: "rule-2", pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: "rule-1" }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留原承诺", status: "active", profileEntryKey: "goals.1" }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人明确声明的承诺" }] };
  const source = { version: "digital-life-model-draft-source-v2", signature: "a".repeat(64), modelContext: context };
  const prepared = preparedModelDraftSourceSchema.parse({ ...source, signature: "b".repeat(64), modelContext: { ...context, profileRevision: 3, resources: [{ ...resource, key: "resource-1", label: "新增杂务", available: 4 }, { ...resource, key: "resource-2", label: "投入时间", available: 6 }, { ...resource, key: "resource-3", label: "休息时间", available: 7 }] } });
  const draft = digitalLifeModelDraftSchema.parse({ version: "digital-life-model-draft-v3", status: "stale", currentRevision: 3, horizonDays: 30, sourceContext: source, currentSourceContext: prepared, draftRules: rules });
  const plan = modelReconciliationSchema.parse({ version: "digital-life-model-reconciliation-v2", draftRevision: 3, horizonDays: 30, sourceRules: rules, requirements: [{ requirementKey: "rule-1:operation", ruleKey: "rule-1", role: "operation", kind: "resource", previousSelector: "resource-1" }, { requirementKey: "rule-1:guard", ruleKey: "rule-1", role: "guard", kind: "resource", previousSelector: "resource-2" }, { requirementKey: "rule-2:operation", ruleKey: "rule-2", role: "operation", kind: "detach_profile_entry", previousSelector: "goals.1" }], permissionsReset: { planning: true, symbolic: true, outcomeCalibration: true, requestIdentity: true } });
  return { draft, prepared, plan };
}

describe("guard-aware explicit reconciliation", () => {
  it("derives operation and guard requirements independently, without silently following their old ordinals", () => {
    const f = fixture(); const plan = buildModelReconciliation(f.draft, f.prepared);
    expect(plan).toMatchObject({ version: "digital-life-model-reconciliation-v2", sourceRules: f.draft.draftRules, requirements: expect.arrayContaining([{ requirementKey: "rule-1:operation", ruleKey: "rule-1", role: "operation", kind: "resource", previousSelector: "resource-1", previousLabel: "投入时间" }, { requirementKey: "rule-1:guard", ruleKey: "rule-1", role: "guard", kind: "resource", previousSelector: "resource-2", previousLabel: "休息时间" }]) });
  });
  it("keeps a guard while independently rebinding both sites, resetting confirmations and detaching unverifiable old background", () => {
    const f = fixture(); const before = JSON.stringify(f);
    const result = applyModelReconciliation({ draft: f.draft, reconciliation: f.plan, preparedSourceContext: f.prepared, resolutions: { "rule-1:operation": { kind: "resource", resourceKey: "resource-2", amount: 2 }, "rule-1:guard": { kind: "resource", resourceKey: "resource-3", operator: "gte", value: 6 }, "rule-2:operation": { kind: "detach_profile_entry" } }, removedRuleKeys: [] } as unknown as ModelReconciliationInput);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.errorCode);
    expect(result.draftRules.version).toBe("digital-life-rules-v3");
    expect(result.draftRules.actions[0]).toMatchObject({ confirmedForSimulation: false, operation: { resourceKey: "resource-2", amount: 2 }, guard: { resourceKey: "resource-3", operator: "gte", value: 6 } });
    expect(result.draftRules.actions[1].operation).not.toHaveProperty("profileEntryKey");
    expect(JSON.stringify(f)).toBe(before);
  });
  it("does not regard an operation choice as permission to move the guard selector", () => {
    const f = fixture();
    const result = applyModelReconciliation({ draft: f.draft, reconciliation: f.plan, preparedSourceContext: f.prepared, resolutions: { "rule-1:operation": { kind: "resource", resourceKey: "resource-2", amount: 2 }, "rule-2:operation": { kind: "detach_profile_entry" } }, removedRuleKeys: [] } as unknown as ModelReconciliationInput);
    expect(result).toMatchObject({ ok: false, errorCode: "reconciliation_incomplete", unresolvedRuleKeys: ["rule-1:guard"] });
  });
});
