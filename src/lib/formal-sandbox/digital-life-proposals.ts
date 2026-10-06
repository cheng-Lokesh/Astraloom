import type { DigitalLifeRules } from "@/lib/digital-life/model";
import type { ActionParametersV2, ActionProposalInputV2, AgentDefinitionIdV2, WorldEntityIdV2, WorldRelationIdV2, WorldResourceIdV2, WorldStateV2 } from "@/lib/v2/agent-world/types";
import type { AssumptionIdV2, RealEvidenceIdV2 } from "@/lib/v2/reality-boundary/types";

export type DigitalLifeProposalBindings = {
  agents: Map<string, AgentDefinitionIdV2>; entities: Map<string, WorldEntityIdV2>;
  relations: Map<string, WorldRelationIdV2>; resources: Map<string, WorldResourceIdV2>;
  evidence: Map<string, RealEvidenceIdV2>; assumptions: Map<string, AssumptionIdV2>;
};

/** Returns proposals only; the accepted V2 approval and transition layer owns every mutation. */
export function proposeDigitalLifeActions(input: {
  rules: DigitalLifeRules["actions"]; world: WorldStateV2; tickIndex: number; occurredAt: string;
  bindings: DigitalLifeProposalBindings; namespace: string;
}): ActionProposalInputV2[] {
  const { rules, world, bindings, tickIndex, occurredAt, namespace } = input;
  return rules.flatMap(rule => {
    const marker = `_${rule.key}`;
    if (world.worldEvents.some(event => event.proposalId.endsWith(marker))) return [];
    const trigger = rule.when.kind === "after_rule" ? world.worldEvents.find(event => event.proposalId.endsWith(`_${rule.when.kind === "after_rule" ? rule.when.ruleKey : ""}`)) : undefined;
    if (rule.when.kind === "at_tick" ? rule.when.tickIndex !== tickIndex : !trigger) return [];
    const actor = bindings.agents.get(rule.actorKey);
    const actorEntity = bindings.entities.get(rule.actorKey);
    if (!actor || !actorEntity || !world.agentDefinitions.some(item => item.id === actor)) return [];
    let parameters: ActionParametersV2;
    const targets = { targetEntityIds: [actorEntity], targetResourceIds: [] as WorldResourceIdV2[], targetRelationIds: [] as WorldRelationIdV2[], targetVariableIds: [] };
    const operation = rule.operation;
    if (operation.actionType === "request_information") {
      const target = bindings.entities.get(operation.targetPersonKey)!;
      targets.targetEntityIds.push(target);
      parameters = { actionType: "request_information", question: operation.question, targetEntityId: target };
    } else if (operation.actionType === "update_commitment") {
      parameters = { actionType: "update_commitment", commitmentId: `digital_life_${rule.actorKey}_${operation.commitmentKey}`, label: operation.label, status: operation.status };
    } else if (operation.actionType === "update_relation_signal") {
      const relationId = bindings.relations.get(operation.relationKey)!;
      const relation = world.relations.find(item => item.id === relationId);
      if (!relation) return [];
      targets.targetEntityIds = [relation.fromEntityId, relation.toEntityId];
      targets.targetRelationIds.push(relationId);
      parameters = { actionType: "update_relation_signal", relationId, signal: operation.signal };
    } else {
      const resourceId = bindings.resources.get(operation.resourceKey)!;
      const resource = world.resources.find(item => item.id === resourceId);
      if (!resource || resource.controllerAgentId !== actor || resource.available - operation.amount < resource.min) return [];
      if (world.constraints.some(constraint => constraint.constraintType === "deadline" && constraint.target.type === "resource" && constraint.target.id === resourceId && constraint.rule.kind === "before_time" && Date.parse(occurredAt) >= Date.parse(constraint.rule.value))) return [];
      targets.targetResourceIds.push(resourceId);
      parameters = { actionType: "allocate_resource", resourceId, amount: operation.amount };
    }
    return [{
      id: `action_proposal_v2_${namespace}_${tickIndex}${marker}`,
      seedContextId: world.seedContextId, actorAgentId: actor, actionType: parameters.actionType, ...targets, parameters,
      realEvidenceIds: [bindings.evidence.get(rule.actorKey)!], assumptionIds: [bindings.assumptions.get(rule.key)!],
      priorWorldEventIds: trigger ? [trigger.id] : [],
      rationaleSummary: `Explicit conditional simulation rule ${rule.key}; not observed real-world behavior.`, createdAt: occurredAt,
    }];
  });
}
