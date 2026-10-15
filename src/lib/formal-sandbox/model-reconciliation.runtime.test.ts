import { beforeEach, describe, expect, it, vi } from "vitest";
import { digitalLifeInput, ids } from "@/lib/digital-life/test-fixtures";
import { saveDigitalLifeModelDraftSchema } from "@/lib/digital-life/model-draft";
import { saveFormalModelDraft } from "@/lib/digital-life/model-draft.server";
import { applyModelReconciliation } from "@/lib/digital-life/model-reconciliation";
import { buildDigitalLifeModel } from "@/lib/digital-life/model";
import { buildFormalSandboxRunV2 } from "./runtime";
import { projectFormalSandboxResult } from "./result-projection.server";

const state = vi.hoisted(() => ({ caller: undefined as unknown }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ ...(state.caller as object), auth: { getUser: async () => ({ data: { user: { id: "11111111-1111-4111-8111-111111111111", is_anonymous: false } }, error: null }) } }) }));
import { GET } from "@/app/api/sandbox/model-draft/route";

function fixture() {
  const oldInput = digitalLifeInput();
  const oldProfile = oldInput.realityProfileSnapshot.profile;
  oldProfile.worldInputs.resources[0].usePerTick = null;
  oldProfile.externalVariables = [{ value: "家庭支持尚未确定", classification: "fact", evidenceSummary: "本人记录的当前安排" }];
  const rules = {
    version: "digital-life-rules-v2", graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, strategies: [],
    actions: [
      { key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: "家庭支持可用" }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人声明的条件情景" },
      { key: "rule-2", pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: "rule-1" }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "先确认共同安排", status: "active", profileEntryKey: "goals.1" }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人声明的承诺" },
      { key: "rule-3", pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: "rule-2" }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: 7 }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人明确声明投入数量" },
    ],
  };
  const context = { graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, agents: oldInput.agents.map((agent, index) => ({ key: `person-${index + 1}`, label: agent.displayName, role: agent.sourceRole })), relationships: [{ key: "relation-1", label: "协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }], resources: oldProfile.worldInputs.resources.map(({ label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary }, index) => ({ key: `resource-${index + 1}`, label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary })), variables: [{ key: "external-variable-1", category: "external_variable", label: "外部变量", ...oldProfile.externalVariables[0] }] };
  const oldRequest = saveDigitalLifeModelDraftSchema.parse({ version: "digital-life-model-draft-v2", expectedRevision: 2, idempotencyKey: ids.edge, horizonDays: 30, sourceContext: { version: "digital-life-model-draft-source-v2", signature: "a".repeat(64), modelContext: context }, draftRules: rules });
  const currentInput = structuredClone(oldInput);
  const currentProfile = currentInput.realityProfileSnapshot.profile;
  currentInput.realityProfileSnapshot.revision = currentProfile.revision = 3;
  currentProfile.worldInputs.resources[0].available = 6;
  currentProfile.worldInputs.resources.unshift({ ...currentProfile.worldInputs.resources[0], key: "rest-time", label: "休息时间", available: 4 });
  currentProfile.externalVariables[0].value = "家庭支持仍待协调";
  const source = {
    signature: "c".repeat(64), signature_v2: "d".repeat(64), seed_contexts: { id: ids.seed, user_id: ids.owner }, relation_graph_snapshots: { id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.snapshot },
    agent_profiles: oldInput.agents.map(agent => ({ id: agent.id, user_id: ids.owner, seed_context_id: ids.seed, snapshot_id: ids.snapshot, display_name: agent.displayName, agent_type: agent.sourceRole, evidence_refs: agent.evidenceRefs })),
    relation_edges: oldInput.edges.map(edge => ({ id: edge.id, user_id: ids.owner, graph_snapshot_id: ids.graph, agent_snapshot_id: ids.snapshot, from_agent_id: edge.fromAgentId, to_agent_id: edge.toAgentId, relationship_type: edge.relationshipType, evidence_refs: edge.evidenceRefs })),
    reality_profiles: { id: ids.profile, user_id: ids.owner, seed_context_id: ids.seed, revision: 3, life_climate_value: null, life_climate_classification: "unknown", life_climate_evidence_summary: "明确未知", resources_value: null, resources_classification: "unknown", resources_evidence_summary: "明确未知", constraints_value: null, constraints_classification: "unknown", constraints_evidence_summary: "明确未知", life_goals: currentProfile.goals, core_values: currentProfile.values, life_themes: currentProfile.lifeThemes, pressures: currentProfile.pressures, external_variables: currentProfile.externalVariables, life_model_domains: currentProfile.lifeModelDomains, world_model_inputs: currentProfile.worldInputs },
  };
  const oldRow = { user_id: ids.owner, revision: 3, request: oldRequest };
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: { seed_context_id: ids.seed }, error: null })) };
  const db = { rpc: vi.fn(async () => ({ data: { source, current: oldRow }, error: null })), from: vi.fn(() => query) };
  return { oldInput, currentInput, oldRequest, oldRow, source, db };
}
beforeEach(() => { state.caller = fixture().db; });

describe("reconciled current model through canonical execution", () => {
  it("preserves a frozen old Run while explicit reselection carries its rules from eight hours to six without spending the new ordinal-one resource", async () => {
    const f = fixture();
    const oldConfirmed = { ...f.oldRequest.draftRules, actions: f.oldRequest.draftRules.actions.map(item => ({ ...item, confirmedForSimulation: true })) };
    const oldRun = await buildFormalSandboxRunV2({ ...f.oldInput, digitalLifeRules: oldConfirmed });
    expect(oldRun.ok).toBe(true);
    if (!oldRun.ok) throw new Error(`old canonical control failed: ${oldRun.errorCode}`);
    expect(projectFormalSandboxResult(oldRun.bundle)).not.toBeNull();
    const oldRunJson = JSON.stringify(oldRun.bundle), oldRequestJson = JSON.stringify(f.oldRequest);
    state.caller = f.db;
    const prepared = await GET(new Request("http://local/api/sandbox/model-draft?prepare_version=v2&reconcile_revision=3"));
    expect(prepared.status).toBe(200);
    const data = await prepared.json();
    expect(data.reconciliation.sourceRules).toEqual(f.oldRequest.draftRules);
    expect(data.reconciliation.requirements).toEqual(expect.arrayContaining([expect.objectContaining({ ruleKey: "rule-3", kind: "resource", previousSelector: "resource-1" })]));
    expect(data.preparedSourceContext.modelContext.resources[0].label).toBe("休息时间");
    expect(data.preparedSourceContext.modelContext.resources[1]).toMatchObject({ key: "resource-2", label: "可投入时间", available: 6 });

    // Explicit user choices: select today's resource, reduce its amount, reselect the variable, detach the unverifiable background link.
    expect(applyModelReconciliation({ draft: data.draft, reconciliation: data.reconciliation, preparedSourceContext: data.preparedSourceContext, resolutions: {} })).toMatchObject({ ok: false, errorCode: "reconciliation_incomplete" });
    const resolved = applyModelReconciliation({ draft: data.draft, reconciliation: data.reconciliation, preparedSourceContext: data.preparedSourceContext, resolutions: {
      "rule-1": { kind: "variable", variableKey: "external-variable-1", value: "家庭支持已安排" },
      "rule-2": { kind: "detach_profile_entry" },
      "rule-3": { kind: "resource", resourceKey: "resource-2", amount: 2 },
    } });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) throw new Error(`explicit reconciliation failed: ${resolved.errorCode}`);
    const request = saveDigitalLifeModelDraftSchema.parse({ version: "digital-life-model-draft-v2", expectedRevision: resolved.expectedRevision, idempotencyKey: ids.npc, horizonDays: resolved.horizonDays, sourceContext: resolved.sourceContext, draftRules: resolved.draftRules });
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: null, error: null })) };
    const saveDb = { from: vi.fn(() => query), rpc: vi.fn(async (name: string) => ({ data: name === "read_digital_life_model_draft_v1" ? { source: f.source, current: f.oldRow } : { row: { user_id: ids.owner, revision: 4, request }, idempotent: false }, error: null })) };
    const saved = await saveFormalModelDraft(saveDb as never, ids.owner, request);
    expect(saved).toMatchObject({ ok: true, idempotent: false, draft: { currentRevision: 4, status: "current", draftRules: request.draftRules } });
    const newConfirmed = { ...request.draftRules, actions: request.draftRules.actions.map(item => ({ ...item, confirmedForSimulation: true })) };
    const newRun = await buildFormalSandboxRunV2({ ...f.currentInput, deterministicSeed: 1801, digitalLifeRules: newConfirmed });
    expect(newRun.ok).toBe(true);
    if (!newRun.ok) throw new Error(`reconciled canonical path failed: ${newRun.errorCode}`);
    for (const world of newRun.bundle.worldSnapshots) {
      expect(world.resources.find(item => item.label === "休息时间")?.available).toBe(4);
      expect(world.resources.find(item => item.label === "可投入时间")?.available).toBe(4);
      expect(world.worldEvents.map(item => item.operation.actionType)).toEqual(["update_external_variable", "update_commitment", "allocate_resource"]);
      const allocation = world.worldEvents[2];
      expect(allocation.priorWorldEventIds).toEqual([world.worldEvents[1].id]);
      expect(allocation.operation).toMatchObject({ actionType: "allocate_resource", amount: 2 });
    }
    expect(projectFormalSandboxResult(JSON.parse(JSON.stringify(newRun.bundle)))).not.toBeNull();
    expect(JSON.stringify(oldRun.bundle)).toBe(oldRunJson);
    expect(JSON.stringify(f.oldRequest)).toBe(oldRequestJson);
  }, 60_000);

  it("does not make an already-current condition or an over-budget old amount valid by merely changing the Profile revision", async () => {
    const f = fixture();
    f.currentInput.realityProfileSnapshot.profile.externalVariables[0].value = "家庭支持可用";
    f.source.reality_profiles.external_variables[0].value = "家庭支持可用";
    const blindlyMoved = { ...f.oldRequest.draftRules, profileRevision: 3, actions: f.oldRequest.draftRules.actions.map(item => ({ ...item, confirmedForSimulation: true })) };
    expect(buildDigitalLifeModel(f.currentInput, blindlyMoved).ok).toBe(false);
    state.caller = f.db;
    const response = await GET(new Request("http://local/api/sandbox/model-draft?prepare_version=v2&reconcile_revision=3"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reconciliation.sourceRules).toEqual(f.oldRequest.draftRules);
    expect(data.reconciliation.permissionsReset).toEqual({ planning: true, symbolic: true, outcomeCalibration: true, requestIdentity: true });
    expect(data.reconciliation.requirements).toEqual(expect.arrayContaining([expect.objectContaining({ ruleKey: "rule-1", kind: "variable" }), expect.objectContaining({ ruleKey: "rule-3", kind: "resource" })]));
    expect(data.reconciliation).not.toHaveProperty("confirmedRules");
    expect(applyModelReconciliation({ draft: data.draft, reconciliation: data.reconciliation, preparedSourceContext: data.preparedSourceContext, resolutions: { "rule-1": { kind: "variable", variableKey: "external-variable-1", value: "家庭支持可用" }, "rule-2": { kind: "detach_profile_entry" }, "rule-3": { kind: "resource", resourceKey: "resource-2", amount: 7 } } })).toMatchObject({ ok: false, errorCode: "invalid_reconciliation" });
    expect(f.db.rpc).toHaveBeenCalledTimes(1);
  });
});
