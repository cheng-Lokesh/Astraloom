import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { buildDigitalLifeModel, digitalLifeModelSchema, digitalLifeProfileSnapshotSchema, digitalLifeSafeText, listDigitalLifeEnvironmentVariables } from "@/lib/digital-life/model";
import { createEmptyRealityProfileDraft, realityProfileDatabaseColumns, realityProfileDraftFromDatabaseRow } from "@/lib/reality-profile/profile";
import { safeDigitalLifeCorrectionContextSchema, type CorrectionContextError, type CorrectionContextResult } from "./correction-context";

const uuid = z.string().uuid();
const runSchema = z.object({ id: uuid, user_id: uuid, status: z.string(), execution_version: z.literal("formal-account-sandbox-m1-v1"), seed_context_id: uuid, graph_snapshot_id: uuid, time_horizon: z.enum(["30_days", "90_days"]), model: z.unknown(), profile: z.unknown() });
const seedSchema = z.object({ id: uuid, user_id: uuid, status: z.literal("submitted"), submitted_at: z.string().datetime({ offset: true }), frozen_at: z.string().datetime({ offset: true }) });
const graphSchema = z.object({ id: uuid, user_id: uuid, seed_context_id: uuid, agent_snapshot_id: uuid, graph_locked: z.boolean(), safety_level: z.enum(["safe", "caution", "downgraded", "blocked"]) });
const agentSchema = z.object({ id: uuid, user_id: uuid, seed_context_id: uuid, snapshot_id: uuid, display_name: digitalLifeSafeText, agent_type: z.enum(["user_core", "user_variant", "npc", "group"]) });
const edgeSchema = z.object({ id: uuid, user_id: uuid, graph_snapshot_id: uuid, agent_snapshot_id: uuid, from_agent_id: uuid, to_agent_id: uuid, relationship_type: digitalLifeSafeText });
const profileIdentity = z.object({ id: uuid, user_id: uuid, seed_context_id: uuid });

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

/** Read only frozen typed rules. No history write, authorization or Run admission occurs here. */
export async function readFormalCorrectionContext(caller: SupabaseClient, ownerId: string, runId: string): Promise<CorrectionContextResult> {
  const failure = (errorCode: CorrectionContextError): CorrectionContextResult => ({ ok: false, errorCode });
  if (!uuid.safeParse(ownerId).success || !uuid.safeParse(runId).success) return failure("invalid_request");
  try {
    // JSON-path projection deliberately excludes narrative, birth, raw evidence and other permissions.
    const found = await caller.from("simulations").select("id,user_id,status,execution_version,seed_context_id,graph_snapshot_id,time_horizon,model:input_snapshot->digitalLifeModel,profile:input_snapshot->realityProfileSnapshot").eq("id", runId).eq("user_id", ownerId).eq("execution_version", "formal-account-sandbox-m1-v1").maybeSingle();
    if (found.error) return failure("persistence_failed");
    if (!found.data || found.data.user_id !== ownerId || found.data.id !== runId) return failure("run_not_found");
    if (found.data.status !== "completed") return failure("run_not_completed");
    if (found.data.model === null || found.data.model === undefined) return failure("correction_rules_not_recorded");
    const run = runSchema.safeParse(found.data);
    const model = digitalLifeModelSchema.safeParse(found.data.model);
    const profileSnapshot = digitalLifeProfileSnapshotSchema.safeParse(found.data.profile);
    if (!run.success || !model.success || !profileSnapshot.success) return failure("correction_source_invalid");
    const frozen = model.data;
    const profile = profileSnapshot.data;
    const horizonDays = run.data.time_horizon === "30_days" ? 30 : 90;
    if (frozen.ownerId !== ownerId || frozen.seedContextId !== run.data.seed_context_id || frozen.graphSnapshotId !== run.data.graph_snapshot_id || profile.ownerId !== ownerId || profile.seedContextId !== frozen.seedContextId) return failure("correction_source_invalid");
    const personByKey = new Map(frozen.agents.map(agent => [agent.key, agent.sourceAgentId]));
    // Reuse the canonical rule validator with frozen typed identities, without loading evidence bodies/refs.
    const rebuilt = buildDigitalLifeModel({ ownerId, seedContextId: frozen.seedContextId, graphSnapshotId: frozen.graphSnapshotId, agentSnapshotId: frozen.agentSnapshotId, horizonDays, realityProfileSnapshot: profile,
      agents: frozen.agents.map(agent => ({ id: agent.sourceAgentId, displayName: agent.label, sourceRole: agent.role, actorType: agent.role === "user_core" || agent.role === "user_variant" ? "self" : agent.role === "group" ? "organization" : "third_party", evidenceRefs: ["frozen-model-validation-only"] })),
      edges: frozen.relationships.map(edge => ({ id: edge.sourceEdgeId, fromAgentId: personByKey.get(edge.fromPersonKey), toAgentId: personByKey.get(edge.toPersonKey), relationshipType: edge.label, evidenceRefs: ["frozen-model-validation-only"] })),
    }, frozen.rules);
    if (!rebuilt.ok || canonical(rebuilt.model) !== canonical(frozen)) return failure("correction_source_invalid");

    const currentSeed = await caller.from("seed_contexts").select("id,user_id,status,submitted_at,frozen_at").eq("user_id", ownerId).eq("status", "submitted").not("submitted_at", "is", null).not("frozen_at", "is", null).order("submitted_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
    if (currentSeed.error) return failure("persistence_failed");
    const seed = seedSchema.safeParse(currentSeed.data);
    if (!seed.success || seed.data.user_id !== ownerId || seed.data.id !== frozen.seedContextId) return failure("correction_source_stale");
    const currentGraph = await caller.from("relation_graph_snapshots").select("id,user_id,seed_context_id,agent_snapshot_id,graph_locked,safety_level").eq("user_id", ownerId).eq("seed_context_id", seed.data.id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
    if (currentGraph.error) return failure("persistence_failed");
    const graph = graphSchema.safeParse(currentGraph.data);
    if (!graph.success || graph.data.user_id !== ownerId || graph.data.seed_context_id !== seed.data.id || graph.data.id !== frozen.graphSnapshotId || graph.data.agent_snapshot_id !== frozen.agentSnapshotId || !graph.data.graph_locked || !["safe", "caution"].includes(graph.data.safety_level)) return failure("correction_source_stale");

    const [currentAgents, currentEdges, currentProfile] = await Promise.all([
      caller.from("agent_profiles").select("id,user_id,seed_context_id,snapshot_id,display_name,agent_type").eq("user_id", ownerId).eq("seed_context_id", seed.data.id).eq("snapshot_id", graph.data.agent_snapshot_id).order("id"),
      caller.from("relation_edges").select("id,user_id,graph_snapshot_id,agent_snapshot_id,from_agent_id,to_agent_id,relationship_type").eq("user_id", ownerId).eq("graph_snapshot_id", graph.data.id).eq("agent_snapshot_id", graph.data.agent_snapshot_id).order("id"),
      caller.from("reality_profiles").select(`id,user_id,seed_context_id,${realityProfileDatabaseColumns}`).eq("user_id", ownerId).eq("seed_context_id", seed.data.id).maybeSingle(),
    ]);
    if (currentAgents.error || currentEdges.error || currentProfile.error) return failure("persistence_failed");
    const agents = z.array(agentSchema).min(1).max(50).safeParse(currentAgents.data);
    const edges = z.array(edgeSchema).min(1).max(200).safeParse(currentEdges.data);
    if (!agents.success || !edges.success || agents.data.length !== frozen.agents.length || edges.data.length !== frozen.relationships.length) return failure("correction_source_stale");
    if (agents.data.some((agent, index) => agent.user_id !== ownerId || agent.seed_context_id !== seed.data.id || agent.snapshot_id !== graph.data.agent_snapshot_id || agent.id !== frozen.agents[index].sourceAgentId || agent.display_name !== frozen.agents[index].label || agent.agent_type !== frozen.agents[index].role)) return failure("correction_source_stale");
    if (edges.data.some((edge, index) => edge.user_id !== ownerId || edge.graph_snapshot_id !== graph.data.id || edge.agent_snapshot_id !== graph.data.agent_snapshot_id || edge.id !== frozen.relationships[index].sourceEdgeId || edge.from_agent_id !== personByKey.get(frozen.relationships[index].fromPersonKey) || edge.to_agent_id !== personByKey.get(frozen.relationships[index].toPersonKey) || edge.relationship_type !== frozen.relationships[index].label)) return failure("correction_source_stale");
    let currentDraft = createEmptyRealityProfileDraft();
    let profileId: string | null = null;
    if (currentProfile.data !== null) {
      const identity = profileIdentity.safeParse(currentProfile.data);
      if (!identity.success || identity.data.user_id !== ownerId || identity.data.seed_context_id !== seed.data.id) return failure("correction_source_stale");
      try { currentDraft = realityProfileDraftFromDatabaseRow(currentProfile.data); } catch { return failure("correction_source_stale"); }
      profileId = identity.data.id;
    }
    if (profileId !== profile.profileId || canonical(currentDraft) !== canonical(profile.profile)) return failure("correction_source_stale");

    const context = safeDigitalLifeCorrectionContextSchema.safeParse({
      version: "digital-life-correction-context-v1", horizonDays,
      modelContext: { graphSnapshotId: frozen.graphSnapshotId, agentSnapshotId: frozen.agentSnapshotId, profileRevision: frozen.profileRevision,
        agents: frozen.agents.map(({ key, label, role }) => ({ key, label, role })),
        relationships: frozen.relationships.map(({ key, label, fromPersonKey, toPersonKey }) => ({ key, label, fromPersonKey, toPersonKey })),
        resources: currentDraft.worldInputs.resources.map(({ label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary }, index) => ({ key: `resource-${index + 1}`, label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary })),
        ...(frozen.rules.version === "digital-life-rules-v2" ? { variables: listDigitalLifeEnvironmentVariables(currentDraft) } : {}),
      },
      frozenRules: frozen.rules,
      draftRules: { ...frozen.rules, strategies: frozen.rules.strategies.map(strategy => ({ ...strategy, confirmedForSimulation: false })), actions: frozen.rules.actions.map(action => ({ ...action, confirmedForSimulation: false })) },
      permissionsReset: { planning: true, symbolic: true, outcomeCalibration: true, requestIdentity: true },
    });
    return context.success ? { ok: true, context: context.data } : failure("correction_source_invalid");
  } catch { return failure("persistence_failed"); }
}
