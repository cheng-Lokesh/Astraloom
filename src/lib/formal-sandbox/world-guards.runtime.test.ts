import { describe, expect, it } from "vitest";
import { digitalLifeInput, ids } from "@/lib/digital-life/test-fixtures";
import { buildDigitalLifeModel } from "@/lib/digital-life/model";
import { validateWorldV2 } from "@/lib/v2/agent-world/validation";
import { buildFormalSandboxRunV2 } from "./runtime";
import { projectFormalSandboxResult } from "./result-projection.server";
import { projectGuardObservations } from "@/lib/digital-life/guard-observations";
import { executeTrajectoryV2 } from "@/lib/v2/trajectory/trajectory-runner";
import { buildChildTrajectoryRunSpecV2 } from "@/lib/v2/trajectory-analysis/child-run-spec";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";

type Guard = { kind: "resource_balance"; resourceKey: string; operator: "lte" | "gte"; value: number } | { kind: "environment_equals"; variableKey: string; value: string };
type Action = { key: string; pathKey: string; actorKey: string; when: { kind: "at_tick"; tickIndex: number } | { kind: "after_rule"; ruleKey: string }; operation: Record<string, unknown>; guard?: Guard; classification: "assumption"; confirmedForSimulation: boolean; evidenceSummary: string };
type Observation = { ruleKey: string; tickIndex: number; schedule: "due" | "not_due" | "already_selected" | "not_reached"; guard: boolean | null; candidate: "selected" | "not_selected" | "ineligible" | null; before: number | string | null; after: number | string | null; stepKey: string | null };
type GuardObservations = { version: "digital-life-guard-observations-v1"; samples: Array<{ key: string; ticks: Array<{ tickIndex: number; occurredAt: string | null; observations: Observation[] }> }> };

function fixture(horizonDays: 30 | 90 = 30) {
  const input = digitalLifeInput(); input.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = null;
  input.realityProfileSnapshot.profile.externalVariables = [{ value: "家庭支持待定", classification: "fact", evidenceSummary: "本人记录的当前安排" }];
  return { ...input, horizonDays };
}
function action(key: string, pathKey: string, when: Action["when"], operation: Action["operation"], guard?: Guard): Action {
  return { key, pathKey, actorKey: pathKey === "main" ? "person-1" : pathKey, when, operation, ...(guard ? { guard } : {}), classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人明确声明的行动与模拟触发条件，不代表现实行为" };
}
function rules(pathKey = "main", amount = 4, offset = 0) {
  const first = `rule-${offset + 1}`, second = `rule-${offset + 2}`;
  return { version: "digital-life-rules-v3", graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, strategies: [] as Array<{ participantKey: string; label: string; confirmedForSimulation: boolean; evidenceSummary: string }>, actions: [
    action(first, pathKey, { kind: "at_tick", tickIndex: 0 }, { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留共同安排", status: "planned" }),
    action(second, pathKey, { kind: "after_rule", ruleKey: first }, { actionType: "allocate_resource", resourceKey: "resource-1", amount }),
    action(`rule-${offset + 3}`, pathKey, { kind: "after_rule", ruleKey: second }, { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留共同安排", status: "cancelled" }, { kind: "resource_balance", resourceKey: "resource-1", operator: "lte", value: 4 }),
  ] };
}

describe("World guards through the existing public formal runtime", () => {
  it.each(["wrong_rate", "false_no_actions"])("rejects an internally Core-valid %s fallback that was never offered by the frozen policy", async attack => {
    const input = fixture(); input.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = 1;
    const declared = rules(); declared.actions = [declared.actions[0]];
    declared.actions[0].guard = { kind: "resource_balance", resourceKey: "resource-1", operator: "gte", value: 1 };
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: declared });
    expect(built.ok).toBe(true); if (!built.ok) throw new Error(built.errorCode);
    const forged = structuredClone(built.bundle), original = forged.trajectoryAnalysis.trajectories[0];
    const child = buildChildTrajectoryRunSpecV2(forged.trajectoryAnalysis.spec, original.trajectorySeed);
    const malicious = executeTrajectoryV2(child, { policyId: child.policyId, policyVersion: child.policyVersion, proposeCandidates: ({ tickIndex, occurredAt }) => {
      if (attack === "false_no_actions" && tickIndex > 0) return [];
      const event = original.finalWorld.worldEvents[tickIndex];
      return [{ id: event.proposalId, seedContextId: event.seedContextId, actorAgentId: event.actorId, actionType: event.operation.actionType, parameters: tickIndex > 0 && event.operation.actionType === "allocate_resource" ? { ...event.operation, amount: 2 } : event.operation, targetEntityIds: event.targetEntityIds, targetResourceIds: event.targetResourceIds, targetRelationIds: event.targetRelationIds, targetVariableIds: event.targetVariableIds, realEvidenceIds: event.causalRealEvidenceIds, assumptionIds: event.causalAssumptionIds, priorWorldEventIds: event.priorWorldEventIds.map(id => tickIndex === 2 ? original.finalWorld.worldEvents[0].id === id ? id : "" : id).filter(Boolean), rationaleSummary: "A structurally legal but unauthorized fallback quantity.", createdAt: occurredAt }];
    } }, { agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`formal-${forged.causalFingerprint}-${original.trajectorySeed}`) });
    expect(malicious.ok).toBe(true); if (!malicious.ok) throw new Error(malicious.errorCode);
    expect(validateWorldV2(malicious.trajectory.finalWorld).ok).toBe(true);
    forged.trajectoryAnalysis.trajectories[0] = malicious.trajectory;
    forged.worldSnapshots[0] = malicious.trajectory.finalWorld;
    forged.events = forged.trajectoryAnalysis.trajectories.flatMap(trajectory => trajectory.finalWorld.worldEvents.map((event, tickIndex) => ({ ...event, branchId: trajectory.trajectoryId, tickIndex })));
    expect(projectGuardObservations(forged)).toBeNull();
  });
  it.each([1, 2])("composes guarded explicit actions with the existing declared rate %s without losing source provenance", async rate => {
    const input = fixture(); input.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = rate;
    const declared = rules(); declared.actions = [declared.actions[0]];
    declared.actions[0].guard = { kind: "resource_balance", resourceKey: "resource-1", operator: "gte", value: 1 };
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: declared });
    expect(built.ok, !built.ok ? built.errorCode : undefined).toBe(true);
    if (!built.ok) throw new Error(built.errorCode);
    for (const world of built.bundle.worldSnapshots) { expect(world.resources[0].available).toBe(8 - rate * 2); expect(validateWorldV2(world).ok).toBe(true); }
    expect(projectFormalSandboxResult(built.bundle)).not.toBeNull();
  });
  it.each([false, true])("returns a known not-saved diagnostic when main has no eligible first action (variant has actions: %s)", async withVariant => {
    const input = fixture(); const declared = rules();
    declared.actions = [action("rule-1", "main", { kind: "at_tick", tickIndex: 0 }, { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留共同安排", status: "planned" }, { kind: "resource_balance", resourceKey: "resource-1", operator: "lte", value: 4 })];
    if (withVariant) {
      declared.strategies = [{ participantKey: "person-3", label: "先主动确认安排", confirmedForSimulation: true, evidenceSummary: "本人明确选择的独立策略" }];
      declared.actions.push(action("rule-2", "person-3", { kind: "at_tick", tickIndex: 0 }, { actionType: "update_commitment", commitmentKey: "commitment-1", label: "先确认安排", status: "active" }));
    }
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: declared });
    expect(built).toMatchObject({ ok: false, errorCode: "no_eligible_actions", pathDiagnostics: { version: "formal-path-diagnostics-v1", status: "not_saved" } });
    expect(built).not.toHaveProperty("bundle");
    const diagnostic = (built as unknown as { pathDiagnostics: { paths: Array<{ status: string; samples: Array<{ terminalStatus: string; executedTickCount: number; selectedEventCount: number }>; guardObservations: GuardObservations }> } }).pathDiagnostics;
    expect(diagnostic.paths).toHaveLength(withVariant ? 2 : 1);
    expect(diagnostic.paths[0].status).toBe("no_actions");
    expect(diagnostic.paths[0].samples).toEqual(Array.from({ length: 3 }, (_, index) => ({ key: `sample-${index + 1}`, terminalStatus: "no_actions", executedTickCount: 1, selectedEventCount: 0 })));
    for (const sample of diagnostic.paths[0].guardObservations.samples) expect(sample.ticks[0].observations).toContainEqual(expect.objectContaining({ ruleKey: "rule-1", guard: false, candidate: null, before: 8, after: 8 }));
    if (withVariant) { expect(diagnostic.paths[1].status).toBe("has_events"); expect(diagnostic.paths[1].samples.every(sample => sample.selectedEventCount === 1)).toBe(true); }
  });

  it("turns the true 30-day balance into a controlled commitment Event while the independent variant remains guard-false", async () => {
    const input = fixture(); const declared = rules();
    declared.strategies = [{ participantKey: "person-3", label: "保留更多本人时间", confirmedForSimulation: true, evidenceSummary: "本人明确选择的独立策略" }];
    declared.actions.push(...rules("person-3", 2, 3).actions);
    const before = JSON.stringify({ input, declared });
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: declared });
    expect(built.ok, !built.ok ? built.errorCode : undefined).toBe(true);
    if (!built.ok) throw new Error(`guard runtime failed: ${built.errorCode}`);
    // Only the model/rules/policy semantics changed; the raw bundle structure and writer lane remain v1.
    expect(built.bundle.versions).toMatchObject({ runtime: "formal-account-sandbox-m1-v1", schema: "formal-run-bundle-m1-v1" });
    expect(built.bundle.trajectoryAnalysis.spec.policyVersion).toBe("digital-life-adapter-v3");
    for (const world of built.bundle.worldSnapshots) {
      expect(validateWorldV2(world).ok).toBe(true);
      expect(world.resources[0].available).toBe(4);
      expect(world.worldEvents.map(event => event.operation.actionType)).toEqual(["update_commitment", "allocate_resource", "update_commitment"]);
      expect(world.worldEvents[2].operation).toMatchObject({ actionType: "update_commitment", status: "cancelled" });
      const assumption = world.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.category === "digital_life_rule_rule-3");
      expect(assumption?.statement).toContain("可投入时间"); expect(assumption?.statement).toContain("4");
      expect(world.worldEvents[2].causalAssumptionIds).toContain(assumption?.id);
      expect(world.worldEvents[2].priorWorldEventIds).toContain(world.worldEvents[1].id);
    }
    const child = built.bundle.strategyPaths.paths[0].bundle;
    expect(child.trajectoryAnalysis.trajectories.every(item => item.status === "no_actions")).toBe(true);
    for (const world of child.worldSnapshots) { expect(world.resources[0].available).toBe(6); expect(world.worldEvents).toHaveLength(2); }
    const projected = projectFormalSandboxResult(JSON.parse(JSON.stringify(built.bundle)));
    expect(projected).not.toBeNull();
    expect(projectFormalSandboxResult(built.bundle)).toEqual(projected);
    const observations = (projected as unknown as { guardObservations: GuardObservations }).guardObservations;
    expect(observations.version).toBe("digital-life-guard-observations-v1"); expect(observations.samples).toHaveLength(3);
    for (const sample of observations.samples) expect(sample.ticks[2].observations).toContainEqual(expect.objectContaining({ ruleKey: "rule-3", tickIndex: 2, schedule: "due", guard: true, candidate: "selected", before: 4, after: 4 }));
    const childObservations = (projected?.strategyPaths[0].projection as unknown as { guardObservations: GuardObservations }).guardObservations;
    for (const sample of childObservations.samples) expect(sample.ticks[2].observations).toContainEqual(expect.objectContaining({ ruleKey: "rule-6", schedule: "due", guard: false, candidate: null, before: 6, after: 6, stepKey: null }));
    expect(JSON.stringify(projected)).not.toMatch(/world_resource_v2_|11111111-1111|seed:self/);
    expect(JSON.stringify({ input, declared })).toBe(before);
  }, 60_000);

  it("evaluates a 90-day declared environment value and late balance from actual ordered steps, not flattened event indexes", async () => {
    const input = fixture(90); const declared = rules();
    declared.actions = [
      action("rule-1", "main", { kind: "at_tick", tickIndex: 0 }, { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留共同安排", status: "planned" }),
      action("rule-2", "main", { kind: "after_rule", ruleKey: "rule-1" }, { actionType: "update_external_variable", variableKey: "external-variable-1", value: "家庭支持可用" }),
      action("rule-3", "main", { kind: "after_rule", ruleKey: "rule-2" }, { actionType: "allocate_resource", resourceKey: "resource-1", amount: 2 }, { kind: "environment_equals", variableKey: "external-variable-1", value: "家庭支持可用" }),
      action("rule-4", "main", { kind: "after_rule", ruleKey: "rule-3" }, { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留共同安排", status: "active" }),
      action("rule-5", "main", { kind: "after_rule", ruleKey: "rule-4" }, { actionType: "allocate_resource", resourceKey: "resource-1", amount: 2 }),
      action("rule-6", "main", { kind: "after_rule", ruleKey: "rule-5" }, { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留共同安排", status: "cancelled" }, { kind: "resource_balance", resourceKey: "resource-1", operator: "lte", value: 4 }),
    ];
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: declared });
    expect(built.ok, !built.ok ? built.errorCode : undefined).toBe(true);
    if (!built.ok) throw new Error(`90-day guard runtime failed: ${built.errorCode}`);
    const projected = projectFormalSandboxResult(built.bundle);
    expect(projected).not.toBeNull();
    const observations = (projected as unknown as { guardObservations: GuardObservations }).guardObservations;
    for (const [index, sample] of observations.samples.entries()) {
      const trajectory = built.bundle.trajectoryAnalysis.trajectories[index];
      expect(sample.ticks).toHaveLength(6);
      expect(sample.ticks.map(tick => tick.occurredAt)).toEqual(trajectory.steps.map(step => step.occurredAt));
      expect(sample.ticks[2].observations).toContainEqual(expect.objectContaining({ ruleKey: "rule-3", guard: true, candidate: "selected", before: "家庭支持可用", after: "家庭支持可用" }));
      expect(sample.ticks[5].observations).toContainEqual(expect.objectContaining({ ruleKey: "rule-6", tickIndex: 5, guard: true, candidate: "selected", before: 4, after: 4 }));
      expect(trajectory.finalWorld.resources[0].available).toBe(4);
      expect(trajectory.steps[5].worldEventId).toBe(trajectory.finalWorld.worldEvents[5].id);
    }
    expect(built.bundle.sourceBoundary.evidenceLedger.items.some(item => item.statement.includes("家庭支持可用"))).toBe(false);
  }, 60_000);

  it("does not invent waiting Events or World values for scheduled guards beyond a legitimate no-actions termination", async () => {
    const input = fixture(90); const declared = rules(); declared.actions.pop();
    declared.actions.push(action("rule-3", "main", { kind: "at_tick", tickIndex: 4 }, { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留共同安排", status: "cancelled" }, { kind: "resource_balance", resourceKey: "resource-1", operator: "lte", value: 4 }));
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: declared });
    expect(built.ok, !built.ok ? built.errorCode : undefined).toBe(true);
    if (!built.ok) throw new Error(`guard early-termination runtime failed: ${built.errorCode}`);
    expect(built.bundle.trajectoryAnalysis.trajectories.every(item => item.status === "no_actions" && item.steps.length === 3)).toBe(true);
    const projected = projectFormalSandboxResult(built.bundle);
    const observations = (projected as unknown as { guardObservations: GuardObservations }).guardObservations;
    for (const sample of observations.samples) expect(sample.ticks[4].observations).toContainEqual(expect.objectContaining({ ruleKey: "rule-3", tickIndex: 4, schedule: "not_reached", guard: null, candidate: null, before: null, after: null, stepKey: null }));
    for (const world of built.bundle.worldSnapshots) expect(world.worldEvents).toHaveLength(2);
  });

  it.each(["digital-life-rules-v1", "digital-life-rules-v2"])("keeps legacy %s metadata and guard-free behavior while refusing guard smuggling", async version => {
    const input = fixture(); const declared = rules();
    const legacy = { ...declared, version, actions: declared.actions.map(action => { const clean = { ...action }; delete clean.guard; return clean; }) };
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: legacy });
    expect(built.ok, !built.ok ? built.errorCode : undefined).toBe(true);
    if (!built.ok) throw new Error(`legacy control failed: ${built.errorCode}`);
    expect(built.bundle.versions).toMatchObject({ runtime: "formal-account-sandbox-m1-v1", schema: "formal-run-bundle-m1-v1" });
    expect(built.bundle.trajectoryAnalysis.spec.policyVersion).toBe("digital-life-adapter-v1");
    expect(projectFormalSandboxResult(built.bundle)).not.toHaveProperty("guardObservations");
    expect(buildDigitalLifeModel(input, { ...declared, version }).ok).toBe(false);
  });
});
