import { describe, expect, it } from "vitest";
import { approveActionProposalV2 } from "@/lib/v2/agent-world/action-proposal";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import { applyWorldTransitionV2 } from "@/lib/v2/agent-world/world-transition";
import { freezeDefaultPlanning, parseFrozenDefaultPlanning } from "./index";
import { projectDefaultPlanning } from "./projection";
import { proposeDefaultPlanning } from "./proposals";
import { planningSource, planningRequest, planningWorld, planningBindings } from "./test-fixtures";

function fixture() {
  const frozen = freezeDefaultPlanning(planningRequest(), planningSource());
  if (!frozen.ok) throw new Error(frozen.errorCode);
  const world = planningWorld(frozen.planning);
  const proposed = proposeDefaultPlanning({ planning: frozen.planning, world, bindings: planningBindings(world), namespace: "safe_projection_fixture", pathKey: "main", tickIndex: 0, occurredAt: frozen.planning.sourceBinding.acceptedAt });
  const runtime = { clock: () => frozen.planning.sourceBinding.acceptedAt, idFactory: createStableAgentWorldIdFactoryV2("safe-planning-projection") };
  const approval = approveActionProposalV2(proposed.candidates[0], world, world.revision, runtime);
  if (!approval.ok) throw new Error(approval.errorCode);
  const transition = applyWorldTransitionV2(world, approval.command, runtime);
  if (!transition.ok) throw new Error(transition.errorCode);
  return { planning: frozen.planning, trace: proposed.trace, finalWorld: transition.world, before: world };
}

describe("safe frozen planning result", () => {
  it("does not label a Core-controlled alternate-resource event as the authorized original", () => {
    const input = fixture();
    const world = structuredClone(input.before);
    const alternate = { ...structuredClone(world.resources[0]), id: "world_resource_v2_alternate" as const, available: 20, max: 30 };
    world.resources.push(alternate);
    const trace = structuredClone(input.trace);
    trace[0].resourceId = alternate.id;
    const original = proposeDefaultPlanning({ planning: input.planning, world: input.before, bindings: planningBindings(input.before), namespace: "safe_projection_fixture", pathKey: "main", tickIndex: 0, occurredAt: input.planning.sourceBinding.acceptedAt }).candidates[0];
    original.parameters = { actionType: "allocate_resource", resourceId: alternate.id, amount: trace[0].proposedAmount };
    original.targetResourceIds = [alternate.id];
    const runtime = { clock: () => input.planning.sourceBinding.acceptedAt, idFactory: createStableAgentWorldIdFactoryV2("wrong-resource-core") };
    const approval = approveActionProposalV2(original, world, world.revision, runtime);
    expect(approval.ok).toBe(true);
    if (!approval.ok) throw new Error(approval.errorCode);
    const transition = applyWorldTransitionV2(world, approval.command, runtime);
    expect(transition.ok).toBe(true);
    if (!transition.ok) throw new Error(transition.errorCode);
    expect(transition.world.resources[0].available).toBe(world.resources[0].available);
    expect(transition.world.resources.at(-1)!.available).toBeLessThan(alternate.available);
    expect(() => projectDefaultPlanning(input.planning, [{ trace, finalWorld: transition.world }])).toThrow("invalid_planning_event_trace");
  });
  it("shows actual selected quantities and the frozen hypothesis without source or event identifiers", () => {
    const input = fixture();
    const result = projectDefaultPlanning(input.planning, [input]);
    expect(result.frozenHypothesis).toMatchObject({ status: "active", classification: "hypothesis", reduction: 0.1, relationshipEffect: "not_implemented", scientificProbability: false });
    expect(result.trace[0]).toMatchObject({ status: "selected", proposedAmount: 0.9, neutralAmount: 1 });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(serialized).not.toMatch(/world_event_v2_|world_resource_v2_|assumption_v2_|sourceRefs|ownerId|snapshotId|birthDate|birthTime/);
    expect(input.planning.fusion.inputs).not.toBeNull();
  });

  it("keeps unselected proposals and legacy absence truthful", () => {
    const input = fixture();
    expect(projectDefaultPlanning(input.planning, [{ trace: input.trace, finalWorld: input.before }]).trace[0]).toMatchObject({ status: "not_selected", actualAmount: null });
    expect(projectDefaultPlanning(undefined)).toMatchObject({ status: "not_recorded", frozenHypothesis: null, trace: [] });
  });

  it("rejects altered trace amounts, clocks, caps and cross-seed final worlds", () => {
    const input = fixture();
    const changed = structuredClone(input);
    changed.trace[0].neutralAmount = 2;
    expect(() => projectDefaultPlanning(changed.planning, [changed])).toThrow("invalid_planning_event_trace");
    const crossSeed = structuredClone(input);
    crossSeed.finalWorld.seedContextId = "foreign";
    expect(() => projectDefaultPlanning(crossSeed.planning, [crossSeed])).toThrow("invalid_planning_event_trace");
    const badConsent = structuredClone(input.planning);
    badConsent.fusion.confirmedForSimulation = false;
    expect(() => parseFrozenDefaultPlanning(badConsent)).toThrow("invalid_frozen_planning");
    const badCap = { ...input.planning, fusion: { ...input.planning.fusion, reductionCap: 0.5 } };
    expect(() => parseFrozenDefaultPlanning(badCap)).toThrow();
  });
});
