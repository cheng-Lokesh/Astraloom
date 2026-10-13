import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { buildDigitalLifeModel } from "./model";
import { createEmptyRealityProfileDraft, realityProfileDraftFromDatabaseRow } from "@/lib/reality-profile/profile";
import { canonicalModelDraftJson, digitalLifeModelDraftSchema, digitalLifeModelDraftSourceSchema, saveDigitalLifeModelDraftSchema, type DigitalLifeModelDraftSource, type ModelDraftError, type ModelDraftResult, type SaveDigitalLifeModelDraft } from "./model-draft";

const uuid = z.string().uuid();
const identity = z.object({ id: uuid, user_id: uuid }).passthrough();
const graphSchema = identity.extend({ seed_context_id: uuid, agent_snapshot_id: uuid }).passthrough();
const agentSchema = identity.extend({ seed_context_id: uuid, snapshot_id: uuid, display_name: z.string(), agent_type: z.enum(["user_core", "user_variant", "npc", "group"]), evidence_refs: z.array(z.string()).min(1) }).passthrough();
const edgeSchema = identity.extend({ graph_snapshot_id: uuid, agent_snapshot_id: uuid, from_agent_id: uuid, to_agent_id: uuid, relationship_type: z.string(), evidence_refs: z.array(z.string()).min(1) }).passthrough();
const sourceSchema = z.object({ signature: z.string().regex(/^[a-f0-9]{64}$/), seed_contexts: identity, relation_graph_snapshots: graphSchema, agent_profiles: z.array(agentSchema).min(1).max(50), relation_edges: z.array(edgeSchema).min(1).max(200), reality_profiles: z.unknown() }).passthrough();
const rowSchema = z.object({ user_id: uuid, revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), request: saveDigitalLifeModelDraftSchema }).passthrough().refine(row => row.revision === row.request.expectedRevision + 1);
const readSchema = z.object({ source: z.unknown(), current: z.unknown() }).strict();
const failure = (errorCode: ModelDraftError): ModelDraftResult => ({ ok: false, errorCode });
const codes = new Set<ModelDraftError>(["invalid_request", "unauthenticated", "model_source_stale", "model_source_invalid", "revision_conflict", "idempotency_key_content_conflict"]);
function databaseFailure(error: { message?: string } | null): ModelDraftResult {
  return failure(error?.message && codes.has(error.message as ModelDraftError) ? error.message as ModelDraftError : "persistence_failed");
}

function currentSource(raw: unknown, ownerId: string, horizonDays: 30 | 90 = 30) {
  const parsed = sourceSchema.safeParse(raw);
  if (!parsed.success) return null;
  const source = parsed.data;
  const graph = source.relation_graph_snapshots;
  const seed = source.seed_contexts;
  if (seed.user_id !== ownerId || graph.user_id !== ownerId || graph.seed_context_id !== seed.id || source.agent_profiles.some(agent => agent.user_id !== ownerId || agent.seed_context_id !== seed.id || agent.snapshot_id !== graph.agent_snapshot_id) || source.relation_edges.some(edge => edge.user_id !== ownerId || edge.graph_snapshot_id !== graph.id || edge.agent_snapshot_id !== graph.agent_snapshot_id)) return null;
  let profile = createEmptyRealityProfileDraft();
  let profileId: string | null = null;
  if (source.reality_profiles !== null) {
    const profileIdentity = identity.extend({ seed_context_id: uuid }).safeParse(source.reality_profiles);
    if (!profileIdentity.success || profileIdentity.data.user_id !== ownerId || profileIdentity.data.seed_context_id !== seed.id) return null;
    try { profile = realityProfileDraftFromDatabaseRow(source.reality_profiles); } catch { return null; }
    profileId = profileIdentity.data.id;
  }
  const input = { ownerId, seedContextId: seed.id, graphSnapshotId: graph.id, agentSnapshotId: graph.agent_snapshot_id, horizonDays, realityProfileSnapshot: { ownerId, seedContextId: seed.id, profileId, revision: profile.revision, profile }, agents: source.agent_profiles.map(agent => ({ id: agent.id, displayName: agent.display_name, sourceRole: agent.agent_type, actorType: agent.agent_type === "user_core" || agent.agent_type === "user_variant" ? "self" : agent.agent_type === "group" ? "organization" : "third_party", evidenceRefs: agent.evidence_refs })), edges: source.relation_edges.map(edge => ({ id: edge.id, fromAgentId: edge.from_agent_id, toAgentId: edge.to_agent_id, relationshipType: edge.relationship_type, evidenceRefs: edge.evidence_refs })) };
  const built = buildDigitalLifeModel(input);
  if (!built.ok) return null;
  const binding = digitalLifeModelDraftSourceSchema.safeParse({ signature: source.signature, modelContext: { graphSnapshotId: graph.id, agentSnapshotId: graph.agent_snapshot_id, profileRevision: profile.revision, agents: built.model.agents.map(({ key, label, role }) => ({ key, label, role })), relationships: built.model.relationships.map(({ key, label, fromPersonKey, toPersonKey }) => ({ key, label, fromPersonKey, toPersonKey })), resources: profile.worldInputs.resources.map(({ label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary }, index) => ({ key: `resource-${index + 1}`, label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary })) } });
  return binding.success ? { input, binding: binding.data } : null;
}

function projected(rawRow: unknown, ownerId: string, current: DigitalLifeModelDraftSource | null, idempotent?: boolean): ModelDraftResult {
  const row = rawRow === null ? null : rowSchema.safeParse(rawRow);
  if (row && (!row.success || row.data.user_id !== ownerId)) return failure("persistence_failed");
  const saved = row?.success ? row.data : null;
  const result = digitalLifeModelDraftSchema.safeParse({ version: "digital-life-model-draft-v1", status: saved ? canonicalModelDraftJson(saved.request.sourceContext) === canonicalModelDraftJson(current) ? "current" : "stale" : "not_saved", currentRevision: saved?.revision ?? 0, horizonDays: saved?.request.horizonDays ?? null, sourceContext: saved?.request.sourceContext ?? null, currentSourceContext: current, draftRules: saved?.request.draftRules ?? null });
  return result.success ? { ok: true, draft: result.data, ...(idempotent === undefined ? {} : { idempotent }) } : failure("persistence_failed");
}

export async function readFormalModelDraft(caller: SupabaseClient, ownerId: string): Promise<ModelDraftResult> {
  if (!uuid.safeParse(ownerId).success) return failure("invalid_request");
  try {
    const found = await caller.rpc("read_digital_life_model_draft_v1");
    if (found.error) return databaseFailure(found.error);
    const read = readSchema.safeParse(found.data);
    if (!read.success) return failure("persistence_failed");
    const current = currentSource(read.data.source, ownerId);
    if (read.data.source !== null && !current) return failure("model_source_invalid");
    return projected(read.data.current, ownerId, current?.binding ?? null);
  } catch { return failure("persistence_failed"); }
}

/** A receipt is checked before any mutable source lookup; DB repeats replay/CAS/source checks atomically. */
export async function saveFormalModelDraft(caller: SupabaseClient, ownerId: string, rawRequest: unknown): Promise<ModelDraftResult> {
  const parsed = saveDigitalLifeModelDraftSchema.safeParse(rawRequest);
  if (!uuid.safeParse(ownerId).success || !parsed.success) return failure("invalid_request");
  const request: SaveDigitalLifeModelDraft = parsed.data;
  try {
    const receipt = await caller.from("digital_life_model_drafts").select("user_id,revision,request").eq("user_id", ownerId).eq("idempotency_key", request.idempotencyKey).maybeSingle();
    if (receipt.error) return databaseFailure(receipt.error);
    if (receipt.data !== null) {
      const saved = rowSchema.safeParse(receipt.data);
      if (!saved.success || saved.data.user_id !== ownerId) return failure("persistence_failed");
      if (canonicalModelDraftJson(saved.data.request) !== canonicalModelDraftJson(request)) return failure("idempotency_key_content_conflict");
      // This response acknowledges the original accepted revision, not today's source eligibility.
      return projected(saved.data, ownerId, null, true);
    }
    const found = await caller.rpc("read_digital_life_model_draft_v1");
    if (found.error) return databaseFailure(found.error);
    const read = readSchema.safeParse(found.data);
    if (!read.success) return failure("persistence_failed");
    const current = currentSource(read.data.source, ownerId, request.horizonDays);
    if (!current || canonicalModelDraftJson(current.binding) !== canonicalModelDraftJson(request.sourceContext)) return failure("model_source_stale");
    const confirmed = { ...request.draftRules, actions: request.draftRules.actions.map(action => ({ ...action, confirmedForSimulation: true })), strategies: request.draftRules.strategies.map(strategy => ({ ...strategy, confirmedForSimulation: true })) };
    if (!buildDigitalLifeModel(current.input, confirmed).ok) return failure("invalid_request");
    const saved = await caller.rpc("save_digital_life_model_draft_v1", { p_request: request });
    if (saved.error) return databaseFailure(saved.error);
    const result = z.object({ row: rowSchema, idempotent: z.boolean() }).strict().safeParse(saved.data);
    if (!result.success || canonicalModelDraftJson(result.data.row.request) !== canonicalModelDraftJson(request)) return failure("persistence_failed");
    return projected(result.data.row, ownerId, result.data.idempotent ? null : current.binding, result.data.idempotent);
  } catch { return failure("persistence_failed"); }
}
