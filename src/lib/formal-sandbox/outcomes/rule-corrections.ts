import { z } from "zod";
import { digitalLifeRulesSchema, digitalLifeSafeText, type DigitalLifeRules } from "@/lib/digital-life/model";
import { digest } from "./core-adapter";

export const frozenCorrectionSchema=z.object({key:z.string().regex(/^correction-v1-[a-f0-9]{64}$/),version:z.literal("formal-outcome-rule-correction-v1"),rowVersion:z.literal(1).optional(),ownerId:z.string().uuid(),seedContextId:z.string().uuid(),graphSnapshotId:z.string().uuid(),agentSnapshotId:z.string().uuid(),profileRevision:z.number().int().nonnegative(),sourceRunId:z.string().uuid(),observationSignature:z.string().regex(/^[a-f0-9]{64}$/),ruleKey:z.string().regex(/^rule-[1-9]\d*$/),ruleFingerprint:z.string().regex(/^[a-f0-9]{64}$/),kind:z.enum(["allocate_resource","update_relation_signal"]),previousValue:z.union([z.number().finite(),z.enum(["negative","neutral","positive"])]),nextValue:z.union([z.number().finite().positive().max(1_000_000),z.enum(["negative","neutral","positive"])]),evidenceSummary:digitalLifeSafeText.max(160),recordedAt:z.string().datetime({offset:true})}).strict();
export const frozenOutcomeCalibrationSchema=z.object({version:z.literal("formal-outcome-run-v1"),corrections:z.array(frozenCorrectionSchema).min(1).max(6)}).strict();
export type FrozenOutcomeCalibration=z.infer<typeof frozenOutcomeCalibrationSchema>;
export function applyFrozenCorrections(source:{ownerId:string;seedContextId:string;graphSnapshotId:string;agentSnapshotId:string;realityProfileSnapshot:{revision:number};startedAt:string;acceptedAt?:string},rawRules:DigitalLifeRules|undefined,calibration:FrozenOutcomeCalibration|undefined) {
 if(!calibration)return rawRules;
 if(!rawRules)throw new Error("invalid_correction");
 const rules=structuredClone(rawRules),seen=new Set<string>();
 for(const correction of calibration.corrections){
   if(correction.ownerId!==source.ownerId||correction.seedContextId!==source.seedContextId||correction.graphSnapshotId!==source.graphSnapshotId||correction.agentSnapshotId!==source.agentSnapshotId||correction.profileRevision!==source.realityProfileSnapshot.revision||Date.parse(correction.recordedAt)>Date.parse(source.acceptedAt??source.startedAt)||seen.has(correction.ruleKey))throw new Error("invalid_correction");
   const rule=rules.actions.find(r=>r.key===correction.ruleKey&&r.pathKey==="main");
   if(!rule||digest(rule)!==correction.ruleFingerprint||rule.operation.actionType!==correction.kind)throw new Error("invalid_correction");
   if(rule.operation.actionType==="allocate_resource") {
     if(typeof correction.nextValue!=="number"||rule.operation.amount!==correction.previousValue)throw new Error("invalid_correction");
     rule.operation.amount=correction.nextValue;
   }else if(rule.operation.actionType==="update_relation_signal"){
     if(typeof correction.nextValue!=="string"||rule.operation.signal!==correction.previousValue)throw new Error("invalid_correction");
     rule.operation.signal=correction.nextValue;
   }
   rule.evidenceSummary=correction.evidenceSummary;seen.add(rule.key);
 }
 return digitalLifeRulesSchema.parse(rules);
}
