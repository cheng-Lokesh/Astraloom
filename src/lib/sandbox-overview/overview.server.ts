import { z } from "zod";

import type { SupabaseClient } from "@supabase/supabase-js";

const hrefSchema = z.string().regex(/^(?:\/app\/|\/login$)/).max(500);
const notModeledSchema = z.object({ state: z.literal("not_modeled") }).strict();
const personKeySchema = z.string().regex(/^person-[1-5]$/);
const safeLabelSchema = z.string().min(1).max(120);
const personSummarySchema = z.object({
  key: personKeySchema,
  label: safeLabelSchema,
  relationship: safeLabelSchema,
  kind: z.enum(["user_core", "user_variant", "npc"]),
}).strict();
const relationSummarySchema = z.object({
  key: z.string().regex(/^relation-[1-5]$/),
  fromPersonKey: personKeySchema,
  toPersonKey: personKeySchema,
  label: safeLabelSchema,
}).strict();

export const sandboxOverviewSchema = z.object({
  authenticated: z.boolean(),
  seed: z.object({ state: z.enum(["not_started", "submitted"]) }).strict(),
  reality: notModeledSchema,
  people: z.object({ confirmedCount: z.number().int().nonnegative(), total: z.number().int().nonnegative(), items: z.array(personSummarySchema).max(5) }).strict(),
  agents: z.object({ immutableCount: z.number().int().nonnegative() }).strict(),
  graph: z.object({ exists: z.boolean(), locked: z.boolean(), edgeCount: z.number().int().nonnegative() }).strict(),
  relations: z.object({ total: z.number().int().nonnegative(), items: z.array(relationSummarySchema).max(5) }).strict(),
  running: z.object({ exists: z.boolean(), href: hrefSchema.nullable() }).strict(),
  latestCompletedRun: z.object({ status: z.literal("completed"), completedAt: z.string().datetime({ offset: true }), href: hrefSchema }).strict().nullable(),
  history: z.object({ count: z.number().int().nonnegative() }).strict(),
  feedback: z.object({ exists: z.boolean() }).strict(),
  lifeClimate: notModeledSchema,
  resources: notModeledSchema,
  constraints: notModeledSchema,
  nextChange: notModeledSchema,
  nextAction: z.object({
    kind: z.enum(["sign_in", "start_intake", "review_people", "build_agents", "review_graph", "start_run", "start_next_run", "open_running", "open_latest_result"]),
    href: hrefSchema,
  }).strict(),
}).strict();

export type SandboxOverview = z.infer<typeof sandboxOverviewSchema>;

export type SandboxOverviewSource = {
  authenticated: boolean;
  seed: { submitted: boolean } | null;
  confirmedPeopleCount: number;
  peopleItems?: Array<z.infer<typeof personSummarySchema>>;
  immutableAgentsCount: number;
  graph: { exists: boolean; locked: boolean; edgeCount: number };
  relationItems?: Array<z.infer<typeof relationSummarySchema>>;
  runningRun: { href: string } | null;
  latestCompletedRun: { status: "completed"; completedAt: string; href: string } | null;
  historyCount: number;
  hasFeedback: boolean;
};

export function buildSandboxOverview(source: SandboxOverviewSource): SandboxOverview {
  const noModel = { state: "not_modeled" as const };
  const action = !source.authenticated
    ? { kind: "sign_in" as const, href: "/login" }
    : !source.seed?.submitted
      ? { kind: "start_intake" as const, href: "/app/new/intake" }
      : source.confirmedPeopleCount === 0
        ? { kind: "review_people" as const, href: "/app/new/people" }
        : source.immutableAgentsCount === 0
          ? { kind: "build_agents" as const, href: "/app/new/agents" }
          : !source.graph.exists || !source.graph.locked
            ? { kind: "review_graph" as const, href: "/app/new/graph" }
            : source.runningRun
              ? { kind: "open_running" as const, href: source.runningRun.href }
              : source.latestCompletedRun
                ? source.hasFeedback
                  ? { kind: "start_next_run" as const, href: "/app/new/graph" }
                  : { kind: "open_latest_result" as const, href: source.latestCompletedRun.href }
                : { kind: "start_run" as const, href: "/app/new/graph" };

  return sandboxOverviewSchema.parse({
    authenticated: source.authenticated,
    seed: { state: source.seed?.submitted ? "submitted" : "not_started" },
    reality: noModel,
    people: { confirmedCount: source.confirmedPeopleCount, total: source.immutableAgentsCount, items: source.peopleItems ?? [] },
    agents: { immutableCount: source.immutableAgentsCount },
    graph: source.graph,
    relations: { total: source.graph.edgeCount, items: source.relationItems ?? [] },
    running: { exists: Boolean(source.runningRun), href: source.runningRun?.href ?? null },
    latestCompletedRun: source.latestCompletedRun,
    history: { count: source.historyCount },
    feedback: { exists: source.hasFeedback },
    lifeClimate: noModel,
    resources: noModel,
    constraints: noModel,
    nextChange: noModel,
    nextAction: action,
  });
}

const seedSchema = z.object({ id: z.string().uuid(), status: z.literal("submitted") }).strict();
const snapshotSchema = z.object({ id: z.string().uuid() }).strict();
const graphSchema = z.object({ id: z.string().uuid(), agent_snapshot_id: z.string().uuid().optional(), graph_locked: z.boolean() }).strict();
const runSchema = z.object({ id: z.string().uuid(), status: z.string(), completed_at: z.string().datetime({ offset: true }).nullable() }).strict();
const agentRowSchema = z.object({
  id: z.string().uuid(),
  seed_context_id: z.string().uuid(),
  snapshot_id: z.string().uuid(),
  display_name: z.string().min(1).max(120),
  relationship_to_user: z.string().min(1).max(120).nullable(),
  agent_type: z.enum(["user_core", "user_variant", "npc"]),
}).strict();
const relationRowSchema = z.object({
  id: z.string().uuid(),
  seed_context_id: z.string().uuid(),
  graph_snapshot_id: z.string().uuid(),
  agent_snapshot_id: z.string().uuid(),
  from_agent_id: z.string().uuid(),
  to_agent_id: z.string().uuid(),
  relationship_type: z.string().min(1).max(120),
}).strict();

const unsafeVisibleText = /[\u0000-\u001f\u007f]|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:token|secret|password|api[_ -]?key)\b/i;

function safeVisibleText(value: string, fallback?: string) {
  const normalized = value.trim();
  const candidate = normalized || fallback;
  if (!candidate || unsafeVisibleText.test(candidate)) throw new Error("sandbox_overview_projection_invalid");
  return safeLabelSchema.parse(candidate);
}

function safeCurrentSummaries(agentData: unknown, relationData: unknown, seedId: string, snapshotId: string | null, graphId: string | null, graphLocked: boolean) {
  const agents = z.array(agentRowSchema).parse(agentData ?? []);
  const relations = z.array(relationRowSchema).parse(relationData ?? []);
  const agentIds = new Set<string>();
  for (const agent of agents) {
    if (agentIds.has(agent.id) || agent.seed_context_id !== seedId || agent.snapshot_id !== snapshotId) throw new Error("sandbox_overview_projection_invalid");
    agentIds.add(agent.id);
  }
  const relationIds = new Set<string>();
  const endpointPairs = new Set<string>();
  for (const relation of relations) {
    const endpointPair = `${relation.from_agent_id}:${relation.to_agent_id}`;
    if (relationIds.has(relation.id) || endpointPairs.has(endpointPair) || relation.seed_context_id !== seedId || relation.graph_snapshot_id !== graphId || relation.agent_snapshot_id !== snapshotId || !agentIds.has(relation.from_agent_id) || !agentIds.has(relation.to_agent_id)) {
      throw new Error("sandbox_overview_projection_invalid");
    }
    relationIds.add(relation.id);
    endpointPairs.add(endpointPair);
  }
  if (!graphLocked && relations.length) throw new Error("sandbox_overview_projection_invalid");
  const visibleAgents = agents.slice(0, 5);
  const ordinalById = new Map(visibleAgents.map((agent, index) => [agent.id, `person-${index + 1}`]));
  const peopleItems = visibleAgents.map((agent, index) => ({
    key: `person-${index + 1}`,
    label: safeVisibleText(agent.display_name),
    relationship: safeVisibleText(agent.relationship_to_user ?? "", agent.agent_type === "user_core" ? "self" : agent.agent_type === "user_variant" ? "parallel self" : "participant"),
    kind: agent.agent_type,
  }));
  const relationItems = relations.flatMap((relation) => {
    const fromPersonKey = ordinalById.get(relation.from_agent_id);
    const toPersonKey = ordinalById.get(relation.to_agent_id);
    return fromPersonKey && toPersonKey ? [{ fromPersonKey, toPersonKey, label: safeVisibleText(relation.relationship_type) }] : [];
  }).slice(0, 5).map((relation, index) => ({ key: `relation-${index + 1}`, ...relation }));
  return {
    peopleItems: z.array(personSummarySchema).max(5).parse(peopleItems),
    relationItems: z.array(relationSummarySchema).max(5).parse(relationItems),
  };
}

function runHref(kind: "running" | "result", id: string) {
  return kind === "running" ? `/app/simulation/running?run_id=${id}` : `/app/simulation/result?run_id=${id}`;
}

export async function readSandboxOverview(supabase: SupabaseClient, ownerId: string): Promise<SandboxOverview> {
  const { data: seedRecord, error: seedError } = await supabase.from("seed_contexts").select("id,status").eq("user_id", ownerId).eq("status", "submitted").not("submitted_at", "is", null).not("frozen_at", "is", null).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  if (seedError) throw new Error("seed_overview_read_failed");
  const seed = seedRecord ? seedSchema.parse(seedRecord) : null;
  if (!seed) return buildSandboxOverview({ authenticated: true, seed: null, confirmedPeopleCount: 0, immutableAgentsCount: 0, graph: { exists: false, locked: false, edgeCount: 0 }, runningRun: null, latestCompletedRun: null, historyCount: 0, hasFeedback: false });

  const [{ count: confirmedPeopleCount, error: peopleError }, { data: snapshotRecord, error: snapshotError }, { data: graphRecord, error: graphError }, { count: historyCount, error: historyError }] = await Promise.all([
    supabase.from("key_people").select("id", { count: "exact", head: true }).eq("user_id", ownerId).eq("seed_context_id", seed.id).eq("status", "confirmed"),
    supabase.from("agent_profile_snapshots").select("id").eq("user_id", ownerId).eq("seed_context_id", seed.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("relation_graph_snapshots").select("id,agent_snapshot_id,graph_locked").eq("user_id", ownerId).eq("seed_context_id", seed.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("simulations").select("id", { count: "exact", head: true }).eq("user_id", ownerId).eq("execution_version", "formal-account-sandbox-m1-v1"),
  ]);
  if (peopleError || snapshotError || graphError || historyError) throw new Error("sandbox_overview_read_failed");

  const snapshot = snapshotRecord ? snapshotSchema.parse(snapshotRecord) : null;
  const graph = graphRecord ? graphSchema.parse(graphRecord) : null;
  if (graph?.agent_snapshot_id && graph.agent_snapshot_id !== snapshot?.id) throw new Error("sandbox_overview_projection_invalid");
  const { data: edgeRows, count: edgeCount, error: edgesError } = graph && snapshot
    ? await supabase.from("relation_edges").select("id,seed_context_id,graph_snapshot_id,agent_snapshot_id,from_agent_id,to_agent_id,relationship_type", { count: "exact" }).eq("user_id", ownerId).eq("seed_context_id", seed.id).eq("agent_snapshot_id", snapshot.id).eq("graph_snapshot_id", graph.id).order("created_at").order("id")
    : { data: [], count: 0, error: null };
  if (edgesError) throw new Error("graph_edges_overview_read_failed");
  const { data: agentRows, count: immutableAgentsCount, error: agentsError } = snapshot ? await supabase.from("agent_profiles").select("id,seed_context_id,snapshot_id,display_name,relationship_to_user,agent_type", { count: "exact" }).eq("user_id", ownerId).eq("seed_context_id", seed.id).eq("snapshot_id", snapshot.id).order("created_at").order("id") : { data: [], count: 0, error: null };
  if (agentsError) throw new Error("agents_overview_read_failed");
  const summaries = safeCurrentSummaries(agentRows, edgeRows, seed.id, snapshot?.id ?? null, graph?.id ?? null, graph?.graph_locked ?? false);

  const [{ data: runningRecord, error: runningError }, { data: completedRecord, error: completedError }] = graph ? await Promise.all([
    supabase.from("simulations").select("id,status,completed_at").eq("user_id", ownerId).eq("execution_version", "formal-account-sandbox-m1-v1").eq("seed_context_id", seed.id).eq("graph_snapshot_id", graph.id).in("status", ["queued", "running"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("simulations").select("id,status,completed_at").eq("user_id", ownerId).eq("execution_version", "formal-account-sandbox-m1-v1").eq("seed_context_id", seed.id).eq("graph_snapshot_id", graph.id).eq("status", "completed").order("completed_at", { ascending: false }).limit(1).maybeSingle(),
  ]) : [{ data: null, error: null }, { data: null, error: null }];
  if (runningError || completedError) throw new Error("sandbox_overview_read_failed");
  const running = runningRecord ? runSchema.parse(runningRecord) : null;
  const completed = completedRecord ? runSchema.parse(completedRecord) : null;
  const { data: feedbackRecord, error: feedbackError } = completed ? await supabase.from("feedback_logs").select("id").eq("user_id", ownerId).eq("version", "formal-run-feedback-m1-v1").eq("seed_context_id", seed.id).eq("simulation_id", completed.id).order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null, error: null };
  if (feedbackError) throw new Error("sandbox_overview_read_failed");
  return buildSandboxOverview({
    authenticated: true, seed: { submitted: true }, confirmedPeopleCount: confirmedPeopleCount ?? 0, immutableAgentsCount: immutableAgentsCount ?? 0,
    peopleItems: summaries.peopleItems,
    graph: { exists: Boolean(graph), locked: graph?.graph_locked ?? false, edgeCount: edgeCount ?? 0 }, relationItems: summaries.relationItems,
    runningRun: running ? { href: runHref("running", running.id) } : null,
    latestCompletedRun: completed?.completed_at ? { status: "completed", completedAt: completed.completed_at, href: runHref("result", completed.id) } : null,
    historyCount: historyCount ?? 0, hasFeedback: Boolean(feedbackRecord),
  });
}
