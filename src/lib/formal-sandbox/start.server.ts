import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { persistFormalSandboxRun } from "./repository.server";
import { buildFormalSandboxRunV2 } from "./runtime";

const requestSchema = z.object({
  graph_snapshot_id: z.string().uuid(),
  idempotency_key: z.string().uuid(),
  horizon_days: z.union([z.literal(30), z.literal(90)]),
}).strict();
const graphSchema = z.object({ id:z.string().uuid(), user_id:z.string().uuid(), seed_context_id:z.string().uuid(), agent_snapshot_id:z.string().uuid(), graph_locked:z.literal(true), locked_at:z.string(), safety_level:z.enum(["safe","caution"]) }).passthrough();
const seedSchema = z.object({ id:z.string().uuid(), user_question:z.string(), raw_context:z.string(), safety_flags:z.unknown() }).passthrough();
const agentSchema = z.object({ id:z.string().uuid(), display_name:z.string().min(1), agent_type:z.string(), evidence_refs:z.array(z.string()).min(1) }).passthrough();
const edgeSchema = z.object({ id:z.string().uuid(), from_agent_id:z.string().uuid(), to_agent_id:z.string().uuid(), relationship_type:z.string().min(1), evidence_refs:z.array(z.string()).min(1) }).passthrough();

function stableSeed(graphId: string, key: string) {
  return (Number.parseInt(createHash("sha256").update(`${graphId}:${key}`).digest("hex").slice(0, 7), 16) % 1_999_999_999) + 1;
}

export async function startFormalSandboxRun(service: SupabaseClient, userId: string, rawRequest: unknown) {
  const request = requestSchema.safeParse(rawRequest);
  if (!request.success) return { ok:false as const,errorCode:"invalid_request" as const };
  try {
    const graphResult = await service.from("relation_graph_snapshots").select("id,user_id,seed_context_id,agent_snapshot_id,graph_locked,locked_at,safety_level").eq("id",request.data.graph_snapshot_id).eq("user_id",userId).eq("graph_locked",true).maybeSingle();
    const graph = graphSchema.safeParse(graphResult.data);
    if (graphResult.error) return { ok:false as const,errorCode:"persistence_failed" as const };
    if (!graph.success) return { ok:false as const,errorCode:"graph_not_found" as const };
    const [seedResult,agentsResult,edgesResult] = await Promise.all([
      service.from("seed_contexts").select("id,user_question,raw_context,safety_flags").eq("id",graph.data.seed_context_id).eq("user_id",userId).eq("status","submitted").maybeSingle(),
      service.from("agent_profiles").select("id,display_name,agent_type,evidence_refs").eq("snapshot_id",graph.data.agent_snapshot_id).eq("user_id",userId).order("id"),
      service.from("relation_edges").select("id,from_agent_id,to_agent_id,relationship_type,evidence_refs").eq("graph_snapshot_id",graph.data.id).eq("user_id",userId).order("id"),
    ]);
    if (seedResult.error || agentsResult.error || edgesResult.error) return { ok:false as const,errorCode:"persistence_failed" as const };
    const seed = seedSchema.safeParse(seedResult.data);
    const agents = z.array(agentSchema).min(1).safeParse(agentsResult.data);
    const edges = z.array(edgeSchema).min(1).safeParse(edgesResult.data);
    if (!seed.success || !agents.success || !edges.success) return { ok:false as const,errorCode:"incomplete_object_chain" as const };
    const built = await buildFormalSandboxRunV2({
      ownerId:userId,
      seedContextId:seed.data.id,
      graphSnapshotId:graph.data.id,
      agentSnapshotId:graph.data.agent_snapshot_id,
      horizonDays:request.data.horizon_days,
      deterministicSeed:stableSeed(graph.data.id,request.data.idempotency_key),
      startedAt:new Date(graph.data.locked_at).toISOString(),
      seedSummary:[seed.data.user_question,seed.data.raw_context].filter(Boolean).join(" ").slice(0,4000),
      agents:agents.data.map((item)=>({id:item.id,displayName:item.display_name,actorType:item.agent_type==="user_core"?"self" as const:"third_party" as const,evidenceRefs:item.evidence_refs})),
      edges:edges.data.map((item)=>({id:item.id,fromAgentId:item.from_agent_id,toAgentId:item.to_agent_id,relationshipType:item.relationship_type,evidenceRefs:item.evidence_refs})),
      safetyLevel:graph.data.safety_level,
      symbolicLens:{mode:"bounded_fusion",summary:"Symbolic context is optional framing and does not alter causal claims."},
      calibrationSnapshot:{source:"none",signals:[]},
    });
    if (!built.ok) return built;
    return persistFormalSandboxRun(service,{userId,graphSnapshotId:graph.data.id,idempotencyKey:request.data.idempotency_key,horizonDays:request.data.horizon_days,bundle:built.bundle});
  } catch {
    return { ok:false as const,errorCode:"persistence_failed" as const };
  }
}
