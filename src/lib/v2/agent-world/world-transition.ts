import { parseWorldEventIdV2 } from "./ids";
import {
  operationMatchesDeclaredTargetsV2,
  operationSourceMatchesCausalReferencesV2,
  violatesWorldConstraintsV2,
} from "./constraint-validation";
import type {
  AgentStateV2,
  AgentWorldRuntimeV2,
  TransitionCommandV2,
  WorldEventDeltaV2,
  WorldEventV2,
  WorldStateV2,
  WorldTransitionErrorCodeV2,
  WorldTransitionResultV2,
} from "./types";
import {
  executableAssumptionErrorV2,
  transitionCommandSchemaV2,
  validateWorldV2,
} from "./validation";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function failure(errorCode: WorldTransitionErrorCodeV2): WorldTransitionResultV2 {
  return { ok: false, errorCode };
}

function causalReferenceError(
  world: WorldStateV2,
  command: TransitionCommandV2,
): WorldTransitionErrorCodeV2 | null {
  const evidenceIds = new Set(
    world.realityBoundarySnapshot.evidenceLedger.items.map((item) => item.id),
  );
  const assumptionIds = new Set(
    world.realityBoundarySnapshot.assumptionLedger.assumptions.map((item) => item.id),
  );
  const eventIds = new Set(world.worldEventIds);
  if (
    command.causalRealEvidenceIds.some((id) => !evidenceIds.has(id)) ||
    command.causalAssumptionIds.some((id) => !assumptionIds.has(id)) ||
    command.priorWorldEventIds.some((id) => !eventIds.has(id))
  ) {
    return "broken_causal_reference";
  }
  const assumptionError = executableAssumptionErrorV2(
    world.realityBoundarySnapshot,
    command.causalAssumptionIds,
  );
  return assumptionError === "unknown_assumption"
    ? "broken_causal_reference"
    : assumptionError;
}

function updateAgentState(
  world: WorldStateV2,
  actorId: TransitionCommandV2["actorId"],
  eventId: WorldEventV2["id"],
  now: string,
  update: (state: AgentStateV2) => void,
) {
  const state = world.agentStates.find((item) => item.agentDefinitionId === actorId)!;
  const before = clone(state);
  update(state);
  state.revision += 1;
  state.lastActionReference = { referenceType: "world_event", worldEventId: eventId };
  state.updatedAt = now;
  return { before, after: clone(state) };
}

export function applyWorldTransitionV2(
  currentWorld: WorldStateV2,
  commandInput: TransitionCommandV2,
  runtime: AgentWorldRuntimeV2,
): WorldTransitionResultV2 {
  const parsed = transitionCommandSchemaV2.safeParse(commandInput);
  if (!parsed.success) return failure("invalid_transition_command");
  const command = clone(parsed.data as TransitionCommandV2);
  if (command.seedContextId !== currentWorld.seedContextId) {
    return failure("cross_seed_reference");
  }
  if (currentWorld.appliedTransitionCommandIds.includes(command.id)) {
    return failure("duplicate_transition");
  }
  if (command.expectedWorldRevision !== currentWorld.revision) {
    return failure("stale_world_revision");
  }
  if (!currentWorld.agentDefinitions.some((item) => item.id === command.actorId)) {
    return failure("unknown_actor");
  }
  const causalError = causalReferenceError(currentWorld, command);
  if (causalError) return failure(causalError);
  const operation = command.operation;
  if (
    operation.actionType === "allocate_resource" &&
    !currentWorld.resources.some((item) => item.id === operation.resourceId)
  ) {
    return failure("unknown_resource");
  }
  if (
    operation.actionType === "update_relation_signal" &&
    !currentWorld.relations.some((item) => item.id === operation.relationId)
  ) {
    return failure("unknown_relation");
  }
  if (
    operation.actionType === "update_external_variable" &&
    !currentWorld.externalVariables.some(
      (item) => item.id === operation.variableId,
    )
  ) {
    return failure("unknown_variable");
  }
  if (
    operation.actionType === "request_information" &&
    operation.targetEntityId &&
    !currentWorld.entities.some(
      (item) => item.id === operation.targetEntityId,
    )
  ) {
    return failure("unknown_entity");
  }
  if (!operationMatchesDeclaredTargetsV2(command.operation, command)) {
    return failure("target_mismatch");
  }
  if (
    !operationSourceMatchesCausalReferencesV2(
      command.operation,
      command.causalRealEvidenceIds,
      command.priorWorldEventIds,
    )
  ) {
    return failure("broken_causal_reference");
  }

  const now = runtime.clock();
  const nowTime = Date.parse(now);
  if (
    !Number.isFinite(nowTime) ||
    nowTime < Date.parse(currentWorld.updatedAt) ||
    nowTime < Date.parse(command.createdAt) ||
    command.priorWorldEventIds.some((id) => {
      const prior = currentWorld.worldEvents.find((event) => event.id === id);
      return !prior || Date.parse(prior.createdAt) > nowTime;
    })
  ) {
    return failure("invalid_transition_command");
  }
  if (
    violatesWorldConstraintsV2(currentWorld, {
      actorId: command.actorId,
      operation: command.operation,
      targetEntityIds: command.targetEntityIds,
      targetResourceIds: command.targetResourceIds,
      targetRelationIds: command.targetRelationIds,
      targetVariableIds: command.targetVariableIds,
      now,
    })
  ) {
    return failure("constraint_violation");
  }

  const rawEventId = runtime.idFactory(
    "world_event",
    JSON.stringify([currentWorld.id, command.id, currentWorld.revision]),
  );
  const eventId = parseWorldEventIdV2(rawEventId);
  if (!eventId) return failure("invalid_transition_command");
  const next = clone(currentWorld);
  let delta: WorldEventDeltaV2;

  if (operation.actionType === "record_observation") {
    const source = operation.source;
    if (
      (source.sourceType === "real_evidence" &&
        !next.realityBoundarySnapshot.evidenceLedger.items.some(
          (item) => item.id === source.realEvidenceId,
        )) ||
      (source.sourceType === "world_event" &&
        !next.worldEventIds.includes(source.worldEventId))
    ) {
      return failure("broken_causal_reference");
    }
    const changed = updateAgentState(next, command.actorId, eventId, now, (state) => {
      state.observations.push({
        id: `observation_${eventId}`,
        content: operation.observation,
        source: clone(source),
        observedAt: now,
      });
      state.memory.push({
        id: `memory_${eventId}`,
        source: clone(source),
        content: operation.observation,
        recordedAt: now,
      });
    });
    delta = { path: `agentStates.${command.actorId}.observations`, valueType: "agent_state", ...changed };
  } else if (operation.actionType === "request_information") {
    if (operation.targetEntityId && !next.entities.some((item) => item.id === operation.targetEntityId)) {
      return failure("unknown_entity");
    }
    const changed = updateAgentState(next, command.actorId, eventId, now, (state) => {
      state.observableStatus = "awaiting_information";
      state.commitments.push({
        id: `request_${eventId}`,
        label: operation.question,
        status: "active",
      });
    });
    delta = { path: `agentStates.${command.actorId}.observableStatus`, valueType: "agent_state", ...changed };
  } else if (operation.actionType === "update_commitment") {
    const changed = updateAgentState(next, command.actorId, eventId, now, (state) => {
      const existing = state.commitments.find((item) => item.id === operation.commitmentId);
      if (existing) {
        existing.label = operation.label;
        existing.status = operation.status;
      } else {
        state.commitments.push({
          id: operation.commitmentId,
          label: operation.label,
          status: operation.status,
        });
      }
      state.observableStatus = operation.status === "active" ? "committed" : state.observableStatus;
    });
    delta = { path: `agentStates.${command.actorId}.commitments`, valueType: "agent_state", ...changed };
  } else if (operation.actionType === "allocate_resource") {
    const resource = next.resources.find((item) => item.id === operation.resourceId);
    if (!resource) return failure("unknown_resource");
    const after = resource.available - operation.amount;
    if (!Number.isFinite(operation.amount) || operation.amount <= 0 || after < resource.min || after > resource.max) {
      return failure("value_out_of_range");
    }
    const before = resource.available;
    resource.available = after;
    delta = { path: `resources.${resource.id}.available`, valueType: "resource", before, after };
  } else if (operation.actionType === "update_external_variable") {
    const variable = next.externalVariables.find((item) => item.id === operation.variableId);
    if (!variable) return failure("unknown_variable");
    if (variable.variableType === "number") {
      if (typeof operation.value !== "number" || operation.value < variable.min || operation.value > variable.max) {
        return failure("value_out_of_range");
      }
    } else if (typeof operation.value !== "string" || !variable.allowedValues.includes(operation.value)) {
      return failure("invalid_enum_value");
    }
    const before = variable.value;
    (variable as { value: number | string }).value = operation.value;
    delta = { path: `externalVariables.${variable.id}.value`, valueType: "variable", before, after: operation.value };
  } else {
    const relation = next.relations.find((item) => item.id === operation.relationId);
    if (!relation) return failure("unknown_relation");
    const before = relation.signal;
    relation.signal = operation.signal;
    delta = { path: `relations.${relation.id}.signal`, valueType: "relation", before, after: operation.signal };
  }

  const event: WorldEventV2 = {
    id: eventId,
    seedContextId: next.seedContextId,
    commandId: command.id,
    proposalId: command.proposalId,
    actorId: command.actorId,
    eventType: command.operation.actionType,
    operation: clone(command.operation),
    targetEntityIds: clone(command.targetEntityIds),
    targetResourceIds: clone(command.targetResourceIds),
    targetRelationIds: clone(command.targetRelationIds),
    targetVariableIds: clone(command.targetVariableIds),
    evidenceClass: "world_transition_simulation_evidence",
    beforeRevision: currentWorld.revision,
    afterRevision: currentWorld.revision + 1,
    deltas: [delta],
    causalRealEvidenceIds: clone(command.causalRealEvidenceIds),
    causalAssumptionIds: clone(command.causalAssumptionIds),
    priorWorldEventIds: clone(command.priorWorldEventIds),
    validationRuleIds: clone(command.validationRuleIds),
    engineVersion: next.engineVersion,
    commandCreatedAt: command.createdAt,
    createdAt: now,
  };
  next.revision += 1;
  next.appliedTransitionCommandIds.push(command.id);
  next.worldEventIds.push(event.id);
  next.worldEvents.push(event);
  next.updatedAt = now;
  const validation = validateWorldV2(next);
  return validation.ok ? { ok: true, world: next, event } : failure("invalid_transition_command");
}
