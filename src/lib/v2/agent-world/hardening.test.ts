import { describe, expect, it } from "vitest";

import type { AssumptionV2 } from "../reality-boundary/types";
import { approveActionProposalV2, buildActionProposalV2 } from "./action-proposal";
import {
  actionProposalInputV2,
  createFixedAgentWorldRuntimeV2,
  fixedWorldNowV2,
  idsV2,
  realityBoundaryV2,
  worldInitializationSpecV2,
} from "./test-fixtures";
import type {
  ActionProposalInputV2,
  AgentWorldRuntimeV2,
  TransitionCommandV2,
  WorldStateV2,
} from "./types";
import { validateWorldV2 } from "./validation";
import { initializeWorldV2 } from "./world-initializer";
import { applyWorldTransitionV2 } from "./world-transition";

function initialWorld() {
  const result = initializeWorldV2(
    realityBoundaryV2(),
    worldInitializationSpecV2(),
    createFixedAgentWorldRuntimeV2(),
  );
  if (!result.ok) throw new Error(result.errorCode);
  return result.world;
}

function command(world: WorldStateV2, input: ActionProposalInputV2) {
  const approved = approveActionProposalV2(
    input,
    world,
    world.revision,
    createFixedAgentWorldRuntimeV2(),
  );
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
    statement: `Event-only assumption ${id}`,
    category: `event_${id}`,
    ...overrides,
  };
  world.realityBoundarySnapshot.assumptionLedger.assumptions.push(assumption);
  return assumption.id;
}

function appliedWorld(input: (world: WorldStateV2) => ActionProposalInputV2) {
  const world = initialWorld();
  const result = applyWorldTransitionV2(
    world,
    command(world, input(world)),
    createFixedAgentWorldRuntimeV2(),
  );
  if (!result.ok) throw new Error(result.errorCode);
  return result.world;
}

function expectInvalidWorldWithoutThrow(input: unknown) {
  expect(() => validateWorldV2(input)).not.toThrow();
  expect(validateWorldV2(input)).toMatchObject({ ok: false });
}

function expectIssue(world: unknown, code: string, path?: string) {
  const result = validateWorldV2(world);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining(path ? { code, path } : { code }),
    ]),
  );
}

describe("Stage 3.1 strict World input boundary", () => {
  it.each([
    ["empty object", {}],
    ["null", null],
    ["missing fieldProvenance", (() => {
      const value = initialWorld() as unknown as Record<string, unknown>;
      const definitions = value.agentDefinitions as Array<Record<string, unknown>>;
      delete definitions[0]!.fieldProvenance;
      return value;
    })()],
    ["wrong commitments", (() => {
      const value = initialWorld();
      (value.agentStates[0] as unknown as { commitments: unknown }).commitments = "broken";
      return value;
    })()],
    ["wrong event deltas", (() => {
      const world = initialWorld();
      const applied = applyWorldTransitionV2(
        world,
        command(world, actionProposalInputV2(world)),
        createFixedAgentWorldRuntimeV2(),
      );
      if (!applied.ok) throw new Error(applied.errorCode);
      (applied.world.worldEvents[0] as unknown as { deltas: unknown }).deltas = null;
      return applied.world;
    })()],
  ])("does not throw for %s", (_label, input) => {
    expectInvalidWorldWithoutThrow(input);
  });

  it("rejects versions, enums, non-finite numbers, and invalid ranges", () => {
    const invalid = initialWorld() as unknown as Record<string, unknown>;
    invalid.schemaVersion = "3.0";
    invalid.engineVersion = "agent-world-engine-v2-stage-4";
    const definitions = invalid.agentDefinitions as Array<Record<string, unknown>>;
    definitions[0]!.actorType = "oracle";
    const resources = invalid.resources as Array<Record<string, unknown>>;
    resources[0]!.available = Number.NaN;
    resources[0]!.max = Number.POSITIVE_INFINITY;
    const states = invalid.agentStates as Array<Record<string, unknown>>;
    states[0]!.revision = 0.5;
    expectIssue(invalid, "invalid_world");
  });

  it("rejects empty, duplicate, and out-of-domain enum values", () => {
    const cases = [
      { allowedValues: [], value: "open" },
      { allowedValues: ["open", "open"], value: "open" },
      { allowedValues: ["open", "closed"], value: "paused" },
    ];
    for (const enumCase of cases) {
      const invalid = initialWorld();
      const variable = invalid.externalVariables.find(
        (item) => item.variableType === "enum",
      );
      if (!variable || variable.variableType !== "enum") throw new Error("missing_enum");
      variable.allowedValues = enumCase.allowedValues;
      variable.value = enumCase.value;
      expectIssue(invalid, "invalid_variable_range");
    }
  });

  it("rejects nested unknown fields", () => {
    const invalid = initialWorld();
    (invalid.agentDefinitions[0]!.fieldProvenance.displayName as unknown as Record<string, unknown>).hidden = true;
    expectIssue(invalid, "forbidden_field");
  });

  it("validates every nested timestamp", () => {
    const invalid = initialWorld();
    invalid.agentStates[0]!.observations.push({
      id: "observation_bad_time",
      content: "Bad timestamp",
      source: {
        sourceType: "real_evidence",
        realEvidenceId: invalid.realityBoundarySnapshot.evidenceLedger.items[0]!.id,
      },
      observedAt: "not-a-time",
    });
    expectIssue(invalid, "invalid_timestamp");
  });
});

describe("Stage 3.1 Reality Boundary snapshot integrity", () => {
  it.each([
    ["world seed", (world: WorldStateV2) => { world.realityBoundarySnapshot.seedContextId = "seed_other"; }],
    ["snapshot revision", (world: WorldStateV2) => { world.realityBoundaryRevisionSnapshot += 1; }],
    ["evidence revision", (world: WorldStateV2) => { world.realityBoundarySnapshot.evidenceLedger.revision += 1; }],
    ["assumption revision", (world: WorldStateV2) => { world.realityBoundarySnapshot.assumptionLedger.revision += 1; }],
    ["evidence seed", (world: WorldStateV2) => { world.realityBoundarySnapshot.evidenceLedger.items[0]!.seedContextId = "seed_other"; }],
    ["assumption seed", (world: WorldStateV2) => { world.realityBoundarySnapshot.assumptionLedger.assumptions[0]!.seedContextId = "seed_other"; }],
  ])("rejects a mismatched %s", (_label, mutate) => {
    const invalid = initialWorld();
    mutate(invalid);
    expectIssue(invalid, "cross_seed_reference");
  });

  it("rejects a corrupted Evidence Ledger", () => {
    const invalid = initialWorld();
    invalid.realityBoundarySnapshot.evidenceLedger.items[0]!.provenance = [];
    expectIssue(invalid, "invalid_world");
  });

  it("rejects a forged Assumption Ledger", () => {
    const invalid = initialWorld();
    invalid.realityBoundarySnapshot.assumptionLedger.assumptions[0]!.factStatus = "real_world_fact" as never;
    expectIssue(invalid, "invalid_world");
  });

  it("safely rejects malformed unknown initialization input", () => {
    expect(() =>
      initializeWorldV2(
        realityBoundaryV2(),
        { seedContextId: "seed_career_decision" },
        createFixedAgentWorldRuntimeV2(),
      ),
    ).not.toThrow();
    expect(
      initializeWorldV2(
        realityBoundaryV2(),
        { seedContextId: "seed_career_decision" },
        createFixedAgentWorldRuntimeV2(),
      ),
    ).toMatchObject({ ok: false, errorCode: "invalid_initialization_spec" });
  });
});

describe("Stage 3.1 reference and provenance integrity", () => {
  it("rejects empty provenance on every modeled object class", () => {
    const mutations: Array<(world: WorldStateV2) => void> = [
      (world) => { world.agentDefinitions[0]!.fieldProvenance.displayName.realEvidenceIds = []; },
      (world) => { world.agentDefinitions[0]!.fieldProvenance.role.realEvidenceIds = []; },
      (world) => { world.entities[0]!.provenance.realEvidenceIds = []; },
      (world) => { world.relations[0]!.provenance.realEvidenceIds = []; },
      (world) => { world.resources[0]!.provenance.realEvidenceIds = []; },
      (world) => { world.constraints[0]!.provenance.realEvidenceIds = []; },
      (world) => { world.externalVariables[0]!.provenance.realEvidenceIds = []; },
    ];
    for (const mutate of mutations) {
      const invalid = initialWorld();
      mutate(invalid);
      expectIssue(invalid, "missing_reference");
    }
  });

  it("requires AgentDefinition aggregate references to equal field provenance unions", () => {
    const hidden = initialWorld();
    hidden.agentDefinitions[0]!.realEvidenceIds = [
      hidden.realityBoundarySnapshot.evidenceLedger.items[0]!.id,
    ];
    expectIssue(hidden, "missing_reference");

    const lost = initialWorld();
    lost.agentDefinitions[1]!.assumptionIds = [];
    expectIssue(lost, "missing_reference");
  });

  it("rejects broken Entity, resourceAccess, and lastAction references", () => {
    const entity = initialWorld();
    entity.entities[0]!.agentDefinitionId = "agent_definition_v2_missing";
    expectIssue(entity, "missing_reference");

    const access = initialWorld();
    access.agentStates[0]!.resourceAccessIds = ["world_resource_v2_missing"];
    expectIssue(access, "missing_reference");

    const action = initialWorld();
    action.agentStates[0]!.lastActionReference = {
      referenceType: "action_proposal",
      actionProposalId: "action_proposal_v2_missing",
    };
    expectIssue(action, "missing_reference");
  });

  it("rejects Agent State revisions above the World revision", () => {
    const invalid = initialWorld();
    invalid.agentStates[0]!.revision = 1;
    expectIssue(invalid, "invalid_world");
  });

  it("rejects duplicate reference arrays", () => {
    const invalid = initialWorld();
    const evidenceId = invalid.agentDefinitions[0]!.realEvidenceIds[0]!;
    invalid.agentDefinitions[0]!.realEvidenceIds.push(evidenceId);
    expectIssue(invalid, "duplicate_id");
  });

  it("rejects invalid Event namespaces and broken actors", () => {
    const world = initialWorld();
    const applied = applyWorldTransitionV2(
      world,
      command(world, actionProposalInputV2(world)),
      createFixedAgentWorldRuntimeV2(),
    );
    if (!applied.ok) throw new Error(applied.errorCode);
    const brokenActor = structuredClone(applied.world);
    brokenActor.worldEvents[0]!.actorId = "agent_definition_v2_missing";
    expectIssue(brokenActor, "missing_reference");
    const brokenProposal = structuredClone(applied.world);
    brokenProposal.worldEvents[0]!.proposalId = "world_event_v2_wrong" as never;
    expectIssue(brokenProposal, "invalid_id_namespace");
  });

  it("rejects Event self-references and future references", () => {
    const world = initialWorld();
    const first = applyWorldTransitionV2(
      world,
      command(world, actionProposalInputV2(world)),
      createFixedAgentWorldRuntimeV2(),
    );
    if (!first.ok) throw new Error(first.errorCode);
    const secondInput = actionProposalInputV2(first.world, {
      id: "action_proposal_v2_second",
      actionType: "update_external_variable",
      targetEntityIds: [],
      targetResourceIds: [],
      targetVariableIds: [idsV2.promotionBudget],
      parameters: {
        actionType: "update_external_variable",
        variableId: idsV2.promotionBudget,
        value: 55,
      },
    });
    const second = applyWorldTransitionV2(
      first.world,
      command(first.world, secondInput),
      createFixedAgentWorldRuntimeV2(),
    );
    if (!second.ok) throw new Error(second.errorCode);

    const selfReference = structuredClone(second.world);
    selfReference.worldEvents[1]!.priorWorldEventIds = [selfReference.worldEvents[1]!.id];
    expectIssue(selfReference, "missing_reference");

    const futureReference = structuredClone(second.world);
    futureReference.worldEvents[0]!.priorWorldEventIds = [futureReference.worldEvents[1]!.id];
    expectIssue(futureReference, "missing_reference");
  });

  it.each([
    {
      id: "assumption_v2_eventrejected" as const,
      overrides: {
        epistemicStatus: "rejected" as const,
        confirmationStatus: "rejected" as const,
      },
      code: "assumption_not_executable",
    },
    {
      id: "assumption_v2_eventdisputed" as const,
      overrides: {
        epistemicStatus: "disputed" as const,
        confirmationStatus: "not_required" as const,
      },
      code: "assumption_not_executable",
    },
    {
      id: "assumption_v2_eventthirdparty" as const,
      overrides: {
        subjectType: "third_party" as const,
        impactLevel: "high" as const,
        epistemicStatus: "inferred" as const,
        confirmationRequirement: "required" as const,
        confirmationStatus: "pending" as const,
      },
      code: "third_party_confirmation_required",
    },
  ])(
    "revalidates Event causal Assumption readiness: $code",
    ({ id, overrides, code }) => {
      const invalid = appliedWorld((world) => actionProposalInputV2(world));
      const assumptionId = addCausalAssumption(invalid, id, overrides);
      invalid.worldEvents[0]!.causalAssumptionIds = [assumptionId];

      expectIssue(invalid, code);
    },
  );

  it("uses broken_causal_reference only for a missing Event causal Assumption", () => {
    const invalid = appliedWorld((world) => actionProposalInputV2(world));
    invalid.worldEvents[0]!.causalAssumptionIds = [
      "assumption_v2_missingeventcause",
    ];

    expectIssue(invalid, "broken_causal_reference");
  });

  it("rejects causal Event history whose timestamps run backward", () => {
    const world = initialWorld();
    const first = applyWorldTransitionV2(
      world,
      command(world, actionProposalInputV2(world)),
      createFixedAgentWorldRuntimeV2(),
    );
    if (!first.ok) throw new Error(first.errorCode);
    const observation = actionProposalInputV2(first.world, {
      id: "action_proposal_v2_time_order",
      actionType: "record_observation",
      targetEntityIds: [],
      targetResourceIds: [],
      priorWorldEventIds: [first.event.id],
      parameters: {
        actionType: "record_observation",
        observation: "The first event remains an auditable cause.",
        source: { sourceType: "world_event", worldEventId: first.event.id },
      },
    });
    const second = applyWorldTransitionV2(
      first.world,
      command(first.world, observation),
      createFixedAgentWorldRuntimeV2(),
    );
    if (!second.ok) throw new Error(second.errorCode);
    expect(validateWorldV2(second.world)).toEqual({ ok: true, issues: [] });

    const invalid = structuredClone(second.world);
    invalid.worldEvents[0]!.createdAt = "2026-07-19T10:01:00.000Z";
    invalid.updatedAt = "2026-07-19T10:01:00.000Z";
    expectIssue(invalid, "invalid_timestamp");
  });

  it.each([
    ["World updatedAt", (world: WorldStateV2) => {
      world.updatedAt = "2026-07-19T09:59:59.000Z";
    }],
    ["Command createdAt", (world: WorldStateV2) => {
      world.worldEvents[0]!.commandCreatedAt = "2026-07-19T10:01:00.000Z";
    }],
  ] as const)("rejects a backward %s audit time", (_label, mutate) => {
    const invalid = appliedWorld((world) => actionProposalInputV2(world));
    mutate(invalid);
    expectIssue(invalid, "invalid_timestamp");
  });
});

describe("Stage 3.1 Proposal, Command, and Event causal closure", () => {
  it.each([
    [
      "allocate_resource",
      (world: WorldStateV2) => actionProposalInputV2(world, { targetResourceIds: [] }),
    ],
    [
      "update_external_variable",
      (world: WorldStateV2) => actionProposalInputV2(world, {
        id: "action_proposal_v2_variable_target",
        actionType: "update_external_variable",
        targetEntityIds: [],
        targetResourceIds: [],
        targetVariableIds: [],
        parameters: {
          actionType: "update_external_variable",
          variableId: idsV2.promotionBudget,
          value: 55,
        },
      }),
    ],
    [
      "update_relation_signal",
      (world: WorldStateV2) => actionProposalInputV2(world, {
        id: "action_proposal_v2_relation_target",
        actionType: "update_relation_signal",
        targetEntityIds: [],
        targetResourceIds: [],
        targetRelationIds: [],
        parameters: {
          actionType: "update_relation_signal",
          relationId: idsV2.recruits,
          signal: "neutral",
        },
      }),
    ],
    [
      "request_information",
      (world: WorldStateV2) => actionProposalInputV2(world, {
        id: "action_proposal_v2_entity_target",
        actionType: "request_information",
        targetEntityIds: [],
        targetResourceIds: [],
        parameters: {
          actionType: "request_information",
          question: "Can the deadline move?",
          targetEntityId: idsV2.recruiterEntity,
        },
      }),
    ],
  ])("rejects an undeclared %s operation target", (_label, build) => {
    const world = initialWorld();
    expect(buildActionProposalV2(build(world), world)).toMatchObject({
      ok: false,
      errorCode: "target_mismatch",
    });
  });

  it("requires an observation source in its matching causal array", () => {
    const world = initialWorld();
    const evidenceId = world.realityBoundarySnapshot.evidenceLedger.items[0]!.id;
    const input = actionProposalInputV2(world, {
      id: "action_proposal_v2_observation_causal",
      actionType: "record_observation",
      targetEntityIds: [],
      targetResourceIds: [],
      parameters: {
        actionType: "record_observation",
        observation: "The offer remains open.",
        source: { sourceType: "real_evidence", realEvidenceId: evidenceId },
      },
      realEvidenceIds: [],
    });
    expect(buildActionProposalV2(input, world)).toMatchObject({
      ok: false,
      errorCode: "broken_causal_reference",
    });
  });

  it("rejects duplicate declared and causal ids before approval", () => {
    const world = initialWorld();
    const input = actionProposalInputV2(world);
    input.targetResourceIds.push(input.targetResourceIds[0]!);
    input.realEvidenceIds.push(input.realEvidenceIds[0]!);
    expect(buildActionProposalV2(input, world)).toMatchObject({
      ok: false,
      errorCode: "invalid_action_proposal",
    });
  });

  it("independently rejects a tampered Command target", () => {
    const world = initialWorld();
    const approved = command(world, actionProposalInputV2(world));
    const tampered = {
      ...approved,
      targetEntityIds: [idsV2.offer],
      targetResourceIds: [],
      targetRelationIds: [],
      targetVariableIds: [],
    } as unknown as TransitionCommandV2;
    expect(
      applyWorldTransitionV2(world, tampered, createFixedAgentWorldRuntimeV2()),
    ).toEqual({ ok: false, errorCode: "target_mismatch" });
  });

  it("independently rejects a tampered observation causal source", () => {
    const world = initialWorld();
    const evidenceId = world.realityBoundarySnapshot.evidenceLedger.items[0]!.id;
    const observation = actionProposalInputV2(world, {
      id: "action_proposal_v2_observation_command",
      actionType: "record_observation",
      targetEntityIds: [],
      targetResourceIds: [],
      parameters: {
        actionType: "record_observation",
        observation: "The offer remains open.",
        source: { sourceType: "real_evidence", realEvidenceId: evidenceId },
      },
    });
    const approved = command(world, observation);
    const tampered = {
      ...approved,
      causalRealEvidenceIds: [],
    } as TransitionCommandV2;
    expect(
      applyWorldTransitionV2(world, tampered, createFixedAgentWorldRuntimeV2()),
    ).toEqual({ ok: false, errorCode: "broken_causal_reference" });
  });

  it("preserves operation targets and sources in the generated Event", () => {
    const world = initialWorld();
    const input = actionProposalInputV2(world);
    const result = applyWorldTransitionV2(
      world,
      command(world, input),
      createFixedAgentWorldRuntimeV2(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event).toMatchObject({
      operation: input.parameters,
      targetEntityIds: input.targetEntityIds,
      targetResourceIds: input.targetResourceIds,
      targetRelationIds: input.targetRelationIds,
      targetVariableIds: input.targetVariableIds,
    });
  });
});

describe("Stage 3.1 typed operation-bound Event delta", () => {
  it.each([
    ["wrong path", (delta: Record<string, unknown>) => {
      delta.path = `resources.${idsV2.budget}.available`;
    }],
    ["wrong valueType", (delta: Record<string, unknown>) => {
      delta.valueType = "variable";
    }],
    ["arbitrary before object", (delta: Record<string, unknown>) => {
      delta.before = { available: 6 };
    }],
    ["array after value", (delta: Record<string, unknown>) => {
      delta.after = [5];
    }],
    ["operation-inconsistent result", (delta: Record<string, unknown>) => {
      delta.after = 4;
    }],
    ["unknown delta field", (delta: Record<string, unknown>) => {
      delta.hiddenPatch = { arbitrary: true };
    }],
  ] as const)("rejects resource delta with %s", (_label, mutate) => {
    const invalid = appliedWorld((world) => actionProposalInputV2(world));
    mutate(invalid.worldEvents[0]!.deltas[0] as unknown as Record<string, unknown>);
    expectInvalidWorldWithoutThrow(invalid);
  });

  it("rejects an operation-consistent delta that does not replay to the current World", () => {
    const invalid = appliedWorld((world) => actionProposalInputV2(world));
    const delta = invalid.worldEvents[0]!.deltas[0]!;
    delta.before = 7 as never;
    delta.after = 6 as never;
    expectInvalidWorldWithoutThrow(invalid);
  });

  it("rejects a numeric Variable delta with the wrong type or operation value", () => {
    const buildVariable = (world: WorldStateV2) =>
      actionProposalInputV2(world, {
        id: "action_proposal_v2_typed_variable",
        actionType: "update_external_variable",
        targetEntityIds: [],
        targetResourceIds: [],
        targetVariableIds: [idsV2.promotionBudget],
        parameters: {
          actionType: "update_external_variable",
          variableId: idsV2.promotionBudget,
          value: 60,
        },
      });
    const wrongType = appliedWorld(buildVariable);
    wrongType.worldEvents[0]!.deltas[0]!.after = "60" as never;
    expectInvalidWorldWithoutThrow(wrongType);

    const wrongValue = appliedWorld(buildVariable);
    wrongValue.worldEvents[0]!.deltas[0]!.after = 59;
    expectInvalidWorldWithoutThrow(wrongValue);
  });

  it("rejects a Relation delta that disagrees with the operation", () => {
    const invalid = appliedWorld((world) =>
      actionProposalInputV2(world, {
        id: "action_proposal_v2_typed_relation",
        actionType: "update_relation_signal",
        targetEntityIds: [],
        targetResourceIds: [],
        targetRelationIds: [idsV2.recruits],
        parameters: {
          actionType: "update_relation_signal",
          relationId: idsV2.recruits,
          signal: "neutral",
        },
      }),
    );
    invalid.worldEvents[0]!.deltas[0]!.after = "positive";
    expectInvalidWorldWithoutThrow(invalid);
  });

  it("rejects Relation delta signal values outside the Relation runtime domain", () => {
    const invalid = appliedWorld((world) =>
      actionProposalInputV2(world, {
        id: "action_proposal_v2_relation_domain",
        actionType: "update_relation_signal",
        targetEntityIds: [],
        targetResourceIds: [],
        targetRelationIds: [idsV2.recruits],
        parameters: {
          actionType: "update_relation_signal",
          relationId: idsV2.recruits,
          signal: "neutral",
        },
      }),
    );
    (invalid.worldEvents[0]!.deltas[0] as unknown as { before: unknown }).before =
      "unknown";
    expectInvalidWorldWithoutThrow(invalid);
  });

  it("rejects an Enum Variable delta whose before value is not allowed", () => {
    const invalid = appliedWorld((world) =>
      actionProposalInputV2(world, {
        id: "action_proposal_v2_enum_domain",
        actionType: "update_external_variable",
        targetEntityIds: [],
        targetResourceIds: [],
        targetVariableIds: [idsV2.offerAvailability],
        parameters: {
          actionType: "update_external_variable",
          variableId: idsV2.offerAvailability,
          value: "closed",
        },
      }),
    );
    invalid.worldEvents[0]!.deltas[0]!.before = "expired" as never;
    expectIssue(invalid, "invalid_world", "worldEvents.0.deltas.0");
  });

  it("rejects Numeric Variable delta values outside the target range", () => {
    const buildVariable = (world: WorldStateV2) =>
      actionProposalInputV2(world, {
        id: "action_proposal_v2_numeric_domain",
        actionType: "update_external_variable",
        targetEntityIds: [],
        targetResourceIds: [],
        targetVariableIds: [idsV2.promotionBudget],
        parameters: {
          actionType: "update_external_variable",
          variableId: idsV2.promotionBudget,
          value: 60,
        },
      });
    const invalidBefore = appliedWorld(buildVariable);
    invalidBefore.worldEvents[0]!.deltas[0]!.before = 101;
    expectIssue(invalidBefore, "invalid_world", "worldEvents.0.deltas.0");

    const invalidAfter = appliedWorld(buildVariable);
    const operation = invalidAfter.worldEvents[0]!.operation;
    if (operation.actionType !== "update_external_variable") throw new Error("operation");
    operation.value = 101;
    invalidAfter.worldEvents[0]!.deltas[0]!.after = 101;
    const variable = invalidAfter.externalVariables.find(
      (item) => item.id === idsV2.promotionBudget,
    );
    if (!variable || variable.variableType !== "number") throw new Error("variable");
    variable.value = 101;
    expectIssue(invalidAfter, "invalid_world", "worldEvents.0.deltas.0");
  });

  it("rejects Resource delta values outside the target range", () => {
    const invalidBefore = appliedWorld((world) => actionProposalInputV2(world));
    invalidBefore.worldEvents[0]!.deltas[0]!.before = 31;
    invalidBefore.worldEvents[0]!.deltas[0]!.after = 30;
    invalidBefore.resources.find((item) => item.id === idsV2.time)!.available = 30;
    expectIssue(invalidBefore, "invalid_world", "worldEvents.0.deltas.0");

    const invalidAfter = appliedWorld((world) => actionProposalInputV2(world));
    invalidAfter.worldEvents[0]!.deltas[0]!.before = 32;
    invalidAfter.worldEvents[0]!.deltas[0]!.after = 31;
    invalidAfter.resources.find((item) => item.id === idsV2.time)!.available = 31;
    expectIssue(invalidAfter, "invalid_world", "worldEvents.0.deltas.0");
  });

  it("accepts legal Relation, Variable, and Resource boundary values", () => {
    for (const signal of ["negative", "neutral", "positive"] as const) {
      const world = appliedWorld((current) =>
        actionProposalInputV2(current, {
          id: `action_proposal_v2_relation_${signal}`,
          actionType: "update_relation_signal",
          targetEntityIds: [],
          targetResourceIds: [],
          targetRelationIds: [idsV2.recruits],
          parameters: {
            actionType: "update_relation_signal",
            relationId: idsV2.recruits,
            signal,
          },
        }),
      );
      expect(validateWorldV2(world)).toEqual({ ok: true, issues: [] });
    }

    for (const value of [0, 100]) {
      const world = appliedWorld((current) =>
        actionProposalInputV2(current, {
          id: `action_proposal_v2_numeric_${value}`,
          actionType: "update_external_variable",
          targetEntityIds: [],
          targetResourceIds: [],
          targetVariableIds: [idsV2.promotionBudget],
          parameters: {
            actionType: "update_external_variable",
            variableId: idsV2.promotionBudget,
            value,
          },
        }),
      );
      expect(validateWorldV2(world)).toEqual({ ok: true, issues: [] });
    }

    const enumWorld = appliedWorld((current) =>
      actionProposalInputV2(current, {
        id: "action_proposal_v2_enum_boundary",
        actionType: "update_external_variable",
        targetEntityIds: [],
        targetResourceIds: [],
        targetVariableIds: [idsV2.offerAvailability],
        parameters: {
          actionType: "update_external_variable",
          variableId: idsV2.offerAvailability,
          value: "closed",
        },
      }),
    );
    expect(validateWorldV2(enumWorld)).toEqual({ ok: true, issues: [] });

    const resourceWorld = initialWorld();
    resourceWorld.resources.find((item) => item.id === idsV2.time)!.available = 30;
    const resourceResult = applyWorldTransitionV2(
      resourceWorld,
      command(
        resourceWorld,
        actionProposalInputV2(resourceWorld, {
          id: "action_proposal_v2_resource_boundaries",
          parameters: {
            actionType: "allocate_resource",
            resourceId: idsV2.time,
            amount: 30,
          },
        }),
      ),
      createFixedAgentWorldRuntimeV2(),
    );
    expect(resourceResult.ok).toBe(true);
    if (!resourceResult.ok) return;
    expect(resourceResult.event.deltas[0]).toMatchObject({ before: 30, after: 0 });
    expect(validateWorldV2(resourceResult.world)).toEqual({ ok: true, issues: [] });
  });

  it("preserves repeated Resource transitions and validates the final replay value", () => {
    const world = initialWorld();
    const first = applyWorldTransitionV2(
      world,
      command(
        world,
        actionProposalInputV2(world, {
          id: "action_proposal_v2_repeated_resource_first",
        }),
      ),
      createFixedAgentWorldRuntimeV2(),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const firstEventSnapshot = structuredClone(first.event);

    const second = applyWorldTransitionV2(
      first.world,
      command(
        first.world,
        actionProposalInputV2(first.world, {
          id: "action_proposal_v2_repeated_resource_second",
          priorWorldEventIds: [first.event.id],
        }),
      ),
      createFixedAgentWorldRuntimeV2(),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.world.revision).toBe(2);
    expect(second.world.worldEvents).toHaveLength(2);
    expect(second.world.worldEvents.map((event) => event.deltas[0])).toMatchObject([
      { before: 6, after: 5 },
      { before: 5, after: 4 },
    ]);
    expect(second.world.worldEvents[0]).toEqual(firstEventSnapshot);
    expect(first.world.worldEvents[0]).toEqual(firstEventSnapshot);
    expect(validateWorldV2(second.world)).toEqual({ ok: true, issues: [] });

    const forged = structuredClone(second.world);
    const lastEvent = forged.worldEvents[1]!;
    if (lastEvent.operation.actionType !== "allocate_resource") {
      throw new Error("operation");
    }
    lastEvent.operation.amount = 2;
    lastEvent.deltas[0]!.after = 3;
    expectIssue(forged, "invalid_world", "worldEvents.deltas");
  });

  it.each([
    ["wrong path", (delta: Record<string, unknown>) => {
      delta.path = `agentStates.${idsV2.manager}.observations`;
    }],
    ["wrong actor", (delta: Record<string, unknown>) => {
      (delta.after as Record<string, unknown>).agentDefinitionId = idsV2.manager;
    }],
    ["invalid revision", (delta: Record<string, unknown>) => {
      (delta.after as Record<string, unknown>).revision = 0;
    }],
    ["unrelated state mutation", (delta: Record<string, unknown>) => {
      (delta.after as Record<string, unknown>).observableStatus = "unavailable";
    }],
    ["unknown nested field", (delta: Record<string, unknown>) => {
      (delta.before as Record<string, unknown>).hidden = true;
    }],
  ] as const)("rejects Agent State delta with %s", (_label, mutate) => {
    const invalid = appliedWorld((world) =>
      actionProposalInputV2(world, {
        id: "action_proposal_v2_typed_observation",
        actionType: "record_observation",
        targetEntityIds: [],
        targetResourceIds: [],
        parameters: {
          actionType: "record_observation",
          observation: "The offer remains open.",
          source: {
            sourceType: "real_evidence",
            realEvidenceId:
              world.realityBoundarySnapshot.evidenceLedger.items[0]!.id,
          },
        },
      }),
    );
    mutate(invalid.worldEvents[0]!.deltas[0] as unknown as Record<string, unknown>);
    expectInvalidWorldWithoutThrow(invalid);
  });
});

describe("Stage 3.1 deterministic World Constraints", () => {
  it("rejects incompatible constraint type and rule combinations", () => {
    const invalid = initialWorld();
    invalid.constraints[0]!.rule = { kind: "max_value", value: 5 };
    expectIssue(invalid, "invalid_world");
  });

  it("allows and rejects capacity_limit using the resulting numeric value", () => {
    const world = initialWorld();
    world.constraints.push({
      id: "world_constraint_v2_budget_capacity",
      seedContextId: world.seedContextId,
      constraintType: "capacity_limit",
      target: { type: "variable", id: idsV2.promotionBudget },
      rule: { kind: "max_value", value: 55 },
      provenance: structuredClone(world.constraints[0]!.provenance),
    });
    const allowed = actionProposalInputV2(world, {
      id: "action_proposal_v2_capacity_allowed",
      actionType: "update_external_variable",
      targetEntityIds: [],
      targetResourceIds: [],
      targetVariableIds: [idsV2.promotionBudget],
      parameters: {
        actionType: "update_external_variable",
        variableId: idsV2.promotionBudget,
        value: 55,
      },
    });
    expect(
      approveActionProposalV2(
        allowed,
        world,
        world.revision,
        createFixedAgentWorldRuntimeV2(),
      ).ok,
    ).toBe(true);
    const rejected = {
      ...allowed,
      id: "action_proposal_v2_capacity_rejected",
      parameters: { ...allowed.parameters, value: 56 },
    } as ActionProposalInputV2;
    expect(
      approveActionProposalV2(
        rejected,
        world,
        world.revision,
        createFixedAgentWorldRuntimeV2(),
      ),
    ).toMatchObject({ ok: false, errorCode: "constraint_violation" });
  });

  it("allows only the required actor for approval_required targets", () => {
    const world = initialWorld();
    world.constraints.push({
      id: "world_constraint_v2_time_approval",
      seedContextId: world.seedContextId,
      constraintType: "approval_required",
      target: { type: "resource", id: idsV2.time },
      rule: { kind: "requires_agent", value: idsV2.manager },
      provenance: structuredClone(world.constraints[0]!.provenance),
    });
    const rejected = actionProposalInputV2(world);
    expect(
      approveActionProposalV2(
        rejected,
        world,
        world.revision,
        createFixedAgentWorldRuntimeV2(),
      ),
    ).toMatchObject({ ok: false, errorCode: "constraint_violation" });

    const allowed = actionProposalInputV2(world, {
      id: "action_proposal_v2_manager_allocation",
      actorAgentId: idsV2.manager,
    });
    expect(
      approveActionProposalV2(
        allowed,
        world,
        world.revision,
        createFixedAgentWorldRuntimeV2(),
      ).ok,
    ).toBe(true);
  });

  it("evaluates deadline using injected approval time", () => {
    const world = initialWorld();
    const proposal = actionProposalInputV2(world);
    expect(
      approveActionProposalV2(
        proposal,
        world,
        world.revision,
        runtimeAt("2026-07-25T16:59:59.000Z"),
      ).ok,
    ).toBe(true);
    expect(
      approveActionProposalV2(
        proposal,
        world,
        world.revision,
        runtimeAt("2026-07-25T17:00:00.000Z"),
      ),
    ).toMatchObject({ ok: false, errorCode: "constraint_violation" });
  });

  it("rechecks constraints during transition after Command approval", () => {
    const world = initialWorld();
    const approved = approveActionProposalV2(
      actionProposalInputV2(world),
      world,
      world.revision,
      runtimeAt(fixedWorldNowV2),
    );
    if (!approved.ok) throw new Error(approved.errorCode);
    expect(
      applyWorldTransitionV2(
        world,
        approved.command,
        runtimeAt("2026-07-25T17:00:00.000Z"),
      ),
    ).toEqual({ ok: false, errorCode: "constraint_violation" });
    expect(world.revision).toBe(0);
    expect(world.worldEvents).toEqual([]);
  });
});
