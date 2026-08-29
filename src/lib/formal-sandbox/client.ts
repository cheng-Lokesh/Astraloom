import { z } from "zod";

const failure=z.object({ok:z.literal(false),error_code:z.string(),trace_id:z.string()}).passthrough();
const run=z.object({id:z.string().uuid(),status:z.string(),graph_snapshot_id:z.string().uuid().nullable().optional(),time_horizon:z.enum(["30_days","90_days"]).optional(),completed_at:z.string().nullable().optional()}).passthrough();
const startSuccess=z.object({ok:z.literal(true),idempotent:z.boolean(),run}).passthrough();
const statusSuccess=z.object({ok:z.literal(true),run}).passthrough();
const resultSuccess=z.object({ok:z.literal(true),run_id:z.string().uuid(),completed_at:z.string().nullable(),bundle:z.record(z.string(),z.unknown())}).passthrough();
const historySuccess=z.object({ok:z.literal(true),items:z.array(run),next_cursor:z.string().nullable()}).passthrough();
const feedbackSuccess=z.object({ok:z.literal(true),idempotent:z.boolean(),feedback:z.record(z.string(),z.unknown())}).passthrough();
type Fetcher=typeof fetch;
async function read<T>(response:Response,schema:z.ZodType<T>){const json=await response.json().catch(()=>null);const failed=failure.safeParse(json);if(!response.ok){return{ok:false as const,status:response.status,errorCode:failed.success?failed.data.error_code:"request_failed"}}const parsed=schema.safeParse(json);return parsed.success?{ok:true as const,data:parsed.data}:{ok:false as const,status:500,errorCode:"invalid_response"}}
export function createFormalSandboxClient(fetcher:Fetcher=fetch){return{
  start:async(input:{graphSnapshotId:string;idempotencyKey:string;horizonDays:30|90})=>read(await fetcher("/api/sandbox/runs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({graph_snapshot_id:input.graphSnapshotId,idempotency_key:input.idempotencyKey,horizon_days:input.horizonDays})}),startSuccess),
  status:async(runId:string)=>read(await fetcher(`/api/sandbox/runs/${encodeURIComponent(runId)}`,{cache:"no-store"}),statusSuccess),
  result:async(runId:string)=>read(await fetcher(`/api/sandbox/runs/${encodeURIComponent(runId)}/result`,{cache:"no-store"}),resultSuccess),
  history:async(limit=20,before?:string)=>read(await fetcher(`/api/sandbox/runs?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:""}`,{cache:"no-store"}),historySuccess),
  feedback:async(runId:string,input:{rating:"useful"|"mixed"|"off";comment:string;idempotencyKey:string})=>read(await fetcher(`/api/sandbox/runs/${encodeURIComponent(runId)}/feedback`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({rating:input.rating,comment:input.comment,idempotency_key:input.idempotencyKey})}),feedbackSuccess),
}}
