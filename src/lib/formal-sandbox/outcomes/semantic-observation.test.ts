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
 await expect(buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",{...input,observations:observations.slice(0,1)},"2026-11-10T04:00:00.000Z")).rejects.toThrow("invalid_observation");
},60000);
