import { beforeEach,describe,expect,it,vi } from "vitest";

const state=vi.hoisted(()=>({client:null as unknown,service:vi.fn(),start:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseServerClient:async()=>state.client}));
vi.mock("@/lib/supabase/service-role.server",()=>({getServiceRoleSupabaseClient:()=>state.service()}));
vi.mock("@/lib/formal-sandbox/start.server",()=>({startFormalSandboxRun:(...args:unknown[])=>state.start(...args)}));

import { GET as history,POST as start } from "./route";
import { GET as status } from "./[runId]/route";
import { GET as result } from "./[runId]/result/route";
import { POST as feedback } from "./[runId]/feedback/route";

const runId="11111111-1111-4111-8111-111111111111";
const userId="22222222-2222-4222-8222-222222222222";
const context={params:Promise.resolve({runId})};
function authClient(user:string|null,from?:()=>unknown,rpc?:()=>unknown){return{auth:{getUser:vi.fn().mockResolvedValue({data:{user:user?{id:user}:null}})},from:from??vi.fn(),rpc:rpc??vi.fn()}}
function query(resultValue:Record<string,unknown>,operations?:string[]){const value={...resultValue};type Builder={select:()=>Builder;eq:(column:string,value:unknown)=>Builder;order:(column:string)=>Builder;limit:(value:number)=>Builder;lt:()=>Builder;or:()=>Builder;maybeSingle:()=>Promise<Record<string,unknown>>;then:PromiseLike<Record<string,unknown>>["then"]};const builder={} as Builder;builder.select=()=>builder;builder.eq=(column,value)=>{operations?.push(`eq:${column}:${String(value)}`);return builder};builder.order=(column)=>{operations?.push(`order:${column}`);return builder};builder.limit=(value)=>{operations?.push(`limit:${value}`);return builder};builder.lt=()=>builder;builder.or=()=>builder;builder.maybeSingle=async()=>value;builder.then=(resolve,reject)=>Promise.resolve(value).then(resolve,reject);return builder}

describe("formal sandbox route contracts",()=>{
  beforeEach(()=>{state.start.mockReset();state.service.mockReset().mockReturnValue({});state.client=authClient(null)});
  it("returns the same non-leaking 401 contract on every account route",async()=>{
    const json=new Request("http://local/api/sandbox/runs",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
    const responses=await Promise.all([start(json),history(new Request("http://local/api/sandbox/runs")),status(new Request("http://local"),context),result(new Request("http://local"),context),feedback(json,context)]);
    expect(responses.map(item=>item.status)).toEqual([401,401,401,401,401]);
    for(const response of responses)expect(await response.json()).toEqual(expect.objectContaining({ok:false,error_code:"unauthenticated",trace_id:expect.any(String)}));
    expect(state.service).not.toHaveBeenCalled();
    expect(state.start).not.toHaveBeenCalled();
  });
  it("validates Start input and maps safety refusal to 403",async()=>{
    state.client=authClient(userId);
    const invalid=await start(new Request("http://local",{method:"POST",headers:{"content-type":"application/json"},body:"{}"}));
    expect(invalid.status).toBe(422);
    state.start.mockResolvedValue({ok:false,errorCode:"safety_blocked"});
    const valid=await start(new Request("http://local",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({graph_snapshot_id:runId,idempotency_key:"33333333-3333-4333-8333-333333333333",horizon_days:30})}));
    expect(valid.status).toBe(403);
  });
  it("gates the server-only writer on cookie identity and rejects a body-supplied owner",async()=>{
    const serviceClient={serverWriter:true};
    const input={graph_snapshot_id:runId,idempotency_key:"33333333-3333-4333-8333-333333333333",horizon_days:30};
    state.client=authClient(userId);
    state.service.mockReturnValue(serviceClient);
    state.start.mockResolvedValue({ok:true,idempotent:false,run:{id:runId,status:"completed",graph_snapshot_id:runId,time_horizon:"30_days"}});

    const response=await start(new Request("http://local/api/sandbox/runs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input)}));

    expect(response.status).toBe(201);
    expect(state.service).toHaveBeenCalledOnce();
    expect(state.start).toHaveBeenCalledOnce();
    expect(state.start).toHaveBeenCalledWith(serviceClient,userId,input);

    const forgedOwner=await start(new Request("http://local/api/sandbox/runs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...input,user_id:"99999999-9999-4999-8999-999999999999"})}));

    expect(forgedOwner.status).toBe(422);
    expect(state.service).toHaveBeenCalledOnce();
    expect(state.start).toHaveBeenCalledOnce();
  });
  it("hides a missing or foreign Run behind the same 404",async()=>{
    state.client=authClient(userId,()=>query({data:null,error:null}));
    const response=await status(new Request("http://local"),context);
    expect(response.status).toBe(404);expect(await response.json()).toEqual(expect.objectContaining({error_code:"run_not_found"}));
  });
  it.each(["draft","queued","running","blocked","failed"])("returns 409 from Result until a persisted Bundle is completed (%s)",async(statusValue)=>{
    state.client=authClient(userId,()=>query({data:{id:runId,status:statusValue,result_bundle:null},error:null}));
    const response=await result(new Request("http://local"),context);
    expect(response.status).toBe(409);expect(await response.json()).toEqual(expect.objectContaining({error_code:"run_not_completed"}));
  });
  it("returns only a validated safe projection for a completed Result",async()=>{
    const unknown={value:"",classification:"unknown",evidenceSummary:"明确未知"};
    const bundle={inputSnapshot:{ownerId:userId,seedContextId:"33333333-3333-4333-8333-333333333333",graphSnapshotId:"44444444-4444-4444-8444-444444444444",agentSnapshotId:"55555555-5555-4555-8555-555555555555",seedSummary:"PRIVATE_RAW_SCENARIO_WITH_SECRET",realityProfileSnapshot:{ownerId:userId,seedContextId:"33333333-3333-4333-8333-333333333333",profileId:"66666666-6666-4666-8666-666666666666",revision:0,profile:{lifeClimate:unknown,resources:unknown,constraints:unknown,goals:[unknown],values:[unknown],lifeThemes:[unknown],pressures:[unknown],externalVariables:[unknown],revision:0}},agents:[{id:"agent_internal",displayName:"Scenario owner",actorType:"self",evidenceRefs:["seed"]}],edges:[]},sourceBoundary:{evidenceLedger:{items:[{id:"real_internal",statement:"PRIVATE_RAW_SCENARIO_WITH_SECRET",claimKey:"formal.seed.summary",privateRef:"seed-private-ref-marker",sourceKind:"user_statement",sourceTier:"tier_1_user_confirmed",verificationStatus:"user_confirmed",provenance:[],limitations:[]}]},assumptionLedger:{assumptions:[]}},events:[{id:"world_event_v2_one",eventType:"record_observation",evidenceClass:"world_transition_simulation_evidence",causalRealEvidenceIds:["real_internal"],causalAssumptionIds:[]}],claims:[{id:"claim_v2_one",claimType:"scenario_frequency",statement:"A conditional signal.",uncertaintyStatement:"Not a probability.",simulationEventIds:["world_event_v2_one"]}],report:{claimIds:["claim_v2_one"]}};
    state.client=authClient(userId,()=>query({data:{id:runId,status:"completed",result_bundle:bundle,completed_at:"2026-09-08T00:00:00.000Z"},error:null}));
    const response=await result(new Request("http://local"),context);const body=await response.json();
    expect(response.status).toBe(200);expect(body).toEqual(expect.objectContaining({ok:true,projection:expect.objectContaining({claims:[expect.objectContaining({key:"claim-1",stepKeys:["step-1"]})],realityProfile:{status:"frozen",revision:0,facts:[],assumptions:[],unknowns:[expect.objectContaining({label:"人生气候"}),expect.objectContaining({label:"资源"}),expect.objectContaining({label:"约束"}),expect.any(Object),expect.any(Object),expect.any(Object),expect.any(Object),expect.any(Object)],structuredResources:[],structuredConstraints:[],worldVariables:[]}})}));expect(body).not.toHaveProperty("run_id");
    expect(body.projection.facts).toEqual([{key:"fact-1",statement:"本次运行使用已提交的 Seed 作为 Reality evidence；情境原文未展示。",boundary:"user_provided_fact"}]);
    expect(JSON.stringify(body)).not.toMatch(/agent_internal|real_internal|world_event_v2|claim_v2|result_bundle|PRIVATE_RAW_SCENARIO_WITH_SECRET|seed-private-ref-marker|66666666-6666-4666-8666-666666666666/i);
  });
  it("paginates History in descending order with an opaque timestamp cursor",async()=>{
    const items=[{id:runId,created_at:"2026-08-30T02:00:00.000Z"},{id:"33333333-3333-4333-8333-333333333333",created_at:"2026-08-30T01:00:00.000Z"}];
    state.client=authClient(userId,()=>query({data:items,error:null}));
    const response=await history(new Request("http://local/api/sandbox/runs?limit=1"));const body=await response.json();
    expect(response.status).toBe(200);expect(body.items).toEqual([items[0]]);expect(JSON.parse(Buffer.from(body.next_cursor,"base64url").toString("utf8"))).toEqual([items[0].created_at,items[0].id]);
  });
  it("filters History to completed Runs in the database before applying the limit-plus-one page boundary",async()=>{
    const operations:string[]=[];
    state.client=authClient(userId,()=>query({data:[],error:null},operations));

    const response=await history(new Request("http://local/api/sandbox/runs?limit=1"));

    expect(response.status).toBe(200);
    expect(operations).toContain("eq:status:completed");
    expect(operations.indexOf("eq:status:completed")).toBeLessThan(operations.indexOf("limit:2"));
  });
  it("accepts the History horizon filter and applies it to the owner-scoped query",async()=>{
    const operations:string[]=[];
    state.client=authClient(userId,()=>query({data:[],error:null},operations));

    const response=await history(new Request("http://local/api/sandbox/runs?horizon=30_days"));

    expect(response.status).toBe(200);
    expect(operations).toContain("eq:time_horizon:30_days");
  });
  it("preserves append-only feedback idempotency and stable 500 errors",async()=>{
    const rpc=vi.fn().mockResolvedValueOnce({data:[{idempotent:true,feedback:{id:runId}}],error:null}).mockResolvedValueOnce({data:null,error:{message:"private sql detail"}});
    state.client=authClient(userId,undefined,rpc);
    const request=()=>new Request("http://local",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({rating:"useful",comment:"clear",idempotency_key:"33333333-3333-4333-8333-333333333333"})});
    const replay=await feedback(request(),context);expect(replay.status).toBe(200);expect(await replay.json()).toEqual(expect.objectContaining({idempotent:true}));
    const failed=await feedback(request(),context);expect(failed.status).toBe(500);expect(await failed.text()).not.toContain("private sql detail");
  });
  it("stores targeted feedback by a safe ordinal key and never returns database identifiers",async()=>{
    const rpc=vi.fn().mockResolvedValue({data:[{idempotent:false,feedback:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",run_id:runId,target_id:"claim_v2_m1_fixture",target_type:"claim",target_key:"claim-1",rating:"off",created_at:"2026-09-28T00:00:00.000Z"}}],error:null});
    state.client=authClient(userId,undefined,rpc);
    const response=await feedback(new Request("http://local",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({target_type:"claim",target_key:"claim-1",rating:"off",comment:"The evidence does not support this conclusion.",idempotency_key:"33333333-3333-4333-8333-333333333333"})}),context);
    const body=await response.json();

    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("append_account_sandbox_feedback_m2",{
      p_run_id:runId,
      p_target_type:"claim",
      p_target_key:"claim-1",
      p_rating:"off",
      p_comment:"The evidence does not support this conclusion.",
      p_idempotency_key:"33333333-3333-4333-8333-333333333333",
    });
    expect(body.feedback).toEqual(expect.objectContaining({target_type:"claim",target_key:"claim-1",rating:"off"}));
    expect(JSON.stringify(body)).not.toContain(runId);
    expect(JSON.stringify(body)).not.toContain("claim_v2_m1_fixture");
    expect(body.feedback).not.toHaveProperty("id");
    expect(body.feedback).not.toHaveProperty("run_id");
    expect(body.feedback).not.toHaveProperty("target_id");
  });
  it.each([
    {target_type:"claim",target_key:"33333333-3333-4333-8333-333333333333",rating:"off"},
    {target_type:"overall",target_key:"claim-1",rating:"useful"},
    {target_type:"claim",target_key:"claim-1",rating:"useful"},
    {target_type:"strategy",target_key:"strategy-1",rating:"useful"},
  ])("rejects unsupported or identifier-bearing targeted feedback before writing (%o)",async(input)=>{
    const rpc=vi.fn();state.client=authClient(userId,undefined,rpc);
    const response=await feedback(new Request("http://local",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...input,comment:"",idempotency_key:"33333333-3333-4333-8333-333333333333"})}),context);
    expect(response.status).toBe(422);expect(rpc).not.toHaveBeenCalled();
  });
});
