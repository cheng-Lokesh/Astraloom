import { describe, expect, it } from "vitest";

import { approveActionProposalV2, buildActionProposalV2 } from "./action-proposal";
import type { AssumptionV2 } from "../reality-boundary/types";
import type { ActionProposalInputV2, AgentWorldRuntimeV2, TransitionCommandV2, WorldStateV2 } from "./types";
import { applyWorldTransitionV2 } from "./world-transition";
import { initializeWorldV2 } from "./world-initializer";
import {
  actionProposalInputV2,
  createFixedAgentWorldRuntimeV2,
  fixedWorldNowV2,
  idsV2,
  realityBoundaryV2,
  worldInitializationSpecV2,
} from "./test-fixtures";

function initialWorld() {
  const result = initializeWorldV2(realityBoundaryV2(), worldInitializationSpecV2(), createFixedAgentWorldRuntimeV2());
  if (!result.ok) throw new Error(result.errorCode);
  return result.world;
}

function command(world: WorldStateV2, input: ActionProposalInputV2) {
  const built = buildActionProposalV2(input, world);
  if (!built.ok) throw new Error(built.errorCode);
  const approved = approveActionProposalV2(built.proposal, world, world.revision, createFixedAgentWorldRuntimeV2());
  if (!approved.ok) throw new Error(approved.errorCode);
  return approved.command;
}

function runtimeAt(now: string): AgentWorldRuntimeV2 {
  return { ...createFixedAgentWorldRuntimeV2(), clock: () => now };
}

function addCausalAssumption(
  world: WorldStateV2,
  id: AssumptionV2["id"],
  overrides: Partial<AssumptionV2>,
) {
  const base = structuredClone(
    world.realityBoundarySnapshot.assumptionLedger.assumptions[1]!,
  );
  const assumption: AssumptionV2 = {
    ...base,
    id,
    statement: `Transition-only assumption ${id}`,
    category: `transition_${id}`,
    ...overrides,
  };
  world.realityBoundarySnapshot.assumptionLedger.assumptions.push(assumption);
  return assumption.id;
}

const operations: Array<{ name: string; input: (world: WorldStateV2) => ActionProposalInputV2; path: string }> = [
  { name: "record_observation", input: (world) => actionProposalInputV2(world, { id: "action_proposal_v2_observe", actionType: "record_observation", targetResourceIds: [], parameters: { actionType: "record_observation", observation: "The offer remains open.", source: { sourceType: "real_evidence", realEvidenceId: world.realityBoundarySnapshot.evidenceLedger.items[0]!.id } } }), path: "agentStates" },
  { name: "request_information", input: (world) => actionProposalInputV2(world, { id: "action_proposal_v2_request", actionType: "request_information", targetResourceIds: [], targetEntityIds: [idsV2.recruiterEntity], parameters: { actionType: "request_information", question: "Can the deadline move?", targetEntityId: idsV2.recruiterEntity } }), path: "agentStates" },
  { name: "update_commitment", input: (world) => actionProposalInputV2(world, { id: "action_proposal_v2_commit", actionType: "update_commitment", targetResourceIds: [], parameters: { actionType: "update_commitment", commitmentId: "review_offer", label: "Review offer", status: "active" } }), path: "agentStates" },
  { name: "allocate_resource", input: (world) => actionProposalInputV2(world), path: "resources" },
  { name: "update_external_variable", input: (world) => actionProposalInputV2(world, { id: "action_proposal_v2_variable", actionType: "update_external_variable", targetEntityIds: [], targetResourceIds: [], targetVariableIds: [idsV2.promotionBudget], parameters: { actionType: "update_external_variable", variableId: idsV2.promotionBudget, value: 60 } }), path: "externalVariables" },
  { name: "update_relation_signal", input: (world) => actionProposalInputV2(world, { id: "action_proposal_v2_relation", actionType: "update_relation_signal", targetEntityIds: [], targetResourceIds: [], targetRelationIds: [idsV2.recruits], parameters: { actionType: "update_relation_signal", relationId: idsV2.recruits, signal: "neutral" } }), path: "relations" },
];

describe("Validated World transition V2", () => {
  it.each(operations)("applies whitelisted $name and emits a structured audit delta", ({ input, path }) => {
    const world = initialWorld();
    const result = applyWorldTransitionV2(world, command(world, input(world)), createFixedAgentWorldRuntimeV2());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.world.revision).toBe(1);
    expect(result.event.beforeRevision).toBe(0);
    expect(result.event.afterRevision).toBe(1);
    expect(result.event.deltas[0]?.path).toContain(path);
    expect(result.world.worldEventIds).toEqual([result.event.id]);
  });

  it("keeps inputs and Agent Definitions unchanged", () => {
    const world = initialWorld();
    const transitionCommand = command(world, actionProposalInputV2(world));
    const worldBefore = structuredClone(world);
    const commandBefore = structuredClone(transitionCommand);
    const result = applyWorldTransitionV2(world, transitionCommand, createFixedAgentWorldRuntimeV2());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(world).toEqual(worldBefore);
    expect(transitionCommand).toEqual(commandBefore);
    expect(result.world.agentDefinitions).toEqual(worldBefore.agentDefinitions);
  });

  it("returns stable stale and duplicate errors without partial output", () => {
    const world = initialWorld();
    const firstCommand = command(world, actionProposalInputV2(world));
    expect(applyWorldTransitionV2(world, { ...firstCommand, expectedWorldRevision: 1 }, createFixedAgentWorldRuntimeV2())).toEqual({ ok: false, errorCode: "stale_world_revision" });
    const first = applyWorldTransitionV2(world, firstCommand, createFixedAgentWorldRuntimeV2());
    if (!first.ok) throw new Error(first.errorCode);
    expect(applyWorldTransitionV2(first.world, { ...firstCommand, expectedWorldRevision: 1 }, createFixedAgentWorldRuntimeV2())).toEqual({ ok: false, errorCode: "duplicate_transition" });
  });

  it.each([
    ["unknown_resource", { actionType: "allocate_resource", resourceId: "world_resource_v2_missing", amount: 1 }],
    ["unknown_relation", { actionType: "update_relation_signal", relationId: "world_relation_v2_missing", signal: "positive" }],
    ["unknown_variable", { actionType: "update_external_variable", variableId: "world_variable_v2_missing", value: 1 }],
  ] as const)("returns %s for missing operation target", (errorCode, operation) => {
    const world = initialWorld();
    const valid = command(world, actionProposalInputV2(world));
    expect(applyWorldTransitionV2(world, { ...valid, operation } as TransitionCommandV2, createFixedAgentWorldRuntimeV2())).toEqual({ ok: false, errorCode });
  });

  it("rejects out-of-range values and broken causal references", () => {
    const world = initialWorld();
    const valid = command(world, actionProposalInputV2(world));
    expect(applyWorldTransitionV2(world, { ...valid, operation: { actionType: "allocate_resource", resourceId: idsV2.time, amount: 99 } }, createFixedAgentWorldRuntimeV2())).toEqual({ ok: false, errorCode: "value_out_of_range" });
    expect(applyWorldTransitionV2(world, { ...valid, causalRealEvidenceIds: ["real_evidence_v2_missing"] }, createFixedAgentWorldRuntimeV2())).toEqual({ ok: false, errorCode: "broken_causal_reference" });
  });

  it.each([
    {
      label: "rejected",
      id: "assumption_v2_transitionrejected" as const,
      overrides: {
        epistemicStatus: "rejected" as const,
        confirmationStatus: "rejected" as const,
      },
      errorCode: "assumption_not_executable",
    },
    {
      label: "disputed",
      id: "assumption_v2_transitiondisputed" as const,
      overrides: {
        epistemicStatus: "disputed" as const,
        confirmationStatus: "not_required" as const,
      },
      errorCode: "assumption_not_executable",
    },
    {
      label: "unconfirmed high-impact third party",
      id: "assumption_v2_transitionthirdparty" as const,
      overrides: {
        subjectType: "third_party" as const,
        impactLevel: "high" as const,
        epistemicStatus: "inferred" as const,
        confirmationRequirement: "required" as const,
        confirmationStatus: "pending" as const,
      },
      errorCode: "third_party_confirmation_required",
    },
  ])(
    "revalidates a tampered Command with a present but $label Assumption",
    ({ id, overrides, errorCode }) => {
      const world = initialWorld();
      const approved = command(world, actionProposalInputV2(world));
      const assumptionId = addCausalAssumption(world, id, overrides);
      const before = structuredClone(world);

      expect(
        applyWorldTransitionV2(
          world,
          { ...approved, causalAssumptionIds: [assumptionId] },
          createFixedAgentWorldRuntimeV2(),
        ),
      ).toEqual({ ok: false, errorCode });
      expect(world).toEqual(before);
      expect(world.revision).toBe(0);
      expect(world.worldEvents).toEqual([]);
    },
  );

  it("continues to accept an executable causal Assumption", () => {
    const world = initialWorld();
    const approved = command(world, actionProposalInputV2(world));
    const executable =
      world.realityBoundarySnapshot.assumptionLedger.assumptions[1]!;

    const result = applyWorldTransitionV2(
      world,
      { ...approved, causalAssumptionIds: [executable.id] },
      createFixedAgentWorldRuntimeV2(),
    );

    expect(result.ok).toBe(true);
  });

  it("keeps Real Evidence and World Event memory discriminated", () => {
    const world = initialWorld();
    const bad = actionProposalInputV2(world, { id: "action_proposal_v2_bad_memory", actionType: "record_observation", targetResourceIds: [], parameters: { actionType: "record_observation", observation: "Invalid mixed reference", source: { sourceType: "real_evidence", realEvidenceId: "world_event_v2_fake" as never } } });
    expect(buildActionProposalV2(bad, world)).toMatchObject({ ok: false, errorCode: "invalid_action_proposal" });
  });

  it("is deterministic and preserves append-only event history across two steps", () => {
    const world = initialWorld();
    const firstCommand = command(world, actionProposalInputV2(world));
    expect(applyWorldTransitionV2(world, firstCommand, createFixedAgentWorldRuntimeV2())).toEqual(applyWorldTransitionV2(world, firstCommand, createFixedAgentWorldRuntimeV2()));
    const first = applyWorldTransitionV2(world, firstCommand, createFixedAgentWorldRuntimeV2());
    if (!first.ok) throw new Error(first.errorCode);
    const oldEvent = structuredClone(first.event);
    const secondInput = operations[4]!.input(first.world);
    const second = applyWorldTransitionV2(first.world, command(first.world, secondInput), createFixedAgentWorldRuntimeV2());
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.world.worldEvents[0]).toEqual(oldEvent);
    expect(second.world.worldEvents).toHaveLength(2);
  });

  it("rejects a second causal Event when runtime time moves backward", () => {
    const world = initialWorld();
    const first = applyWorldTransitionV2(
      world,
      command(world, actionProposalInputV2(world)),
      createFixedAgentWorldRuntimeV2(),
    );
    if (!first.ok) throw new Error(first.errorCode);
    const observation = actionProposalInputV2(first.world, {
      id: "action_proposal_v2_time_reversal",
      actionType: "record_observation",
      targetEntityIds: [],
      targetResourceIds: [],
      priorWorldEventIds: [first.event.id],
      parameters: {
        actionType: "record_observation",
        observation: "This cites the first transition.",
        source: { sourceType: "world_event", worldEventId: first.event.id },
      },
    });
    const secondCommand = command(first.world, observation);
    const before = structuredClone(first.world);

    expect(
      applyWorldTransitionV2(
        first.world,
        secondCommand,
        runtimeAt("2026-07-19T09:59:59.000Z"),
      ),
    ).toEqual({ ok: false, errorCode: "invalid_transition_command" });
    expect(first.world).toEqual(before);
  });

  it("rejects an Event timestamp earlier than its Command timestamp", () => {
    const world = initialWorld();
    const proposal = actionProposalInputV2(world);
    const approved = approveActionProposalV2(
      proposal,
      world,
      world.revision,
      runtimeAt("2026-07-19T10:05:00.000Z"),
    );
    if (!approved.ok) throw new Error(approved.errorCode);

    expect(
      applyWorldTransitionV2(
        world,
        approved.command,
        runtimeAt("2026-07-19T10:04:00.000Z"),
      ),
    ).toEqual({ ok: false, errorCode: "invalid_transition_command" });
  });

  it("marks every generated Event as simulation evidence, never Real Evidence", () => {
    const world = initialWorld();
    const result = applyWorldTransitionV2(world, command(world, actionProposalInputV2(world)), createFixedAgentWorldRuntimeV2());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event.evidenceClass).toBe("world_transition_simulation_evidence");
    expect(result.event.createdAt).toBe(fixedWorldNowV2);
    expect(result.event.commandCreatedAt).toBe(fixedWorldNowV2);
    expect(world.realityBoundarySnapshot.evidenceLedger.items.map((item) => item.id)).not.toContain(result.event.id);
  });

  it("allows memory to cite only an already occurred World Event", () => {
    const world = initialWorld();
    const first = applyWorldTransitionV2(
      world,
      command(world, actionProposalInputV2(world)),
      createFixedAgentWorldRuntimeV2(),
    );
    if (!first.ok) throw new Error(first.errorCode);
    const observation = actionProposalInputV2(first.world, {
      id: "action_proposal_v2_event_memory",
      actionType: "record_observation",
      targetEntityIds: [],
      targetResourceIds: [],
      priorWorldEventIds: [first.event.id],
      parameters: {
        actionType: "record_observation",
        observation: "One day was allocated in the prior transition.",
        source: { sourceType: "world_event", worldEventId: first.event.id },
      },
    });
    const second = applyWorldTransitionV2(
      first.world,
      command(first.world, observation),
      createFixedAgentWorldRuntimeV2(),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.world.agentStates[0]?.memory.at(-1)?.source).toEqual({
      sourceType: "world_event",
      worldEventId: first.event.id,
    });
  });
});
