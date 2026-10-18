import { beforeAll, describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "../runtime";
import { buildFrozenRealityCriteria, buildFrozenRealityCriteriaV1, buildObservedOutcome, loadDurableForecast, outcomeTargets } from "./core-adapter";
import type { FormalOutcomeInput } from "./contracts";
import { observationNeedsTime } from "./observation-time";
import { formalOutcomeTargetSchema } from "./contracts";

const storedAt = "2026-10-06T03:59:59.999Z";
const afterWindow = "2026-11-10T04:00:00.000Z";
export function mixedRealityRules() {
  const rules = digitalLifeRules();
  return { ...rules, strategies: [], actions: [rules.actions[0], rules.actions[1], { ...rules.actions[0], key: "rule-3", when: { kind: "after_rule" as const, ruleKey: "rule-2" }, operation: { actionType: "allocate_resource" as const, resourceKey: "resource-1", amount: 2 } }] };
}
type RuntimeSuccess = Extract<Awaited<ReturnType<typeof buildFormalSandboxRunV2>>, { ok: true }>;
let mixed: RuntimeSuccess;
let resource: RuntimeSuccess;
beforeAll(async () => {
  const a = await buildFormalSandboxRunV2({ ...digitalLifeInput(), digitalLifeRules: mixedRealityRules() });
  const b = await buildFormalSandboxRunV2(digitalLifeInput());
  expect(a.ok).toBe(true); expect(b.ok).toBe(true);
  if (!a.ok || !b.ok) throw new Error("runtime fixture failed");
  mixed = a; resource = b;
}, 120_000);
function observationsFor(target: ReturnType<typeof outcomeTargets>[number]): FormalOutcomeInput {
  return { target_key: target.key, observed: "uncertain", evidence_summary: "本人逐项核对实际询问和可见回应", uncertainty: "medium", confirmed_user_observation: true, idempotency_key: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", observations: target.conditions.map(c => ({ key: c.key, value: c.expectedValue, ...(c.requiresTime ? { occurred_at: `2026-10-${String(15 + c.sequence).padStart(2, "0")}T04:00:00.000Z` } : {}) })) };
}
describe("independent reality criteria v2", () => {
  it("freezes an actual same-sample request, visible response and resource chain with safe review groups", () => {
    expect(mixed.bundle.frozenRealityCriteria.version).toBe("formal-reality-criteria-v2");
    const target = outcomeTargets(mixed.bundle, afterWindow, true)[0];
    expect(target).toMatchObject({ status: "not_observable", criteriaStatus: "available", criteriaVersion: "formal-reality-criteria-v2", review: { kind: "relationship_resource_chain" } });
    expect(target.conditions.map(c => c.measurement)).toEqual(expect.arrayContaining(["relationship_scope", "response_source", "resource_before", "resource_after", "actor_scope", "resource_scope"]));
    expect(target.conditions.length).toBeLessThanOrEqual(32);
    const review = (target as unknown as {review:{stepKeys:string[];groups:{conditionKeys:string[]}[]}}).review;
    expect(review.stepKeys).toHaveLength(3);
    expect(review.groups.flatMap(group => group.conditionKeys)).toEqual(target.conditions.map(c => c.key));
    for (const step of review.stepKeys) expect(mixed.bundle.events[Number(step.slice(5)) - 1]).toBeDefined();
  });
  it("compares a complete chain without producing Core scoring or calibration artifacts", async () => {
    const target = outcomeTargets(mixed.bundle, afterWindow, true)[0];
    const result = await buildObservedOutcome(mixed.bundle, storedAt, observationsFor(target), afterWindow);
    expect(result.criteriaComparison).toEqual({ status: "matched", differences: [] });
    expect(result.artifacts).toEqual([]); expect(result.calibration).toBeUndefined();
  });
  it("records false asking without an invented time and keeps partial differences while the window is open", async () => {
    const target = outcomeTargets(mixed.bundle, afterWindow, true)[0];
    const request = target.conditions.find(c => c.kind === "request_information" && c.measurement === "operation")!;
    const input = observationsFor(target);
    input.observations = input.observations.map(o => o.key === request.key ? { key:o.key,value:false } : { key:o.key,value:null });
    const result = await buildObservedOutcome(mixed.bundle, storedAt, input, "2026-10-25T04:00:00.000Z");
    expect(result.criteriaComparison).toEqual({ status: "unknown", differences: [request.key] });
  });
  it("requires asking, object/relationship scope and visible-source confirmations before a response correction", async () => {
    const target = outcomeTargets(mixed.bundle, afterWindow, true)[0];
    const response = target.conditions.find(c => c.kind === "update_relation_signal" && c.measurement === "operation")!;
    const request = target.conditions.find(c => c.kind === "request_information" && c.measurement === "operation")!;
    const input = observationsFor(target); input.correction = { rule_key: "rule-2", confirmed_for_next_run:true };
    input.observations = input.observations.map(o => o.key === response.key ? { ...o,value:"negative" } : o);
    expect((await buildObservedOutcome(mixed.bundle, storedAt, input, afterWindow)).correction?.nextValue).toBe("negative");
    const rejected = input.observations.map(o => o.key === request.key ? { key:o.key,value:false } : o);
    await expect(buildObservedOutcome(mixed.bundle, storedAt, { ...input, observations:rejected }, afterWindow)).rejects.toThrow("invalid_correction");
    for (const scope of target.conditions.filter(c => ["relationship_scope", "response_source"].includes(c.measurement))) {
      await expect(buildObservedOutcome(mixed.bundle, storedAt, { ...input, observations:input.observations.map(o => o.key === scope.key ? {...o,value:false} : o) }, afterWindow)).rejects.toThrow("invalid_correction");
    }
  });
  it("keeps pure resource comparison available in new v2 runs", async () => {
    expect(resource.bundle.frozenRealityCriteria.version).toBe("formal-reality-criteria-v2");
    const target = outcomeTargets(resource.bundle, afterWindow, true)[0];
    expect(target).toMatchObject({ criteriaStatus:"available", review:{kind:"resource"} });
    expect((await buildObservedOutcome(resource.bundle, storedAt, observationsFor(target), afterWindow)).criteriaComparison.status).toBe("matched");
  });
  it("retains unknown fields, detects reversed actual sequence and requires resource scope for corrections", async () => {
    const target=outcomeTargets(mixed.bundle,afterWindow,true)[0],input=observationsFor(target);
    const unknown=await buildObservedOutcome(mixed.bundle,storedAt,{...input,observations:input.observations.map(o=>({key:o.key,value:null}))},afterWindow);
    expect(unknown.criteriaComparison).toEqual({status:"unknown",differences:[]});
    const response=target.conditions.find(c=>c.kind==="update_relation_signal"&&c.measurement==="operation")!;
    const reverse=input.observations.map(o=>o.key===response.key?{...o,occurred_at:"2026-10-15T04:00:00.000Z"}:o);
    expect((await buildObservedOutcome(mixed.bundle,storedAt,{...input,observations:reverse},afterWindow)).criteriaComparison.differences).toContain(response.key);
    await expect(buildObservedOutcome(mixed.bundle,storedAt,{...input,observations:reverse,correction:{rule_key:"rule-2",confirmed_for_next_run:true}},afterWindow)).rejects.toThrow("invalid_correction");
    const allocation=target.conditions.find(c=>c.kind==="allocate_resource"&&c.measurement==="operation")!;
    const correction={...input,correction:{rule_key:"rule-3",confirmed_for_next_run:true as const},observations:input.observations.map(o=>o.key===allocation.key?{...o,value:1}:o)};
    expect((await buildObservedOutcome(mixed.bundle,storedAt,correction,afterWindow)).correction?.nextValue).toBe(1);
    for(const scope of target.conditions.filter(c=>c.sequence===allocation.sequence&&["actor_scope","resource_scope"].includes(c.measurement)))await expect(buildObservedOutcome(mixed.bundle,storedAt,{...correction,observations:correction.observations.map(o=>o.key===scope.key?{...o,value:null,occurred_at:undefined}:o)},afterWindow)).rejects.toThrow("invalid_correction");
    const equal=input.observations.map(o=>({...o,...(o.occurred_at?{occurred_at:"2026-10-20T04:00:00.000Z"}:{})}));
    expect((await buildObservedOutcome(mixed.bundle,storedAt,{...input,observations:equal},afterWindow)).criteriaComparison.status).toBe("matched");
  });
  it("does not turn a later declared resource rate into an explicit relationship causal chain", async () => {
    const rules=digitalLifeRules(),built=await buildFormalSandboxRunV2({...digitalLifeInput(),digitalLifeRules:{...rules,strategies:[],actions:rules.actions.slice(0,2)}});
    expect(built.ok).toBe(true);if(!built.ok)return;
    expect(built.bundle.events.some(e=>e.operation.actionType==="allocate_resource")).toBe(true);
    expect(built.bundle.frozenRealityCriteria.targets).toEqual([]);
    expect(outcomeTargets(built.bundle,afterWindow,true).every(t=>t.criteriaStatus==="not_recorded"&&!t.correctionAllowed)).toBe(true);
  });
  it("binds request scope to the response rule's exact relation when the same people have two relationships", async () => {
    const input=digitalLifeInput(),rules=mixedRealityRules();
    const actions=rules.actions.map(rule=>rule.key==="rule-2"?{...rule,operation:{actionType:"update_relation_signal",relationKey:"relation-2",signal:"positive"}}:rule);
    const built=await buildFormalSandboxRunV2({...input,edges:[{...input.edges[0],relationshipType:"旧的工作关系"},{...input.edges[0],id:"abababab-abab-4bab-8bab-abababababab",relationshipType:"本次共同学习关系"}],digitalLifeRules:{...rules,actions}});
    expect(built.ok).toBe(true);if(!built.ok)return;
    const scopes=outcomeTargets(built.bundle,afterWindow,true)[0].conditions.filter(c=>c.measurement==="relationship_scope");
    expect(scopes).toHaveLength(2);
    expect(scopes.every(c=>c.label.includes("本次共同学习关系")&&!c.label.includes("旧的工作关系"))).toBe(true);
  });
  it("keeps valid long source labels safe without truncating identities", async () => {
    const input=digitalLifeInput(),npcLabel="协作对象".repeat(45),relationLabel="共同安排".repeat(24);
    const built=await buildFormalSandboxRunV2({...input,agents:input.agents.map((a,i)=>i===1?{...a,displayName:npcLabel}:a),edges:[{...input.edges[0],relationshipType:relationLabel}],digitalLifeRules:mixedRealityRules()});
    expect(built.ok).toBe(true);if(!built.ok)return;
    expect(outcomeTargets(built.bundle,afterWindow,true)[0].conditions.filter(c=>c.measurement==="relationship_scope").every(c=>c.label.includes(npcLabel)&&c.label.includes(relationLabel))).toBe(true);
  });
  it.each(["binding","criteria","flat_sample","event_prior","rule_scope"])("rejects damaged %s instead of accepting a regenerated independent standard", async kind => {
    const clone=structuredClone(mixed.bundle);
    if(kind==="binding")clone.frozenRealityCriteria.targets[0].binding.trajectorySeed++;
    if(kind==="criteria")clone.frozenRealityCriteria.targets[0].conditions[0].expectedValue=false;
    if(kind==="flat_sample")clone.events[0].branchId=clone.trajectoryAnalysis.trajectories[1].trajectoryId;
    if(kind==="event_prior")clone.trajectoryAnalysis.trajectories[0].finalWorld.worldEvents[1].priorWorldEventIds=[];
    if(kind==="rule_scope")clone.inputSnapshot.digitalLifeModel.rules.actions[1].pathKey="person-3";
    await expect(loadDurableForecast(clone,storedAt)).rejects.toThrow();
    if(["flat_sample","event_prior","rule_scope"].includes(kind))expect(()=>buildFrozenRealityCriteria(clone)).toThrow();
  });
  it("reconstructs explicitly built legacy v1 in its original order and never backfills missing standards", async () => {
    const old={...resource.bundle,frozenRealityCriteria:buildFrozenRealityCriteriaV1(resource.bundle)};
    expect(old.frozenRealityCriteria.version).toBe("formal-reality-criteria-v1");
    expect(old.frozenRealityCriteria.targets[0].conditions.map(c=>c.expectedValue)).toEqual([1,8,7,true,true,1,7,6,true,true,1,6,5,true,true,3]);
    expect(old.frozenRealityCriteria.targets[0].conditions.map(c=>c.key)).toEqual(Array.from({length:16},(_,i)=>`condition-${i+1}`));
    await expect(loadDurableForecast(old,storedAt)).resolves.toBeDefined();
    const target=outcomeTargets(old,afterWindow,true)[0];expect(target.review).toBeUndefined();expect(target.criteriaVersion).toBeUndefined();
    expect((await buildObservedOutcome(old,storedAt,observationsFor(target),afterWindow)).criteriaComparison.status).toBe("matched");
    const absent={...mixed.bundle} as Record<string,unknown>;delete absent.frozenRealityCriteria;
    expect(outcomeTargets(absent,afterWindow,true).every(t=>t.criteriaStatus==="not_recorded"&&t.review===undefined)).toBe(true);
    await expect(loadDurableForecast(absent,storedAt)).resolves.toBeDefined();
  });
  it("shares browser time semantics while preserving legacy false-request rules", () => {
    const request={kind:"request_information",measurement:"operation",requiresTime:true};
    expect(observationNeedsTime(request,false,"formal-reality-criteria-v2")).toBe(false);
    expect(observationNeedsTime(request,true,"formal-reality-criteria-v2")).toBe(true);
    expect(observationNeedsTime(request,null,"formal-reality-criteria-v2")).toBe(false);
    expect(observationNeedsTime(request,false,"formal-reality-criteria-v1")).toBe(true);
    expect(observationNeedsTime(request,false)).toBe(true);
  });
  it("validates an actual mixed persisted JSON round trip before observation save and still rejects altered source values", async () => {
    const persisted=JSON.parse(JSON.stringify(mixed.bundle));
    const target=outcomeTargets(persisted,afterWindow,true)[0];
    expect((await buildObservedOutcome(persisted,storedAt,observationsFor(target),afterWindow)).criteriaComparison.status).toBe("matched");
    persisted.claims[0].evidenceEventIds=[];
    await expect(buildObservedOutcome(persisted,storedAt,observationsFor(target),afterWindow)).rejects.toThrow("invalid_forecast_lock");
  });
  it("validates a legacy v1 artifact produced by the unchanged old algorithm after real JSON storage",async()=>{
    const legacy={...resource.bundle,frozenRealityCriteria:buildFrozenRealityCriteriaV1(resource.bundle)};
    const persisted=JSON.parse(JSON.stringify(legacy)),original=JSON.stringify(persisted);
    const target=outcomeTargets(persisted,afterWindow,true)[0];
    expect((await buildObservedOutcome(persisted,storedAt,observationsFor(target),afterWindow)).criteriaComparison.status).toBe("matched");
    expect(JSON.stringify(persisted)).toBe(original);
    persisted.sourceBoundary.evidenceLedger.items[0].statement="改变了已冻结的事实";
    await expect(buildObservedOutcome(persisted,storedAt,observationsFor(target),afterWindow)).rejects.toThrow("invalid_forecast_lock");
  });
  it("projects exact correction prerequisites from the frozen causal rule rather than a nearest request",()=>{
    const target=outcomeTargets(mixed.bundle,afterWindow,true)[0];
    const request=target.conditions.find(c=>c.kind==="request_information"&&c.measurement==="operation")!,response=target.conditions.find(c=>c.ruleKey==="rule-2")!,allocation=target.conditions.find(c=>c.ruleKey==="rule-3")!;
    const requirement={ruleKey:"rule-2",conditionKey:response.key,requestConditionKey:request.key,requiredTrueConditionKeys:target.conditions.filter(c=>(c.sequence===request.sequence&&["actor_scope","relationship_scope"].includes(c.measurement))||(c.sequence===response.sequence&&["relationship_scope","response_source"].includes(c.measurement))).map(c=>c.key)};
    expect(target).toMatchObject({correctionRequirements:expect.arrayContaining([requirement,{ruleKey:"rule-3",conditionKey:allocation.key,requestConditionKey:null,requiredTrueConditionKeys:target.conditions.filter(c=>c.sequence===allocation.sequence&&["actor_scope","resource_scope"].includes(c.measurement)).map(c=>c.key)}])});
    expect(formalOutcomeTargetSchema.safeParse({...target,correctionRequirements:[{...requirement,requiredTrueConditionKeys:["condition-999"]}]}).success).toBe(false);
    expect(formalOutcomeTargetSchema.safeParse({...target,correctionRequirements:[{...requirement,requiredTrueConditionKeys:[requirement.requiredTrueConditionKeys[0],requirement.requiredTrueConditionKeys[0]]}]}).success).toBe(false);
    expect(formalOutcomeTargetSchema.safeParse({...target,correctionRequirements:[{...requirement,conditionKey:"condition-999"}]}).success).toBe(false);
    expect(formalOutcomeTargetSchema.safeParse({...target,correctionRequirements:[{...requirement,requestConditionKey:"condition-999"}]}).success).toBe(false);
    expect(mixed.bundle.frozenRealityCriteria.targets[0]).not.toHaveProperty("correctionRequirements");
  });
  it("binds actual interleaved ninety-day response corrections to their own earlier request",async()=>{
    const input=digitalLifeInput(),base=digitalLifeRules().actions[0];
    const actions=[
      {...base,key:"rule-1",when:{kind:"at_tick",tickIndex:0}},
      {...base,key:"rule-2",when:{kind:"at_tick",tickIndex:1},operation:{actionType:"request_information",targetPersonKey:"person-2",question:"再询问另一项共同安排"}},
      {...base,key:"rule-3",actorKey:"person-2",when:{kind:"after_rule",ruleKey:"rule-1"},operation:{actionType:"update_relation_signal",relationKey:"relation-1",signal:"positive"}},
      {...base,key:"rule-4",actorKey:"person-2",when:{kind:"after_rule",ruleKey:"rule-2"},operation:{actionType:"update_relation_signal",relationKey:"relation-1",signal:"neutral"}},
      {...base,key:"rule-5",when:{kind:"after_rule",ruleKey:"rule-3"},operation:{actionType:"allocate_resource",resourceKey:"resource-1",amount:2}},
    ];
    const built=await buildFormalSandboxRunV2({...input,horizonDays:90,realityProfileSnapshot:{...input.realityProfileSnapshot,profile:{...input.realityProfileSnapshot.profile,worldInputs:{...input.realityProfileSnapshot.profile.worldInputs,resources:input.realityProfileSnapshot.profile.worldInputs.resources.map(r=>({...r,usePerTick:null}))}}},digitalLifeRules:{...digitalLifeRules(),strategies:[],actions}});
    expect(built.ok).toBe(true);if(!built.ok)return;
    const target=outcomeTargets(built.bundle,"2027-01-10T04:00:00.000Z",true).find(t=>{const response=t.conditions.find(c=>c.ruleKey==="rule-3");return response?.sequence===4;});
    expect(target).toBeDefined();if(!target)return;
    const requestA=target.conditions.find(c=>c.kind==="request_information"&&c.sequence===1&&c.measurement==="operation")!,requestB=target.conditions.find(c=>c.kind==="request_information"&&c.sequence===2&&c.measurement==="operation")!,response=target.conditions.find(c=>c.ruleKey==="rule-3")!;
    expect(target.correctionRequirements?.find(r=>r.ruleKey==="rule-3")?.requestConditionKey).toBe(requestA.key);
    const observation=observationsFor(target);observation.correction={rule_key:"rule-3",confirmed_for_next_run:true};
    observation.observations=observation.observations.map(o=>o.key===response.key?{...o,value:"negative"}:o.key===requestB.key?{key:o.key,value:false}:o);
    expect((await buildObservedOutcome(built.bundle,storedAt,observation,"2027-01-10T04:00:00.000Z")).correction?.nextValue).toBe("negative");
    await expect(buildObservedOutcome(built.bundle,storedAt,{...observation,observations:observation.observations.map(o=>o.key===requestA.key?{key:o.key,value:null}:o.key===requestB.key?{...o,value:true,occurred_at:"2026-10-17T04:00:00.000Z"}:o)},"2027-01-10T04:00:00.000Z")).rejects.toThrow("invalid_correction");
  },60_000);
});
