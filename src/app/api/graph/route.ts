import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const querySchema = z.object({ seed_id: z.string().uuid() }).strict();
const version = z.literal("phase3-graph-snapshot-v1");
const safety = z.enum(["safe", "caution"]);
const evidence = z.union([z.literal("seed:submitted"), z.literal("key_person:confirmed"), z.literal("user_supplement"), z.string().regex(/^agent:[a-z_]+$/), z.string().regex(/^seed_context:[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}:[0-9a-f]{16}$/i)]);
const weights = z.object({ trust: z.number().int().min(0).max(100), hostility: z.number().int().min(0).max(100), dependency: z.number().int().min(0).max(100), attraction: z.number().int().min(0).max(100), competition: z.number().int().min(0).max(100), information_gap: z.number().int().min(0).max(100), resource_control: z.number().int().min(0).max(100), emotional_debt: z.number().int().min(0).max(100) }).strict();
const graphSchema = z.object({ id: z.string().uuid(), agent_snapshot_id: z.string().uuid(), version, graph_locked: z.boolean(), locked_at: z.string().datetime({ offset: true }).nullable(), safety_level: safety, error_code: z.null() }).strip().superRefine((v, c) => { if (v.graph_locked !== (v.locked_at !== null)) c.addIssue({ code: z.ZodIssueCode.custom, message: "lock mismatch" }); });
const edgeSchema = z.object({ id: z.string().uuid(), graph_snapshot_id: z.string().uuid(), agent_snapshot_id: z.string().uuid(), from_agent_id: z.string().uuid(), to_agent_id: z.string().uuid(), version, relationship_type: z.enum(["professional", "personal", "family", "support", "competitive"]), weights, confidence: z.number().int().min(0).max(100), evidence_refs: z.array(evidence).min(1).max(32), safety_level: safety }).strip();
function trace() { return `graph_read_${crypto.randomUUID()}`; }
function fail(status: number, error_code: string, trace_id: string) { return NextResponse.json({ ok: false, error_code, trace_id }, { status }); }

export async function GET(request: Request) {
  const trace_id = trace();
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return fail(500, "persistence_failed", trace_id);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) return fail(401, "unauthenticated", trace_id);
    const url = new URL(request.url);
    if ([...url.searchParams.keys()].length !== 1 || url.searchParams.getAll("seed_id").length !== 1) return fail(400, "invalid_request", trace_id);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) return fail(400, "invalid_request", trace_id);
    const { data: seed, error: seedError } = await supabase.from("seed_contexts").select("id").eq("id", parsed.data.seed_id).eq("user_id", auth.user.id).not("submitted_at", "is", null).not("frozen_at", "is", null).maybeSingle();
    if (seedError) return fail(500, "persistence_failed", trace_id);
    if (!seed) return fail(404, "seed_not_found", trace_id);
    const { data: graph, error: graphError } = await supabase.from("relation_graph_snapshots").select("id,agent_snapshot_id,version,graph_locked,locked_at,safety_level,error_code").eq("user_id", auth.user.id).eq("seed_context_id", seed.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (graphError) return fail(500, "persistence_failed", trace_id);
    if (!graph) return NextResponse.json({ ok: true, error_code: null, trace_id, graph: null, edges: [] });
    const safeGraph = graphSchema.safeParse(graph);
    if (!safeGraph.success) return fail(500, "persistence_failed", trace_id);
    const { data: edges, error: edgeError } = await supabase.from("relation_edges").select("id,graph_snapshot_id,agent_snapshot_id,from_agent_id,to_agent_id,version,relationship_type,weights,confidence,evidence_refs,safety_level").eq("graph_snapshot_id", safeGraph.data.id).order("created_at", { ascending: true });
    const safeEdges = z.array(edgeSchema).safeParse(edges);
    if (edgeError || !safeEdges.success || safeEdges.data.length === 0 || safeEdges.data.some((e) => e.graph_snapshot_id !== safeGraph.data.id || e.agent_snapshot_id !== safeGraph.data.agent_snapshot_id || e.safety_level !== safeGraph.data.safety_level || e.from_agent_id === e.to_agent_id)) return fail(500, "persistence_failed", trace_id);
    const pairs = new Set<string>();
    if (safeEdges.data.some((e) => { const p = [e.from_agent_id, e.to_agent_id].sort().join(":"); if (pairs.has(p)) return true; pairs.add(p); return false; })) return fail(500, "persistence_failed", trace_id);
    return NextResponse.json({ ok: true, error_code: null, trace_id, graph: safeGraph.data, edges: safeEdges.data });
  } catch { return fail(500, "persistence_failed", trace_id); }
}
