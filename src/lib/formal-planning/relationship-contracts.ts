import { z } from "zod";
import { digitalLifeRulesSchema, digitalLifeSafeText } from "@/lib/digital-life/model";

export const RELATIONSHIP_RESPONSE_VERSION = "formal-relationship-response-hypothesis-v1" as const;
export const RELATIONSHIP_RESPONSE_CAP = 0.1;
const confirmation = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(false), confirmedForSimulation: z.literal(false) }).strict(),
  z.object({ enabled: z.literal(true), confirmedForSimulation: z.literal(true) }).strict(),
]);
export const relationshipResponseRequestSchema = z.object({
  version: z.literal(RELATIONSHIP_RESPONSE_VERSION), pathKey: z.string().regex(/^(main|person-[1-9]\d*)$/),
  resourceKey: z.string().regex(/^resource-[1-8]$/), confirmedForSimulation: z.literal(true),
  requestRule: digitalLifeRulesSchema.shape.actions.element,
  responseRule: digitalLifeRulesSchema.shape.actions.element,
  symbolicSensitivity: confirmation,
}).strict().superRefine((value, context) => {
  if (value.requestRule.pathKey !== value.pathKey || value.responseRule.pathKey !== value.pathKey
    || value.requestRule.operation.actionType !== "request_information"
    || value.responseRule.operation.actionType !== "update_relation_signal"
    || value.responseRule.when.kind !== "after_rule" || value.responseRule.when.ruleKey !== value.requestRule.key
    || value.requestRule.operation.targetPersonKey !== value.responseRule.actorKey) context.addIssue({ code: "custom", message: "invalid_relationship_response_pair" });
});
export type RelationshipResponseRequest = z.infer<typeof relationshipResponseRequestSchema>;
export function relationshipPolicyAuthorization(value: RelationshipResponseRequest) {
  return { version: value.version, pathKey: value.pathKey, resourceKey: value.resourceKey,
    confirmedForSimulation: value.confirmedForSimulation, requestRule: value.requestRule, responseRule: value.responseRule };
}

export const frozenRelationshipResponseSchema = z.object({
  authorization: relationshipResponseRequestSchema,
  status: z.enum(["active", "explicit_rule", "explicit_rate", "no_budget_headroom"]),
  selfLabel: digitalLifeSafeText, npcLabel: digitalLifeSafeText, relationLabel: digitalLifeSafeText,
  selfSourceAgentId: z.string().uuid(), npcSourceAgentId: z.string().uuid(), sourceEdgeId: z.string().uuid(),
  npcSourceOrdinal: z.number().int().min(1).max(50),
  effectiveRulesSignature: z.string().min(1).max(30_000),
  ruleBindings: z.object({
    agents: z.array(z.object({ key: z.string().regex(/^person-[1-9]\d*$/), sourceAgentId: z.string().uuid(), sourceOrdinal: z.number().int().min(1).max(50), role: z.enum(["user_core", "user_variant", "npc", "group"]) }).strict()).min(1).max(50),
    relations: z.array(z.object({ key: z.string().regex(/^relation-[1-9]\d*$/), sourceEdgeId: z.string().uuid(), fromPersonKey: z.string(), toPersonKey: z.string() }).strict()).min(1).max(200),
    resources: z.array(z.object({ key: z.string().regex(/^resource-[1-8]$/), profileResourceKey: z.string().min(1).max(64) }).strict()).max(8),
  }).strict(),
  baseNegativeReduction: z.literal(0.05), symbolicAdditionalReduction: z.union([z.literal(0), z.literal(0.05)]),
  negativeReduction: z.union([z.literal(0.05), z.literal(0.1)]), reductionCap: z.literal(RELATIONSHIP_RESPONSE_CAP),
  symbolicStatus: z.enum(["off", "active"]),
  symbolicInputs: z.object({ responsibilityCount: z.number().finite().nonnegative(), peerCount: z.number().finite().nonnegative() }).strict().nullable(),
  symbolicSource: z.object({ sourceVersion: z.number().int().positive(), snapshotId: z.string().uuid(), preferenceRevision: z.number().int().positive(),
    frameVersion: z.literal("formal-symbolic-frame-v1"), ruleVersion: z.literal("symbolic-product-rules-v1"), calculationVersion: z.literal("local-pillar-approximation-v1") }).strict().nullable(),
  classification: z.literal("hypothesis"), realWorldEvidence: z.literal(false), scientificProbability: z.literal(false),
}).strict();
export type FrozenRelationshipResponse = z.infer<typeof frozenRelationshipResponseSchema>;

export const safeRelationshipResponseSchema = z.object({
  version: z.literal(RELATIONSHIP_RESPONSE_VERSION), pathKey: z.string().regex(/^(main|person-[1-9]\d*)$/),
  status: z.enum(["active", "explicit_rule", "explicit_rate", "no_budget_headroom"]),
  selfLabel: digitalLifeSafeText, npcLabel: digitalLifeSafeText, relationLabel: digitalLifeSafeText,
  resourceLabel: digitalLifeSafeText.max(80), unit: digitalLifeSafeText.max(32), signal: z.enum(["negative", "neutral", "positive"]),
  baseNegativeReduction: z.literal(0.05), symbolicAdditionalReduction: z.union([z.literal(0), z.literal(0.05)]),
  negativeReduction: z.union([z.literal(0.05), z.literal(0.1)]), reductionCap: z.literal(0.1), symbolicStatus: z.enum(["off", "active"]),
  classification: z.literal("hypothesis"), realWorldEvidence: z.literal(false), scientificProbability: z.literal(false),
  samples: z.array(z.object({ key: z.string().regex(/^sample-[1-9]\d*$/), status: z.enum(["selected", "not_selected", "not_triggered", "inactive"]),
    responseTickNumber: z.number().int().min(1).max(6).nullable(), allocationTickNumber: z.number().int().min(1).max(6).nullable(),
    neutralAmount: z.number().finite().nonnegative(), proposedAmount: z.number().finite().positive().nullable(),
    actualAmount: z.number().finite().nonnegative().nullable(), appliedReduction: z.number().finite().min(0).max(0.1).nullable(),
    assumptionCategories: z.array(z.string().regex(/^formal_(default_planning_resource_[1-8]|relationship_response_v1)$/)).max(2),
  }).strict()).max(3),
}).strict().superRefine((value, context) => {
  if (value.samples.some(sample => sample.status === "selected" ? sample.actualAmount === null || sample.proposedAmount === null || sample.allocationTickNumber === null : sample.actualAmount !== null)) context.addIssue({ code: "custom", message: "invalid_relationship_event_summary" });
});
export type SafeRelationshipResponse = z.infer<typeof safeRelationshipResponseSchema>;

export function canonicalRelationshipValue(value: unknown): string {
  return canonicalJson(value === undefined ? null : JSON.parse(JSON.stringify(value)));
}
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}
