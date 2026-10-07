import { z } from "zod";
import { digitalLifeSafeText } from "@/lib/digital-life/model";
import type { WorldStateV2 } from "@/lib/v2/agent-world/types";
import { parseFrozenDefaultPlanning } from "./index";
import { comparePlanningEvents, type PlanningProposalTrace } from "./proposals";
import { planningWorldBindingMatches } from "./world-binding";

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
  trace: z.array(z.object({ key: z.string().regex(/^planning-[1-9]\d*$/), pathKey: z.string().regex(/^(main|person-[1-9]\d*)$/), tickNumber: z.number().int().min(1).max(6),
    resourceLabel: digitalLifeSafeText.max(80), unit: digitalLifeSafeText.max(32), neutralAmount: amount, proposedAmount: amount,
    priorApplied: z.boolean(), reduction: z.number().min(0).max(0.1), totalBudgetLimit: amount,
    status: z.enum(["selected", "not_selected"]), actualAmount: nonnegative.nullable(),
    assumptionCategories: z.array(z.string().regex(/^formal_(default_planning_resource_[1-8]|symbolic_initial_planning_v1)$/)).min(1).max(2),
    evidenceSummary: z.literal("实际变化来自本次运行的受控模拟事件；不是现实发生证明"),
  }).strict()).max(512),
}).strict().superRefine((projection, context) => {
  if (projection.trace.some(item => item.status === "selected" ? item.actualAmount === null : item.actualAmount !== null)) context.addIssue({ code: "custom", message: "invalid_planning_event_trace" });
});
export type SafeDefaultPlanning = z.infer<typeof safeDefaultPlanningSchema>;

/** A legacy result must remain absent instead of being reconstructed from current preferences. */
export function projectDefaultPlanning(planningInput: unknown, entries: Array<{ trace: PlanningProposalTrace[]; finalWorld: WorldStateV2 }> = []): SafeDefaultPlanning {
  if (planningInput === undefined) return safeDefaultPlanningSchema.parse({ status: "not_recorded", frozenAt: null, budgetSemantics: "per_path_per_sample_whole_run", resources: [], frozenHypothesis: null, trace: [] });
  const planning = parseFrozenDefaultPlanning(planningInput);
  const trace: SafeDefaultPlanning["trace"] = [];
  for (const entry of entries) {
    if (entry.finalWorld.seedContextId !== planning.sourceBinding.seedContextId) throw new Error("invalid_planning_event_trace");
    for (const comparison of comparePlanningEvents(entry.trace, entry.finalWorld)) {
      if (!planningWorldBindingMatches(planning, entry.finalWorld, comparison.worldBinding, comparison.pathKey)
        || comparison.resourceId !== comparison.worldBinding.resources.find(item => item.resourceKey === comparison.resourceKey)?.resourceId) throw new Error("invalid_planning_event_trace");
      const resource = planning.resources.find(item => item.resourceKey === comparison.resourceKey && item.status === "active");
      const priorApplied = comparison.tickIndex === 0 && planning.fusion.status === "active";
      if (!resource || comparison.tickIndex < 0 || comparison.tickIndex >= planning.maxTicks || comparison.neutralAmount !== resource.neutralAmount
        || comparison.totalBudgetLimit !== resource.totalBudgetLimit || comparison.priorApplied !== priorApplied
        || comparison.reduction !== (priorApplied ? planning.fusion.reduction : 0)
        || comparison.proposedAmount !== resource.neutralAmount * (priorApplied ? planning.fusion.initialAmountFactor : 1)) throw new Error("invalid_planning_event_trace");
      trace.push({ key: `planning-${trace.length + 1}`, pathKey: comparison.pathKey, tickNumber: comparison.tickIndex + 1,
        resourceLabel: resource.label, unit: resource.unit, neutralAmount: comparison.neutralAmount, proposedAmount: comparison.proposedAmount,
        priorApplied, reduction: comparison.reduction, totalBudgetLimit: resource.totalBudgetLimit,
        status: comparison.status, actualAmount: comparison.actualAmount,
        assumptionCategories: comparison.causalAssumptionIds.map(id => entry.finalWorld.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.id === id)?.category ?? "invalid"),
        evidenceSummary: "实际变化来自本次运行的受控模拟事件；不是现实发生证明" });
    }
  }
  return safeDefaultPlanningSchema.parse({ status: planning.status, frozenAt: planning.sourceBinding.acceptedAt,
    budgetSemantics: planning.budgetSemantics,
    resources: planning.resources.map(resource => ({ key: resource.resourceKey, label: resource.label, unit: resource.unit, status: resource.status, totalBudgetLimit: resource.totalBudgetLimit, neutralAmount: resource.neutralAmount, initialAvailable: resource.initialAvailable, minimum: resource.minimum })),
    frozenHypothesis: { version: planning.fusion.version, status: planning.fusion.status, confirmedForSimulation: planning.fusion.confirmedForSimulation,
      classification: "hypothesis", reductionCap: planning.fusion.reductionCap, reduction: planning.fusion.reduction,
      cautionReduction: planning.fusion.derivation.cautionReduction, rhythmReduction: planning.fusion.derivation.rhythmReduction,
      relationshipEffect: "not_implemented", realityEvidence: false, scientificProbability: false }, trace,
  });
}
