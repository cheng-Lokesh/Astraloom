import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { buildDigitalLifeModel } from "@/lib/digital-life/model";
import { createEmptyRealityProfileDraft, realityProfileDatabaseColumns, realityProfileDraftFromDatabaseRow } from "@/lib/reality-profile/profile";
import { safeDigitalLifeContextSchema, type SafeDigitalLifeContext } from "./model-context";

const graphSchema = z.object({ id: z.string().uuid(), user_id: z.string().uuid(), seed_context_id: z.string().uuid(), agent_snapshot_id: z.string().uuid(), graph_locked: z.boolean() }).passthrough();
const seedSchema = z.object({ id: z.string().uuid(), user_id: z.string().uuid(), status: z.literal("submitted"), submitted_at: z.string().datetime({ offset: true }), frozen_at: z.string().datetime({ offset: true }) }).passthrough();
const agentSchema = z.object({ id: z.string().uuid(), user_id: z.string().uuid(), seed_context_id: z.string().uuid(), snapshot_id: z.string().uuid(), display_name: z.string(), agent_type: z.enum(["user_core", "user_variant", "npc", "group"]), evidence_refs: z.array(z.string()).min(1) }).passthrough();
const edgeSchema = z.object({ id: z.string().uuid(), user_id: z.string().uuid(), graph_snapshot_id: z.string().uuid(), agent_snapshot_id: z.string().uuid(), from_agent_id: z.string().uuid(), to_agent_id: z.string().uuid(), relationship_type: z.string(), evidence_refs: z.array(z.string()).min(1) }).passthrough();
const profileIdentity = z.object({ id: z.string().uuid(), user_id: z.string().uuid(), seed_context_id: z.string().uuid() }).passthrough();

type ContextResult = { ok: true; context: SafeDigitalLifeContext } | { ok: false; errorCode: "invalid_request" | "graph_not_found" | "current_graph_required" | "incomplete_object_chain" | "persistence_failed" };

export async function readFormalDigitalLifeContext(caller: SupabaseClient, ownerId: string, graphId?: string): Promise<ContextResult> {
  const failure = (errorCode: Exclude<ContextResult, { ok: true }>["errorCode"]): ContextResult => ({ ok: false, errorCode });
  if (!z.string().uuid().safeParse(ownerId).success || (graphId !== undefined && !z.string().uuid().safeParse(graphId).success)) return failure("invalid_request");
  try {
    let currentSeed: z.infer<typeof seedSchema> | undefined;
    if (!graphId) {
      const result = await caller.from("seed_contexts").select("id,user_id,status,submitted_at,frozen_at").eq("user_id", ownerId).eq("status", "submitted").not("submitted_at", "is", null).not("frozen_at", "is", null).order("submitted_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
      if (result.error) return failure("persistence_failed");
      const seed = seedSchema.safeParse(result.data);
      if (!seed.success || seed.data.user_id !== ownerId) return failure("current_graph_required");
      currentSeed = seed.data;
    }
    let graphQuery = caller.from("relation_graph_snapshots").select("id,user_id,seed_context_id,agent_snapshot_id,graph_locked").eq("user_id", ownerId);
    graphQuery = graphId ? graphQuery.eq("id", graphId) : graphQuery.eq("seed_context_id", currentSeed!.id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1);
    const result = await graphQuery.maybeSingle();
    if (result.error) return failure("persistence_failed");
    const graph = graphSchema.safeParse(result.data);
    if (!graph.success || graph.data.user_id !== ownerId || (graphId && graph.data.id !== graphId)) return failure(graphId ? "graph_not_found" : "current_graph_required");
    if (!graph.data.graph_locked) return failure("current_graph_required");
    if (currentSeed && graph.data.seed_context_id !== currentSeed.id) return failure("incomplete_object_chain");
    const [seedResult, agentResult, edgeResult, profileResult] = await Promise.all([
      currentSeed ? Promise.resolve({ data: currentSeed, error: null }) : caller.from("seed_contexts").select("id,user_id,status,submitted_at,frozen_at").eq("id", graph.data.seed_context_id).eq("user_id", ownerId).eq("status", "submitted").not("submitted_at", "is", null).not("frozen_at", "is", null).maybeSingle(),
      caller.from("agent_profiles").select("id,user_id,seed_context_id,snapshot_id,display_name,agent_type,evidence_refs").eq("user_id", ownerId).eq("seed_context_id", graph.data.seed_context_id).eq("snapshot_id", graph.data.agent_snapshot_id).order("id"),
      caller.from("relation_edges").select("id,user_id,graph_snapshot_id,agent_snapshot_id,from_agent_id,to_agent_id,relationship_type,evidence_refs").eq("user_id", ownerId).eq("graph_snapshot_id", graph.data.id).eq("agent_snapshot_id", graph.data.agent_snapshot_id).order("id"),
      caller.from("reality_profiles").select(`id,user_id,seed_context_id,${realityProfileDatabaseColumns}`).eq("user_id", ownerId).eq("seed_context_id", graph.data.seed_context_id).maybeSingle(),
    ]);
    if (seedResult.error || agentResult.error || edgeResult.error || profileResult.error) return failure("persistence_failed");
    const seed = seedSchema.safeParse(seedResult.data);
    const agents = z.array(agentSchema).min(1).safeParse(agentResult.data);
    const edges = z.array(edgeSchema).min(1).safeParse(edgeResult.data);
    if (!seed.success || seed.data.id !== graph.data.seed_context_id || seed.data.user_id !== ownerId || !agents.success || !edges.success || agents.data.some(agent => agent.user_id !== ownerId || agent.seed_context_id !== seed.data.id || agent.snapshot_id !== graph.data.agent_snapshot_id) || edges.data.some(edge => edge.user_id !== ownerId || edge.graph_snapshot_id !== graph.data.id || edge.agent_snapshot_id !== graph.data.agent_snapshot_id)) return failure("incomplete_object_chain");
    let profile = createEmptyRealityProfileDraft();
    let profileId: string | null = null;
    if (profileResult.data !== null) {
      const identity = profileIdentity.safeParse(profileResult.data);
      if (!identity.success || identity.data.user_id !== ownerId || identity.data.seed_context_id !== seed.data.id) return failure("incomplete_object_chain");
      try { profile = realityProfileDraftFromDatabaseRow(profileResult.data); } catch { return failure("incomplete_object_chain"); }
      profileId = identity.data.id;
    }
    const modeled = buildDigitalLifeModel({
      ownerId, seedContextId: seed.data.id, graphSnapshotId: graph.data.id, agentSnapshotId: graph.data.agent_snapshot_id, horizonDays: 30,
      realityProfileSnapshot: { ownerId, seedContextId: seed.data.id, profileId, revision: profile.revision, profile },
      agents: agents.data.map(agent => ({ id: agent.id, displayName: agent.display_name, sourceRole: agent.agent_type, actorType: agent.agent_type === "user_core" || agent.agent_type === "user_variant" ? "self" : agent.agent_type === "group" ? "organization" : "third_party", evidenceRefs: agent.evidence_refs })),
      edges: edges.data.map(edge => ({ id: edge.id, fromAgentId: edge.from_agent_id, toAgentId: edge.to_agent_id, relationshipType: edge.relationship_type, evidenceRefs: edge.evidence_refs })),
    });
    if (!modeled.ok) return failure("incomplete_object_chain");
    const context = safeDigitalLifeContextSchema.safeParse({
      graphSnapshotId: graph.data.id, agentSnapshotId: graph.data.agent_snapshot_id, profileRevision: profile.revision,
      agents: modeled.model.agents.map(({ key, label, role }) => ({ key, label, role })),
      relationships: modeled.model.relationships.map(({ key, label, fromPersonKey, toPersonKey }) => ({ key, label, fromPersonKey, toPersonKey })),
      resources: profile.worldInputs.resources.map(({ label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary }, index) => ({ key: `resource-${index + 1}`, label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary })),
    });
    return context.success ? { ok: true, context: context.data } : failure("incomplete_object_chain");
  } catch { return failure("persistence_failed"); }
}
