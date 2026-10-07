import type { SupabaseClient } from "@supabase/supabase-js";
import { formalOutcomeInputSchema,formalOutcomeProjectionSchema,formalCalibrationContextSchema,type FormalOutcomeProjection } from "./contracts";
import { buildObservedOutcome,digest,loadDurableForecast,outcomeTargets,parseOutcomeBundle } from "./core-adapter";
import { frozenCorrectionSchema } from "./rule-corrections";
import { readFormalDigitalLifeContext } from "../model-context.server";

async function loadRun(service:SupabaseClient,owner:string,runId:string){
 const result=await service.from("simulations").select("id,user_id,seed_context_id,graph_snapshot_id,status,execution_version,result_bundle").eq("id",runId).eq("user_id",owner).eq("execution_version","formal-account-sandbox-m1-v1").eq("status","completed").maybeSingle();
 if(result.error)throw new Error("persistence_failed");if(!result.data)throw new Error("run_not_found");return result.data;
}
export async function readFormalOutcomes(service:SupabaseClient,owner:string,runId:string):Promise<FormalOutcomeProjection>{
 const run=await loadRun(service,owner,runId);
 const [locks,rows]=await Promise.all([service.from("formal_forecast_locks").select("history,stored_at,reality_criteria").eq("user_id",owner).eq("simulation_id",runId).eq("path_key","main").maybeSingle(),service.from("formal_outcome_observations").select("request_payload,recorded_at,backtest_status,correction,criteria_comparison").eq("user_id",owner).eq("simulation_id",runId).order("recorded_at").order("id")]);
 if(locks.error||rows.error)throw new Error("persistence_failed");
 const now=new Date().toISOString();
 if(locks.data){
   const bundle=parseOutcomeBundle(run.result_bundle);
   if(digest(locks.data.history)!==digest(bundle.forecastPersistenceHistory))throw new Error("invalid_forecast_lock");
   if(digest(locks.data.reality_criteria??null)!==digest(bundle.frozenRealityCriteria??null))throw new Error("invalid_forecast_lock");
   await loadDurableForecast(run.result_bundle,locks.data.stored_at);
 }
 return formalOutcomeProjectionSchema.parse({lockStatus:locks.data?"available":"historical_lock_not_recorded",assessedAt:now,targets:outcomeTargets(run.result_bundle,now,!!locks.data),history:(rows.data??[]).map((row,index)=>{const request=formalOutcomeInputSchema.parse(row.request_payload);return {key:`observation-${index+1}`,targetKey:request.target_key,observed:request.observed,recordedAt:row.recorded_at,occurredAt:request.occurred_at??null,source:"user_observation",evidenceSummary:request.evidence_summary,uncertainty:request.uncertainty,backtestStatus:row.backtest_status,correctionAvailable:row.correction!==null,observations:request.observations.map(o=>({key:o.key,value:o.value,occurredAt:o.occurred_at??null})),criteriaComparison:row.criteria_comparison??{status:"not_recorded",differences:[]}};}),calibration:{status:"insufficient_data",sampleCount:0,minimumSampleSize:5}});
}
export async function saveFormalOutcome(service:SupabaseClient,owner:string,runId:string,rawInput:unknown){
 const input=formalOutcomeInputSchema.parse(rawInput),requestHash=digest({runId,input});
 // Receipt-first recovery must not rebuild against a newer time or target snapshot.
 const prior=await service.from("formal_outcome_observations").select("request_hash").eq("user_id",owner).eq("idempotency_key",input.idempotency_key).maybeSingle();
 if(prior.error)throw new Error("persistence_failed");
 if(prior.data){if(prior.data.request_hash!==requestHash)throw new Error("idempotency_key_content_conflict");return {idempotent:true,outcomes:await readFormalOutcomes(service,owner,runId)};}
 const run=await loadRun(service,owner,runId);
 const locks=await service.from("formal_forecast_locks").select("stored_at,history,reality_criteria").eq("user_id",owner).eq("simulation_id",runId).eq("path_key","main").maybeSingle();
 if(locks.error)throw new Error("persistence_failed");
 if(locks.data){const bundle=parseOutcomeBundle(run.result_bundle);if(digest(locks.data.history)!==digest(bundle.forecastPersistenceHistory)||digest(locks.data.reality_criteria??null)!==digest(bundle.frozenRealityCriteria??null))throw new Error("invalid_forecast_lock");await loadDurableForecast(run.result_bundle,locks.data.stored_at);}
 const recordedAt=new Date().toISOString();
 const built=await buildObservedOutcome(run.result_bundle,locks.data?.stored_at??null,input,recordedAt);
 let correction=null;
 if(built.correction){const draft={...built.correction,rowVersion:1,sourceRunId:runId};correction=frozenCorrectionSchema.parse({...draft,key:`correction-v1-${digest(draft)}`});}
 const status=input.observed==="uncertain"?(locks.data?"not_observable":"historical_lock_not_recorded"):"scored";
 const result=await service.rpc("append_formal_outcome_v1",{p_owner:owner,p_run:runId,p_request:input,p_request_hash:requestHash,p_recorded_at:recordedAt,p_observation_signature:built.observationSignature,p_artifacts:built.artifacts,p_calibration:built.calibration??null,p_correction:correction,p_status:status,p_criteria_comparison:built.criteriaComparison});
 if(result.error)throw new Error(result.error.message);
 if(!Array.isArray(result.data)||result.data.length!==1||typeof result.data[0].idempotent!=="boolean")throw new Error("persistence_failed");
 return {idempotent:result.data[0].idempotent as boolean,outcomes:await readFormalOutcomes(service,owner,runId)};
}
export async function readFormalCalibrationContext(caller:SupabaseClient,service:SupabaseClient,owner:string,graphId?:string){
 const current=await readFormalDigitalLifeContext(caller,owner);
 if(!current.ok||graphId&&graphId!==current.context.graphSnapshotId) return formalCalibrationContextSchema.parse({status:"current_graph_required",profileRevision:0,corrections:[]});
 const rows=await service.from("formal_outcome_observations").select("correction,recorded_at").eq("user_id",owner).not("correction","is",null).order("recorded_at",{ascending:false}).order("id",{ascending:false}).limit(20);
 if(rows.error)throw new Error("persistence_failed");
 const corrections=(rows.data??[]).map(r=>frozenCorrectionSchema.parse(r.correction));
 const compatible=corrections.filter(c=>c.graphSnapshotId===current.context.graphSnapshotId&&c.agentSnapshotId===current.context.agentSnapshotId&&c.profileRevision===current.context.profileRevision);
 const newestSource=compatible[0]?.sourceRunId;
 return formalCalibrationContextSchema.parse({status:"available",profileRevision:current.context.profileRevision,corrections:corrections.map(c=>({key:c.key,label:c.kind==="allocate_resource"?"依据实际投入修正下次资源条件":"依据实际可见回应修正下次回应假设",evidenceSummary:c.evidenceSummary,ruleKey:c.ruleKey,kind:c.kind,previousValue:c.previousValue,nextValue:c.nextValue,version:1,status:compatible.includes(c)&&c.sourceRunId===newestSource?"eligible":"incompatible",reason:compatible.includes(c)&&c.sourceRunId===newestSource?null:"适用处境、规则来源或现实档案版本已不同，请重新确认条件"}))});
}
