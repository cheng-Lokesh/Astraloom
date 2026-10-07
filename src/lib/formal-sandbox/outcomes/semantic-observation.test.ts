import { expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "../runtime";
import { buildObservedOutcome, outcomeTargets } from "./core-adapter";

it("keeps mixed NPC observations and independently confirmed next-run corrections without scoring the cluster", async () => {
 const result=await buildFormalSandboxRunV2({...digitalLifeInput(),digitalLifeRules:digitalLifeRules()});
 expect(result.ok).toBe(true);if(!result.ok)return;
 const target=outcomeTargets(result.bundle,"2026-11-10T04:00:00.000Z",true)[0];
 expect(target.status).toBe("not_observable");
 expect(target.conditions.length).toBeGreaterThan(0);
 const observations=target.conditions.map(c=>({key:c.key,value:c.kind==="update_relation_signal"?"negative" as const:c.expectedValue,occurred_at:"2026-10-20T04:00:00.000Z"}));
 const built=await buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",{target_key:target.key,observed:"uncertain",observations,evidence_summary:"本人记录的询问后回应",uncertainty:"medium",confirmed_user_observation:true,correction:{rule_key:"rule-2",confirmed_for_next_run:true},idempotency_key:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"},"2026-11-10T04:00:00.000Z");
 expect(built.artifacts).toHaveLength(0);expect(built.correction?.nextValue).toBe("negative");
},60000);

it("compares independently frozen resource criteria without scoring an unobservable Core cluster",async()=>{
 const result=await buildFormalSandboxRunV2(digitalLifeInput());expect(result.ok).toBe(true);if(!result.ok)return;
 const target=outcomeTargets(result.bundle,"2026-11-10T04:00:00.000Z",true)[0];
 expect(target.status).toBe("not_observable");
 expect(target.conditions.some(c=>(c as {measurement?:string}).measurement==="resource_before")).toBe(true);
 expect(target.conditions.some(c=>(c as {measurement?:string}).measurement==="actor_scope")).toBe(true);
 const observations=target.conditions.map(c=>({key:c.key,value:c.expectedValue,...((c as {requiresTime?:boolean}).requiresTime?{occurred_at:"2026-10-20T04:00:00.000Z"}:{})}));
 const input={target_key:target.key,observed:"uncertain" as const,observations,evidence_summary:"本人核对了完整资源变化",uncertainty:"medium" as const,confirmed_user_observation:true as const,idempotency_key:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"};
 const built=await buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",input,"2026-11-10T04:00:00.000Z");
 expect(built.artifacts).toHaveLength(0);expect((built as unknown as {criteriaComparison:{status:string}}).criteriaComparison.status).toBe("matched");
 const actor=target.conditions.find(c=>(c as {measurement?:string}).measurement==="actor_scope")!;
 const changed=await buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",{...input,observations:observations.map(o=>o.key===actor.key?{...o,value:false}:o)},"2026-11-10T04:00:00.000Z");
 expect((changed as unknown as {criteriaComparison:{status:string}}).criteriaComparison.status).toBe("different");
 const orderChanged=observations.map(o=>{const c=target.conditions.find(c=>c.key===o.key)!;return c.requiresTime?{...o,occurred_at:c.sequence===1?"2026-10-22T04:00:00.000Z":"2026-10-20T04:00:00.000Z"}:o;});
 expect((await buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",{...input,observations:orderChanged},"2026-11-10T04:00:00.000Z")).criteriaComparison.status).toBe("different");
 expect((await buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",input,"2026-10-25T04:00:00.000Z")).criteriaComparison.status).toBe("unknown");
 const unknown=observations.map(o=>({key:o.key,value:null}));
 expect((await buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",{...input,observations:unknown},"2026-11-10T04:00:00.000Z")).criteriaComparison.status).toBe("unknown");
 const before=target.conditions.find(c=>c.measurement==="resource_before")!;
 expect((await buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",{...input,observations:observations.map(o=>o.key===before.key?{...o,value:1}:o)},"2026-11-10T04:00:00.000Z")).criteriaComparison.status).toBe("different");
 const realTimes=observations.map(o=>o.key===before.key?{...o,occurred_at:"2026-10-19T04:00:00.000Z"}:o);
 expect((await buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",{...input,observations:realTimes},"2026-11-10T04:00:00.000Z")).criteriaComparison.status).toBe("matched");
 const tampered=structuredClone(result.bundle);tampered.frozenRealityCriteria.targets[0].conditions[0].expectedValue=7;
 await expect(buildObservedOutcome(tampered,"2026-10-06T03:59:59.999Z",input,"2026-11-10T04:00:00.000Z")).rejects.toThrow("invalid_forecast_lock");
 await expect(buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",{...input,observations:observations.slice(0,1)},"2026-11-10T04:00:00.000Z")).rejects.toThrow("invalid_observation");
},60000);
