import { z } from "zod";
import { digitalLifeSafeText } from "@/lib/digital-life/model";

const value = z.union([z.boolean(), z.number().finite().min(0).max(1_000_000), z.enum(["negative", "neutral", "positive", "planned", "active", "fulfilled", "cancelled"]), z.null()]);
export const outcomeCalibrationSelectionSchema = z.object({ version: z.literal(1), correction_keys: z.array(z.string().regex(/^correction-[1-9]\d*$/)).min(1).max(6), confirmed: z.literal(true) }).strict().refine(v => new Set(v.correction_keys).size === v.correction_keys.length);
export type OutcomeCalibrationSelection = z.infer<typeof outcomeCalibrationSelectionSchema>;
export const formalOutcomeInputSchema = z.object({
  target_key: z.string().regex(/^target-[1-9]\d*$/), observed: z.enum(["occurred", "did_not_occur", "uncertain"]),
  occurred_at: z.string().datetime({ offset: true }).optional(), evidence_summary: digitalLifeSafeText.max(160),
  uncertainty: z.enum(["low", "medium", "high"]), confirmed_user_observation: z.literal(true),
  observations: z.array(z.object({ key: z.string().regex(/^condition-[1-9]\d*$/), value }).strict()).max(32),
  correction: z.object({ rule_key: z.string().regex(/^rule-[1-9]\d*$/), confirmed_for_next_run: z.literal(true) }).strict().optional(),
  idempotency_key: z.string().uuid(),
}).strict().superRefine((v,c) => {
  if ((v.observed === "occurred") !== (v.occurred_at !== undefined)) c.addIssue({code:"custom",message:"occurrence time must match status"});
  if (new Set(v.observations.map(x=>x.key)).size !== v.observations.length) c.addIssue({code:"custom",message:"duplicate observation condition"});
});
export type FormalOutcomeInput = z.infer<typeof formalOutcomeInputSchema>;
const condition = z.object({ key:z.string(), label:digitalLifeSafeText, kind:z.enum(["request_information","allocate_resource","update_relation_signal","update_commitment"]), expectedValue:value, ruleKey:z.string().nullable(), correctable:z.boolean() }).strict();
export const formalOutcomeTargetSchema = z.object({key:z.string(),label:digitalLifeSafeText,status:z.enum(["observable","not_observable"]),reason:digitalLifeSafeText.nullable(),observationWindow:z.object({startAt:z.string(),horizonEnd:z.string()}).strict(),canRecordDidNotOccur:z.boolean(),conditions:z.array(condition).max(32)}).strict();
export type FormalOutcomeTarget = z.infer<typeof formalOutcomeTargetSchema>;
export const formalOutcomeProjectionSchema = z.object({
  lockStatus:z.enum(["available","historical_lock_not_recorded"]),assessedAt:z.string(),targets:z.array(formalOutcomeTargetSchema),
  history:z.array(z.object({key:z.string(),targetKey:z.string(),observed:z.enum(["occurred","did_not_occur","uncertain"]),recordedAt:z.string(),occurredAt:z.string().nullable(),source:z.literal("user_observation"),evidenceSummary:digitalLifeSafeText,uncertainty:z.enum(["low","medium","high"]),backtestStatus:z.enum(["scored","insufficient_data","not_observable","historical_lock_not_recorded"]),correctionAvailable:z.boolean()}).strict()),
  calibration:z.object({status:z.literal("insufficient_data"),sampleCount:z.number().int().nonnegative(),minimumSampleSize:z.literal(5)}).strict(),
}).strict();
export type FormalOutcomeProjection = z.infer<typeof formalOutcomeProjectionSchema>;
export const formalCalibrationContextSchema = z.object({ status:z.enum(["available","current_graph_required"]),graphSnapshotId:z.string().uuid().nullable(),agentSnapshotId:z.string().uuid().nullable(),profileRevision:z.number().int().nonnegative(),corrections:z.array(z.object({key:z.string(),label:digitalLifeSafeText,evidenceSummary:digitalLifeSafeText,ruleKey:z.string(),kind:z.enum(["allocate_resource","update_relation_signal"]),previousValue:value,nextValue:value,version:z.literal(1),status:z.enum(["eligible","incompatible"]),reason:digitalLifeSafeText.nullable()}).strict()) }).strict();
export type FormalCalibrationContext = z.infer<typeof formalCalibrationContextSchema>;
