import type { DigitalLifeRules } from "@/lib/digital-life/model";
import type { ActionProposalInputV2, WorldStateV2, AgentDefinitionIdV2, WorldEntityIdV2 } from "@/lib/v2/agent-world/types";
import type { AssumptionIdV2, RealEvidenceIdV2 } from "@/lib/v2/reality-boundary/types";
import type { RealityProfileDraft } from "@/lib/reality-profile/profile";
import type { FrozenDefaultPlanning } from "@/lib/formal-planning/contracts";
import type { PlanningWorldBinding } from "@/lib/formal-planning/world-binding";
import { proposeDefaultPlanning, type PlanningProposalTrace } from "@/lib/formal-planning/proposals";
import { proposeDigitalLifeActions, type DigitalLifeProposalBindings } from "./digital-life-proposals";

export type CandidatePipelineContext = {
  rules: DigitalLifeRules["actions"]; bindings: DigitalLifeProposalBindings; declaredResources: RealityProfileDraft["worldInputs"]["resources"];
  actorAgentId: AgentDefinitionIdV2; actorEntityId: WorldEntityIdV2; primaryEvidenceId: RealEvidenceIdV2; assumptionByCategory: Map<string, AssumptionIdV2>;
  planning?: FrozenDefaultPlanning; planningWorldBinding?: PlanningWorldBinding; pathKey: string;
};

/** Shared runtime/replay producer. Explicit rules have priority over declared rates and the authorized planner. */
export function proposeSandboxCandidates(context: CandidatePipelineContext, tick: { world: WorldStateV2; tickIndex: number; occurredAt: string; namespace: string }): { candidates: ActionProposalInputV2[]; trace: PlanningProposalTrace[] } {
  const { world, tickIndex, occurredAt, namespace } = tick;
  const explicit = proposeDigitalLifeActions({ rules: context.rules, world, tickIndex, occurredAt, namespace, bindings: context.bindings });
  if (explicit.length > 0) return { candidates: explicit, trace: [] };
  const declared: ActionProposalInputV2[] = context.declaredResources.flatMap((resource, index) => {
    const resourceId = context.bindings.resources.get(`resource-${index + 1}`)!;
    const currentResource = world.resources.find(item => item.id === resourceId);
    if (!currentResource || resource.usePerTick === null || currentResource.available - resource.usePerTick < currentResource.min) return [];
    if (world.constraints.some(constraint => constraint.constraintType === "deadline" && constraint.target.type === "resource" && constraint.target.id === resourceId && constraint.rule.kind === "before_time" && Date.parse(occurredAt) >= Date.parse(constraint.rule.value))) return [];
    return [{ id: `action_proposal_v2_${namespace}_${tickIndex}_${resource.key}`, seedContextId: world.seedContextId, actorAgentId: context.actorAgentId, actionType: "allocate_resource", targetEntityIds: [context.actorEntityId], targetResourceIds: [resourceId], targetRelationIds: [], targetVariableIds: [], parameters: { actionType: "allocate_resource", resourceId, amount: resource.usePerTick },
      realEvidenceIds: [...new Set([...currentResource.provenance.realEvidenceIds, context.primaryEvidenceId])], assumptionIds: [...new Set([...currentResource.provenance.assumptionIds, context.assumptionByCategory.get(`reality_profile_world_rate_${resource.key}`)!])], priorWorldEventIds: [...world.worldEventIds], rationaleSummary: `User-declared resource rule at tick ${tickIndex + 1}.`, createdAt: occurredAt }];
  });
  if (!context.planning || !context.planningWorldBinding) return { candidates: declared, trace: [] };
  const planned = proposeDefaultPlanning({ planning: context.planning, world, tickIndex, occurredAt, namespace, pathKey: context.pathKey, bindings: { actorAgentId: context.actorAgentId, actorEntityId: context.actorEntityId, worldBinding: context.planningWorldBinding, resources: context.bindings.resources, assumptions: context.assumptionByCategory } });
  return { candidates: [...declared, ...planned.candidates], trace: planned.trace };
}
