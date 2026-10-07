import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createEmptyRealityProfileDraft, realityProfileDraftFromDatabaseRow } from "@/lib/reality-profile/profile";
import { persistFormalSandboxRun } from "./repository.server";
import { buildFormalSandboxRunV2 } from "./runtime";
import { formalSandboxStartRequestSchema } from "./start-request";
import { parseFrozenSymbolicLens } from "./symbolic-lens";

const requestSchema = formalSandboxStartRequestSchema;
const graphSchema = z.object({ id:z.string().uuid(), user_id:z.string().uuid(), seed_context_id:z.string().uuid(), agent_snapshot_id:z.string().uuid(), graph_locked:z.literal(true), locked_at:z.string(), safety_level:z.enum(["safe","caution"]) }).passthrough();
const seedSchema = z.object({ id:z.string().uuid(), user_question:z.string(), raw_context:z.string(), safety_flags:z.unknown() }).passthrough();
const profileIdentitySchema = z.object({ id:z.string().uuid(), user_id:z.string().uuid(), seed_context_id:z.string().uuid() }).passthrough();
const agentSchema = z.object({ id:z.string().uuid(), display_name:z.string().min(1), agent_type:z.enum(["user_core", "user_variant", "npc", "group"]), evidence_refs:z.array(z.string()).min(1) }).passthrough();
const edgeSchema = z.object({ id:z.string().uuid(), from_agent_id:z.string().uuid(), to_agent_id:z.string().uuid(), relationship_type:z.string().min(1), evidence_refs:z.array(z.string()).min(1) }).passthrough();
const reservationSchema = z.object({
  accepted_at: z.string().refine(value => Number.isFinite(Date.parse(value))),
  simulation_start_at: z.string().refine(value => Number.isFinite(Date.parse(value))),
  frozen_source_input: z.record(z.string(), z.unknown()).nullable(),
  run: z.object({ id:z.string().uuid(), status:z.literal("completed"), graph_snapshot_id:z.string().uuid(), time_horizon:z.enum(["30_days", "90_days"]) }).passthrough().nullable(),
}).strict();
const reservationErrors = new Set(["unauthenticated", "invalid_request", "graph_not_found", "seed_not_found", "safety_blocked", "incomplete_object_chain", "idempotency_key_content_conflict", "reservation_expired", "invalid_correction", "current_graph_required"]);

function stableSeed(graphId: string, key: string) {
  return (Number.parseInt(createHash("sha256").update(`${graphId}:${key}`).digest("hex").slice(0, 7), 16) % 1_999_999_999) + 1;
}

export function buildAccountCalibrationSnapshot(rows: Array<{rating:unknown;target_type:unknown;created_at:unknown}>) {
  return { source:"account_feedback" as const, signals:rows.slice(0,20).map((item)=>({rating:String(item.rating),targetType:String(item.target_type),createdAt:String(item.created_at)})) };
}

export async function startFormalSandboxRun(caller: SupabaseClient, userId: string, rawRequest: unknown) {
  const request = requestSchema.safeParse(rawRequest);
  if (!request.success) return { ok:false as const,errorCode:"invalid_request" as const };
  try {
    const reserved = await caller.rpc("reserve_account_sandbox_run", {
      p_graph_snapshot_id: request.data.graph_snapshot_id,
      p_idempotency_key: request.data.idempotency_key,
      p_horizon_days: request.data.horizon_days,
      p_digital_life_rules: request.data.digital_life_rules ?? null,
      p_outcome_calibration: request.data.outcome_calibration ?? null,
    });
    if (reserved.error) return { ok:false as const,errorCode:reservationErrors.has(reserved.error.message) ? reserved.error.message : "persistence_failed" };
    const result = z.array(reservationSchema).length(1).safeParse(reserved.data);
    if (!result.success) return { ok:false as const,errorCode:"persistence_failed" as const };
    const reservation = result.data[0];
    if (reservation.run) {
      if (reservation.run.graph_snapshot_id !== request.data.graph_snapshot_id || reservation.run.time_horizon !== `${request.data.horizon_days}_days`) return { ok:false as const,errorCode:"persistence_failed" as const };
      return { ok:true as const,idempotent:true,run:reservation.run };
    }
    if (Date.now() >= Date.parse(reservation.simulation_start_at)) return { ok:false as const,errorCode:"reservation_expired" as const };
    const source = reservation.frozen_source_input;
    if (!source) return { ok:false as const,errorCode:"persistence_failed" as const };
    const graph = graphSchema.safeParse(source.relation_graph_snapshots);
    if (!graph.success || graph.data.user_id !== userId || graph.data.id !== request.data.graph_snapshot_id) return { ok:false as const,errorCode:"graph_not_found" as const };
    const seed = seedSchema.safeParse(source.seed_contexts);
    const agents = z.array(agentSchema).min(1).safeParse(source.agent_profiles);
    const edges = z.array(edgeSchema).min(1).safeParse(source.relation_edges);
    if (!seed.success || seed.data.id !== graph.data.seed_context_id || !agents.success || !edges.success) return { ok:false as const,errorCode:"incomplete_object_chain" as const };
    let profile = createEmptyRealityProfileDraft(0);
    let profileId: string | null = null;
    if (source.reality_profiles !== null) {
      const identity = profileIdentitySchema.safeParse(source.reality_profiles);
      if (!identity.success || identity.data.user_id !== userId || identity.data.seed_context_id !== seed.data.id) return { ok:false as const,errorCode:"incomplete_object_chain" as const };
      try { profile = realityProfileDraftFromDatabaseRow(source.reality_profiles); }
      catch { return { ok:false as const,errorCode:"incomplete_object_chain" as const }; }
      profileId = identity.data.id;
    }
    const built = await buildFormalSandboxRunV2({
      ownerId:userId,
      seedContextId:seed.data.id,
      realityProfileSnapshot:{ownerId:userId,seedContextId:seed.data.id,profileId,revision:profile.revision,profile},
      graphSnapshotId:graph.data.id,
      agentSnapshotId:graph.data.agent_snapshot_id,
      horizonDays:request.data.horizon_days,
      deterministicSeed:stableSeed(graph.data.id,request.data.idempotency_key),
      acceptedAt:new Date(reservation.accepted_at).toISOString(),
      startedAt:new Date(reservation.simulation_start_at).toISOString(),
      graphLockedAt:new Date(graph.data.locked_at).toISOString(),
      seedSummary:[seed.data.user_question,seed.data.raw_context].filter(Boolean).join(" ").slice(0,4000),
      agents:agents.data.map((item)=>({id:item.id,displayName:item.display_name,sourceRole:item.agent_type,actorType:item.agent_type==="user_core"||item.agent_type==="user_variant"?"self" as const:item.agent_type==="group"?"organization" as const:"third_party" as const,evidenceRefs:item.evidence_refs})),
      edges:edges.data.map((item)=>({id:item.id,fromAgentId:item.from_agent_id,toAgentId:item.to_agent_id,relationshipType:item.relationship_type,evidenceRefs:item.evidence_refs})),
      safetyLevel:graph.data.safety_level,
      symbolicLens:parseFrozenSymbolicLens(source.symbolic_lens,userId,reservation.accepted_at),
      calibrationSnapshot:buildAccountCalibrationSnapshot(z.array(z.object({ rating:z.unknown(),target_type:z.unknown(),created_at:z.unknown() })).parse(source.feedback_logs)),
      ...(source.outcome_calibration ? {outcomeCalibration:source.outcome_calibration} : {}),
      ...(source.digital_life_rules ? { digitalLifeRules: source.digital_life_rules } : request.data.digital_life_rules ? { digitalLifeRules: request.data.digital_life_rules } : {}),
    });
    if (!built.ok) return built;
    return persistFormalSandboxRun(caller,{userId,graphSnapshotId:graph.data.id,idempotencyKey:request.data.idempotency_key,horizonDays:request.data.horizon_days,bundle:built.bundle});
  } catch {
    return { ok:false as const,errorCode:"persistence_failed" as const };
  }
}
