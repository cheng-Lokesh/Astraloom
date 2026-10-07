import { describe, expect, it } from "vitest";
import { approveActionProposalV2 } from "@/lib/v2/agent-world/action-proposal";
import { applyWorldTransitionV2 } from "@/lib/v2/agent-world/world-transition";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import { idsV2 } from "@/lib/v2/agent-world/test-fixtures";
import { executeTrajectoryV2 } from "@/lib/v2/trajectory/trajectory-runner";
import { createLocalTrajectoryPolicyV2 } from "@/lib/v2/trajectory/local-adapter";
import { TRAJECTORY_ENGINE_VERSION_V2 } from "@/lib/v2/trajectory/types";
import type { WorldStateV2 } from "@/lib/v2/agent-world/types";
import { freezeDefaultPlanning } from "./index";
import { comparePlanningEvents, proposeDefaultPlanning, type PlanningProposalTrace } from "./proposals";
import { bindPlanningWorld } from "./world-binding";
import { planningBindings, planningRequest, planningSource, planningWorld } from "./test-fixtures";

function setup(enabled = true, budget = 3) {
  const request = planningRequest(enabled);
  request.resources[0].totalBudgetLimit = budget;
  const frozen = freezeDefaultPlanning(request, planningSource());
  if (!frozen.ok) throw new Error(frozen.errorCode);
  const world = planningWorld(frozen.planning);
  const bindings = planningBindings(world);
  return { planning: frozen.planning, world, bindings, namespace: "controlled_fixture_main", pathKey: "main", tickIndex: 0, occurredAt: frozen.planning.sourceBinding.acceptedAt };
}

describe("default planning through accepted V2 Core", () => {
  it("rejects same-label alternate-resource authorization and nonexistent path/source identities", () => {
    const input = setup();
    const alternate = structuredClone(input.world.resources[0]);
    alternate.id = "world_resource_v2_unauthorized_alternate";
    alternate.resourceType = "budget";
    alternate.available = 20;
    input.world.resources.push(alternate);
    const bindings = { ...input.bindings, resources: new Map(input.bindings.resources) };
    bindings.resources.set("resource-1", alternate.id);
    expect(proposeDefaultPlanning({ ...input, bindings }).candidates).toHaveLength(0);
    expect(proposeDefaultPlanning({ ...input, pathKey: "person-99" }).candidates).toEqual([]);
    const altered = structuredClone(input.planning);
    altered.sourceBinding.profileRevision++;
    expect(proposeDefaultPlanning({ ...input, planning: altered }).candidates).toEqual([]);
    alternate.resourceType = input.world.resources[0].resourceType;
    alternate.available = input.world.resources[0].available;
    expect(proposeDefaultPlanning({ ...input, bindings }).candidates).toHaveLength(0);
    for (const field of ["ownerId", "graphSnapshotId"] as const) {
      const changed = structuredClone(input.planning);
      changed.sourceBinding[field] = "99999999-9999-4999-8999-999999999999";
      expect(proposeDefaultPlanning({ ...input, planning: changed }).candidates).toHaveLength(0);
    }
    const wrongSelf = structuredClone(input.world);
    wrongSelf.agentDefinitions.push({ ...wrongSelf.agentDefinitions[0], id: "agent_definition_v2_other_self" });
    wrongSelf.entities.push({ ...wrongSelf.entities.find(item => item.id === input.bindings.actorEntityId)!, id: "world_entity_v2_other_self", agentDefinitionId: "agent_definition_v2_other_self" });
    expect(proposeDefaultPlanning({ ...input, world: wrongSelf, bindings: { ...input.bindings, actorAgentId: "agent_definition_v2_other_self", actorEntityId: "world_entity_v2_other_self" } }).candidates).toHaveLength(0);
    const changedSource = structuredClone(input.world);
    changedSource.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.id === changedSource.resources[0].provenance.assumptionIds[0])!.limitations = ["another accepted resource"];
    expect(proposeDefaultPlanning({ ...input, world: changedSource }).candidates).toHaveLength(0);
    expect(() => bindPlanningWorld(input.planning, changedSource, input.bindings.worldBinding.worldNamespace, "main", input.bindings.worldBinding.simulationStartAt)).toThrow("invalid_planning_world_binding");
  });

  it("keeps a six-tick strict fractional budget under actual sequential Core accumulation", () => {
    for (const enabled of [false, true]) {
      const source = planningSource();
      source.horizonDays = 90;
      const request = planningRequest(enabled);
      request.resources[0].totalBudgetLimit = 0.015;
      const frozen = freezeDefaultPlanning(request, source);
      if (!frozen.ok) throw new Error(frozen.errorCode);
      let world = planningWorld(frozen.planning);
      const bindings = planningBindings(world);
      for (let tickIndex = 0; tickIndex < 6; tickIndex++) {
        const proposed = proposeDefaultPlanning({ planning: frozen.planning, world, bindings, namespace: "strict_six_ticks", pathKey: "main", tickIndex, occurredAt: source.acceptedAt });
        expect(proposed.candidates).toHaveLength(1);
        const runtime = { clock: () => source.acceptedAt, idFactory: createStableAgentWorldIdFactoryV2("strict-six-ticks") };
        const approval = approveActionProposalV2(proposed.candidates[0], world, world.revision, runtime);
        if (!approval.ok) throw new Error(approval.errorCode);
        const transition = applyWorldTransitionV2(world, approval.command, runtime);
        if (!transition.ok) throw new Error(transition.errorCode);
        world = transition.world;
      }
      expect(world.worldEvents).toHaveLength(6);
      const spent = world.worldEvents.reduce((sum, event) => sum + (event.operation.actionType === "allocate_resource" ? event.operation.amount : 0), 0);
      expect(spent).toBeLessThanOrEqual(0.015);
    }
  });

  it("changes the initial controlled delta with a real ledger reference, without direct mutation", () => {
    const input = setup();
    const before = structuredClone(input.world);
    const result = proposeDefaultPlanning(input);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].parameters).toMatchObject({ amount: 0.9 });
    expect(input.world).toEqual(before);
    const runtime = { clock: () => input.occurredAt, idFactory: createStableAgentWorldIdFactoryV2("planning-controlled-test") };
    const approval = approveActionProposalV2(result.candidates[0], input.world, input.world.revision, runtime);
    expect(approval.ok).toBe(true);
    if (!approval.ok) throw new Error(approval.errorCode);
    const transition = applyWorldTransitionV2(input.world, approval.command, runtime);
    expect(transition.ok).toBe(true);
    if (!transition.ok) throw new Error(transition.errorCode);
    expect(transition.world.resources[0].available).toBeCloseTo(7.1);
    expect(transition.event.causalAssumptionIds).toEqual(result.candidates[0].assumptionIds);
    expect(transition.world.realityBoundarySnapshot.evidenceLedger).toEqual(before.realityBoundarySnapshot.evidenceLedger);
    expect(transition.world.relations).toEqual(before.relations);
    expect(before.agentStates.every(agent => agent.memory.length === 0)).toBe(true);
    expect(comparePlanningEvents(result.trace, transition.world)[0]).toMatchObject({ status: "selected", proposedAmount: 0.9, priorApplied: true });
    expect(comparePlanningEvents(result.trace, input.world)[0]).toMatchObject({ status: "not_selected", actualAmount: null });
    expect(proposeDefaultPlanning({ ...input, world: transition.world }).candidates).toEqual([]);
  });

  it.each([3, 0.5, 0.15, 0.3, 0.000003, 6.999999])("enforces the whole-run fractional budget %s in actual controlled trajectories", budget => {
    for (const enabled of [false, true]) {
      const input = setup(enabled, budget);
      const traces: PlanningProposalTrace[] = [];
      const policy = createLocalTrajectoryPolicyV2({ policyId: "planning_fixture", policyVersion: "1", candidatesForTick: ({ world, tickIndex, occurredAt }) => {
        const output = proposeDefaultPlanning({ ...input, world, tickIndex, occurredAt });
        traces.push(...output.trace);
        return output.candidates;
      } });
      const execution = executeTrajectoryV2({
        runSpecId: "trajectory_run_spec_v2_planning_fixture", trajectoryId: "trajectory_v2_planning_fixture", seedContextId: input.world.seedContextId,
        initialWorld: input.world, expectedInitialWorldRevision: input.world.revision, trajectorySeed: 1701,
        horizonDays: 30, startAt: input.occurredAt, tickIntervalDays: 1, maxTicks: 3,
        policyId: "planning_fixture", policyVersion: "1", trajectoryEngineVersion: TRAJECTORY_ENGINE_VERSION_V2,
      }, policy, { agentWorldIdFactory: createStableAgentWorldIdFactoryV2("planning-budget-test") });
      expect(execution.ok).toBe(true);
      if (!execution.ok) throw new Error(execution.errorCode);
      expect(execution.trajectory.steps).toHaveLength(3);
      expect(execution.trajectory.finalWorld.worldEvents).toHaveLength(3);
      const actual = execution.trajectory.finalWorld.worldEvents.reduce((spent, event) => spent + (event.operation.actionType === "allocate_resource" ? event.operation.amount : 0), 0);
      expect(actual).toBeLessThanOrEqual(budget);
      expect(execution.trajectory.finalWorld.resources[0].available).toBeGreaterThanOrEqual(input.world.resources[0].min);
      expect(traces.every(item => item.tickIndex === 0 ? item.priorApplied === enabled : item.proposedAmount === item.neutralAmount && !item.priorApplied)).toBe(true);
      expect(comparePlanningEvents(traces, execution.trajectory.finalWorld).every(item => item.status === "selected")).toBe(true);
    }
  });

  it("keeps on/off candidate counts equal at a fractional minimum-reserve boundary", () => {
    const counts: number[][] = [];
    for (const enabled of [false, true]) {
      const source = planningSource();
      source.realityProfileSnapshot.profile.worldInputs.resources[0].available = 1.3;
      const request = planningRequest(enabled);
      request.resources[0].totalBudgetLimit = 0.3;
      const frozen = freezeDefaultPlanning(request, source);
      if (!frozen.ok) throw new Error(frozen.errorCode);
      let world = planningWorld(frozen.planning);
      const bindings = planningBindings(world);
      const observed: number[] = [];
      for (let tickIndex = 0; tickIndex < 3; tickIndex++) {
        const proposed = proposeDefaultPlanning({ planning: frozen.planning, world, bindings, namespace: "fractional_reserve_fixture", pathKey: "main", tickIndex, occurredAt: source.acceptedAt });
        observed.push(proposed.candidates.length);
        if (!proposed.candidates.length) continue;
        const runtime = { clock: () => source.acceptedAt, idFactory: createStableAgentWorldIdFactoryV2("fractional-reserve-test") };
        const approval = approveActionProposalV2(proposed.candidates[0], world, world.revision, runtime);
        if (!approval.ok) throw new Error(approval.errorCode);
        const transition = applyWorldTransitionV2(world, approval.command, runtime);
        if (!transition.ok) throw new Error(transition.errorCode);
        world = transition.world;
      }
      expect(world.resources[0].available).toBeGreaterThanOrEqual(1);
      counts.push(observed);
    }
    expect(counts).toEqual([[1, 1, 1], [1, 1, 1]]);
  });

  it("retains identical candidate identities, order, count and uniform RNG audit under on/off", () => {
    const off = setup(false);
    const on = setup(true);
    const a = proposeDefaultPlanning(off);
    const b = proposeDefaultPlanning(on);
    expect(a.candidates.map(item => [item.id, item.actorAgentId, item.actionType, item.targetResourceIds])).toEqual(b.candidates.map(item => [item.id, item.actorAgentId, item.actionType, item.targetResourceIds]));
    for (const seed of [1701, 1702, 1703]) {
      const run = (input: typeof on) => executeTrajectoryV2({
        runSpecId: "trajectory_run_spec_v2_planning_rng", trajectoryId: "trajectory_v2_planning_rng", seedContextId: input.world.seedContextId,
        initialWorld: input.world, expectedInitialWorldRevision: input.world.revision, trajectorySeed: seed,
        horizonDays: 30, startAt: input.occurredAt, tickIntervalDays: 1, maxTicks: 3,
        policyId: "planning_fixture", policyVersion: "1", trajectoryEngineVersion: TRAJECTORY_ENGINE_VERSION_V2,
      }, createLocalTrajectoryPolicyV2({ policyId: "planning_fixture", policyVersion: "1", candidatesForTick: ({ world, tickIndex, occurredAt }) => proposeDefaultPlanning({ ...input, world, tickIndex, occurredAt }).candidates }), { agentWorldIdFactory: createStableAgentWorldIdFactoryV2("planning-rng-test") });
      const first = run(off);
      const second = run(on);
      expect(first.ok && second.ok).toBe(true);
      if (!first.ok || !second.ok) continue;
      expect(first.trajectory.steps.map(step => step.rngAudit)).toEqual(second.trajectory.steps.map(step => step.rngAudit));
      expect(first.trajectory.steps.map(step => step.proposalId)).toEqual(second.trajectory.steps.map(step => step.proposalId));
      expect(first.trajectory.finalWorld.resources[0].available).toBeCloseTo(5);
      expect(second.trajectory.finalWorld.resources[0].available).toBeCloseTo(5.1);
    }
  });

  it("keeps two authorized resources in real uniform competition and contrasts selected and unselected proposals", () => {
    const source = planningSource();
    source.realityProfileSnapshot.profile.worldInputs.resources.push({ ...source.realityProfileSnapshot.profile.worldInputs.resources[0], key: "other-time", label: "第二份可用时间" });
    const run = (enabled: boolean) => {
      const request = planningRequest(enabled);
      request.resources.push({ ...request.resources[0], resourceKey: "resource-2" });
      const frozen = freezeDefaultPlanning(request, source);
      if (!frozen.ok) throw new Error(frozen.errorCode);
      const world = planningWorld(frozen.planning);
      const bindings = planningBindings(world);
      const traces: PlanningProposalTrace[] = [];
      const execution = executeTrajectoryV2({ runSpecId: "trajectory_run_spec_v2_multi_planning", trajectoryId: "trajectory_v2_multi_planning", seedContextId: world.seedContextId,
        initialWorld: world, expectedInitialWorldRevision: world.revision, trajectorySeed: 1701, horizonDays: 30, startAt: source.acceptedAt, tickIntervalDays: 1, maxTicks: 3,
        policyId: "planning_fixture", policyVersion: "1", trajectoryEngineVersion: TRAJECTORY_ENGINE_VERSION_V2,
      }, createLocalTrajectoryPolicyV2({ policyId: "planning_fixture", policyVersion: "1", candidatesForTick: ({ world, tickIndex, occurredAt }) => {
        const proposed = proposeDefaultPlanning({ planning: frozen.planning, world, bindings, namespace: "multiresource_fixture", pathKey: "main", tickIndex, occurredAt });
        expect(proposed.candidates).toHaveLength(2);
        traces.push(...proposed.trace);
        return proposed.candidates;
      } }), { agentWorldIdFactory: createStableAgentWorldIdFactoryV2("planning-multi-test") });
      if (!execution.ok) throw new Error(execution.errorCode);
      const compared = comparePlanningEvents(traces, execution.trajectory.finalWorld);
      expect(compared.filter(item => item.status === "selected")).toHaveLength(3);
      expect(compared.filter(item => item.status === "not_selected")).toHaveLength(3);
      return { execution, traces };
    };
    const off = run(false);
    const on = run(true);
    expect(off.execution.trajectory.steps.map(step => step.rngAudit)).toEqual(on.execution.trajectory.steps.map(step => step.rngAudit));
    expect(off.execution.trajectory.steps.map(step => step.proposalId)).toEqual(on.execution.trajectory.steps.map(step => step.proposalId));
    expect(off.traces.map(trace => trace.proposalId)).toEqual(on.traces.map(trace => trace.proposalId));
    expect(off.execution.trajectory.steps.every(step => step.rngAudit && step.rngAudit.selectedIndex === step.rngAudit.rawValue % 2)).toBe(true);
  });

  it("blocks non-self resource controllers, missing assumption bindings, foreign seed and expired deadlines", () => {
    const input = setup();
    const wrongController = structuredClone(input.world);
    wrongController.resources[0].controllerAgentId = idsV2.manager;
    expect(proposeDefaultPlanning({ ...input, world: wrongController }).candidates).toEqual([]);
    expect(proposeDefaultPlanning({ ...input, bindings: { ...input.bindings, assumptions: new Map() } }).candidates).toEqual([]);
    expect(proposeDefaultPlanning({ ...input, world: { ...input.world, seedContextId: "foreign" } }).candidates).toEqual([]);
    const expired = structuredClone(input.world);
    expired.constraints.push({ ...expired.constraints[0], target: { type: "resource", id: input.bindings.resources.get("resource-1")! } });
    expect(proposeDefaultPlanning({ ...input, world: expired }).candidates).toEqual([]);
    const unowned = structuredClone(input.world);
    unowned.resources[0].ownerEntityId = idsV2.currentCompany;
    expect(proposeDefaultPlanning({ ...input, world: unowned }).candidates).toEqual([]);
  });

  it("does not introduce a candidate that fits only after prior reduction", () => {
    const on = setup(true);
    const off = setup(false);
    for (const input of [on, off]) {
      input.world.resources[0].available = 1.95;
      expect(proposeDefaultPlanning(input).candidates).toEqual([]);
    }
  });

  it("never spends beyond accepted controlled budget or executes outside its frozen tick window", () => {
    const input = setup();
    expect(proposeDefaultPlanning({ ...input, tickIndex: 3 }).candidates).toEqual([]);
    expect(proposeDefaultPlanning({ ...input, tickIndex: -1 }).candidates).toEqual([]);
    expect(proposeDefaultPlanning({ ...input, occurredAt: "invalid" }).candidates).toEqual([]);
    expect(proposeDefaultPlanning({ ...input, namespace: "bad namespace" }).candidates).toEqual([]);
    expect(proposeDefaultPlanning({ ...input, pathKey: "arbitrary" }).candidates).toEqual([]);
  });

  it("rejects forged causal reference or quantity in an event comparison", () => {
    const input = setup();
    const proposed = proposeDefaultPlanning(input);
    const runtime = { clock: () => input.occurredAt, idFactory: createStableAgentWorldIdFactoryV2("planning-tamper-test") };
    const approval = approveActionProposalV2(proposed.candidates[0], input.world, input.world.revision, runtime);
    if (!approval.ok) throw new Error(approval.errorCode);
    const transition = applyWorldTransitionV2(input.world, approval.command, runtime);
    if (!transition.ok) throw new Error(transition.errorCode);
    for (const mutate of [
      (world: WorldStateV2) => { world.worldEvents[0].causalAssumptionIds = []; },
      (world: WorldStateV2) => { if (world.worldEvents[0].operation.actionType === "allocate_resource") world.worldEvents[0].operation.amount = 2; },
    ]) {
      const corrupted = structuredClone(transition.world);
      mutate(corrupted);
      expect(() => comparePlanningEvents(proposed.trace, corrupted)).toThrow("invalid_planning_event_trace");
    }
  });
});
