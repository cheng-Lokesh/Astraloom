import { describe, expect, it } from "vitest";
import { digitalLifeInput, ids } from "@/lib/digital-life/test-fixtures";
import type { ActionParametersV2, WorldStateV2 } from "@/lib/v2/agent-world/types";
import { validateWorldV2 } from "@/lib/v2/agent-world/validation";
import { buildFormalSandboxRunV2 } from "./runtime";
import { projectFormalSandboxResult } from "./result-projection.server";

type ScenarioAction = {
  key: string; pathKey: string; actorKey: string;
  when: { kind: "at_tick"; tickIndex: number } | { kind: "after_rule"; ruleKey: string };
  operation: Record<string, unknown>; classification: "assumption";
  confirmedForSimulation: boolean; evidenceSummary: string;
};

function environmentInput(horizonDays: 30 | 90 = 30) {
  const input = digitalLifeInput();
  // Every event in these journeys must come from a declared rule, never an automatic rate or invented wait.
  const profile = input.realityProfileSnapshot.profile;
  profile.worldInputs.resources = profile.worldInputs.resources.map(resource => ({ ...resource, usePerTick: null }));
  profile.externalVariables = [{ value: "家庭支持尚未确定", classification: "fact", evidenceSummary: "本人记录的当前安排" }];
  return { ...input, horizonDays };
}

function action(key: string, pathKey: string, actorKey: string, when: ScenarioAction["when"], operation: ScenarioAction["operation"]): ScenarioAction {
  return { key, pathKey, actorKey, when, operation, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人显式声明的条件情景与行动；不是现实预测" };
}

function scenarioRules(horizon: 30 | 90, pathKey = "main", keyOffset = 0, alternative = "家庭支持可用", amount = 2) {
  const actor = pathKey === "main" ? "person-1" : pathKey;
  const conditionTick = horizon === 30 ? 1 : 4;
  const actions: ScenarioAction[] = [];
  // These are explicitly authored preparation commitments, not policy-injected waiting events.
  for (let tick = 0; tick < conditionTick; tick += 1) {
    actions.push(action(`rule-${keyOffset + tick + 1}`, pathKey, actor,
      tick === 0 ? { kind: "at_tick", tickIndex: 0 } : { kind: "after_rule", ruleKey: `rule-${keyOffset + tick}` },
      { actionType: "update_commitment", commitmentKey: `commitment-${tick + 1}`, label: `本人声明的第${tick + 1}项准备安排`, status: "active" }));
  }
  const conditionKey = `rule-${keyOffset + conditionTick + 1}`;
  actions.push(action(conditionKey, pathKey, actor, { kind: "at_tick", tickIndex: conditionTick },
    { actionType: "update_external_variable", variableKey: "external-variable-1", value: alternative }));
  actions.push(action(`rule-${keyOffset + conditionTick + 2}`, pathKey, actor, { kind: "after_rule", ruleKey: conditionKey },
    { actionType: "allocate_resource", resourceKey: "resource-1", amount }));
  return {
    version: "digital-life-rules-v2", graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2,
    strategies: [] as Array<{ participantKey: string; label: string; confirmedForSimulation: boolean; evidenceSummary: string }>, actions,
  };
}

function assertCausalEnvironmentChain(world: WorldStateV2, expectedTick: number, initialAvailable: number, alternative: string, amount: number) {
  expect(validateWorldV2(world).ok).toBe(true);
  const condition = world.worldEvents.find(event => event.operation.actionType === "update_external_variable");
  expect(condition).toBeDefined();
  if (!condition || condition.operation.actionType !== "update_external_variable") throw new Error("missing canonical environment transition");
  const variableId = condition.operation.variableId;
  const expectedAt = new Date(Date.parse("2026-10-06T04:00:00.000Z") + expectedTick * (expectedTick === 1 ? 10 : 15) * 86_400_000).toISOString();
  expect(condition.occurredAt).toBe(expectedAt);
  expect(condition.operation.value).toBe(alternative);
  expect(condition.targetVariableIds).toEqual([variableId]);
  expect(condition.deltas).toContainEqual({ path: `externalVariables.${variableId}.value`, valueType: "variable", before: "家庭支持尚未确定", after: alternative });
  expect(condition.causalAssumptionIds.length).toBeGreaterThan(0);
  const assumptions = condition.causalAssumptionIds.map(id => world.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.id === id));
  expect(assumptions.every(item => item?.confirmationStatus === "confirmed" && item.subjectType === "external_variable")).toBe(true);
  expect(world.realityBoundarySnapshot.evidenceLedger.items.some(item => item.statement.includes(alternative))).toBe(false);
  const allocation = world.worldEvents.find(event => event.operation.actionType === "allocate_resource");
  expect(allocation).toBeDefined();
  if (!allocation || allocation.operation.actionType !== "allocate_resource") throw new Error("missing declared successor allocation");
  expect(Date.parse(allocation.occurredAt)).toBeGreaterThan(Date.parse(condition.occurredAt));
  expect(allocation.priorWorldEventIds).toContain(condition.id);
  expect(allocation.operation.amount).toBe(amount);
  expect(world.resources[0].available).toBe(initialAvailable - amount);
  expect(world.externalVariables.find(item => item.id === variableId)?.value).toBe(alternative);
  expect(world.worldEvents.map(event => event.operation.actionType)).toEqual([
    ...Array<string>(expectedTick).fill("update_commitment"), "update_external_variable", "allocate_resource",
  ]);
}

describe("environment conditions through real formal Core execution", () => {
  it.each([30, 90] as const)("executes a %i-day later-cycle condition before its declared resource response, with evidence and immutable JSON replay", async horizon => {
    const input = environmentInput(horizon);
    const rules = scenarioRules(horizon);
    const before = JSON.stringify(input);
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: rules });
    expect(built.ok, !built.ok ? built.errorCode : undefined).toBe(true);
    if (!built.ok) throw new Error(`expected real environment path; got ${built.errorCode}`);
    expect(built.bundle.runtimePath).toContain("stage8_canonical_validation");
    expect(built.bundle.worldSnapshots).toHaveLength(3);
    for (const world of built.bundle.worldSnapshots) assertCausalEnvironmentChain(world, horizon === 30 ? 1 : 4, 8, "家庭支持可用", 2);
    expect(built.bundle.claims.every(claim => claim.simulationEventIds.every(id => built.bundle.events.some(event => event.id === id)))).toBe(true);
    const projection = projectFormalSandboxResult(built.bundle);
    expect(projection).not.toBeNull();
    expect(JSON.stringify(projection)).toContain("家庭支持可用");
    expect(JSON.stringify(projection)).not.toMatch(/11111111-1111|seed:self|seed:person|world_variable_v2_/);
    expect(projectFormalSandboxResult(JSON.parse(JSON.stringify(built.bundle)))).toEqual(projection);
    expect(JSON.stringify(input)).toBe(before);

    const forgedDelta = structuredClone(built.bundle);
    const condition = forgedDelta.events.find(event => event.operation.actionType === "update_external_variable");
    if (!condition) throw new Error("missing event for tamper test");
    condition.deltas = condition.deltas.map(delta => delta.valueType === "variable" ? { ...delta, after: "未声明的支持状态" } : delta);
    expect(projectFormalSandboxResult(forgedDelta)).toBeNull();
    const brokenCausality = structuredClone(built.bundle);
    for (const world of brokenCausality.worldSnapshots) {
      const response = world.worldEvents.find(event => event.operation.actionType === "allocate_resource");
      if (response) response.priorWorldEventIds = [];
    }
    expect(projectFormalSandboxResult(brokenCausality)).toBeNull();
  }, 60_000);

  it("keeps strategy conditions, events, resources and evidence in separate hypothetical worlds", async () => {
    const input = environmentInput();
    const rules = scenarioRules(30);
    rules.strategies = [{ participantKey: "person-3", label: "先保留更多个人时间", confirmedForSimulation: true, evidenceSummary: "本人确认的独立策略" }];
    rules.actions.push(...scenarioRules(30, "person-3", 3, "家庭支持仍待协调", 1).actions);
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: rules });
    expect(built.ok, !built.ok ? built.errorCode : undefined).toBe(true);
    if (!built.ok) throw new Error(`expected separate environment worlds; got ${built.errorCode}`);
    const child = built.bundle.strategyPaths.paths[0]?.bundle;
    expect(child).toBeDefined();
    if (!child) throw new Error("missing explicit strategy world");
    for (const world of built.bundle.worldSnapshots) assertCausalEnvironmentChain(world, 1, 8, "家庭支持可用", 2);
    for (const world of child.worldSnapshots) assertCausalEnvironmentChain(world, 1, 8, "家庭支持仍待协调", 1);
    const mainIds = new Set(built.bundle.events.map(event => event.id));
    expect(child.events.every(event => !mainIds.has(event.id) && event.priorWorldEventIds.every(id => !mainIds.has(id)))).toBe(true);
    expect(child.claims.every(claim => claim.simulationEventIds.every(id => child.events.some(event => event.id === id)))).toBe(true);
    expect(projectFormalSandboxResult(JSON.parse(JSON.stringify(built.bundle)))).not.toBeNull();

    const mixed = structuredClone(built.bundle);
    const mainCondition = mixed.events.find(event => event.operation.actionType === "update_external_variable");
    const childResponse = mixed.strategyPaths.paths[0].bundle.events.find(event => event.operation.actionType === "allocate_resource");
    if (!mainCondition || !childResponse) throw new Error("missing cross-path tamper sources");
    childResponse.priorWorldEventIds = [mainCondition.id];
    expect(projectFormalSandboxResult(mixed)).toBeNull();
  }, 60_000);

  it("does not manufacture waits or reach a future condition after Core legitimately terminates for no actions", async () => {
    const input = environmentInput();
    const rules = scenarioRules(30);
    // One real tick-zero action, followed by a gap at tick one. No user-authored waiting action exists.
    rules.actions[1].when = { kind: "at_tick", tickIndex: 2 };
    rules.actions.pop();
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: rules });
    expect(built.ok, !built.ok ? built.errorCode : undefined).toBe(true);
    if (!built.ok) throw new Error(`expected honest early termination; got ${built.errorCode}`);
    for (const trajectory of built.bundle.trajectoryAnalysis.trajectories) {
      expect(trajectory.status).toBe("no_actions");
      expect(trajectory.finalWorld.worldEvents.map(event => event.operation.actionType)).toEqual(["update_commitment"]);
      expect(trajectory.steps.at(-1)).toMatchObject({ tickIndex: 1, termination: { reason: "no_actions" } });
      expect(trajectory.finalWorld.externalVariables[0].value).toBe("家庭支持尚未确定");
    }
    const projection = projectFormalSandboxResult(built.bundle);
    expect(projection).not.toBeNull();
    const actions = built.bundle.events.map(event => event.operation.actionType as ActionParametersV2["actionType"]);
    expect(actions).not.toContain("update_external_variable");
    expect(actions).not.toContain("allocate_resource");
  }, 60_000);

  it("executes the same later-cycle fixture through legacy v1 when its condition operation is replaced by a declared commitment", async () => {
    const input = environmentInput();
    const original = scenarioRules(30);
    const rules = {
      ...original, version: "digital-life-rules-v1",
      actions: original.actions.map(item => item.operation.actionType === "update_external_variable"
        ? { ...item, operation: { actionType: "update_commitment", commitmentKey: "commitment-2", label: "本人明确声明的条件复核安排", status: "active" } }
        : item),
    };
    const built = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: rules });
    expect(built.ok, !built.ok ? built.errorCode : undefined).toBe(true);
    if (!built.ok) throw new Error(`legacy control failed: ${built.errorCode}`);
    expect(built.bundle.runtimePath).toContain("stage8_canonical_validation");
    expect(built.bundle.worldSnapshots).toHaveLength(3);
    for (const world of built.bundle.worldSnapshots) {
      expect(world.worldEvents.map(event => event.operation.actionType)).toEqual(["update_commitment", "update_commitment", "allocate_resource"]);
      expect(world.resources[0].available).toBe(6);
      expect(world.externalVariables[0].value).toBe("家庭支持尚未确定");
    }
    expect(projectFormalSandboxResult(JSON.parse(JSON.stringify(built.bundle)))).not.toBeNull();
  }, 60_000);
});
