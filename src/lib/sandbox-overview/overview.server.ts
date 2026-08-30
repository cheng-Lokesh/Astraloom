import { z } from "zod";

import type { SupabaseClient } from "@supabase/supabase-js";

const hrefSchema = z.string().regex(/^(?:\/app\/|\/login$)/).max(500);
const notModeledSchema = z.object({ state: z.literal("not_modeled") }).strict();

export const sandboxOverviewSchema = z.object({
  authenticated: z.boolean(),
  seed: z.object({ state: z.enum(["not_started", "submitted"]) }).strict(),
  reality: notModeledSchema,
  people: z.object({ confirmedCount: z.number().int().nonnegative() }).strict(),
  agents: z.object({ immutableCount: z.number().int().nonnegative() }).strict(),
  graph: z.object({ exists: z.boolean(), locked: z.boolean(), edgeCount: z.number().int().nonnegative() }).strict(),
  running: z.object({ exists: z.boolean(), href: hrefSchema.nullable() }).strict(),
  latestCompletedRun: z.object({ status: z.literal("completed"), completedAt: z.string().datetime({ offset: true }), href: hrefSchema }).strict().nullable(),
  history: z.object({ count: z.number().int().nonnegative() }).strict(),
  feedback: z.object({ exists: z.boolean() }).strict(),
  lifeClimate: notModeledSchema,
  resources: notModeledSchema,
  constraints: notModeledSchema,
  nextChange: notModeledSchema,
  nextAction: z.object({
    kind: z.enum(["sign_in", "start_intake", "review_people", "build_agents", "review_graph", "start_run", "open_running", "open_latest_result"]),
    href: hrefSchema,
  }).strict(),
}).strict();

export type SandboxOverview = z.infer<typeof sandboxOverviewSchema>;

export type SandboxOverviewSource = {
  authenticated: boolean;
  seed: { submitted: boolean } | null;
  confirmedPeopleCount: number;
  immutableAgentsCount: number;
  graph: { exists: boolean; locked: boolean; edgeCount: number };
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
                ? { kind: "open_latest_result" as const, href: source.latestCompletedRun.href }
                : { kind: "start_run" as const, href: "/app/new/graph" };

  return sandboxOverviewSchema.parse({
    authenticated: source.authenticated,
    seed: { state: source.seed?.submitted ? "submitted" : "not_started" },
    reality: noModel,
    people: { confirmedCount: source.confirmedPeopleCount },
    agents: { immutableCount: source.immutableAgentsCount },
    graph: source.graph,
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

const seedSchema = z.object({ id: z.string().uuid(), status: z.literal("submitted") }).strip();
const snapshotSchema = z.object({ id: z.string().uuid() }).strip();
const graphSchema = z.object({ id: z.string().uuid(), graph_locked: z.boolean() }).strip();
const runSchema = z.object({ id: z.string().uuid(), status: z.string(), completed_at: z.string().datetime({ offset: true }).nullable() }).strip();

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
    supabase.from("relation_graph_snapshots").select("id,graph_locked").eq("user_id", ownerId).eq("seed_context_id", seed.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("simulations").select("id", { count: "exact", head: true }).eq("user_id", ownerId).eq("execution_version", "formal-account-sandbox-m1-v1"),
  ]);
  if (peopleError || snapshotError || graphError || historyError) throw new Error("sandbox_overview_read_failed");

  const snapshot = snapshotRecord ? snapshotSchema.parse(snapshotRecord) : null;
  const graph = graphRecord ? graphSchema.parse(graphRecord) : null;
  const { count: edgeCount, error: edgesError } = graph ? await supabase.from("relation_edges").select("id", { count: "exact", head: true }).eq("user_id", ownerId).eq("graph_snapshot_id", graph.id) : { count: 0, error: null };
  if (edgesError) throw new Error("graph_edges_overview_read_failed");
  const { count: immutableAgentsCount, error: agentsError } = snapshot ? await supabase.from("agent_profiles").select("id", { count: "exact", head: true }).eq("user_id", ownerId).eq("seed_context_id", seed.id).eq("snapshot_id", snapshot.id) : { count: 0, error: null };
  if (agentsError) throw new Error("agents_overview_read_failed");

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
    graph: { exists: Boolean(graph), locked: graph?.graph_locked ?? false, edgeCount: edgeCount ?? 0 },
    runningRun: running ? { href: runHref("running", running.id) } : null,
    latestCompletedRun: completed?.completed_at ? { status: "completed", completedAt: completed.completed_at, href: runHref("result", completed.id) } : null,
    historyCount: historyCount ?? 0, hasFeedback: Boolean(feedbackRecord),
  });
}
