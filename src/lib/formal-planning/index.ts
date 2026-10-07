import { GENERATES, CONTROLS } from "@/lib/destiny/constants";
import type { AssumptionInputV2 } from "@/lib/v2/reality-boundary/types";
import {
  DEFAULT_PLANNER_VERSION, INITIAL_REDUCTION_CAP, MINIMUM_PLANNING_AMOUNT, PLANNING_HYPOTHESIS_VERSION,
  defaultPlanningRequestSchema, defaultPlanningSourceSchema, frozenDefaultPlanningEnvelopeSchema,
  type FrozenDefaultPlanning, type PlanningPriorInputs,
} from "./contracts";

export { defaultPlanningRequestSchema, defaultPlanningContextSchema, DEFAULT_PLANNER_VERSION, PLANNING_HYPOTHESIS_VERSION } from "./contracts";
export type { DefaultPlanningRequest, DefaultPlanningContext, DefaultPlanningSource, FrozenDefaultPlanning } from "./contracts";

/** Product planning hypothesis only. These constants are not scientific or traditional probabilities. */
export function derivePlanningHypothesis(inputs: PlanningPriorInputs) {
  const peak = Math.max(...Object.values(inputs.groupCounts));
  const cautionReduction = peak > 0 && (inputs.groupCounts.responsibility === peak || inputs.groupCounts.support === peak) ? 0.05 as const : 0 as const;
  const channel = (current: PlanningPriorInputs["natalDayElement"]) => {
    const anchor = inputs.natalDayElement;
    if (current === anchor) return "peer";
    if (GENERATES[anchor] === current) return "expression";
    if (GENERATES[current] === anchor) return "support";
    if (CONTROLS[anchor] === current) return "resource";
    return "responsibility";
  };
  const rhythmReduction = channel(inputs.periodYearElement) === channel(inputs.periodMonthElement) ? 0 as const : 0.05 as const;
  const reduction = Math.min(INITIAL_REDUCTION_CAP, cautionReduction + rhythmReduction);
  return { reduction, initialAmountFactor: 1 - reduction, derivation: { cautionReduction, rhythmReduction, relationshipEffect: "not_implemented" as const } };
}

export const floorPlanningAmount = (value: number) => Math.floor(value * 1_000_000) / 1_000_000;

/** Keep both total allocation and sequential Core subtraction inside strict floating-point bounds. */
export function neutralPlanningAmount(totalBudgetLimit: number, available: number, minimum: number, maxTicks: number) {
  let neutral = floorPlanningAmount(Math.min(totalBudgetLimit, available - minimum) / maxTicks);
  let remaining = available;
  let spent = 0;
  for (let tick = 0; tick < maxTicks; tick++) { remaining -= neutral; spent += neutral; }
  if (neutral * maxTicks > totalBudgetLimit || spent > totalBudgetLimit || remaining < minimum) neutral = Math.max(0, (Math.round(neutral * 1_000_000) - 1) / 1_000_000);
  return neutral;
}

/** Freeze from the accepted owner/source context. No current source is reread during execution or replay. */
export function freezeDefaultPlanning(requestInput: unknown, sourceInput: unknown):
  | { ok: true; planning: FrozenDefaultPlanning }
  | { ok: false; errorCode: "invalid_planning_request" | "invalid_planning_source" } {
  const request = defaultPlanningRequestSchema.safeParse(requestInput);
  if (!request.success) return { ok: false, errorCode: "invalid_planning_request" };
  const source = defaultPlanningSourceSchema.safeParse(sourceInput);
  if (!source.success) return { ok: false, errorCode: "invalid_planning_source" };
  if (source.data.consentContext !== request.data.consentContext) return { ok: false, errorCode: "invalid_planning_source" };
  const { model, realityProfileSnapshot, horizonDays, symbolicLens, acceptedAt } = source.data;
  const maxTicks = horizonDays === 30 ? 3 : 6;
  const neutralFusion: FrozenDefaultPlanning["fusion"] = {
    version: PLANNING_HYPOTHESIS_VERSION, enabled: request.data.fusion.enabled, confirmedForSimulation: request.data.fusion.confirmedForSimulation,
    status: request.data.fusion.enabled ? "unavailable" : "off",
    reductionCap: INITIAL_REDUCTION_CAP, reduction: 0, initialAmountFactor: 1,
    inputs: null, provenance: null,
    derivation: { cautionReduction: 0, rhythmReduction: 0, relationshipEffect: "not_implemented" },
    classification: "hypothesis", realWorldEvidence: false, scientificProbability: false,
  };
  let fusion = neutralFusion;
  if (request.data.fusion.enabled && "version" in symbolicLens && symbolicLens.status === "attached" && symbolicLens.frame && symbolicLens.provenance) {
    const frame = symbolicLens.frame;
    const inputs = { groupCounts: frame.calculation.groupCounts, natalDayElement: frame.calculation.natalDayElement, periodYearElement: frame.calculation.periodYearElement, periodMonthElement: frame.calculation.periodMonthElement };
    fusion = { ...neutralFusion, status: "active", inputs, ...derivePlanningHypothesis(inputs), provenance: { sourceVersion: frame.sourceVersion, snapshotId: symbolicLens.provenance.snapshotId, preferenceRevision: symbolicLens.preferenceRevision, frameVersion: frame.version, ruleVersion: frame.ruleVersion, calculationVersion: frame.calculation.calculationVersion, sourceRefs: ["natal_stem_counts", "current_year_month", "natal_day_element", "element_relation_table"] } };
  }
  const resources: FrozenDefaultPlanning["resources"] = [];
  for (const authorization of request.data.resources) {
    const ordinal = Number(authorization.resourceKey.slice("resource-".length));
    const resource = realityProfileSnapshot.profile.worldInputs.resources[ordinal - 1];
    if (!resource) return { ok: false, errorCode: "invalid_planning_request" };
    const explicitRulePresent = model.rules.actions.some(rule => rule.operation.actionType === "allocate_resource" && rule.operation.resourceKey === authorization.resourceKey);
    const neutralAmount = neutralPlanningAmount(authorization.totalBudgetLimit, resource.available, resource.minimum, maxTicks);
    const status = resource.usePerTick !== null ? "explicit_rate" : explicitRulePresent ? "explicit_rule" : neutralAmount < MINIMUM_PLANNING_AMOUNT ? "no_budget_headroom" : "active";
    resources.push({ resourceKey: authorization.resourceKey, label: resource.label, unit: resource.unit, status,
      profileResourceKey: resource.key, resourceType: resource.resourceType, maximum: resource.maximum, classification: resource.classification, evidenceSummary: resource.evidenceSummary,
      totalBudgetLimit: authorization.totalBudgetLimit, initialAvailable: resource.available, minimum: resource.minimum,
      neutralAmount: status === "active" ? neutralAmount : 0, declaredRate: resource.usePerTick, explicitRulePresent,
      assumptionCategory: `formal_default_planning_resource_${ordinal}` });
  }
  const planning = frozenDefaultPlanningEnvelopeSchema.parse({
    version: DEFAULT_PLANNER_VERSION, status: resources.some(resource => resource.status === "active") ? "active" : "inactive",
    sourceBinding: { ownerId: model.ownerId, seedContextId: model.seedContextId, graphSnapshotId: model.graphSnapshotId, agentSnapshotId: model.agentSnapshotId, profileRevision: model.profileRevision, profileId: realityProfileSnapshot.profileId, acceptedAt, consentContext: source.data.consentContext,
      allowedPaths: [{ pathKey: "main", sourceAgentId: model.agents.find(agent => agent.role === "user_core")!.sourceAgentId, sourceAgentOrdinal: model.agents.findIndex(agent => agent.role === "user_core") + 1 }, ...model.rules.strategies.map(strategy => ({ pathKey: strategy.participantKey, sourceAgentId: model.agents.find(agent => agent.key === strategy.participantKey && agent.role === "user_variant")!.sourceAgentId, sourceAgentOrdinal: model.agents.findIndex(agent => agent.key === strategy.participantKey) + 1 }))],
    },
    maxTicks, budgetSemantics: "per_path_per_sample_whole_run", resources, fusion,
  });
  return { ok: true, planning: structuredClone(planning) };
}

/** Reject structurally plausible tampering before proposing or displaying a frozen hypothesis. */
export function parseFrozenDefaultPlanning(input: unknown): FrozenDefaultPlanning {
  const frozen = frozenDefaultPlanningEnvelopeSchema.parse(input);
  if (new Set(frozen.resources.map(item => item.resourceKey)).size !== frozen.resources.length) throw new Error("invalid_frozen_planning");
  for (const resource of frozen.resources) {
    const ordinal = resource.resourceKey.slice("resource-".length);
    const neutral = neutralPlanningAmount(resource.totalBudgetLimit, resource.initialAvailable, resource.minimum, frozen.maxTicks);
    const status = resource.declaredRate !== null ? "explicit_rate" : resource.explicitRulePresent ? "explicit_rule" : neutral < MINIMUM_PLANNING_AMOUNT ? "no_budget_headroom" : "active";
    if (resource.initialAvailable < resource.minimum || resource.initialAvailable > resource.maximum || resource.status !== status || resource.neutralAmount !== (status === "active" ? neutral : 0) || resource.assumptionCategory !== `formal_default_planning_resource_${ordinal}`) throw new Error("invalid_frozen_planning");
  }
  if (new Set(frozen.resources.map(item => item.profileResourceKey)).size !== frozen.resources.length || frozen.sourceBinding.allowedPaths[0].pathKey !== "main" || new Set(frozen.sourceBinding.allowedPaths.map(item => item.pathKey)).size !== frozen.sourceBinding.allowedPaths.length) throw new Error("invalid_frozen_planning");
  if (frozen.status !== (frozen.resources.some(resource => resource.status === "active") ? "active" : "inactive")) throw new Error("invalid_frozen_planning");
  const { fusion } = frozen;
  if (fusion.enabled !== fusion.confirmedForSimulation) throw new Error("invalid_frozen_planning");
  if (fusion.status === "active") {
    if (!fusion.enabled || !fusion.inputs || !fusion.provenance) throw new Error("invalid_frozen_planning");
    const expected = derivePlanningHypothesis(fusion.inputs);
    if (expected.reduction !== fusion.reduction || expected.initialAmountFactor !== fusion.initialAmountFactor || JSON.stringify(expected.derivation) !== JSON.stringify(fusion.derivation)) throw new Error("invalid_frozen_planning");
  } else if (fusion.status !== (fusion.enabled ? "unavailable" : "off") || fusion.inputs !== null || fusion.provenance !== null || fusion.reduction !== 0 || fusion.initialAmountFactor !== 1 || fusion.derivation.cautionReduction !== 0 || fusion.derivation.rhythmReduction !== 0) throw new Error("invalid_frozen_planning");
  return structuredClone(frozen);
}

/** These are executable self assumptions, never symbolic Real Evidence. */
export function createPlanningAssumptions(input: FrozenDefaultPlanning): AssumptionInputV2[] {
  const planning = parseFrozenDefaultPlanning(input);
  return planning.resources.filter(resource => resource.status === "active").map((resource): AssumptionInputV2 => ({
    statement: `本人授权的默认模拟规划：每条路径每个样本整次运行最多分配 ${resource.totalBudgetLimit} ${resource.unit}，每轮中性候选 ${resource.neutralAmount} ${resource.unit}；首轮仅按可关闭的产品规划假设缩减，最多百分之十。`,
    subjectType: "self", category: resource.assumptionCategory, epistemicStatus: "confirmed_for_simulation", impactLevel: "low",
    supportingRealEvidenceIds: [], contradictingRealEvidenceIds: [], confirmationRequirement: "required", confirmationStatus: "confirmed",
    parameterRange: { min: resource.neutralAmount * 0.9, max: resource.neutralAmount, defaultValue: resource.neutralAmount, unit: resource.unit },
    limitations: ["仅为本人明确授权的模拟规划假设，不是现实事实、科学概率或行动建议。", "符号来源仅保留在规划推导记录，不作为现实证据。", "已明确的行动与每轮用量不受本规划影响。", "关系敏感度尚未接入关系变化。"],
  })).concat(planning.status === "active" && planning.fusion.status === "active" ? [{
    statement: `本人另行确认的首轮规划假设：按产品规则 ${PLANNING_HYPOTHESIS_VERSION} 将默认候选用量缩减 ${planning.fusion.reduction * 100}%，固定上限 10%；后续轮次使用中性候选用量。`,
    subjectType: "self", category: "formal_symbolic_initial_planning_v1", epistemicStatus: "confirmed_for_simulation", impactLevel: "low",
    supportingRealEvidenceIds: [], contradictingRealEvidenceIds: [], confirmationRequirement: "required", confirmationStatus: "confirmed",
    parameterRange: { min: 0, max: 10, defaultValue: planning.fusion.reduction * 100, unit: "percent reduction" },
    limitations: ["这是明示的产品规划假设，不代表传统权威、科学权重或现实概率。", "符号镜头仍独立保存，不是现实证据；每个实际变化仍须通过受控转换。", "关系敏感度仅供对照，尚未改变关系。"],
  }] : []);
}
