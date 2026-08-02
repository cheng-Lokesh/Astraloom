import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const querySchema = z.object({ seed_id: z.string().uuid() }).strict();
const safetyLevelSchema = z.enum(["safe", "caution", "downgraded"]);
const snapshotVersionSchema = z.literal("phase3-agent-snapshot-v1");
const opaqueEvidenceRefSchema = z.union([
  z.literal("seed:submitted"),
  z.literal("key_person:confirmed"),
  z.literal("user_supplement"),
  z.string().regex(/^seed_context:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}:[0-9a-f]{16,64}$/),
]);
const safeSnapshotSchema = z.object({
  id: z.string().uuid(),
  version: snapshotVersionSchema,
  safety_level: safetyLevelSchema,
  error_code: z.union([z.literal("safety_downgraded"), z.null()]),
}).strip().superRefine((snapshot, context) => {
  const expectedErrorCode = snapshot.safety_level === "downgraded" ? "safety_downgraded" : null;
  if (snapshot.error_code !== expectedErrorCode) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["error_code"], message: "invalid safety result" });
  }
});
const safeAgentSchema = z.object({
  id: z.string().uuid(),
  snapshot_id: z.string().uuid(),
  key_person_id: z.string().uuid().nullable(),
  version: snapshotVersionSchema,
  agent_type: z.enum(["user_core", "user_variant", "npc"]),
  display_name: z.string().trim().min(1).max(160),
  relationship_to_user: z.string().trim().min(1).max(160),
  source: z.enum(["conservative_snapshot", "confirmed_person_snapshot"]),
  confidence: z.number().int().min(0).max(100),
  evidence_refs: z.array(opaqueEvidenceRefSchema).min(1).max(32),
  safety_level: safetyLevelSchema,
}).strip();
function parseSafeAgents(snapshot: z.infer<typeof safeSnapshotSchema>, value: unknown) {
  const agents = z.array(safeAgentSchema).safeParse(value);
  if (!agents.success) return null;
  if (agents.data.length === 0) return null;
  if (agents.data.some((agent) => agent.snapshot_id !== snapshot.id || agent.safety_level !== snapshot.safety_level)) {
    return null;
  }
  if (agents.data.some((agent) => (
    (agent.agent_type === "npc" && agent.key_person_id === null)
    || (agent.agent_type !== "npc" && agent.key_person_id !== null)
  ))) return null;
  const userCores = agents.data.filter((agent) => agent.agent_type === "user_core");
  if (userCores.length !== 1) return null;
  if (agents.data.filter((agent) => agent.agent_type === "user_variant").length > 2) return null;
  const npcKeyPersonIds = agents.data
    .filter((agent) => agent.agent_type === "npc")
    .map((agent) => agent.key_person_id);
  if (new Set(npcKeyPersonIds).size !== npcKeyPersonIds.length) return null;
  if (snapshot.safety_level === "downgraded"
    && (agents.data.length !== 1 || agents.data[0]?.agent_type !== "user_core")) return null;
  return agents.data;
}
function traceId() { return `agent_snapshot_read_${crypto.randomUUID()}`; }
function failure(status: number, errorCode: string, trace: string) {
  return NextResponse.json({ ok: false, error_code: errorCode, trace_id: trace }, { status });
}
export async function GET(request: Request) {
  const trace = traceId();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure(500, "persistence_failed", trace);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return failure(401, "unauthenticated", trace);
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].length !== 1 || url.searchParams.getAll("seed_id").length !== 1) {
    return failure(400, "invalid_request", trace);
  }
  const query = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!query.success) return failure(400, "invalid_request", trace);
  const { data: seed, error: seedError } = await supabase.from("seed_contexts").select("id")
    .eq("id", query.data.seed_id).eq("user_id", auth.user.id).eq("status", "submitted")
    .not("submitted_at", "is", null).not("frozen_at", "is", null).maybeSingle();
  if (seedError) return failure(500, "persistence_failed", trace);
  if (!seed) return failure(404, "seed_not_found", trace);
  const { data: snapshot, error: snapshotError } = await supabase.from("agent_profile_snapshots")
    .select("id,version,safety_level,error_code").eq("user_id", auth.user.id).eq("seed_context_id", seed.id)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (snapshotError) return failure(500, "persistence_failed", trace);
  if (!snapshot) return NextResponse.json({ ok: true, error_code: null, trace_id: trace, snapshot: null, agents: [] });
  const safeSnapshot = safeSnapshotSchema.safeParse(snapshot);
  if (!safeSnapshot.success) return failure(500, "persistence_failed", trace);
  const { data: agents, error: agentsError } = await supabase.from("agent_profiles")
    .select("id,snapshot_id,key_person_id,version,agent_type,display_name,relationship_to_user,source,confidence,evidence_refs,safety_level")
    .eq("snapshot_id", snapshot.id).eq("user_id", auth.user.id).eq("seed_context_id", seed.id)
    .order("created_at", { ascending: true });
  if (agentsError || !Array.isArray(agents)) return failure(500, "persistence_failed", trace);
  const safeAgents = parseSafeAgents(safeSnapshot.data, agents);
  if (!safeAgents) return failure(500, "persistence_failed", trace);
  return NextResponse.json({
    ok: true,
    error_code: null,
    trace_id: trace,
    snapshot: safeSnapshot.data,
    agents: safeAgents,
  });
}
