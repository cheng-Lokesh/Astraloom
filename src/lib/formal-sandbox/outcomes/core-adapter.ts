import { createHash } from "node:crypto";
import { z } from "zod";
import { digitalLifeModelSchema } from "@/lib/digital-life/model";
import { buildClaimsV2 } from "@/lib/v2/claims-reports";
import { createInMemoryOutcomeCalibrationRepositoryV2, parseValidatedForecastLockPersistenceVersionV2, type OutcomeCalibrationPersistenceVersionV2 } from "@/lib/v2/outcome-calibration";
import { canonicalStage7JsonV2 } from "@/lib/v2/outcome-calibration/ids";
import { addTrajectoryDaysV2, parseTrajectoryInstantV2 } from "@/lib/v2/trajectory/time";
import type { BatchAnalysisV2 } from "@/lib/v2/trajectory-analysis/types";
import { formalOutcomeConditionSchema, formalOutcomeInputSchema, type FormalOutcomeInput, type FormalOutcomeTarget } from "./contracts";

export const digest = (input: unknown) => createHash("sha256").update(canonicalStage7JsonV2(input)).digest("hex");
const bundleSchema = z.object({ inputSnapshot:z.object({ownerId:z.string().uuid(),seedContextId:z.string().uuid(),graphSnapshotId:z.string().uuid(),agentSnapshotId:z.string().uuid(),startedAt:z.string(),horizonDays:z.union([z.literal(30),z.literal(90)]),realityProfileSnapshot:z.object({revision:z.number().int()}).passthrough(),digitalLifeModel:digitalLifeModelSchema.optional()}).passthrough(), sourceBoundary:z.unknown(),trajectoryAnalysis:z.unknown(),claims:z.array(z.unknown()),report:z.unknown(),forecastPersistenceHistory:z.array(z.unknown()).optional() }).passthrough();
const realityCriteriaSchema=z.object({version:z.literal("formal-reality-criteria-v1"),ownerId:z.string().uuid(),seedContextId:z.string().uuid(),pathKey:z.string(),forecastLockReference:z.object({streamId:z.string(),version:z.number().int().positive()}).strict(),frozenAt:z.string().datetime({offset:true}),sourceFingerprint:z.string().regex(/^[a-f0-9]{64}$/),targets:z.array(z.object({targetKey:z.string(),observationWindow:z.object({startAt:z.string(),horizonEnd:z.string()}).strict(),conditions:z.array(formalOutcomeConditionSchema).max(32)}).strict()),criteriaFingerprint:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export function parseOutcomeBundle(raw:unknown) { return bundleSchema.parse(raw); }

/** Reconstruct only repository-persisted versions; never fabricate a late pre-lock. */
export async function loadDurableForecast(raw:unknown, storedAt:string) {
  const bundle=parseOutcomeBundle(raw);
  const records=bundle.forecastPersistenceHistory;
  if (!records || records.length!==1) throw new Error("historical_lock_not_recorded");
  const first=parseValidatedForecastLockPersistenceVersionV2(records[0]);
  if (!first.ok) throw new Error("invalid_forecast_lock");
  const record=first.persistenceVersion;
  if (record.artifact.kind!=="forecast_lock") throw new Error("invalid_forecast_lock");
  const lock=record.artifact.value;
  const snapshots=lock.sourceSnapshots;
  if (canonicalStage7JsonV2(snapshots.claimSet.realityBoundary)!==canonicalStage7JsonV2(bundle.sourceBoundary)
    || canonicalStage7JsonV2(snapshots.run.payload)!==canonicalStage7JsonV2(bundle.trajectoryAnalysis)
    || canonicalStage7JsonV2(snapshots.report)!==canonicalStage7JsonV2(bundle.report)
    || canonicalStage7JsonV2([...snapshots.claims].sort((a,b)=>a.id.localeCompare(b.id)))!==canonicalStage7JsonV2(bundle.claims)) throw new Error("invalid_forecast_lock");
  if (!Number.isFinite(Date.parse(storedAt)) || Date.parse(record.persistedAt)>Date.parse(storedAt)
    || lock.forecastUnits.some(unit=>Date.parse(storedAt)>=Date.parse(unit.semantics.evaluationWindow.startAt))) throw new Error("invalid_forecast_lock");
  const repository=createInMemoryOutcomeCalibrationRepositoryV2();
  const appended=await repository.append({streamId:record.streamId,expectedVersion:0,idempotencyKey:record.idempotencyKey,persistedAt:record.persistedAt,artifact:record.artifact});
  if (!appended.ok || canonicalStage7JsonV2(appended.data)!==canonicalStage7JsonV2(record)) throw new Error("invalid_forecast_lock");
  if(bundle.frozenRealityCriteria!=null&&digest(realityCriteriaSchema.parse(bundle.frozenRealityCriteria))!==digest(buildFrozenRealityCriteria(bundle)))throw new Error("invalid_forecast_lock");
  return {bundle,lock,record,repository};
}

function deriveOutcomeTargets(raw:unknown, now:string, available:boolean, buildingCriteria=false): FormalOutcomeTarget[] {
  const bundle=parseOutcomeBundle(raw);
  const analysis=bundle.trajectoryAnalysis as BatchAnalysisV2;
  const model=bundle.inputSnapshot.digitalLifeModel;
  const start=parseTrajectoryInstantV2(bundle.inputSnapshot.startedAt);if(!start.ok)throw new Error("invalid_forecast_lock");
  const end=addTrajectoryDaysV2(start.value,bundle.inputSnapshot.horizonDays);
  if (!end.ok) throw new Error("invalid_forecast_lock");
  return bundle.claims.map((rawClaim,index)=>{
    const claim=rawClaim as {id:string;clusterIds:string[];claimType:string};
    const cluster=analysis.clusters.find(c=>c.clusterId===claim.clusterIds[0]);
    const trajectory=analysis.trajectories.find(t=>t.trajectoryId===cluster?.representativeTrajectoryId);
    const events=trajectory?.finalWorld.worldEvents ?? [];
    const conditions:FormalOutcomeTarget["conditions"]=[];
    const resourceOnly=events.length>0 && events.every(event=>{
      const op=event.operation;
      const actor=trajectory?.finalWorld.agentDefinitions.find(a=>a.id===event.actorId);
      const entity=trajectory?.finalWorld.entities.find(e=>e.agentDefinitionId===event.actorId);
      const resource=op.actionType==="allocate_resource"?trajectory?.finalWorld.resources.find(r=>r.id===op.resourceId):undefined;
      return op.actionType==="allocate_resource" && event.eventType==="allocate_resource" && actor?.actorType==="self" && event.deltas.length===1
        && event.deltas[0].valueType==="resource" && event.deltas[0].path===`resources.${op.resourceId}.available`
        && event.deltas[0].before-event.deltas[0].after===op.amount
        && event.targetEntityIds.length===1 && event.targetEntityIds[0]===entity?.id && resource?.ownerEntityId===entity?.id && resource.controllerAgentId===event.actorId
        && event.targetResourceIds.length===1 && event.targetResourceIds[0]===op.resourceId
        && event.targetRelationIds.length===0 && event.targetVariableIds.length===0;
    });
    for (const [eventIndex,event] of events.entries()) {
      const operation=event.operation;
      const explicit=model?.rules.actions.find(rule=>event.proposalId.endsWith(`_${rule.key}`));
      let label:string; let expectedValue:FormalOutcomeTarget["conditions"][number]["expectedValue"];
      if(operation.actionType==="allocate_resource") { const resource=trajectory?.finalWorld.resources.find(r=>r.id===operation.resourceId); label=`实际投入“${resource?.label ?? "已声明资源"}”的数量`;expectedValue=operation.amount; }
      else if(operation.actionType==="request_information") { label="已向指定协作对象询问安排";expectedValue=true; }
      else if(operation.actionType==="update_relation_signal") { label="询问后的可观察回应（不代表私密意图）";expectedValue=operation.signal; }
      else if(operation.actionType==="update_commitment") { label=`可观察承诺“${operation.label}”的状态`;expectedValue=operation.status; }
      else continue;
      const actorLabel=trajectory?.finalWorld.agentDefinitions.find(a=>a.id===event.actorId)?.displayName??null;
      const resourceLabel=operation.actionType==="allocate_resource"?trajectory?.finalWorld.resources.find(r=>r.id===operation.resourceId)?.label??null:null;
      const metadata={requiresTime:true,actorLabel,resourceLabel,sequence:eventIndex+1};
      conditions.push({key:`condition-${conditions.length+1}`,label:`第 ${eventIndex+1} 项：${actorLabel??"参与者"} · ${label}`,kind:operation.actionType,expectedValue,ruleKey:explicit?.key ?? null,correctable:!!explicit && (operation.actionType==="allocate_resource" || operation.actionType==="update_relation_signal"),measurement:"operation",...metadata});
      if(resourceOnly&&buildingCriteria){
        const delta=event.deltas[0];
        for(const [measurement,value,label] of [["resource_before",delta.before,"投入前可用数量"],["resource_after",delta.after,"投入后剩余数量"]] as const){
          conditions.push({key:`condition-${conditions.length+1}`,label:`第 ${eventIndex+1} 项：${actorLabel} · ${resourceLabel} · ${label}`,kind:"allocate_resource",expectedValue:value as number,ruleKey:null,correctable:false,measurement,...metadata});
        }
        for(const [measurement,label] of [["actor_scope",`实际投入者是“${actorLabel}”本人，而非其他人`],["resource_scope",`实际投入的是“${resourceLabel}”，单位为“${trajectory?.finalWorld.resources.find(r=>operation.actionType==="allocate_resource"&&r.id===operation.resourceId)?.unit}”`]] as const){
          conditions.push({key:`condition-${conditions.length+1}`,label:`第 ${eventIndex+1} 项：${label}`,kind:"scope_confirmation",expectedValue:true,ruleKey:null,correctable:false,measurement,...metadata,requiresTime:false});
        }
      }
    }
    if(resourceOnly && trajectory&&buildingCriteria){
      conditions.push({key:`condition-${conditions.length+1}`,label:"整个观察窗口内，本人对以上指定资源的实际投入总次数（不要只填模拟列出的次数）",kind:"allocate_resource",expectedValue:events.length,ruleKey:null,correctable:false,requiresTime:false,measurement:"event_count",actorLabel:null,resourceLabel:null,sequence:0});
    }
    // Core Cluster signatures contain internal state/provenance, not only reality criteria.
    const retained=available&&conditions.length<=32?conditions:[];
    const criteria=bundle.frozenRealityCriteria?realityCriteriaSchema.parse(bundle.frozenRealityCriteria):null;
    const frozen=criteria?.targets.find(t=>t.targetKey===`target-${index+1}`);
    return {key:`target-${index+1}`,label:`结果条件 ${index+1}`,status:"not_observable" as const,reason:available?"完整模拟情景还含内部状态与来源绑定，尚不能用本人观察为整个情景评分；具体资源条件可以独立对照":"此历史运行未保存结果发生前的完整锁定记录",observationWindow:{startAt:bundle.inputSnapshot.startedAt,horizonEnd:end.value.isoTimestamp},canRecordDidNotOccur:false,canRecordTypedObservation:retained.length>0,correctionAllowed:retained.some(c=>c.correctable),conditions:frozen&&available?frozen.conditions:retained,criteriaStatus:frozen&&available?"available":"not_recorded"};
  });
}
export function outcomeTargets(raw:unknown,now:string,available:boolean){return deriveOutcomeTargets(raw,now,available);}

/** An independent reality comparison; never a Core Cluster occurrence or Brier score. */
export function buildFrozenRealityCriteria(raw:unknown){
 const parsed=parseOutcomeBundle(raw),base:Record<string,unknown>={...parsed};delete base.frozenRealityCriteria;
 const record=parsed.forecastPersistenceHistory?.[0] as {artifact?:{value?:{lockedAt?:string}};persistedAt?:string;streamId?:string;version?:number}|undefined;
 if(!record?.artifact?.value?.lockedAt||!record.streamId||!record.version)throw new Error("invalid_forecast_lock");
 const targets=deriveOutcomeTargets(base,record.persistedAt!,true,true).filter(t=>t.conditions.some(c=>c.measurement==="event_count")&&t.conditions.every(c=>c.kind==="allocate_resource"||c.kind==="scope_confirmation")).map(t=>({targetKey:t.key,observationWindow:t.observationWindow,conditions:t.conditions}));
 const unsigned={version:"formal-reality-criteria-v1" as const,ownerId:parsed.inputSnapshot.ownerId,seedContextId:parsed.inputSnapshot.seedContextId,pathKey:typeof parsed.inputSnapshot.activePathKey==="string"?parsed.inputSnapshot.activePathKey:"main",forecastLockReference:{streamId:record.streamId,version:record.version},frozenAt:record.artifact.value.lockedAt,sourceFingerprint:digest({input:parsed.inputSnapshot,boundary:parsed.sourceBoundary,analysis:parsed.trajectoryAnalysis}),targets};
 return realityCriteriaSchema.parse({...unsigned,criteriaFingerprint:digest(unsigned)});
}

export async function buildObservedOutcome(rawBundle:unknown, storedAt:string|null, input:FormalOutcomeInput, recordedAt:string) {
  input=formalOutcomeInputSchema.parse(input);
  const bundle=parseOutcomeBundle(rawBundle);
  const target=outcomeTargets(rawBundle,recordedAt,storedAt!==null).find(t=>t.key===input.target_key);
  if(!target) throw new Error("invalid_target");
  if(input.observed!=="uncertain" && (target.status!=="observable" || !storedAt)) throw new Error("not_observable");
  if(target.canRecordTypedObservation && (input.observations.length!==target.conditions.length || target.conditions.some(c=>!input.observations.some(o=>o.key===c.key && (o.value===null || typeof o.value===typeof c.expectedValue && (typeof o.value!=="string" || (c.kind==="update_relation_signal"?["negative","neutral","positive"]:["planned","active","fulfilled","cancelled"]).includes(o.value))))))) throw new Error("invalid_observation");
  if(!target.canRecordTypedObservation && input.observations.length) throw new Error("invalid_observation");
  for(const condition of target.conditions){
    const actual=input.observations.find(o=>o.key===condition.key)!;
    if(condition.measurement==="event_count"&&actual.value!==null&&(typeof actual.value!=="number"||!Number.isInteger(actual.value)))throw new Error("invalid_observation");
    if(actual.value!==null && condition.requiresTime && (!actual.occurred_at || Date.parse(actual.occurred_at)<Date.parse(target.observationWindow.startAt)||Date.parse(actual.occurred_at)>Math.min(Date.parse(recordedAt),Date.parse(target.observationWindow.horizonEnd))))throw new Error("invalid_observation_time");
    if(actual.value===null && actual.occurred_at)throw new Error("invalid_observation_time");
  }
  const allMatch=target.conditions.every(c=>input.observations.find(o=>o.key===c.key)?.value===c.expectedValue);
  if(input.observed==="occurred" && (!allMatch || !input.occurred_at || Date.parse(input.occurred_at)>Date.parse(recordedAt))) throw new Error("invalid_observation");
  if(input.observed==="did_not_occur" && (!target.canRecordDidNotOccur || allMatch || input.observations.some(o=>o.value===null))) throw new Error("invalid_observation");
  let correction:Record<string,unknown>|null=null;
  if(input.correction) {
    const condition=target.conditions.find(c=>c.ruleKey===input.correction?.rule_key && c.correctable);
    const rule=bundle.inputSnapshot.digitalLifeModel?.rules.actions.find(r=>r.key===input.correction?.rule_key && r.pathKey==="main");
    const actual=input.observations.find(o=>o.key===condition?.key)?.value;
    if(!condition || !rule || actual===null || actual===undefined || actual===condition.expectedValue || !target.correctionAllowed) throw new Error("invalid_correction");
    if(rule.operation.actionType==="allocate_resource" ? typeof actual!=="number" || actual<=0 : rule.operation.actionType!=="update_relation_signal" || typeof actual!=="string") throw new Error("invalid_correction");
    if(rule.operation.actionType==="allocate_resource"&&target.conditions.some(c=>c.sequence===condition.sequence&&(c.measurement==="actor_scope"||c.measurement==="resource_scope")&&input.observations.find(o=>o.key===c.key)?.value!==true))throw new Error("invalid_correction");
    correction={version:"formal-outcome-rule-correction-v1",ownerId:bundle.inputSnapshot.ownerId,seedContextId:bundle.inputSnapshot.seedContextId,graphSnapshotId:bundle.inputSnapshot.graphSnapshotId,agentSnapshotId:bundle.inputSnapshot.agentSnapshotId,profileRevision:bundle.inputSnapshot.realityProfileSnapshot.revision,ruleKey:rule.key,ruleFingerprint:digest(rule),kind:rule.operation.actionType,previousValue:condition.expectedValue,nextValue:actual,evidenceSummary:input.evidence_summary,recordedAt};
  }
  const observationSignature=digest({run:bundle.inputSnapshot,target:input.target_key,observations:input.observations,evidence:input.evidence_summary,observed:input.observed});
  if(input.observed!=="uncertain")throw new Error("not_observable");
  let criteriaComparison:{status:"matched"|"different"|"unknown"|"not_recorded";differences:string[]}={status:"not_recorded",differences:[]};
  if(target.criteriaStatus==="available"){
    if(!storedAt)throw new Error("invalid_forecast_lock");
    await loadDurableForecast(rawBundle,storedAt);
    const frozen=realityCriteriaSchema.parse(bundle.frozenRealityCriteria);
    if(digest(frozen)!==digest(buildFrozenRealityCriteria(bundle)))throw new Error("invalid_forecast_lock");
    const differences:string[]=[];let unknown=false;let priorTime=-Infinity;
    for(const condition of target.conditions){
      const actual=input.observations.find(o=>o.key===condition.key)!;
      if(actual.value===null){unknown=true;continue;}
      if(actual.value!==condition.expectedValue)differences.push(condition.key);
      if(condition.measurement==="operation"){
        const time=Date.parse(actual.occurred_at!);
        if(time<priorTime)differences.push(condition.key);
        priorTime=time;
        const before=target.conditions.find(c=>c.sequence===condition.sequence&&c.measurement==="resource_before");
        const after=target.conditions.find(c=>c.sequence===condition.sequence&&c.measurement==="resource_after");
        const b=input.observations.find(o=>o.key===before?.key),a=input.observations.find(o=>o.key===after?.key);
        if(b?.value==null||a?.value==null){unknown=true;continue;}
        if(typeof actual.value!=="number"||typeof b.value!=="number"||typeof a.value!=="number")throw new Error("invalid_observation");
        if(b.value-actual.value!==a.value||Date.parse(b.occurred_at!)>time||Date.parse(a.occurred_at!)<time)differences.push(after!.key);
      }
    }
    criteriaComparison={status:Date.parse(recordedAt)<Date.parse(target.observationWindow.horizonEnd)?"unknown":differences.length?"different":unknown?"unknown":"matched",differences:[...new Set(differences)]};
  }
  if(correction)correction.observationSignature=observationSignature;
  return {target,correction,artifacts:[] as OutcomeCalibrationPersistenceVersionV2[],observationSignature,calibration:undefined,criteriaComparison};
}

// Imported Core builder is retained as an explicit validator dependency, never a replacement scoring implementation.
export const validateOutcomeClaimSet = buildClaimsV2;
