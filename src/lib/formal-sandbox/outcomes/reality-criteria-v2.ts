import { createHash } from "node:crypto";
import { z } from "zod";
import { buildDigitalLifeModel, digitalLifeModelSchema } from "@/lib/digital-life/model";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import { approveActionProposalV2 } from "@/lib/v2/agent-world/action-proposal";
import { applyWorldTransitionV2 } from "@/lib/v2/agent-world/world-transition";
import type { WorldEventV2, WorldStateV2 } from "@/lib/v2/agent-world/types";
import { createSeededRngV2, selectSeededIndexV2 } from "@/lib/v2/trajectory/seeded-rng";
import { parseTrajectoryResultForFeatureV2 } from "@/lib/v2/trajectory-analysis/trajectory-result-validation";
import type { BatchAnalysisV2 } from "@/lib/v2/trajectory-analysis/types";
import { canonicalStage7JsonV2 } from "@/lib/v2/outcome-calibration/ids";
import { bindPlanningWorld } from "@/lib/formal-planning/world-binding";
import { frozenDefaultPlanningEnvelopeSchema } from "@/lib/formal-planning/contracts";
import { buildFormalSandboxInitialWorld, initialWorldSourceSchema } from "../initial-world";
import { proposeSandboxCandidates } from "../candidate-pipeline";
import type { DigitalLifeProposalBindings } from "../digital-life-proposals";
import { formalOutcomeConditionSchema, formalOutcomeReviewSchema, type FormalOutcomeTarget } from "./contracts";

const hash = (input: unknown) => createHash("sha256").update(canonicalStage7JsonV2(input)).digest("hex");
const same = (a: unknown, b: unknown) => hash(JSON.parse(JSON.stringify(a))) === hash(JSON.parse(JSON.stringify(b)));
const windowSchema = z.object({startAt:z.string().datetime({offset:true}),horizonEnd:z.string().datetime({offset:true})}).strict();
export const realityCriteriaV2Schema = z.object({
  version:z.literal("formal-reality-criteria-v2"), ownerId:z.string().uuid(),seedContextId:z.string().uuid(),pathKey:z.string(),
  forecastLockReference:z.object({streamId:z.string(),version:z.number().int().positive()}).strict(), frozenAt:z.string().datetime({offset:true}),
  sourceFingerprint:z.string().regex(/^[a-f0-9]{64}$/),criteriaFingerprint:z.string().regex(/^[a-f0-9]{64}$/),
  targets:z.array(z.object({targetKey:z.string().regex(/^target-[1-9]\d*$/),observationWindow:windowSchema,conditions:z.array(formalOutcomeConditionSchema).min(1).max(32),review:formalOutcomeReviewSchema,
    binding:z.object({trajectoryId:z.string(),trajectorySeed:z.number().int(),eventIds:z.array(z.string()).min(1).max(32),ruleKeys:z.array(z.string().nullable()).min(1).max(32)}).strict(),
  }).strict()).max(32),
}).strict();
const frameSchema = z.object({
  causalFingerprint:z.string(),policyFingerprint:z.string().optional(), inputSnapshot:initialWorldSourceSchema.extend({digitalLifeModel:digitalLifeModelSchema,activePathKey:z.string()}),
  sourceBoundary:z.object({updatedAt:z.string()}).passthrough(), trajectoryAnalysis:z.unknown(), events:z.array(z.unknown()),worldSnapshots:z.array(z.unknown()).length(3),
  claims:z.array(z.object({id:z.string(),clusterIds:z.array(z.string())}).passthrough()),defaultPlanningSnapshot:frozenDefaultPlanningEnvelopeSchema.optional(),
  forecastPersistenceHistory:z.array(z.object({streamId:z.string(),version:z.number(),artifact:z.object({value:z.object({lockedAt:z.string()}).passthrough()}).passthrough()}).passthrough()).length(1),
}).passthrough();

/** Deterministic replay of the existing producer and Core; it does not run a new simulation. */
function replayFrame(raw:unknown) {
  const frame=frameSchema.parse(raw),source=frame.inputSnapshot,model=source.digitalLifeModel;
  const analysis=frame.trajectoryAnalysis as BatchAnalysisV2;
  const sourceModel=buildDigitalLifeModel(source,model.rules);
  if(!sourceModel.ok||!same(sourceModel.model,model)||analysis.trajectories.length!==3)throw new Error("invalid_forecast_lock");
  const namespace=frame.policyFingerprint??frame.causalFingerprint;
  const rebuilt=buildFormalSandboxInitialWorld(source,model,source.activePathKey,namespace,frame.sourceBoundary.updatedAt,frame.defaultPlanningSnapshot);
  if(!rebuilt.worldResult.ok)throw new Error("invalid_forecast_lock");
  const initial=rebuilt.worldResult.world;
  if(!same(initial,analysis.spec.trajectoryTemplate.initialWorld)||!same(initial.realityBoundarySnapshot,frame.sourceBoundary))throw new Error("invalid_forecast_lock");
  const ids=createStableAgentWorldIdFactoryV2(`formal-${namespace}`), profile=source.realityProfileSnapshot.profile;
  const activeRules=model.rules.actions.filter(rule=>rule.pathKey===source.activePathKey);
  const bindings:DigitalLifeProposalBindings={
    agents:new Map(model.agents.map(a=>[a.key,ids("agent_definition",a.sourceAgentId) as WorldStateV2["agentDefinitions"][number]["id"]])),
    entities:new Map(model.agents.map(a=>[a.key,ids("world_entity",a.sourceAgentId) as WorldStateV2["entities"][number]["id"]])),
    relations:new Map(model.relationships.map(r=>[r.key,ids("world_relation",r.sourceEdgeId) as WorldStateV2["relations"][number]["id"]])),
    resources:new Map(profile.worldInputs.resources.map((r,i)=>[`resource-${i+1}`,ids("world_resource",r.key) as WorldStateV2["resources"][number]["id"]])),
    variables:new Map(initial.externalVariables.map(v=>[v.key,v.id])),
    evidence:new Map(model.agents.map(a=>[a.key,initial.realityBoundarySnapshot.evidenceLedger.items.find(e=>e.claimKey===`formal.agent.${Number(a.key.slice(7))}`)!.id])),
    assumptions:new Map(activeRules.map(r=>[r.key,initial.realityBoundarySnapshot.assumptionLedger.assumptions.find(a=>a.category===`digital_life_rule_${r.key}`)!.id])),
  };
  const self=model.agents.find(a=>source.activePathKey==="main"?a.role==="user_core":a.key===source.activePathKey);
  if(!self)throw new Error("invalid_forecast_lock");
  const planningWorldBinding=frame.defaultPlanningSnapshot?bindPlanningWorld(frame.defaultPlanningSnapshot,initial,`formal-${namespace}`,source.activePathKey,analysis.spec.trajectoryTemplate.startAt):undefined;
  const context={rules:activeRules,bindings,declaredResources:profile.worldInputs.resources,actorAgentId:bindings.agents.get(self.key)!,actorEntityId:bindings.entities.get(self.key)!,primaryEvidenceId:initial.realityBoundarySnapshot.evidenceLedger.items.find(e=>e.claimKey==="formal.seed.summary")!.id,assumptionByCategory:new Map(initial.realityBoundarySnapshot.assumptionLedger.assumptions.map(a=>[a.category,a.id])),planning:frame.defaultPlanningSnapshot,planningWorldBinding,pathKey:source.activePathKey};
  for(const [index,trajectory] of analysis.trajectories.entries()){
    const parsed=parseTrajectoryResultForFeatureV2(initial,trajectory,{seedContextId:analysis.spec.seedContextId,trajectorySeed:trajectory.trajectorySeed,policyId:analysis.spec.policyId,policyVersion:analysis.spec.policyVersion,trajectoryEngineVersion:analysis.spec.trajectoryEngineVersion,batchRunSpec:analysis.spec});
    if(!parsed.ok||!same(trajectory.finalWorld,frame.worldSnapshots[index]))throw new Error("invalid_forecast_lock");
    let world=structuredClone(initial);const rng=createSeededRngV2(trajectory.trajectorySeed);
    for(const step of trajectory.steps){
      const candidates=proposeSandboxCandidates(context,{world,tickIndex:step.tickIndex,occurredAt:step.occurredAt,namespace:`formal_${namespace}_${trajectory.trajectorySeed}`}).candidates;
      const event=trajectory.finalWorld.worldEvents.find(e=>e.id===step.worldEventId);
      if(!event){if(!step.termination||candidates.length)throw new Error("invalid_forecast_lock");continue;}
      if(!candidates.length)throw new Error("invalid_forecast_lock");
      const audit=selectSeededIndexV2(rng,candidates.length),proposal=candidates[audit.selectedIndex];
      if(!same(audit,step.rngAudit)||audit.selectedIndex!==step.selectedCandidateIndex||proposal.id!==event.proposalId)throw new Error("invalid_forecast_lock");
      const runtime={clock:()=>step.occurredAt,idFactory:createStableAgentWorldIdFactoryV2(`formal-${namespace}-${trajectory.trajectorySeed}`)};
      const approved=approveActionProposalV2(proposal,world,world.revision,runtime);
      if(!approved.ok)throw new Error("invalid_forecast_lock");
      const applied=applyWorldTransitionV2(world,approved.command,runtime);
      if(!applied.ok||!same(applied.event,event)||step.beforeRevision!==world.revision||step.afterRevision!==applied.world.revision)throw new Error("invalid_forecast_lock");
      world=applied.world;
    }
    if(!same(world,trajectory.finalWorld))throw new Error("invalid_forecast_lock");
  }
  const events=analysis.trajectories.flatMap(t=>t.finalWorld.worldEvents.map((event,tickIndex)=>({...event,branchId:t.trajectoryId,tickIndex})));
  if(!same(events,frame.events))throw new Error("invalid_forecast_lock");
  return {frame,analysis,initial,ids,self,events,activeRules};
}

/** Only selected events from one representative sample can become this bounded independent standard. */
export function buildRealityCriteriaV2(raw:unknown){
  const {frame,analysis,initial,ids,self,events,activeRules}=replayFrame(raw),model=frame.inputSnapshot.digitalLifeModel;
  const source=frame.inputSnapshot,record=frame.forecastPersistenceHistory[0];
  const targets:z.infer<typeof realityCriteriaV2Schema>["targets"]=[];
  for(const [claimIndex,claim] of frame.claims.entries()){
    const cluster=analysis.clusters.find(c=>c.clusterId===claim.clusterIds[0]);
    const trajectory=analysis.trajectories.find(t=>t.trajectoryId===cluster?.representativeTrajectoryId);
    if(!trajectory||!trajectory.finalWorld.worldEvents.length||source.activePathKey!=="main")continue;
    const selected=trajectory.finalWorld.worldEvents;
    const ruleFor=(e:WorldEventV2)=>activeRules.find(r=>e.proposalId.endsWith(`_${r.key}`));
    const pureResource=selected.every(e=>e.operation.actionType==="allocate_resource");
    const responseEvents=selected.filter(e=>e.operation.actionType==="update_relation_signal");
    const chainValid=!pureResource&&responseEvents.length>0&&selected.every((event,index)=>{
      const rule=ruleFor(event),op=event.operation;
      if(op.actionType==="request_information")return rule?.actorKey===self.key&&rule.operation.actionType==="request_information"&&model.agents.find(a=>a.key===(rule.operation.actionType==="request_information"?rule.operation.targetPersonKey:""))?.role==="npc";
      if(op.actionType==="update_relation_signal"){
        if(!rule||rule.when.kind!=="after_rule"||rule.operation.actionType!=="update_relation_signal")return false;
        const request=selected.slice(0,index).find(e=>ruleFor(e)?.key===(rule.when.kind==="after_rule"?rule.when.ruleKey:""));
        const requestRule=request?ruleFor(request):undefined,relation=model.relationships.find(r=>r.key===(rule.operation.actionType==="update_relation_signal"?rule.operation.relationKey:""));
        return !!request&&request.operation.actionType==="request_information"&&requestRule?.actorKey===self.key&&requestRule.operation.actionType==="request_information"&&requestRule.operation.targetPersonKey===rule.actorKey
          &&!!relation&&[relation.fromPersonKey,relation.toPersonKey].includes(self.key)&&[relation.fromPersonKey,relation.toPersonKey].includes(rule.actorKey)
          &&event.priorWorldEventIds.includes(request.id)&&Date.parse(event.createdAt)>Date.parse(request.createdAt);
      }
      if(op.actionType!=="allocate_resource")return false;
      // A later timestamp alone never establishes a causal edge.
      return !!rule&&rule.when.kind==="after_rule"&&responseEvents.some(response=>ruleFor(response)?.key===(rule.when.kind==="after_rule"?rule.when.ruleKey:"")&&selected.indexOf(response)<index&&event.priorWorldEventIds.includes(response.id));
    })&&selected.filter(e=>e.operation.actionType==="request_information").every(request=>responseEvents.filter(response=>ruleFor(response)?.when.kind==="after_rule"&&(ruleFor(response)!.when as {kind:"after_rule";ruleKey:string}).ruleKey===ruleFor(request)?.key&&response.priorWorldEventIds.includes(request.id)).length===1);
    if(!pureResource&&!chainValid)continue;
    const conditions:FormalOutcomeTarget["conditions"]=[],groups:z.infer<typeof formalOutcomeReviewSchema>["groups"]=[];
    let valid=true;
    for(const [eventIndex,event] of selected.entries()){
      const op=event.operation,rule=ruleFor(event),sequence=eventIndex+1,first=conditions.length;
      const actor=initial.agentDefinitions.find(a=>a.id===event.actorId),actorLabel=actor?.displayName??null;
      const resource=op.actionType==="allocate_resource"?initial.resources.find(r=>r.id===op.resourceId):undefined,resourceLabel=resource?.label??null;
      const metadata={actorLabel,resourceLabel,sequence};
      const add=(label:string,kind:FormalOutcomeTarget["conditions"][number]["kind"],expectedValue:FormalOutcomeTarget["conditions"][number]["expectedValue"],measurement:FormalOutcomeTarget["conditions"][number]["measurement"],requiresTime=false,correctable=false)=>conditions.push({key:`condition-${conditions.length+1}`,label,kind,expectedValue,measurement,requiresTime,correctable,ruleKey:correctable?rule?.key??null:null,...metadata});
      if(op.actionType==="allocate_resource"){
        const delta=event.deltas[0],selfId=ids("agent_definition",self.sourceAgentId),selfEntity=ids("world_entity",self.sourceAgentId);
        if(!resource||event.actorId!==selfId||resource.ownerEntityId!==selfEntity||resource.controllerAgentId!==selfId||event.eventType!==op.actionType||event.deltas.length!==1||delta.valueType!=="resource"||delta.path!==`resources.${op.resourceId}.available`||delta.before-delta.after!==op.amount){valid=false;break;}
        add(`第 ${sequence} 项：本人实际投入“${resource.label}”的数量`,"allocate_resource",op.amount,"operation",true,!!rule);
        add(`第 ${sequence} 项：投入前“${resource.label}”可用数量`,"allocate_resource",delta.before as number,"resource_before",true);
        add(`第 ${sequence} 项：投入后“${resource.label}”剩余数量`,"allocate_resource",delta.after as number,"resource_after",true);
        add(`第 ${sequence} 项：实际投入者是“${self.label}”本人`,"scope_confirmation",true,"actor_scope");
        add(`第 ${sequence} 项：实际投入的是“${resource.label}”，单位为“${resource.unit}”`,"scope_confirmation",true,"resource_scope");
      }else if(op.actionType==="request_information"){
        const requestRule=rule!;if(requestRule.operation.actionType!=="request_information")throw new Error("invalid_forecast_lock");
        const requestOperation=requestRule.operation,target=model.agents.find(a=>a.key===requestOperation.targetPersonKey)!;
        const response=responseEvents.find(e=>{const responseRule=ruleFor(e);return responseRule?.when.kind==="after_rule"&&responseRule.when.ruleKey===requestRule.key;})!;
        const responseOperation=ruleFor(response)!.operation;if(responseOperation.actionType!=="update_relation_signal")throw new Error("invalid_forecast_lock");
        const relation=model.relationships.find(r=>r.key===responseOperation.relationKey)!;
        add(`第 ${sequence} 项：本人已向“${target.label}”询问安排`,"request_information",true,"operation",true);
        add(`第 ${sequence} 项：实际询问者是“${self.label}”本人`,"scope_confirmation",true,"actor_scope");
        add(`第 ${sequence} 项：询问对象是“${target.label}”，关系为“${relation.label}”`,"scope_confirmation",true,"relationship_scope");
      }else if(op.actionType==="update_relation_signal"){
        const responseRule=rule!;if(responseRule.operation.actionType!=="update_relation_signal")throw new Error("invalid_forecast_lock");
        const responseOperation=responseRule.operation,relation=model.relationships.find(r=>r.key===responseOperation.relationKey)!,target=model.agents.find(a=>a.key===responseRule.actorKey)!;
        add(`第 ${sequence} 项：“${target.label}”询问后的可见回应（不代表私密意图）`,"update_relation_signal",op.signal,"operation",true,true);
        add(`第 ${sequence} 项：回应对象是“${target.label}”，关系为“${relation.label}”`,"scope_confirmation",true,"relationship_scope");
        add(`第 ${sequence} 项：本人直接看到或听到该对象对这次询问的回应`,"scope_confirmation",true,"response_source");
      }
      groups.push({key:`review-group-${groups.length+1}`,label:`第 ${sequence} 项：${op.actionType==="allocate_resource"?"本人资源投入":op.actionType==="request_information"?"本人询问":"对方可见回应"}`,conditionKeys:conditions.slice(first).map(c=>c.key)});
    }
    if(!valid)continue;
    const allocations=selected.filter(e=>e.operation.actionType==="allocate_resource");
    if(allocations.length){const key=`condition-${conditions.length+1}`;conditions.push({key,label:"整个观察窗口内，本人对以上指定资源的实际投入总次数",kind:"allocate_resource",expectedValue:allocations.length,ruleKey:null,correctable:false,requiresTime:false,measurement:"event_count",actorLabel:null,resourceLabel:null,sequence:0});groups.push({key:`review-group-${groups.length+1}`,label:"完整观察窗口",conditionKeys:[key]});}
    if(conditions.length>32||targets.length>=32)continue;
    targets.push({targetKey:`target-${claimIndex+1}`,observationWindow:{startAt:source.startedAt,horizonEnd:new Date(Date.parse(source.startedAt)+source.horizonDays*86_400_000).toISOString()},conditions,
      review:{kind:pureResource?"resource":"relationship_resource_chain",title:pureResource?"逐项核对本人资源变化":"逐项核对本人询问、可见回应与资源投入",stepKeys:selected.map(event=>`step-${events.findIndex(e=>e.id===event.id)+1}`),groups},
      binding:{trajectoryId:trajectory.trajectoryId,trajectorySeed:trajectory.trajectorySeed,eventIds:selected.map(e=>e.id),ruleKeys:selected.map(e=>ruleFor(e)?.key??null)}});
  }
  const unsigned={version:"formal-reality-criteria-v2" as const,ownerId:source.ownerId,seedContextId:source.seedContextId,pathKey:source.activePathKey,forecastLockReference:{streamId:record.streamId,version:record.version},frozenAt:record.artifact.value.lockedAt,sourceFingerprint:hash({input:source,boundary:frame.sourceBoundary,analysis:frame.trajectoryAnalysis,events:frame.events}),targets};
  return realityCriteriaV2Schema.parse({...unsigned,criteriaFingerprint:hash(unsigned)});
}
