import { beforeEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({getUser:vi.fn(),service:vi.fn(),save:vi.fn(),read:vi.fn(),context:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseServerClient:async()=>({auth:{getUser:mocks.getUser}})}));
vi.mock("@/lib/supabase/service-role.server",()=>({getServiceRoleSupabaseClient:mocks.service}));
vi.mock("./service.server",()=>({saveFormalOutcome:mocks.save,readFormalOutcomes:mocks.read,readFormalCalibrationContext:mocks.context}));
import { outcomesHttp } from "./http.server";
const run="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",owner="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const input={target_key:"target-1",observed:"uncertain",observations:[],evidence_summary:"本人暂未确定",uncertainty:"high",confirmed_user_observation:true,idempotency_key:"cccccccc-cccc-4ccc-8ccc-cccccccccccc"};
const request=()=>new Request("https://example.test/outcomes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input)});
beforeEach(()=>{vi.clearAllMocks();mocks.getUser.mockResolvedValue({data:{user:{id:owner,is_anonymous:false}},error:null});mocks.service.mockReturnValue({});});
it("rejects missing and anonymous verified identities before trusted access",async()=>{
 for(const user of [null,{id:owner,is_anonymous:true}]){
  mocks.getUser.mockResolvedValue({data:{user},error:null});
  const result=await outcomesHttp(request(),run,true);
  expect(result.status).toBe(401);expect(result.headers.get("cache-control")).toBe("no-store");
 }
 expect(mocks.service.mock.calls.length).toBe(0);expect(mocks.save.mock.calls.length).toBe(0);
});
it("binds the verified owner and returns a known window conflict without raw details",async()=>{
 mocks.save.mockRejectedValue(new Error("observation_window_open"));
 const result=await outcomesHttp(request(),run,true),body=await result.json();
 expect(result.status).toBe(409);expect(body.error_code).toBe("observation_window_open");
 expect(mocks.save.mock.calls[0][1]===owner&&mocks.save.mock.calls[0][2]===run).toBe(true);
});
it("sanitizes unknown persistence errors and rejects malformed input before mutation",async()=>{
 mocks.save.mockRejectedValue(new Error("private internal database detail"));
 const failed=await outcomesHttp(request(),run,true);
 expect(failed.status).toBe(500);expect((await failed.json()).error_code).toBe("persistence_failed");
 vi.clearAllMocks();
 const invalid=await outcomesHttp(new Request("https://example.test/outcomes",{method:"POST",headers:{"content-type":"application/json"},body:'{}'}),run,true);
 expect(invalid.status).toBe(422);expect(mocks.save.mock.calls.length).toBe(0);
});
