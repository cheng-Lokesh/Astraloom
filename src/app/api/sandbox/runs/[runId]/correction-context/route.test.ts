import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDigitalLifeModel } from "@/lib/digital-life/model";
import { digitalLifeInput, digitalLifeRules, ids } from "@/lib/digital-life/test-fixtures";
import { safeDigitalLifeCorrectionContextSchema } from "@/lib/formal-sandbox/correction-context";
import { readFormalCorrectionContext } from "@/lib/formal-sandbox/correction-context.server";
import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";

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
    simulations: [{ id: runId, user_id: ids.owner, status: "completed", execution_version: "formal-account-sandbox-m1-v1", seed_context_id: ids.seed, graph_snapshot_id: ids.graph, time_horizon: "30_days", model: built.model, profile: structuredClone(input.realityProfileSnapshot) }],
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
    if (failureTable === `throw:${table}`) throw new Error("private database diagnostic");
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
  it("accepts a 90-day frozen source with matching typed rules", async () => {
    const input = { ...digitalLifeInput(), horizonDays: 90 };
    const rules = digitalLifeRules(); rules.actions[0].when = { kind: "at_tick", tickIndex: 5 };
    const built = buildDigitalLifeModel(input, rules);
    expect(built.ok).toBe(true); if (!built.ok) return;
    rows.simulations[0].model = built.model; rows.simulations[0].time_horizon = "90_days";
    const response = await request(); expect(response.status).toBe(200);
    expect((await response.json()).context.horizonDays).toBe(90);
  });
  it("accepts only an exact unrecorded Profile at revision zero", async () => {
    const input = digitalLifeInput();
    Object.assign(input.realityProfileSnapshot, { profileId: null, revision: 0, profile: createEmptyRealityProfileDraft() });
    const rules = digitalLifeRules(); rules.profileRevision = 0;
    rules.actions = rules.actions.slice(0, 2); rules.strategies = [];
    const built = buildDigitalLifeModel(input, rules);
    expect(built.ok).toBe(true); if (!built.ok) return;
    rows.simulations[0].model = built.model; rows.simulations[0].profile = structuredClone(input.realityProfileSnapshot);
    rows.reality_profiles = [];
    const response = await request(); expect(response.status).toBe(200);
    expect((await response.json()).context.modelContext.resources).toEqual([]);
  });
  it("rejects resource reordering even when labels and Profile revision are unchanged", async () => {
    const input = digitalLifeInput();
    input.realityProfileSnapshot.profile.worldInputs.resources.push({ ...input.realityProfileSnapshot.profile.worldInputs.resources[0], key: "second-time" });
    const built = buildDigitalLifeModel(input, digitalLifeRules());
    expect(built.ok).toBe(true); if (!built.ok) return;
    rows.simulations[0].model = built.model; rows.simulations[0].profile = structuredClone(input.realityProfileSnapshot);
    rows.reality_profiles[0].world_model_inputs.resources = structuredClone(input.realityProfileSnapshot.profile.worldInputs.resources).reverse();
    await assertError(409, "correction_source_stale");
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
  it.each(["version", "owner", "seed", "graph", "profile", "missing_rules"])("rejects invalid frozen %s without repairing its source", async mode => {
    if (mode === "version") Object.assign(rows.simulations[0].model, { version: "future-version" });
    if (mode === "owner") rows.simulations[0].model.ownerId = ids.npc;
    if (mode === "seed") rows.simulations[0].model.seedContextId = otherId;
    if (mode === "graph") rows.simulations[0].model.graphSnapshotId = otherId;
    if (mode === "profile") rows.simulations[0].profile.revision++;
    if (mode === "missing_rules") Reflect.deleteProperty(rows.simulations[0].model, "rules");
    await assertError(409, "correction_source_invalid");
    expect(operations.some(op => op.table !== "simulations")).toBe(false);
  });
  it.each(["agent_profiles", "relation_edges", "reality_profiles"])("rejects missing or foreign current %s", async table => {
    for (const row of rows[table as "agent_profiles" | "relation_edges" | "reality_profiles"]) row.user_id = ids.npc;
    await assertError(409, "correction_source_stale");
  });
  it("rejects a malformed current Profile instead of falling back to frozen data", async () => {
    Object.assign(rows.reality_profiles[0], { world_model_inputs: { resources: "malformed" } });
    await assertError(409, "correction_source_stale");
  });
  it.each(["simulations", "seed_contexts", "relation_graph_snapshots", "agent_profiles", "relation_edges", "reality_profiles"])("sanitizes %s database failures", async table => { failureTable = table; await assertError(500, "persistence_failed"); });
  it("sanitizes a thrown query without partial source output", async () => { failureTable = "throw:relation_edges"; await assertError(500, "persistence_failed"); });
  it("the helper rejects malformed owner/run identifiers before any query", async () => {
    expect(await readFormalCorrectionContext(state.caller as never, "bad", runId)).toEqual({ ok: false, errorCode: "invalid_request" });
    expect(await readFormalCorrectionContext(state.caller as never, ids.owner, "bad")).toEqual({ ok: false, errorCode: "invalid_request" });
    expect(operations).toEqual([]);
  });
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
