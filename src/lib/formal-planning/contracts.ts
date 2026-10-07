import { z } from "zod";
import { digitalLifeModelSchema, digitalLifeProfileSnapshotSchema, digitalLifeSafeText } from "@/lib/digital-life/model";
import { runSymbolicLensSchema } from "@/lib/formal-sandbox/symbolic-lens";

export const DEFAULT_PLANNER_VERSION = "formal-default-planner-v1" as const;
export const PLANNING_HYPOTHESIS_VERSION = "symbolic-initial-planning-hypothesis-v1" as const;
export const INITIAL_REDUCTION_CAP = 0.1;
export const MINIMUM_PLANNING_AMOUNT = 0.000001;
const element = z.enum(["wood", "fire", "earth", "metal", "water"]);
const amount = z.number().finite().positive().max(1_000_000);
const resourceKey = z.string().regex(/^resource-[1-8]$/);
export const planningConsentContextSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const defaultPlanningContextSchema = z.object({
  version: z.literal(DEFAULT_PLANNER_VERSION), consentContext: planningConsentContextSchema,
  profileRevision: z.number().int().nonnegative(),
  resources: z.array(z.object({ resourceKey, label: digitalLifeSafeText.max(80), unit: digitalLifeSafeText.max(32),
    available: z.number().finite().nonnegative(), minimum: z.number().finite().nonnegative(), declaredRate: amount.nullable(), explicitRulePresent: z.boolean(),
  }).strict()).max(8),
  symbolicFusion: z.object({ status: z.enum(["eligible", "off", "unavailable"]), classification: z.literal("hypothesis"), relationshipEffect: z.literal("not_implemented") }).strict(),
}).strict();
export type DefaultPlanningContext = z.infer<typeof defaultPlanningContextSchema>;
const resourceAuthorizationSchema = z.object({ resourceKey, totalBudgetLimit: amount, confirmedForSimulation: z.literal(true) }).strict();

/** The client never chooses a source, owner, frame, assumption ID, cap or actor. */
export const defaultPlanningRequestSchema = z.object({
  version: z.literal(DEFAULT_PLANNER_VERSION),
  consentContext: planningConsentContextSchema,
  resources: z.array(resourceAuthorizationSchema).max(8),
  fusion: z.discriminatedUnion("enabled", [
    z.object({ enabled: z.literal(false), confirmedForSimulation: z.literal(false) }).strict(),
    z.object({ enabled: z.literal(true), confirmedForSimulation: z.literal(true) }).strict(),
  ]),
}).strict().superRefine((request, ctx) => {
  if (new Set(request.resources.map(item => item.resourceKey)).size !== request.resources.length) ctx.addIssue({ code: "custom", message: "duplicate_resource_authorization" });
});
export type DefaultPlanningRequest = z.infer<typeof defaultPlanningRequestSchema>;

/** Server-only accepted source context, not a browser request schema. */
export const defaultPlanningSourceSchema = z.object({
  model: digitalLifeModelSchema, realityProfileSnapshot: digitalLifeProfileSnapshotSchema,
  horizonDays: z.union([z.literal(30), z.literal(90)]), acceptedAt: z.string().datetime({ offset: true }),
  symbolicLens: runSymbolicLensSchema,
  consentContext: planningConsentContextSchema,
}).strict().superRefine((source, ctx) => {
  const { model, realityProfileSnapshot: profile } = source;
  if (model.ownerId !== profile.ownerId || model.seedContextId !== profile.seedContextId || model.profileRevision !== profile.revision
    || profile.revision !== profile.profile.revision || model.rules.graphSnapshotId !== model.graphSnapshotId
    || model.rules.agentSnapshotId !== model.agentSnapshotId || model.rules.profileRevision !== profile.revision
    || model.agents.filter(agent => agent.role === "user_core").length !== 1
    || model.agents.some((agent, index) => agent.key !== `person-${index + 1}`)) ctx.addIssue({ code: "custom", message: "invalid_planning_source_binding" });
  const lens = source.symbolicLens;
  if ("version" in lens && (Date.parse(lens.frozenAt) !== Date.parse(source.acceptedAt) || lens.provenance && lens.provenance.ownerId !== model.ownerId)) ctx.addIssue({ code: "custom", message: "invalid_planning_symbolic_binding" });
});
export type DefaultPlanningSource = z.infer<typeof defaultPlanningSourceSchema>;

export const priorInputsSchema = z.object({
  groupCounts: z.object({ peer: z.number().finite().nonnegative(), expression: z.number().finite().nonnegative(), resource: z.number().finite().nonnegative(), responsibility: z.number().finite().nonnegative(), support: z.number().finite().nonnegative() }).strict(),
  natalDayElement: element, periodYearElement: element, periodMonthElement: element,
}).strict();
export type PlanningPriorInputs = z.infer<typeof priorInputsSchema>;
export const planningFusionSchema = z.object({
  version: z.literal(PLANNING_HYPOTHESIS_VERSION),
  enabled: z.boolean(), confirmedForSimulation: z.boolean(), status: z.enum(["off", "active", "unavailable"]),
  reductionCap: z.literal(INITIAL_REDUCTION_CAP), reduction: z.number().finite().min(0).max(INITIAL_REDUCTION_CAP),
  initialAmountFactor: z.number().finite().min(0.9).max(1),
  inputs: priorInputsSchema.nullable(),
  provenance: z.object({ sourceVersion: z.number().int().positive(), snapshotId: z.string().uuid(), preferenceRevision: z.number().int().positive(), frameVersion: z.literal("formal-symbolic-frame-v1"), ruleVersion: z.literal("symbolic-product-rules-v1"), calculationVersion: z.literal("local-pillar-approximation-v1"), sourceRefs: z.array(z.enum(["natal_stem_counts", "current_year_month", "natal_day_element", "element_relation_table"])).length(4) }).strict().nullable(),
  derivation: z.object({ cautionReduction: z.union([z.literal(0), z.literal(0.05)]), rhythmReduction: z.union([z.literal(0), z.literal(0.05)]), relationshipEffect: z.literal("not_implemented") }).strict(),
  classification: z.literal("hypothesis"), realWorldEvidence: z.literal(false), scientificProbability: z.literal(false),
}).strict();

export const planningResourceSchema = z.object({
  resourceKey, label: digitalLifeSafeText.max(80), unit: digitalLifeSafeText.max(32),
  profileResourceKey: z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/), resourceType: z.enum(["time", "budget", "position_availability", "information"]),
  maximum: z.number().finite().min(0).max(1_000_000), classification: z.enum(["fact", "assumption"]), evidenceSummary: digitalLifeSafeText.max(160),
  status: z.enum(["active", "explicit_rule", "explicit_rate", "no_budget_headroom"]),
  totalBudgetLimit: amount, initialAvailable: z.number().finite().min(0).max(1_000_000), minimum: z.number().finite().min(0).max(1_000_000),
  neutralAmount: z.number().finite().nonnegative().max(1_000_000),
  declaredRate: amount.nullable(), explicitRulePresent: z.boolean(),
  assumptionCategory: z.string().regex(/^formal_default_planning_resource_[1-8]$/),
}).strict();
export const frozenDefaultPlanningEnvelopeSchema = z.object({
  version: z.literal(DEFAULT_PLANNER_VERSION), status: z.enum(["active", "inactive"]),
  sourceBinding: z.object({ ownerId: z.string().uuid(), seedContextId: z.string().uuid(), graphSnapshotId: z.string().uuid(), agentSnapshotId: z.string().uuid(), profileRevision: z.number().int().nonnegative(), profileId: z.string().uuid().nullable(), acceptedAt: z.string().datetime({ offset: true }), consentContext: planningConsentContextSchema,
    allowedPaths: z.array(z.object({ pathKey: z.string().regex(/^(main|person-[1-9]\d*)$/), sourceAgentId: z.string().uuid(), sourceAgentOrdinal: z.number().int().min(1).max(50) }).strict()).min(1).max(3),
  }).strict(),
  maxTicks: z.union([z.literal(3), z.literal(6)]),
  budgetSemantics: z.literal("per_path_per_sample_whole_run"),
  resources: z.array(planningResourceSchema).max(8), fusion: planningFusionSchema,
}).strict();
export type FrozenDefaultPlanning = z.infer<typeof frozenDefaultPlanningEnvelopeSchema>;
