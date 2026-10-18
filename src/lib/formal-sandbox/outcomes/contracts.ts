import { z } from "zod";
import { digitalLifeSafeDescription, digitalLifeSafeText } from "@/lib/digital-life/model";

const value = z.union([z.boolean(), z.number().finite().min(0).max(1_000_000), z.enum(["negative", "neutral", "positive", "planned", "active", "fulfilled", "cancelled"]), z.null()]);
export const outcomeCalibrationSelectionSchema = z.object({ version: z.literal(1), correction_keys: z.array(z.string().regex(/^correction-v1-[a-f0-9]{64}$/)).min(1).max(6), confirmed: z.literal(true) }).strict().refine(v => new Set(v.correction_keys).size === v.correction_keys.length);
export type OutcomeCalibrationSelection = z.infer<typeof outcomeCalibrationSelectionSchema>;
export const formalOutcomeInputSchema = z.object({
  target_key: z.string().regex(/^target-[1-9]\d*$/), observed: z.enum(["occurred", "did_not_occur", "uncertain"]),
  occurred_at: z.string().datetime({ offset: true }).optional(), evidence_summary: digitalLifeSafeText.max(160),
  uncertainty: z.enum(["low", "medium", "high"]), confirmed_user_observation: z.literal(true),
  observations: z.array(z.object({ key: z.string().regex(/^condition-[1-9]\d*$/), value, occurred_at:z.string().datetime({offset:true}).optional() }).strict()).max(32),
  correction: z.object({ rule_key: z.string().regex(/^rule-[1-9]\d*$/), confirmed_for_next_run: z.literal(true) }).strict().optional(),
  idempotency_key: z.string().uuid(),
}).strict().superRefine((v,c) => {
  if ((v.observed === "occurred") !== (v.occurred_at !== undefined)) c.addIssue({code:"custom",message:"occurrence time must match status"});
  if (new Set(v.observations.map(x=>x.key)).size !== v.observations.length) c.addIssue({code:"custom",message:"duplicate observation condition"});
});
export type FormalOutcomeInput = z.infer<typeof formalOutcomeInputSchema>;
export const formalOutcomeConditionSchema = z.object({ key:z.string(), label:digitalLifeSafeDescription, kind:z.enum(["request_information","allocate_resource","update_relation_signal","update_commitment","scope_confirmation"]), expectedValue:value, ruleKey:z.string().nullable(), correctable:z.boolean(),requiresTime:z.boolean(),measurement:z.enum(["operation","resource_before","resource_after","event_count","tick_count","scope_confirmation","actor_scope","resource_scope","relationship_scope","response_source"]),actorLabel:digitalLifeSafeText.nullable(),resourceLabel:digitalLifeSafeText.nullable(),sequence:z.number().int().nonnegative() }).strict();
export const formalRealityCriteriaVersionSchema = z.enum(["formal-reality-criteria-v1", "formal-reality-criteria-v2"]);
export const formalOutcomeReviewSchema = z.object({kind:z.enum(["resource","relationship_resource_chain"]),title:digitalLifeSafeText,stepKeys:z.array(z.string().regex(/^step-[1-9]\d*$/)).min(1).max(32),groups:z.array(z.object({key:z.string().regex(/^review-group-[1-9]\d*$/),label:digitalLifeSafeText,conditionKeys:z.array(z.string().regex(/^condition-[1-9]\d*$/)).min(1).max(32)}).strict()).min(1).max(32)}).strict();
export const formalCriteriaComparisonSchema=z.object({status:z.enum(["matched","different","unknown","not_recorded"]),differences:z.array(z.string().regex(/^condition-[1-9]\d*$/)).max(32)}).strict();
const conditionKey=z.string().regex(/^condition-[1-9]\d*$/);
const correctionRequirementSchema=z.object({ruleKey:z.string().regex(/^rule-[1-9]\d*$/),conditionKey,requiredTrueConditionKeys:z.array(conditionKey).min(1).max(32),requestConditionKey:conditionKey.nullable()}).strict();
export const formalOutcomeTargetSchema = z.object({key:z.string(),label:digitalLifeSafeText,status:z.enum(["observable","not_observable"]),reason:digitalLifeSafeText.nullable(),observationWindow:z.object({startAt:z.string(),horizonEnd:z.string()}).strict(),canRecordDidNotOccur:z.boolean(),canRecordTypedObservation:z.boolean(),correctionAllowed:z.boolean(),conditions:z.array(formalOutcomeConditionSchema).max(32),criteriaStatus:z.enum(["available","not_recorded"]),criteriaVersion:formalRealityCriteriaVersionSchema.optional(),review:formalOutcomeReviewSchema.optional(),correctionRequirements:z.array(correctionRequirementSchema).max(32).optional()}).strict().superRefine((target,ctx)=>{
  const requirements=target.correctionRequirements;if(!requirements)return;
  if(target.criteriaVersion!=="formal-reality-criteria-v2"||target.criteriaStatus!=="available"||new Set(requirements.map(r=>r.ruleKey)).size!==requirements.length)ctx.addIssue({code:"custom",message:"Invalid correction scope"});
  for(const requirement of requirements){
    const operation=target.conditions.find(c=>c.key===requirement.conditionKey),request=target.conditions.find(c=>c.key===requirement.requestConditionKey);
    if(!operation?.correctable||operation.measurement!=="operation"||operation.ruleKey!==requirement.ruleKey||new Set(requirement.requiredTrueConditionKeys).size!==requirement.requiredTrueConditionKeys.length||requirement.requiredTrueConditionKeys.some(key=>{const c=target.conditions.find(c=>c.key===key);return !c||c.kind!=="scope_confirmation"||c.expectedValue!==true;})||(requirement.requestConditionKey!==null&&(!request||request.kind!=="request_information"||request.measurement!=="operation")))ctx.addIssue({code:"custom",message:"Invalid correction condition reference"});
  }
});
export type FormalOutcomeTarget = z.infer<typeof formalOutcomeTargetSchema>;
export const formalOutcomeProjectionSchema = z.object({
  lockStatus:z.enum(["available","historical_lock_not_recorded"]),assessedAt:z.string(),targets:z.array(formalOutcomeTargetSchema),
  history:z.array(z.object({key:z.string(),targetKey:z.string(),observed:z.enum(["occurred","did_not_occur","uncertain"]),recordedAt:z.string(),occurredAt:z.string().nullable(),source:z.literal("user_observation"),evidenceSummary:digitalLifeSafeText,uncertainty:z.enum(["low","medium","high"]),backtestStatus:z.enum(["scored","insufficient_data","not_observable","historical_lock_not_recorded"]),correctionAvailable:z.boolean(),observations:z.array(z.object({key:z.string(),value,occurredAt:z.string().nullable()}).strict()).max(32),criteriaComparison:formalCriteriaComparisonSchema}).strict()),
  calibration:z.object({status:z.enum(["insufficient_data","calibrated"]),sampleCount:z.number().int().nonnegative(),minimumSampleSize:z.literal(5)}).strict(),
}).strict();
export type FormalOutcomeProjection = z.infer<typeof formalOutcomeProjectionSchema>;
export const formalCalibrationContextSchema = z.object({ status:z.enum(["available","current_graph_required"]),profileRevision:z.number().int().nonnegative(),corrections:z.array(z.object({key:z.string().regex(/^correction-v1-[a-f0-9]{64}$/),label:digitalLifeSafeText,evidenceSummary:digitalLifeSafeText,ruleKey:z.string(),kind:z.enum(["allocate_resource","update_relation_signal"]),previousValue:value,nextValue:value,version:z.literal(1),status:z.enum(["eligible","incompatible"]),reason:digitalLifeSafeText.nullable(),sourceRunId:z.string().uuid().optional(),recordedAt:z.string().datetime({offset:true}).optional()}).strict()) }).strict();
export type FormalCalibrationContext = z.infer<typeof formalCalibrationContextSchema>;
