import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDigitalLifeModel } from "@/lib/digital-life/model";
import { digitalLifeInput, digitalLifeRules, ids } from "@/lib/digital-life/test-fixtures";
import { safeDigitalLifeCorrectionContextSchema } from "@/lib/formal-sandbox/correction-context";

const state = vi.hoisted(() => ({ caller: null as unknown }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => state.caller }));
import { GET } from "./route";

const runId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function fixture() {
  const input = digitalLifeInput();
  const built = buildDigitalLifeModel(input, digitalLifeRules());
  if (!built.ok) throw new Error("Invalid test model");
  const profile = input.realityProfileSnapshot.profile;
  return {
    simulations: [{ id: runId, user_id: ids.owner, status: "completed", execution_version: "formal-account-sandbox-m1-v1", seed_context_id: ids.seed, graph_snapshot_id: ids.graph, time_horizon: "30_days", model: built.model, profile: input.realityProfileSnapshot }],
    seed_contexts: [{ id: ids.seed, user_id: ids.owner, status: "submitted", submitted_at: "2026-10-06T00:00:00.000Z", frozen_at: "2026-10-06T00:00:00.000Z" }],
    relation_graph_snapshots: [{ id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.snapshot, graph_locked: true, safety_level: "safe" }],
    agent_profiles: input.agents.map(agent => ({ id: agent.id, user_id: ids.owner, seed_context_id: ids.seed, snapshot_id: ids.snapshot, display_name: agent.displayName, agent_type: agent.sourceRole })),
    relation_edges: input.edges.map(edge => ({ id: edge.id, user_id: ids.owner, graph_snapshot_id: ids.graph, agent_snapshot_id: ids.snapshot, from_agent_id: edge.fromAgentId, to_agent_id: edge.toAgentId, relationship_type: edge.relationshipType })),
    reality_profiles: [{ id: ids.profile, user_id: ids.owner, seed_context_id: ids.seed, revision: profile.revision,
      life_climate_value: profile.lifeClimate.value, life_climate_classification: profile.lifeClimate.classification, life_climate_evidence_summary: profile.lifeClimate.evidenceSummary,
      resources_value: profile.resources.value, resources_classification: profile.resources.classification, resources_evidence_summary: profile.resources.evidenceSummary,
      constraints_value: profile.constraints.value, constraints_classification: profile.constraints.classification, constraints_evidence_summary: profile.constraints.evidenceSummary,
      life_goals: profile.goals, core_values: profile.values, life_themes: profile.lifeThemes, pressures: profile.pressures, external_variables: profile.externalVariables,
      life_model_domains: profile.lifeModelDomains, world_model_inputs: profile.worldInputs }],
  };
}
type Rows = ReturnType<typeof fixture>;
let rows: Rows;
let operations: Array<{ table: string; operation: string; args: unknown[] }>;
let user: { id: string; is_anonymous?: boolean } | null;
let failureTable: string | null;
let authError: boolean;
let throwAuth: boolean;

beforeEach(() => {
  rows = fixture(); operations = []; user = { id: ids.owner }; failureTable = null; authError = false; throwAuth = false;
  state.caller = { auth: { getUser: async () => {
    if (throwAuth) throw new Error("private auth diagnostic");
    return { data: { user }, error: authError ? { message: "private auth diagnostic" } : null };
  } }, from(table: keyof Rows) {
    const filters: Array<[string, unknown]> = [];
    let limit: number | undefined;
    const builder: Record<string, (...args: unknown[]) => unknown> = {};
    const result = () => ({ data: rows[table].filter(row => filters.every(([key, value]) => (row as Record<string, unknown>)[key] === value)).slice(0, limit), error: failureTable === table ? { message: "private database diagnostic" } : null });
    for (const operation of ["select", "eq", "not", "order", "limit"]) builder[operation] = (...args) => {
      operations.push({ table, operation, args });
      if (operation === "eq") filters.push([String(args[0]), args[1]]);
      if (operation === "limit") limit = Number(args[0]);
      return builder;
    };
    builder.maybeSingle = async () => { const value = result(); return { ...value, data: value.data[0] ?? null }; };
    builder.then = (resolve, reject) => Promise.resolve(result()).then(resolve as never, reject as never);
    return builder;
  } };
});

async function request(query = "", id = runId) {
  return GET(new Request(`http://local/api/sandbox/runs/${id}/correction-context${query}`), { params: Promise.resolve({ runId: id }) });
}
async function assertError(status: number, code: string) {
  const response = await request();
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body = await response.json();
  expect(body).toMatchObject({ ok: false, error_code: code });
  expect(Object.keys(body).sort()).toEqual(["error_code", "ok", "trace_id"]);
  return body;
}

describe("completed owner Run correction source through the real handler and helper", () => {
  it("returns exact frozen self/NPC/strategy rules and an unconfirmed draft without mutating history", async () => {
    const original = structuredClone(rows);
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(safeDigitalLifeCorrectionContextSchema.safeParse(body.context).success).toBe(true);
    expect(body.context.frozenRules).toEqual(digitalLifeRules());
    expect(body.context.draftRules.actions.every((rule: { confirmedForSimulation: boolean }) => rule.confirmedForSimulation === false)).toBe(true);
    expect(body.context.draftRules.strategies[0].confirmedForSimulation).toBe(false);
    expect(body.context.modelContext.agents.map((agent: { role: string }) => agent.role)).toEqual(["user_core", "npc", "user_variant"]);
    expect(body.context.horizonDays).toBe(30);
    expect(body.context.permissionsReset).toEqual({ planning: true, symbolic: true, outcomeCalibration: true, requestIdentity: true });
    expect(rows).toEqual(original);
    expect(operations.filter(op => op.operation === "select").every(op => !/evidence_refs|raw_context|birth|result_bundle|\*/.test(String(op.args[0])))).toBe(true);
    expect(operations).toContainEqual({ table: "simulations", operation: "eq", args: ["user_id", ids.owner] });
    expect(operations).toContainEqual({ table: "simulations", operation: "eq", args: ["execution_version", "formal-account-sandbox-m1-v1"] });
    expect(operations).toContainEqual({ table: "seed_contexts", operation: "order", args: ["submitted_at", { ascending: false }] });
    expect(operations).toContainEqual({ table: "agent_profiles", operation: "order", args: ["id"] });
    expect(operations).toContainEqual({ table: "relation_edges", operation: "order", args: ["id"] });
    const display = JSON.stringify({ agents: body.context.modelContext.agents, relationships: body.context.modelContext.relationships, resources: body.context.modelContext.resources, draft: body.context.draftRules.actions });
    expect(display).not.toMatch(/11111111|55555555|focus-time|seed:self|seed:person|private|birth/);
  });
  it.each([null, { id: ids.owner, is_anonymous: true }])("rejects missing and anonymous verified users before source reads", async value => {
    user = value;
    await assertError(401, "unauthenticated");
    expect(operations).toEqual([]);
  });
  it("rejects getUser errors even if a user object was returned", async () => {
    authError = true; await assertError(401, "unauthenticated"); expect(operations).toEqual([]);
  });
  it.each(["missing", "foreign", "legacy_execution"])("hides %s Runs with the same 404", async mode => {
    if (mode === "missing") rows.simulations = [];
    if (mode === "foreign") rows.simulations[0].user_id = ids.npc;
    if (mode === "legacy_execution") rows.simulations[0].execution_version = "legacy";
    await assertError(404, "run_not_found");
    expect(operations.some(op => op.table !== "simulations")).toBe(false);
  });
  it("requires completion", async () => { rows.simulations[0].status = "running"; await assertError(409, "run_not_completed"); });
  it("does not invent rules for a legacy model", async () => {
    Object.assign(rows.simulations[0], { model: null });
    await assertError(409, "correction_rules_not_recorded");
  });
  it.each(["seed", "graph", "snapshot", "unlocked", "unsafe", "profile_revision", "profile_id", "resources", "person_order", "person_identity", "relation_identity", "relation_endpoint"])("rejects stale %s bindings rather than rebinding ordinal keys", async mode => {
    if (mode === "seed") rows.seed_contexts[0].id = otherId;
    if (mode === "graph") rows.relation_graph_snapshots[0].id = otherId;
    if (mode === "snapshot") rows.relation_graph_snapshots[0].agent_snapshot_id = otherId;
    if (mode === "unlocked") rows.relation_graph_snapshots[0].graph_locked = false;
    if (mode === "unsafe") rows.relation_graph_snapshots[0].safety_level = "blocked";
    if (mode === "profile_revision") rows.reality_profiles[0].revision++;
    if (mode === "profile_id") rows.reality_profiles[0].id = otherId;
    if (mode === "resources") rows.reality_profiles[0].world_model_inputs.resources[0].key = "replacement";
    if (mode === "person_order") rows.agent_profiles.reverse();
    if (mode === "person_identity") rows.agent_profiles[1].id = otherId;
    if (mode === "relation_identity") rows.relation_edges[0].id = otherId;
    if (mode === "relation_endpoint") rows.relation_edges[0].to_agent_id = ids.variant;
    await assertError(409, "correction_source_stale");
  });
  it("rejects malformed frozen rules and scope without projecting a draft", async () => {
    rows.simulations[0].model.rules.actions[1].when = { kind: "after_rule", ruleKey: "rule-99" };
    await assertError(409, "correction_source_invalid");
  });
  it("sanitizes database failures", async () => { failureTable = "agent_profiles"; await assertError(500, "persistence_failed"); });
  it("sanitizes thrown Auth and absent-client failures", async () => {
    throwAuth = true; await assertError(500, "persistence_failed");
    state.caller = null; await assertError(500, "persistence_failed");
  });
  it("rejects client owner/selectors and malformed Run IDs", async () => {
    for (const query of ["?user_id=foreign", "?graph_id=foreign", "?run_id=other&run_id=other"]) expect((await request(query)).status).toBe(422);
    expect((await request("", "bad")).status).toBe(422);
    expect(operations).toEqual([]);
  });
  it("the strict DTO rejects private fields and retained authorizations", async () => {
    const response = await request();
    const { context } = await response.json();
    expect(response.status).toBe(200);
    expect(safeDigitalLifeCorrectionContextSchema.safeParse({ ...context, defaultPlanning: {} }).success).toBe(false);
    const forged = structuredClone(context); forged.draftRules.actions[0].confirmedForSimulation = true;
    expect(safeDigitalLifeCorrectionContextSchema.safeParse(forged).success).toBe(false);
  });
});
