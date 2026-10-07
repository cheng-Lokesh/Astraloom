import type { SupabaseClient } from "@supabase/supabase-js";
import { expect,it,vi } from "vitest";
import { digitalLifeInput,digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "../runtime";
import { outcomeTargets } from "./core-adapter";
import { saveFormalOutcome } from "./service.server";
it("validates every mixed-path durable forecast before append rather than only after a write",async()=>{
 const built=await buildFormalSandboxRunV2({...digitalLifeInput(),digitalLifeRules:digitalLifeRules()});expect(built.ok).toBe(true);if(!built.ok)return;
 const rpc=vi.fn().mockResolvedValue({data:[{idempotent:false}],error:null});
 const lock={history:built.bundle.forecastPersistenceHistory,stored_at:"2026-12-01T00:00:00.000Z",reality_criteria:built.bundle.frozenRealityCriteria};
 const service={rpc,from:(name:string)=>{const data=name==="simulations"?{result_bundle:built.bundle}:name==="formal_forecast_locks"?lock:null;const query={select:()=>query,eq:()=>query,order:()=>query,maybeSingle:async()=>({data,error:null}),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve(resolve({data:name==="formal_outcome_observations"?[]:data,error:null}))};return query;}} as unknown as SupabaseClient;
 const target=outcomeTargets(built.bundle,"2026-11-10T04:00:00.000Z",true)[0];
 await expect(saveFormalOutcome(service,digitalLifeInput().ownerId,"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",{target_key:target.key,observed:"uncertain",observations:target.conditions.map(c=>({key:c.key,value:null})),evidence_summary:"本人暂时无法完整核对",uncertainty:"high",confirmed_user_observation:true,idempotency_key:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"})).rejects.toThrow("invalid_forecast_lock");
 expect(rpc.mock.calls.length).toBe(0);
},60000);
