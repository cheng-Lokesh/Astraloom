import { z } from "zod";
import { realityProfileDraftSchema } from "@/lib/reality-profile/profile";
import { symbolicFrameSchema } from "@/lib/formal-symbolic-lens/frame";

export const LIFE_CLIMATE_B3_VERSION = "life-climate-b3-v1" as const;
export const lifeClimateB3Domains = ["identity", "career", "wealth", "relationships", "environment", "lifeStage"] as const;
export const b3HorizonSchema = z.enum(["1_year", "3_years", "5_years"]);
export const b3PeriodUnitSchema = z.enum(["quarter", "year"]);
export type LifeClimateB3Horizon = z.infer<typeof b3HorizonSchema>;
export type LifeClimateB3PeriodUnit = z.infer<typeof b3PeriodUnitSchema>;
const id = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const unsafeText = /[\u0000-\u001f\u007f-\u009f]|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:secret|password|api[_ -]?key|token|trace[_ -]?id)\b/i;
const text = (max: number) => z.string().trim().min(1).max(max).refine((value) => !unsafeText.test(value));
export const b3DecimalSchema = z.string().max(26).regex(/^(?:0|[1-9]\d{0,12})(?:\.\d{0,5}[1-9])?$/);
const signedDecimal = z.string().max(27).regex(/^-?(?:0|[1-9]\d{0,12})(?:\.\d{0,5}[1-9])?$/);
// Input allows 16 shared + 24 path rules, five stages, and twelve structural effects.
const maximumPathExecutions = (16 + 24) * 5;
const maximumComparisonExecutions = 16 * 5 + maximumPathExecutions;
const outputDecimal = z.string().max(32).regex(/^(?:0|[1-9]\d{0,18})(?:\.\d{0,5}[1-9])?$/);
const stage = z.number().int().min(1).max(5);
const sourceRef = z.string().regex(/^(?:lifeClimate|resources|constraints|(?:goals|values|lifeThemes|pressures|externalVariables)\.[1-8]|lifeModelDomains\.(?:identity|career|wealth|relationships|environment|lifeStage)\.[1-8]|worldInputs\.(?:resources|constraints)\.[a-z][a-z0-9-]{0,39})$/);
const quantity = z.object({ id, label: text(80), evidenceSummary: text(160), kind: z.literal("quantity"), value: b3DecimalSchema.nullable(), unit: text(32), periodUnit: z.enum(["once", "quarter", "year"]) }).strict();
const state = z.object({ id, label: text(80), evidenceSummary: text(160), kind: z.literal("state"), value: text(240).nullable() }).strict();
export const b3AssumptionSchema = z.discriminatedUnion("kind", [quantity, state]);
const condition = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("resource_at_least"), resourceId: id, amountAssumptionId: id }).strict(),
  z.object({ kind: z.literal("investment_at_least"), investmentId: id, amountAssumptionId: id }).strict(),
  z.object({ kind: z.literal("source_state_is"), sourceEntryKey: sourceRef, valueAssumptionId: id }).strict(),
  z.object({ kind: z.literal("rule_executed"), ruleId: id }).strict(),
]);
const base = z.object({ id, label: text(80), order: z.number().int().min(0).max(99), stages: z.array(stage).min(1).max(5), assumptionRefs: z.array(id).min(1).max(32), sourceRefs: z.array(sourceRef).max(32), guard: z.object({ all: z.array(condition).min(1).max(12) }).strict().nullable() }).strict();
export const b3RuleSchema = z.discriminatedUnion("kind", [
  base.extend({ kind: z.literal("scenario_change"), sourceEntryKey: sourceRef, valueAssumptionId: id }),
  base.extend({ kind: z.literal("one_time_resource_change"), resourceId: id, direction: z.enum(["credit", "debit"]), amountAssumptionId: id }),
  base.extend({ kind: z.literal("recurring_resource_flow"), resourceId: id, direction: z.enum(["credit", "debit"]), amountByStage: z.array(z.object({ stageIndex: stage, amountAssumptionId: id }).strict()).min(1).max(5), obligation: z.enum(["required", "optional"]) }),
  base.extend({ kind: z.literal("investment_cycle"), investmentId: id, initialProgressAssumptionId: id, timeResourceId: id, budgetResourceId: id, timeAmountAssumptionId: id, costAmountAssumptionId: id }),
  base.extend({ kind: z.literal("relocation"), targetEntryKey: sourceRef, valueAssumptionId: id, budgetResourceId: id, costAmountAssumptionId: id }),
  base.extend({ kind: z.literal("guarded_structure_transition"), effects: z.array(z.object({ targetEntryKey: sourceRef, valueAssumptionId: id }).strict()).min(1).max(12) }),
  base.extend({ kind: z.literal("transition_readiness"), domain: z.enum(["career", "lifeStage"]), investmentId: id }),
]);
export type LifeClimateB3Rule = z.infer<typeof b3RuleSchema>;
export type LifeClimateB3Condition = z.infer<typeof condition>;
export type LifeClimateB3Assumption = z.infer<typeof b3AssumptionSchema>;
const resource = z.object({
  id, label: text(80), resourceType: z.enum(["budget", "time", "other"]), unit: text(32),
  initial: z.discriminatedUnion("kind", [z.object({ kind: z.literal("profile_resource"), resourceKey: id }).strict(), z.object({ kind: z.literal("assumption"), assumptionId: id }).strict(), z.object({ kind: z.literal("unknown") }).strict()]),
  minimum: b3DecimalSchema, maximum: b3DecimalSchema,
}).strict();
export const b3ConstraintBindingSchema = z.discriminatedUnion("mode", [
  z.object({ constraintKey: id, mode: z.literal("source_deadline") }).strict(),
  z.object({ constraintKey: id, mode: z.literal("narrowed_stage_limit"), lastStage: stage, assumptionId: id }).strict(),
]);
export const lifeClimateB3RequestSchema = z.object({
  version: z.literal(LIFE_CLIMATE_B3_VERSION), horizon: b3HorizonSchema, periodUnit: b3PeriodUnitSchema,
  profileRevision: z.number().int().nonnegative(), sourceContext: digest,
  model: z.object({ resources: z.array(resource).max(8), assumptions: z.array(b3AssumptionSchema).max(96), constraintBindings: z.array(b3ConstraintBindingSchema).max(8), commonRules: z.array(b3RuleSchema).max(16), alternatives: z.array(z.object({ id: id.refine((value) => value !== "baseline"), label: text(80), rules: z.array(b3RuleSchema).max(24) }).strict()).min(2).max(3) }).strict(),
  confirmation: z.object({ context: digest, assumptionIds: z.array(id).max(96), ruleIds: z.array(id).max(88), pathIds: z.array(id).min(3).max(4), reviewedSource: z.literal(true) }).strict(),
  symbolic: z.discriminatedUnion("enabled", [z.object({ enabled: z.literal(false) }).strict(), z.object({ enabled: z.literal(true), sourceContext: digest }).strict()]),
}).strict().superRefine((request, ctx) => {
  if ((request.horizon === "1_year") !== (request.periodUnit === "quarter")) ctx.addIssue({ code: "custom", message: "horizon_period_unit_mismatch" });
  const count = request.horizon === "1_year" ? 4 : request.horizon === "3_years" ? 3 : 5;
  const rules = [...request.model.commonRules, ...request.model.alternatives.flatMap((path) => path.rules)];
  if (rules.some((rule) => rule.stages.some((value) => value > count))) ctx.addIssue({ code: "custom", message: "stage_outside_horizon" });
});
export type LifeClimateB3Request = z.infer<typeof lifeClimateB3RequestSchema>;
export const lifeClimateB3SourceViewSchema = z.object({ version: z.literal("life-climate-b3-source-view-v1"), scopeKey: digest, profile: realityProfileDraftSchema }).strict();
export const lifeClimateB3SymbolicSourceSchema = z.object({
  version: z.literal("life-climate-b3-symbolic-source-v1"), sourceContext: digest, sourceVersion: z.number().int().positive(), consentRevision: z.number().int().positive(), horizon: b3HorizonSchema, periodUnit: b3PeriodUnitSchema,
  series: z.array(z.discriminatedUnion("status", [z.object({ stageIndex: stage, status: z.literal("available"), frame: symbolicFrameSchema, limitations: z.array(text(600)).min(1).max(8) }).strict(), z.object({ stageIndex: stage, status: z.literal("unknown"), reason: text(240) }).strict()])).min(3).max(5),
}).strict();
export type LifeClimateB3SymbolicSource = z.infer<typeof lifeClimateB3SymbolicSourceSchema>;
export const lifeClimateB3FrozenSourceSchema = z.object({
  version: z.literal("life-climate-b3-source-v1"), view: lifeClimateB3SourceViewSchema, sourceContext: digest,
  binding: z.object({ seedContextId: z.string().uuid(), profileRevision: z.number().int().nonnegative(), assessedAt: z.string().datetime({ offset: true }) }).strict(),
  symbolic: lifeClimateB3SymbolicSourceSchema.nullable(),
}).strict();
export type LifeClimateB3FrozenSource = z.infer<typeof lifeClimateB3FrozenSourceSchema>;
export type LifeClimateB3SourceView = z.infer<typeof lifeClimateB3SourceViewSchema>;
const resourceState = z.object({ id, label: text(80), unit: text(32), balance: b3DecimalSchema.nullable(), status: z.enum(["known", "unknown", "constrained"]), shortfall: b3DecimalSchema.nullable() }).strict();
const investmentState = z.object({ id, unit: text(32), amount: outputDecimal.nullable(), status: z.enum(["known", "unknown"]) }).strict();
const transitionState = z.object({ ruleId: id, domain: z.enum(["career", "lifeStage"]), status: z.enum(["conditions_met", "constrained", "unknown"]) }).strict();
const contextState = z.object({ sourceEntryKey: sourceRef, label: text(80), value: text(240).nullable(), classification: z.enum(["fact", "assumption", "unknown"]), source: z.enum(["frozen_profile", "simulation_condition"]), sourceRefs: z.array(sourceRef).max(32), assumptionRefs: z.array(id).max(32), evidenceEventIds: z.array(digest).max(128) }).strict();
const constraintState = z.object({ constraintKey: id, label: text(80), resourceLabel: text(80), resourceIds: z.array(id).max(8), status: z.enum(["satisfied", "unknown", "constrained"]), reason: z.enum(["before_deadline", "deadline_inside_stage", "deadline_passed", "narrowed_stage_limit"]), sourceRefs: z.array(sourceRef).min(1).max(32), assumptionRefs: z.array(id).max(32) }).strict();
const obligationState = z.object({ ruleId: id, stageIndex: stage, resourceId: id, resourceLabel: text(80), kind: z.enum(["inflow_assumption", "outflow_obligation"]), status: z.enum(["fulfilled", "unfunded", "unknown", "not_applicable"]), requestedAmount: b3DecimalSchema.nullable(), paidAmount: b3DecimalSchema.nullable(), shortfall: b3DecimalSchema.nullable(), evidenceEventIds: z.array(digest).max(128) }).strict();
const stageState = z.object({ stageIndex: stage, label: text(80), lifeModelDomains: realityProfileDraftSchema.shape.lifeModelDomains, contextStates: z.array(contextState).max(91), constraints: z.array(constraintState).max(8), obligations: z.array(obligationState).max(maximumPathExecutions), resources: z.array(resourceState).max(8), investments: z.array(investmentState).max(40), transitions: z.array(transitionState).max(40) }).strict();
const eventChange = z.object({ target: z.string().min(1).max(120), label: text(80), value: z.union([z.string(), z.number(), z.null()]) }).strict();
const event = z.object({ id: digest, kind: z.enum(["scenario_change", "resource_change", "investment", "relocation", "structure_transition", "transition_readiness", "guard_constrained", "guard_unknown"]), pathId: id, stageIndex: stage, sequence: z.number().int().positive().max(768), ruleId: id, summary: text(240), sourceRefs: z.array(sourceRef).max(72), assumptionRefs: z.array(id).max(60), before: z.array(eventChange).max(24), after: z.array(eventChange).max(24), causalEventIds: z.array(digest).max(128) }).strict();
const claim = z.object({ id: digest, type: z.enum(["resource_projection", "investment_projection", "conditional_structure_change", "transition_conditions", "conditional_constraint"]), pathId: id, summary: text(240), uncertainty: text(600), evidenceEventIds: z.array(digest).min(1).max(128), sourceRefs: z.array(sourceRef).max(72), assumptionRefs: z.array(id).max(60) }).strict();
const comparison = z.object({ baselinePathId: z.literal("baseline"), alternativePathId: id, stageIndex: stage, resourceDifferences: z.array(z.object({ resourceId: id, status: z.enum(["known", "unknown", "constrained"]), baselineValue: b3DecimalSchema.nullable(), alternativeValue: b3DecimalSchema.nullable(), difference: signedDecimal.nullable(), evidenceEventIds: z.array(digest).max(maximumComparisonExecutions) }).strict()).max(8) }).strict();
const runShape = {
  version: z.literal(LIFE_CLIMATE_B3_VERSION), horizon: b3HorizonSchema, periodUnit: b3PeriodUnitSchema, profileRevision: z.number().int().nonnegative(), sourceContext: digest,
  requestSnapshot: lifeClimateB3RequestSchema,
  paths: z.array(z.object({ id, label: text(80), basis: z.enum(["explicit_common_conditions", "explicit_path_conditions"]), stages: z.array(stageState).min(3).max(5) }).strict()).min(3).max(4),
  events: z.array(event).max(768), claims: z.array(claim).max(768), comparisons: z.array(comparison).max(15),
  report: z.object({ mode: z.literal("conditional_long_horizon_structure"), headline: text(80), summary: text(600), limitations: z.array(text(600)).min(3).max(12), claimIds: z.array(digest).max(768), includesExactDates: z.literal(false), claimsUseEventEvidence: z.literal(true) }).strict(),
  symbolicAttachment: lifeClimateB3SymbolicSourceSchema.nullable(),
};
export const lifeClimateB3RunSchema = z.object({ ...runShape, sourceSnapshot: lifeClimateB3FrozenSourceSchema }).strict();
export const lifeClimateB3PublicRunSchema = z.object({ ...runShape, sourceSnapshot: lifeClimateB3FrozenSourceSchema.omit({ binding: true }) }).strict();
export type LifeClimateB3Run = z.infer<typeof lifeClimateB3RunSchema>;
export type LifeClimateB3PublicRun = z.infer<typeof lifeClimateB3PublicRunSchema>;
export type LifeClimateB3Stage = LifeClimateB3Run["paths"][number]["stages"][number];
export type LifeClimateB3Event = LifeClimateB3Run["events"][number];
export class LifeClimateB3Error extends Error {
  constructor(public readonly code: string) { super(code); this.name = "LifeClimateB3Error"; }
}
export function projectLifeClimateB3Run(run: LifeClimateB3Run): LifeClimateB3PublicRun {
  const { binding: _binding, ...sourceSnapshot } = run.sourceSnapshot;
  void _binding;
  return lifeClimateB3PublicRunSchema.parse({ ...run, sourceSnapshot });
}
