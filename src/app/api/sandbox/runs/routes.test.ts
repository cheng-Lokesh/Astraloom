import { beforeEach,describe,expect,it,vi } from "vitest";

const state=vi.hoisted(()=>({client:null as unknown,service:null as unknown,start:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseServerClient:async()=>state.client}));
vi.mock("@/lib/supabase/service-role.server",()=>({getServiceRoleSupabaseClient:()=>state.service}));
vi.mock("@/lib/formal-sandbox/start.server",()=>({startFormalSandboxRun:(...args:unknown[])=>state.start(...args)}));

import { GET as history,POST as start } from "./route";
import { GET as status } from "./[runId]/route";
import { GET as result } from "./[runId]/result/route";
import { POST as feedback } from "./[runId]/feedback/route";

const runId="11111111-1111-4111-8111-111111111111";
const userId="22222222-2222-4222-8222-222222222222";
const context={params:Promise.resolve({runId})};
function authClient(user:string|null,from?:()=>unknown,rpc?:()=>unknown){return{auth:{getUser:vi.fn().mockResolvedValue({data:{user:user?{id:user}:null}})},from:from??vi.fn(),rpc:rpc??vi.fn()}}
function query(resultValue:Record<string,unknown>){const value={...resultValue};type Builder={select:()=>Builder;eq:()=>Builder;order:()=>Builder;limit:()=>Builder;lt:()=>Builder;or:()=>Builder;maybeSingle:()=>Promise<Record<string,unknown>>;then:PromiseLike<Record<string,unknown>>["then"]};const builder={} as Builder;builder.select=()=>builder;builder.eq=()=>builder;builder.order=()=>builder;builder.limit=()=>builder;builder.lt=()=>builder;builder.or=()=>builder;builder.maybeSingle=async()=>value;builder.then=(resolve,reject)=>Promise.resolve(value).then(resolve,reject);return builder}

describe("formal sandbox route contracts",()=>{
  beforeEach(()=>{state.start.mockReset();state.service={};state.client=authClient(null)});
  it("returns the same non-leaking 401 contract on every account route",async()=>{
    const json=new Request("http://local/api/sandbox/runs",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
    const responses=await Promise.all([start(json),history(new Request("http://local/api/sandbox/runs")),status(new Request("http://local"),context),result(new Request("http://local"),context),feedback(json,context)]);
    expect(responses.map(item=>item.status)).toEqual([401,401,401,401,401]);
    for(const response of responses)expect(await response.json()).toEqual(expect.objectContaining({ok:false,error_code:"unauthenticated",trace_id:expect.any(String)}));
  });
  it("validates Start input and maps safety refusal to 403",async()=>{
    state.client=authClient(userId);state.service={};
    const invalid=await start(new Request("http://local",{method:"POST",headers:{"content-type":"application/json"},body:"{}"}));
    expect(invalid.status).toBe(422);
    state.start.mockResolvedValue({ok:false,errorCode:"safety_blocked"});
    const valid=await start(new Request("http://local",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({graph_snapshot_id:runId,idempotency_key:"33333333-3333-4333-8333-333333333333",horizon_days:30})}));
    expect(valid.status).toBe(403);
  });
  it("hides a missing or foreign Run behind the same 404",async()=>{
    state.client=authClient(userId,()=>query({data:null,error:null}));
    const response=await status(new Request("http://local"),context);
    expect(response.status).toBe(404);expect(await response.json()).toEqual(expect.objectContaining({error_code:"run_not_found"}));
  });
  it("returns 409 until a persisted Bundle is completed",async()=>{
    state.client=authClient(userId,()=>query({data:{id:runId,status:"running",result_bundle:null},error:null}));
    const response=await result(new Request("http://local"),context);
    expect(response.status).toBe(409);expect(await response.json()).toEqual(expect.objectContaining({error_code:"run_not_completed"}));
  });
  it("paginates History in descending order with an opaque timestamp cursor",async()=>{
    const items=[{id:runId,created_at:"2026-08-30T02:00:00.000Z"},{id:"33333333-3333-4333-8333-333333333333",created_at:"2026-08-30T01:00:00.000Z"}];
    state.client=authClient(userId,()=>query({data:items,error:null}));
    const response=await history(new Request("http://local/api/sandbox/runs?limit=1"));const body=await response.json();
    expect(response.status).toBe(200);expect(body.items).toEqual([items[0]]);expect(JSON.parse(Buffer.from(body.next_cursor,"base64url").toString("utf8"))).toEqual([items[0].created_at,items[0].id]);
  });
  it("preserves append-only feedback idempotency and stable 500 errors",async()=>{
    const rpc=vi.fn().mockResolvedValueOnce({data:[{idempotent:true,feedback:{id:runId}}],error:null}).mockResolvedValueOnce({data:null,error:{message:"private sql detail"}});
    state.client=authClient(userId,undefined,rpc);
    const request=()=>new Request("http://local",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({rating:"useful",comment:"clear",idempotency_key:"33333333-3333-4333-8333-333333333333"})});
    const replay=await feedback(request(),context);expect(replay.status).toBe(200);expect(await replay.json()).toEqual(expect.objectContaining({idempotent:true}));
    const failed=await feedback(request(),context);expect(failed.status).toBe(500);expect(await failed.text()).not.toContain("private sql detail");
  });
});
