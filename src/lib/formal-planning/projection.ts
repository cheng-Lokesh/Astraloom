import { z } from "zod";
import { digitalLifeSafeText } from "@/lib/digital-life/model";
import type { WorldStateV2 } from "@/lib/v2/agent-world/types";
import { parseFrozenDefaultPlanning } from "./index";
import { comparePlanningEvents, type PlanningProposalTrace } from "./proposals";
import { planningWorldBindingMatches } from "./world-binding";
import { safeRelationshipResponseSchema } from "./relationship-contracts";
import { resolveRelationshipTrigger, RELATIONSHIP_ASSUMPTION_CATEGORY, createRelationshipAssumption } from "./relationship-response";

const nonnegative = z.number().finite().nonnegative();
const amount = z.number().finite().positive();
export const safeDefaultPlanningSchema = z.object({
  status: z.enum(["not_recorded", "active", "inactive"]), frozenAt: z.string().datetime({ offset: true }).nullable(),
  budgetSemantics: z.literal("per_path_per_sample_whole_run"),
  resources: z.array(z.object({ key: z.string().regex(/^resource-[1-8]$/), label: digitalLifeSafeText.max(80), unit: digitalLifeSafeText.max(32),
    status: z.enum(["active", "explicit_rule", "explicit_rate", "no_budget_headroom"]), totalBudgetLimit: amount, neutralAmount: nonnegative, initialAvailable: nonnegative, minimum: nonnegative }).strict()).max(8),
  frozenHypothesis: z.object({ version: z.literal("symbolic-initial-planning-hypothesis-v1"), status: z.enum(["off", "active", "unavailable"]),
    confirmedForSimulation: z.boolean(), classification: z.literal("hypothesis"), reductionCap: z.literal(0.1), reduction: z.number().min(0).max(0.1),
    cautionReduction: z.union([z.literal(0), z.literal(0.05)]), rhythmReduction: z.union([z.literal(0), z.literal(0.05)]),
    relationshipEffect: z.literal("not_implemented"), realityEvidence: z.literal(false), scientificProbability: z.literal(false),
  }).strict().nullable(),
  relationshipResponse: safeRelationshipResponseSchema.optional(),
  trace: z.array(z.object({ key: z.string().regex(/^planning-[1-9]\d*$/), pathKey: z.string().regex(/^(main|person-[1-9]\d*)$/), tickNumber: z.number().int().min(1).max(6),
    resourceLabel: digitalLifeSafeText.max(80), unit: digitalLifeSafeText.max(32), neutralAmount: amount, proposedAmount: amount,
    priorApplied: z.boolean(), reduction: z.number().min(0).max(0.1), totalBudgetLimit: amount,
    status: z.enum(["selected", "not_selected"]), actualAmount: nonnegative.nullable(),
    assumptionCategories: z.array(z.string().regex(/^formal_(default_planning_resource_[1-8]|symbolic_initial_planning_v1|relationship_response_v1)$/)).min(1).max(2),
    evidenceSummary: z.literal("实际变化来自本次运行的受控模拟事件；不是现实发生证明"),
  }).strict()).max(512),
}).strict().superRefine((projection, context) => {
  if (projection.trace.some(item => item.status === "selected" ? item.actualAmount === null : item.actualAmount !== null)) context.addIssue({ code: "custom", message: "invalid_planning_event_trace" });
});
export type SafeDefaultPlanning = z.infer<typeof safeDefaultPlanningSchema>;

/** A legacy result must remain absent instead of being reconstructed from current preferences. */
export function projectDefaultPlanning(planningInput: unknown, entries: Array<{ trace: PlanningProposalTrace[]; finalWorld: WorldStateV2; pathKey?: string; namespace?: string }> = []): SafeDefaultPlanning {
  if (planningInput === undefined) return safeDefaultPlanningSchema.parse({ status: "not_recorded", frozenAt: null, budgetSemantics: "per_path_per_sample_whole_run", resources: [], frozenHypothesis: null, trace: [] });
  const planning = parseFrozenDefaultPlanning(planningInput);
  const trace: SafeDefaultPlanning["trace"] = [];
  const responseSamples: z.infer<typeof safeRelationshipResponseSchema>["samples"] = [];
  for (const entry of entries) {
    if (planning.version === "formal-default-planner-v2" && (!entry.pathKey || !entry.namespace || !planning.sourceBinding.allowedPaths.some(path => path.pathKey === entry.pathKey) || entry.trace.some(trace => trace.pathKey !== entry.pathKey))) throw new Error("invalid_relationship_path_binding");
    if (entry.namespace) for (const event of entry.finalWorld.worldEvents.filter(event => event.proposalId.startsWith(`action_proposal_v2_formal_planning_${entry.namespace}_`))) {
      if (event.operation.actionType !== "allocate_resource" || !entry.trace.some(trace => trace.proposalId === event.proposalId && trace.resourceId === (event.operation.actionType === "allocate_resource" ? event.operation.resourceId : ""))) throw new Error("missing_planning_event_trace");
    }
    if (entry.finalWorld.seedContextId !== planning.sourceBinding.seedContextId) throw new Error("invalid_planning_event_trace");
    for (const comparison of comparePlanningEvents(entry.trace, entry.finalWorld)) {
      if (!planningWorldBindingMatches(planning, entry.finalWorld, comparison.worldBinding, comparison.pathKey)
        || comparison.resourceId !== comparison.worldBinding.resources.find(item => item.resourceKey === comparison.resourceKey)?.resourceId) throw new Error("invalid_planning_event_trace");
      const resource = planning.resources.find(item => item.resourceKey === comparison.resourceKey && item.status === "active");
      const priorApplied = comparison.tickIndex === 0 && planning.fusion.status === "active";
      let responseReduction = 0;
      if (comparison.relationshipResponse) {
        if (planning.version !== "formal-default-planner-v2" || comparison.pathKey !== planning.relationshipResponse.authorization.pathKey || comparison.resourceKey !== planning.relationshipResponse.authorization.resourceKey || priorApplied) throw new Error("invalid_relationship_event_trace");
        const occurredAt = new Date(Date.parse(comparison.worldBinding.simulationStartAt) + comparison.tickIndex * (planning.maxTicks === 3 ? 10 : 15) * 86_400_000).toISOString();
        const prefix = comparison.proposalId.slice(0, comparison.proposalId.lastIndexOf(`_${comparison.tickIndex}_${comparison.resourceKey}`));
        const namespace = prefix.slice("action_proposal_v2_formal_planning_".length);
        const trigger = resolveRelationshipTrigger(planning.relationshipResponse, entry.finalWorld, namespace, comparison.worldBinding.worldNamespace, occurredAt, comparison.worldBinding.simulationStartAt, planning.maxTicks);
        const assumption = entry.finalWorld.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.category === RELATIONSHIP_ASSUMPTION_CATEGORY);
        const expectedAssumption = createRelationshipAssumption(planning.relationshipResponse);
        if (!trigger || !assumption || assumption.statement !== expectedAssumption.statement || JSON.stringify(assumption.parameterRange) !== JSON.stringify(expectedAssumption.parameterRange)
          || assumption.subjectType !== "self" || assumption.epistemicStatus !== "confirmed_for_simulation" || assumption.confirmationStatus !== "confirmed"
          || assumption.supportingRealEvidenceIds.length || assumption.contradictingRealEvidenceIds.length) throw new Error("invalid_relationship_event_trace");
        const consumed = entry.finalWorld.worldEvents.some(event => Date.parse(event.createdAt) < Date.parse(occurredAt) && event.proposalId.startsWith(`${prefix}_`) && event.operation.actionType === "allocate_resource" && event.operation.resourceId === comparison.resourceId && event.causalAssumptionIds.includes(assumption.id) && event.priorWorldEventIds.includes(trigger.response.id));
        responseReduction = !consumed && trigger.signal === "negative" ? planning.relationshipResponse.negativeReduction : 0;
        if (comparison.relationshipResponse.requestEventId !== trigger.request.id || comparison.relationshipResponse.responseEventId !== trigger.response.id
          || comparison.relationshipResponse.signal !== trigger.signal || comparison.relationshipResponse.responseTickIndex !== trigger.responseTickIndex
          || comparison.relationshipResponse.firstResponseAllocation !== !consumed || comparison.relationshipResponse.reduction !== responseReduction
          || comparison.causalAssumptionIds.includes(assumption.id) !== !consumed) throw new Error("invalid_relationship_event_trace");
        const event = entry.finalWorld.worldEvents.find(item => item.proposalId === comparison.proposalId);
        if (event && JSON.stringify(event.priorWorldEventIds) !== JSON.stringify([trigger.request.id, trigger.response.id])) throw new Error("invalid_relationship_event_trace");
      } else if (planning.version === "formal-default-planner-v2" && comparison.pathKey === planning.relationshipResponse.authorization.pathKey && comparison.resourceKey === planning.relationshipResponse.authorization.resourceKey) {
        const occurredAt = new Date(Date.parse(comparison.worldBinding.simulationStartAt) + comparison.tickIndex * (planning.maxTicks === 3 ? 10 : 15) * 86_400_000).toISOString();
        const prefix = comparison.proposalId.slice(0, comparison.proposalId.lastIndexOf(`_${comparison.tickIndex}_${comparison.resourceKey}`));
        const trigger = resolveRelationshipTrigger(planning.relationshipResponse, entry.finalWorld, prefix.slice("action_proposal_v2_formal_planning_".length), comparison.worldBinding.worldNamespace, occurredAt, comparison.worldBinding.simulationStartAt, planning.maxTicks);
        if (trigger) throw new Error("invalid_relationship_event_trace");
      }
      if (!resource || comparison.tickIndex < 0 || comparison.tickIndex >= planning.maxTicks || comparison.neutralAmount !== resource.neutralAmount
        || comparison.totalBudgetLimit !== resource.totalBudgetLimit || comparison.priorApplied !== priorApplied
        || comparison.reduction !== (priorApplied ? planning.fusion.reduction : 0)
        || comparison.proposedAmount !== resource.neutralAmount * (comparison.relationshipResponse ? 1 - responseReduction : priorApplied ? planning.fusion.initialAmountFactor : 1)) throw new Error("invalid_planning_event_trace");
      trace.push({ key: `planning-${trace.length + 1}`, pathKey: comparison.pathKey, tickNumber: comparison.tickIndex + 1,
        resourceLabel: resource.label, unit: resource.unit, neutralAmount: comparison.neutralAmount, proposedAmount: comparison.proposedAmount,
        priorApplied, reduction: comparison.reduction, totalBudgetLimit: resource.totalBudgetLimit,
        status: comparison.status, actualAmount: comparison.actualAmount,
        assumptionCategories: comparison.causalAssumptionIds.map(id => entry.finalWorld.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.id === id)?.category ?? "invalid"),
        evidenceSummary: "实际变化来自本次运行的受控模拟事件；不是现实发生证明" });
    }
    if (planning.version === "formal-default-planner-v2") {
      const frame = planning.relationshipResponse;
      const resource = planning.resources.find(item => item.resourceKey === frame.authorization.resourceKey)!;
      const relevant = comparePlanningEvents(entry.trace.filter(item => item.relationshipResponse && item.relationshipResponse.firstResponseAllocation), entry.finalWorld);
      const selected = relevant.find(item => item.status === "selected"), first = selected ?? relevant[0];
      if (entry.pathKey === frame.authorization.pathKey) responseSamples.push({ key: `sample-${responseSamples.length + 1}`,
        status: frame.status !== "active" ? "inactive" : selected ? "selected" : first ? "not_selected" : "not_triggered",
        responseTickNumber: first ? first.relationshipResponse!.responseTickIndex + 1 : null, allocationTickNumber: first ? first.tickIndex + 1 : null,
        neutralAmount: resource.neutralAmount, proposedAmount: first?.proposedAmount ?? null, actualAmount: selected?.actualAmount ?? null,
        appliedReduction: first?.relationshipResponse?.reduction ?? null,
        assumptionCategories: first ? first.causalAssumptionIds.map(id => entry.finalWorld.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.id === id)?.category ?? "invalid") : [],
      });
    }
  }
  return safeDefaultPlanningSchema.parse({ status: planning.status, frozenAt: planning.sourceBinding.acceptedAt,
    budgetSemantics: planning.budgetSemantics,
    resources: planning.resources.map(resource => ({ key: resource.resourceKey, label: resource.label, unit: resource.unit, status: resource.status, totalBudgetLimit: resource.totalBudgetLimit, neutralAmount: resource.neutralAmount, initialAvailable: resource.initialAvailable, minimum: resource.minimum })),
    frozenHypothesis: { version: planning.fusion.version, status: planning.fusion.status, confirmedForSimulation: planning.fusion.confirmedForSimulation,
      classification: "hypothesis", reductionCap: planning.fusion.reductionCap, reduction: planning.fusion.reduction,
      cautionReduction: planning.fusion.derivation.cautionReduction, rhythmReduction: planning.fusion.derivation.rhythmReduction,
      relationshipEffect: "not_implemented", realityEvidence: false, scientificProbability: false }, trace,
    ...(planning.version === "formal-default-planner-v2" && entries.length > 0 && entries.every(entry => entry.pathKey === planning.relationshipResponse.authorization.pathKey) ? { relationshipResponse: {
      version: planning.relationshipResponse.authorization.version, pathKey: planning.relationshipResponse.authorization.pathKey, status: planning.relationshipResponse.status,
      selfLabel: planning.relationshipResponse.selfLabel, npcLabel: planning.relationshipResponse.npcLabel, relationLabel: planning.relationshipResponse.relationLabel,
      resourceLabel: planning.resources.find(item => item.resourceKey === planning.relationshipResponse.authorization.resourceKey)!.label,
      unit: planning.resources.find(item => item.resourceKey === planning.relationshipResponse.authorization.resourceKey)!.unit,
      signal: planning.relationshipResponse.authorization.responseRule.operation.actionType === "update_relation_signal" ? planning.relationshipResponse.authorization.responseRule.operation.signal : "neutral",
      baseNegativeReduction: 0.05, symbolicAdditionalReduction: planning.relationshipResponse.symbolicAdditionalReduction, negativeReduction: planning.relationshipResponse.negativeReduction,
      reductionCap: 0.1, symbolicStatus: planning.relationshipResponse.symbolicStatus, classification: "hypothesis", realWorldEvidence: false, scientificProbability: false, samples: responseSamples,
    } } : {}),
  });
}
