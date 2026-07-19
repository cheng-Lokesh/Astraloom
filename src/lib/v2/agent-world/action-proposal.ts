import { evaluateAssumptionReadinessV2 } from "../reality-boundary/assumption-ledger";
import { parseTransitionCommandIdV2 } from "./ids";
import type {
  ActionProposalInputV2,
  ActionProposalResultV2,
  AgentWorldRuntimeV2,
  CommandApprovalResultV2,
  WorldStateV2,
} from "./types";
import { parseActionProposalInputV2 } from "./validation";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function semanticValidation(
  proposal: ActionProposalInputV2,
  world: WorldStateV2,
): Exclude<ActionProposalResultV2, { ok: true }> | null {
  if (proposal.seedContextId !== world.seedContextId) {
    return { ok: false, errorCode: "cross_seed_reference" };
  }
  if (!world.agentDefinitions.some((item) => item.id === proposal.actorAgentId)) {
    return { ok: false, errorCode: "unknown_actor" };
  }
  const known = {
    entities: new Set(world.entities.map((item) => item.id)),
    resources: new Set(world.resources.map((item) => item.id)),
    relations: new Set(world.relations.map((item) => item.id)),
    variables: new Set(world.externalVariables.map((item) => item.id)),
  };
  if (
    proposal.targetEntityIds.some((id) => !known.entities.has(id)) ||
    proposal.targetResourceIds.some((id) => !known.resources.has(id)) ||
    proposal.targetRelationIds.some((id) => !known.relations.has(id)) ||
    proposal.targetVariableIds.some((id) => !known.variables.has(id))
  ) {
    return { ok: false, errorCode: "unknown_target" };
  }
  const evidenceIds = new Set(
    world.realityBoundarySnapshot.evidenceLedger.items.map((item) => item.id),
  );
  const events = new Set(world.worldEventIds);
  if (
    proposal.realEvidenceIds.some((id) => !evidenceIds.has(id)) ||
    proposal.priorWorldEventIds.some((id) => !events.has(id))
  ) {
    return { ok: false, errorCode: "broken_causal_reference" };
  }
  if (proposal.parameters.actionType === "record_observation") {
    const source = proposal.parameters.source;
    if (
      (source.sourceType === "real_evidence" && !evidenceIds.has(source.realEvidenceId)) ||
      (source.sourceType === "world_event" && !events.has(source.worldEventId))
    ) {
      return { ok: false, errorCode: "broken_causal_reference" };
    }
  }
  const assumptions = new Map(
    world.realityBoundarySnapshot.assumptionLedger.assumptions.map((item) => [item.id, item]),
  );
  for (const id of proposal.assumptionIds) {
    const assumption = assumptions.get(id);
    if (!assumption) return { ok: false, errorCode: "broken_causal_reference" };
    const readiness = evaluateAssumptionReadinessV2(assumption);
    if (
      assumption.subjectType === "third_party" &&
      assumption.impactLevel === "high" &&
      !readiness.downstreamReady
    ) {
      return { ok: false, errorCode: "third_party_confirmation_required" };
    }
    if (!readiness.downstreamReady) {
      return { ok: false, errorCode: "assumption_not_executable" };
    }
  }
  const parameters = proposal.parameters;
  if (parameters.actionType === "allocate_resource") {
    const resource = world.resources.find((item) => item.id === parameters.resourceId);
    if (!resource) return { ok: false, errorCode: "unknown_target" };
    if (parameters.amount > resource.available || resource.available - parameters.amount < resource.min) {
      return { ok: false, errorCode: "value_out_of_range" };
    }
  }
  if (parameters.actionType === "update_external_variable") {
    const variable = world.externalVariables.find((item) => item.id === parameters.variableId);
    if (!variable) return { ok: false, errorCode: "unknown_target" };
    if (
      (variable.variableType === "number" &&
        (typeof parameters.value !== "number" ||
          parameters.value < variable.min ||
          parameters.value > variable.max)) ||
      (variable.variableType === "enum" &&
        (typeof parameters.value !== "string" ||
          !variable.allowedValues.includes(parameters.value)))
    ) {
      return { ok: false, errorCode: "value_out_of_range" };
    }
  }
  if (
    parameters.actionType === "update_relation_signal" &&
    !known.relations.has(parameters.relationId)
  ) {
    return { ok: false, errorCode: "unknown_target" };
  }
  if (
    parameters.actionType === "request_information" &&
    parameters.targetEntityId &&
    !known.entities.has(parameters.targetEntityId)
  ) {
    return { ok: false, errorCode: "unknown_target" };
  }
  return null;
}

export function buildActionProposalV2(
  input: unknown,
  world: WorldStateV2,
): ActionProposalResultV2 {
  const parsed = parseActionProposalInputV2(input);
  if (!parsed.ok) {
    return { ok: false, errorCode: "invalid_action_proposal", issues: parsed.issues };
  }
  const validation = semanticValidation(parsed.value, world);
  return validation ?? { ok: true, proposal: clone(parsed.value) };
}

export function approveActionProposalV2(
  proposalInput: ActionProposalInputV2,
  world: WorldStateV2,
  expectedWorldRevision: number,
  runtime: AgentWorldRuntimeV2,
): CommandApprovalResultV2 {
  if (!Number.isInteger(expectedWorldRevision) || expectedWorldRevision < 0) {
    return { ok: false, errorCode: "invalid_expected_revision" };
  }
  const proposalResult = buildActionProposalV2(proposalInput, world);
  if (!proposalResult.ok) return proposalResult;
  const proposal = clone(proposalResult.proposal);
  const rawId = runtime.idFactory(
    "transition_command",
    JSON.stringify([proposal.id, expectedWorldRevision, proposal.parameters]),
  );
  const commandId = parseTransitionCommandIdV2(rawId);
  if (!commandId) {
    return { ok: false, errorCode: "invalid_action_proposal" };
  }
  return {
    ok: true,
    command: {
      id: commandId,
      proposalId: proposal.id,
      seedContextId: proposal.seedContextId,
      expectedWorldRevision,
      actorId: proposal.actorAgentId,
      operation: clone(proposal.parameters),
      causalRealEvidenceIds: clone(proposal.realEvidenceIds),
      causalAssumptionIds: clone(proposal.assumptionIds),
      priorWorldEventIds: clone(proposal.priorWorldEventIds),
      validationRuleIds: [
        "stage3.strict_action_schema",
        "stage3.seed_and_reference_integrity",
        "stage3.assumption_execution_gate",
        "stage3.operation_whitelist",
      ],
      createdAt: runtime.clock(),
    },
  };
}
