import { digitalLifeRulesSchema, type DigitalLifeRules } from "@/lib/digital-life/model";
import type { FrozenOutcomeCalibration } from "./correction-contracts";
export { frozenCorrectionSchema, frozenOutcomeCalibrationSchema, type FrozenOutcomeCalibration } from "./correction-contracts";
import { digest } from "./core-adapter";

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
