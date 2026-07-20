import type {
  ActionParametersV2,
  AgentDefinitionIdV2,
  WorldEntityIdV2,
  WorldRelationIdV2,
  WorldResourceIdV2,
  WorldStateV2,
  WorldVariableIdV2,
} from "./types";

export type DeclaredTargetsV2 = {
  targetEntityIds: WorldEntityIdV2[];
  targetResourceIds: WorldResourceIdV2[];
  targetRelationIds: WorldRelationIdV2[];
  targetVariableIds: WorldVariableIdV2[];
};

export function operationMatchesDeclaredTargetsV2(
  operation: ActionParametersV2,
  targets: DeclaredTargetsV2,
) {
  switch (operation.actionType) {
    case "allocate_resource":
      return targets.targetResourceIds.includes(operation.resourceId);
    case "update_external_variable":
      return targets.targetVariableIds.includes(operation.variableId);
    case "update_relation_signal":
      return targets.targetRelationIds.includes(operation.relationId);
    case "request_information":
      return (
        !operation.targetEntityId ||
        targets.targetEntityIds.includes(operation.targetEntityId)
      );
    default:
      return true;
  }
}

export function operationSourceMatchesCausalReferencesV2(
  operation: ActionParametersV2,
  realEvidenceIds: string[],
  priorWorldEventIds: string[],
) {
  if (operation.actionType !== "record_observation") return true;
  return operation.source.sourceType === "real_evidence"
    ? realEvidenceIds.includes(operation.source.realEvidenceId)
    : priorWorldEventIds.includes(operation.source.worldEventId);
}

function constraintTargetsTransition(
  target: WorldStateV2["constraints"][number]["target"],
  declared: DeclaredTargetsV2,
) {
  if (target.type === "entity") return declared.targetEntityIds.includes(target.id);
  if (target.type === "resource") return declared.targetResourceIds.includes(target.id);
  return declared.targetVariableIds.includes(target.id);
}

function resultingNumericValue(
  world: WorldStateV2,
  operation: ActionParametersV2,
  target: WorldStateV2["constraints"][number]["target"],
) {
  if (
    target.type === "resource" &&
    operation.actionType === "allocate_resource" &&
    operation.resourceId === target.id
  ) {
    const resource = world.resources.find((item) => item.id === target.id);
    return resource ? resource.available - operation.amount : null;
  }
  if (
    target.type === "variable" &&
    operation.actionType === "update_external_variable" &&
    operation.variableId === target.id &&
    typeof operation.value === "number"
  ) {
    return operation.value;
  }
  return null;
}

/**
 * Stage 3 max_value semantics constrain the resulting Resource/Variable value,
 * not the requested delta. Time is supplied by the injected runtime.
 */
export function violatesWorldConstraintsV2(
  world: WorldStateV2,
  transition: DeclaredTargetsV2 & {
    actorId: AgentDefinitionIdV2;
    operation: ActionParametersV2;
    now: string;
  },
) {
  for (const constraint of world.constraints) {
    if (!constraintTargetsTransition(constraint.target, transition)) continue;
    if (
      constraint.constraintType === "deadline" &&
      constraint.rule.kind === "before_time" &&
      Date.parse(transition.now) >= Date.parse(constraint.rule.value)
    ) {
      return true;
    }
    if (
      constraint.constraintType === "approval_required" &&
      constraint.rule.kind === "requires_agent" &&
      transition.actorId !== constraint.rule.value
    ) {
      return true;
    }
    if (
      constraint.constraintType === "capacity_limit" &&
      constraint.rule.kind === "max_value"
    ) {
      const result = resultingNumericValue(world, transition.operation, constraint.target);
      if (result !== null && result > constraint.rule.value) return true;
    }
  }
  return false;
}
