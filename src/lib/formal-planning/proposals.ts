import { violatesWorldConstraintsV2 } from "@/lib/v2/agent-world/constraint-validation";
import type { ActionProposalInputV2, AgentDefinitionIdV2, WorldEntityIdV2, WorldResourceIdV2, WorldStateV2 } from "@/lib/v2/agent-world/types";
import type { AssumptionIdV2 } from "@/lib/v2/reality-boundary/types";
import { createPlanningAssumptions, parseFrozenDefaultPlanning } from "./index";
import type { FrozenDefaultPlanning } from "./contracts";
import { planningWorldBindingMatches, planningWorldBindingSchema, type PlanningWorldBinding } from "./world-binding";
import { z } from "zod";

export const planningProposalTraceSchema = z.object({
  version: z.literal("formal-default-planning-trace-v1"), pathKey: z.string().regex(/^(main|person-[1-9]\d*)$/), tickIndex: z.number().int().min(0).max(5), resourceKey: z.string().regex(/^resource-[1-8]$/),
  resourceId: z.custom<WorldResourceIdV2>(value => typeof value === "string" && /^world_resource_v2_[a-z0-9_-]+$/i.test(value)),
  proposalId: z.custom<ActionProposalInputV2["id"]>(value => typeof value === "string" && /^action_proposal_v2_[a-z0-9_-]+$/i.test(value)),
  neutralAmount: z.number().finite().positive(), proposedAmount: z.number().finite().positive(), priorApplied: z.boolean(), reduction: z.number().finite().min(0).max(0.1), reductionCap: z.literal(0.1),
  totalBudgetLimit: z.number().finite().positive(), spentBefore: z.number().finite().nonnegative(), causalAssumptionIds: z.array(z.custom<AssumptionIdV2>(value => typeof value === "string" && /^assumption_v2_[a-z0-9]+$/i.test(value))).min(1).max(2), worldBinding: planningWorldBindingSchema,
}).strict();

export type PlanningBindings = {
  actorAgentId: AgentDefinitionIdV2; actorEntityId: WorldEntityIdV2;
  resources: Map<string, WorldResourceIdV2>; assumptions: Map<string, AssumptionIdV2>;
  worldBinding: PlanningWorldBinding;
};
export type PlanningProposalTrace = {
  version: "formal-default-planning-trace-v1";
  pathKey: string; tickIndex: number; resourceKey: string; resourceId: WorldResourceIdV2;
  proposalId: ActionProposalInputV2["id"]; neutralAmount: number; proposedAmount: number;
  priorApplied: boolean; reduction: number; reductionCap: 0.1;
  totalBudgetLimit: number; spentBefore: number;
  causalAssumptionIds: AssumptionIdV2[];
  worldBinding: PlanningWorldBinding;
};

/** Only returns candidates; Core retains uniform selection, approval and every World mutation. */
export function proposeDefaultPlanning(input: {
  planning: FrozenDefaultPlanning; world: WorldStateV2; bindings: PlanningBindings;
  namespace: string; pathKey: string; tickIndex: number; occurredAt: string;
}): { candidates: ActionProposalInputV2[]; trace: PlanningProposalTrace[] } {
  const planning = parseFrozenDefaultPlanning(input.planning);
  const { world, bindings, tickIndex, occurredAt, namespace, pathKey } = input;
  const empty = { candidates: [] as ActionProposalInputV2[], trace: [] as PlanningProposalTrace[] };
  if (!/^[a-zA-Z0-9_-]{1,180}$/.test(namespace) || !/^(main|person-[1-9]\d*)$/.test(pathKey)
    || !Number.isInteger(tickIndex) || tickIndex < 0 || tickIndex >= planning.maxTicks || !Number.isFinite(Date.parse(occurredAt))
    || world.seedContextId !== planning.sourceBinding.seedContextId || planning.status !== "active") return empty;
  if (!planningWorldBindingMatches(planning, world, bindings.worldBinding, pathKey)
    || bindings.actorAgentId !== bindings.worldBinding.actorAgentId || bindings.actorEntityId !== bindings.worldBinding.actorEntityId) return empty;
  const actor = world.agentDefinitions.find(agent => agent.id === bindings.actorAgentId);
  const entity = world.entities.find(item => item.id === bindings.actorEntityId);
  if (actor?.actorType !== "self" || entity?.agentDefinitionId !== actor.id) return empty;
  const expectedAssumptions = createPlanningAssumptions(planning);
  const resolve = (category: string) => {
    const id = bindings.assumptions.get(category);
    const assumption = world.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.id === id);
    const expected = expectedAssumptions.find(item => item.category === category);
    return assumption && expected && assumption.seedContextId === world.seedContextId && assumption.subjectType === "self"
      && assumption.epistemicStatus === "confirmed_for_simulation" && assumption.confirmationStatus === "confirmed"
      && assumption.statement === expected.statement && assumption.category === expected.category
      && assumption.supportingRealEvidenceIds.length === 0 && assumption.contradictingRealEvidenceIds.length === 0
      && JSON.stringify(assumption.parameterRange) === JSON.stringify(expected.parameterRange) ? id : undefined;
  };
  const candidates: ActionProposalInputV2[] = [];
  const trace: PlanningProposalTrace[] = [];
  const prefix = `action_proposal_v2_formal_planning_${namespace}_`;
  for (const resourcePlan of planning.resources) {
    if (resourcePlan.status !== "active") continue;
    const resourceId = bindings.resources.get(resourcePlan.resourceKey);
    const resource = world.resources.find(item => item.id === resourceId);
    const baseAssumption = resolve(resourcePlan.assumptionCategory);
    const priorApplied = tickIndex === 0 && planning.fusion.status === "active";
    const priorAssumption = priorApplied ? resolve("formal_symbolic_initial_planning_v1") : undefined;
    if (!resource || !resourceId || resourceId !== bindings.worldBinding.resources.find(item => item.resourceKey === resourcePlan.resourceKey)?.resourceId || !baseAssumption || priorApplied && !priorAssumption
      || resource.controllerAgentId !== actor.id || resource.ownerEntityId !== entity.id
      || resource.label !== resourcePlan.label || resource.unit !== resourcePlan.unit || resource.min !== resourcePlan.minimum) continue;
    // Eligibility uses the neutral quantity so the prior cannot add candidates by fitting a smaller budget.
    if (resource.available - resourcePlan.neutralAmount < resource.min) continue;
    const proposalId = `${prefix}${tickIndex}_${resourcePlan.resourceKey}` as ActionProposalInputV2["id"];
    if (world.worldEvents.some(event => event.proposalId === proposalId)) continue;
    const priorAllocations = world.worldEvents.filter(event => event.proposalId.startsWith(prefix) && event.operation.actionType === "allocate_resource" && event.operation.resourceId === resourceId);
    const spentBefore = priorAllocations.reduce((total, event) => total + (event.operation.actionType === "allocate_resource" ? event.operation.amount : 0), 0);
    // Count accepted neutral slices, not rounded prior-dependent sums; this gate stays equal under on/off.
    if ((priorAllocations.length + 1) * resourcePlan.neutralAmount > resourcePlan.totalBudgetLimit || spentBefore > resourcePlan.totalBudgetLimit) continue;
    const amount = resourcePlan.neutralAmount * (priorApplied ? planning.fusion.initialAmountFactor : 1);
    const parameters = { actionType: "allocate_resource" as const, resourceId, amount };
    const targets = { targetEntityIds: [entity.id], targetResourceIds: [resourceId], targetRelationIds: [], targetVariableIds: [] };
    // Check the same neutral operation for eligibility; Core repeats all guards for the actual candidate.
    if (violatesWorldConstraintsV2(world, { actorId: actor.id, operation: { ...parameters, amount: resourcePlan.neutralAmount }, ...targets, now: occurredAt })) continue;
    const assumptionIds = [baseAssumption, ...(priorAssumption ? [priorAssumption] : [])];
    candidates.push({ id: proposalId, seedContextId: world.seedContextId, actorAgentId: actor.id,
      actionType: "allocate_resource", parameters, ...targets,
      realEvidenceIds: [...new Set([...resource.provenance.realEvidenceIds, ...actor.realEvidenceIds])], assumptionIds,
      priorWorldEventIds: [...world.worldEventIds],
      rationaleSummary: "Explicitly authorized default simulation planning; initial quantity is a bounded product hypothesis, not observed behavior.", createdAt: occurredAt,
    });
    trace.push({ version: "formal-default-planning-trace-v1", pathKey, tickIndex, resourceKey: resourcePlan.resourceKey,
      resourceId, proposalId, neutralAmount: resourcePlan.neutralAmount, proposedAmount: amount, priorApplied,
      reduction: priorApplied ? planning.fusion.reduction : 0, reductionCap: 0.1,
      totalBudgetLimit: resourcePlan.totalBudgetLimit, spentBefore, causalAssumptionIds: [...assumptionIds], worldBinding: structuredClone(bindings.worldBinding) });
  }
  return { candidates, trace };
}

/** Compare each proposed quantity with real controlled simulation Events, including unselected candidates. */
export function comparePlanningEvents(trace: PlanningProposalTrace[], world: WorldStateV2) {
  return trace.map(item => {
    const event = world.worldEvents.find(event => event.proposalId === item.proposalId);
    if (!event) return { ...structuredClone(item), status: "not_selected" as const, eventId: null, actualAmount: null };
    const delta = event.deltas.find(delta => delta.valueType === "resource" && delta.path === `resources.${item.resourceId}.available`);
    const referencesMatch = item.causalAssumptionIds.every(id => event.causalAssumptionIds.includes(id));
    if (event.seedContextId !== world.seedContextId || event.actorId !== item.worldBinding.actorAgentId || event.operation.actionType !== "allocate_resource" || event.operation.resourceId !== item.resourceId
      || event.operation.amount !== item.proposedAmount || !referencesMatch || delta?.valueType !== "resource"
      || Math.abs((delta.before - delta.after) - item.proposedAmount) > Number.EPSILON * Math.max(1, delta.before) * 4) throw new Error("invalid_planning_event_trace");
    return { ...structuredClone(item), status: "selected" as const, eventId: event.id, actualAmount: delta.before - delta.after };
  });
}
