import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  client: null as unknown,
  service: null as unknown,
  serviceFactory: vi.fn(),
  rpc: vi.fn(),
  tables: {} as Record<string, unknown>,
  operations: [] as string[],
}));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => state.client }));
vi.mock("@/lib/supabase/service-role.server", () => ({ getServiceRoleSupabaseClient: () => state.serviceFactory() }));

import { GET, POST } from "./route";
import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";
import { buildLifeClimatePathRun, buildLifeClimateRun } from "@/lib/life-climate/engine";

const userId = "22222222-2222-4222-8222-222222222222";
const seedId = "33333333-3333-4333-8333-333333333333";
const runId = "44444444-4444-4444-8444-444444444444";

function query(result: unknown) {
  const builder: Record<string, unknown> = {};
  builder.select = (value: string) => { state.operations.push(`select:${value}`); return builder; };
  builder.eq = (key: string, value: unknown) => { state.operations.push(`eq:${key}:${String(value)}`); return builder; };
  builder.in = (key: string, value: unknown[]) => { state.operations.push(`in:${key}:${value.join(",")}`); return builder; };
  builder.not = (key: string, operator: string, value: unknown) => { state.operations.push(`not:${key}:${operator}:${String(value)}`); return builder; };
  builder.order = (key: string) => { state.operations.push(`order:${key}`); return builder; };
  builder.limit = (value: number) => { state.operations.push(`limit:${value}`); return builder; };
  builder.maybeSingle = async () => result;
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

function authClient(user: string | null) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: user ? { id: user } : null } }) },
    from: vi.fn((table: string) => query(state.tables[table])),
  };
}

function profileRow() {
  const profile = createEmptyRealityProfileDraft(7);
  return {
    life_climate_value: null, life_climate_classification: "unknown", life_climate_evidence_summary: "明确未知",
    resources_value: null, resources_classification: "unknown", resources_evidence_summary: "明确未知",
    constraints_value: null, constraints_classification: "unknown", constraints_evidence_summary: "明确未知",
    life_goals: profile.goals, core_values: profile.values, life_themes: profile.lifeThemes,
    pressures: profile.pressures, external_variables: profile.externalVariables,
    life_model_domains: profile.lifeModelDomains, world_model_inputs: profile.worldInputs, revision: profile.revision,
  };
}

function seedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: seedId,
    user_question: "",
    raw_context: "",
    decision_options: [],
    forbidden_actions: [],
    desired_output: {},
    safety_flags: [],
    ...overrides,
  };
}

const change = {
  domain: "career",
  entryIndex: 0,
  startPeriod: 2,
  newState: "尝试四天工作制",
  evidenceSummary: "本人设定的备选路径假设",
} as const;

describe("Track B life-climate runs route", () => {
  beforeEach(() => {
    state.client = authClient(null);
    state.service = { rpc: state.rpc };
    state.serviceFactory.mockReset().mockReturnValue(state.service);
    state.rpc.mockReset();
    state.tables = {};
    state.operations = [];
  });

  it("requires the cookie-authenticated owner before accessing the writer", async () => {
    const response = await POST(new Request("http://local/api/life-climate/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idempotency_key: "55555555-5555-4555-8555-555555555555", profile_revision: 7, change }),
    }));

    expect(response.status).toBe(401);
    expect(state.serviceFactory).not.toHaveBeenCalled();
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it("rejects forged owner or unsupported horizons before reading or writing profile data", async () => {
    state.client = authClient(userId);
    const base = { idempotency_key: "55555555-5555-4555-8555-555555555555", profile_revision: 7, change };
    const forged = await POST(new Request("http://local/api/life-climate/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...base, user_id: "99999999-9999-4999-8999-999999999999" }) }));
    const unsupported = await POST(new Request("http://local/api/life-climate/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...base, horizon: "5_years" }) }));

    expect(forged.status).toBe(422);
    expect(unsupported.status).toBe(422);
    expect(state.client && (state.client as ReturnType<typeof authClient>).from).not.toHaveBeenCalled();
    expect(state.serviceFactory).not.toHaveBeenCalled();
  });

  it("rejects a path that mixes unrelated life themes before reading or writing profile data", async () => {
    state.client = authClient(userId);
    const mixedChanges = [
      { ...change, startPeriod: 1 },
      { ...change, domain: "wealth" as const, startPeriod: 2, newState: "增加储备" },
    ];
    const response = await POST(new Request("http://local/api/life-climate/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idempotency_key: "55555555-5555-4555-8555-555555555557",
        profile_revision: 7,
        horizon: "3_years",
        changes: mixedChanges,
      }),
    }));

    expect(response.status).toBe(422);
    expect(state.client && (state.client as ReturnType<typeof authClient>).from).not.toHaveBeenCalled();
    expect(state.serviceFactory).not.toHaveBeenCalled();
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it("binds the immutable run to the authenticated user's current submitted Seed and exact profile revision", async () => {
    state.client = authClient(userId);
    state.tables.seed_contexts = { data: seedRow(), error: null };
    state.tables.reality_profiles = { data: profileRow(), error: null };
    const resultBundle = buildLifeClimateRun(createEmptyRealityProfileDraft(7), {
      horizon: "1_year",
      profileRevision: 7,
      change,
    });
    state.rpc.mockResolvedValue({ data: [{ id: runId, idempotent: false, created_at: "2026-09-28T00:00:00.000Z", result_bundle: resultBundle }], error: null });

    const response = await POST(new Request("http://local/api/life-climate/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idempotency_key: "55555555-5555-4555-8555-555555555555", profile_revision: 7, change }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(state.rpc).toHaveBeenCalledOnce();
    expect(state.rpc).toHaveBeenCalledWith("persist_life_climate_run_b1", expect.objectContaining({
      p_user_id: userId,
      p_seed_context_id: seedId,
      p_profile_revision: 7,
      p_idempotency_key: "55555555-5555-4555-8555-555555555555",
      p_result_bundle: expect.objectContaining({ version: "life-climate-b1-v1" }),
    }));
    expect(body).toMatchObject({ ok: true, error_code: null, idempotent: false, run: { id: runId } });
    expect(JSON.stringify(body)).not.toContain(userId);
  });

  it("saves a multi-stage 3-year path with all user assumptions in the versioned owner-scoped writer", async () => {
    state.client = authClient(userId);
    state.tables.seed_contexts = { data: seedRow(), error: null };
    state.tables.reality_profiles = { data: profileRow(), error: null };
    const input = {
      horizon: "3_years" as const,
      profileRevision: 7,
      changes: [
        { ...change, startPeriod: 1 },
        { domain: "career" as const, entryIndex: 0, startPeriod: 3, newState: "逐步转向顾问工作", evidenceSummary: "本人设定的备选假设" },
      ],
    };
    const resultBundle = buildLifeClimatePathRun(createEmptyRealityProfileDraft(7), input);
    state.rpc.mockResolvedValue({ data: [{ id: runId, idempotent: false, created_at: "2026-09-28T00:00:00.000Z", result_bundle: resultBundle }], error: null });

    const response = await POST(new Request("http://local/api/life-climate/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idempotency_key: "55555555-5555-4555-8555-555555555556", profile_revision: 7, horizon: input.horizon, changes: input.changes }),
    }));
    const body = await response.json();

    expect(state.rpc).toHaveBeenCalledOnce();
    expect(response.status).toBe(201);
    expect(state.rpc).toHaveBeenCalledWith("persist_life_climate_run_b2", expect.objectContaining({
      p_user_id: userId,
      p_seed_context_id: seedId,
      p_profile_revision: 7,
      p_result_bundle: expect.objectContaining({ version: "life-climate-b2-v1", horizon: "3_years", events: expect.any(Array), claims: expect.any(Array) }),
      p_input_snapshot: expect.objectContaining({ version: "life-climate-b2-v1", horizon: "3_years", changes: input.changes }),
    }));
    expect(body.run.result.events).toHaveLength(2);
    expect(body.run.result.claims.map((item: { evidenceEventIds: string[] }) => item.evidenceEventIds[0])).toEqual(body.run.result.events.map((item: { id: string }) => item.id));
    expect(JSON.stringify(body)).not.toContain(userId);
  });

  it("reopens a saved multi-year path from the same owner-scoped history ledger", async () => {
    state.client = authClient(userId);
    const input = {
      horizon: "3_years" as const,
      profileRevision: 7,
      changes: [{ ...change, startPeriod: 2 }],
    };
    const result = buildLifeClimatePathRun(createEmptyRealityProfileDraft(7), input);
    state.tables.life_climate_runs = {
      data: {
        id: runId,
        created_at: "2026-09-28T00:00:00.000Z",
        profile_revision: 7,
        input_snapshot: { version: result.version, horizon: result.horizon, profileRevision: result.profileRevision, changes: result.selectedChanges },
        result_bundle: result,
      },
      error: null,
    };

    const response = await GET(new Request(`http://local/api/life-climate/runs?run_id=${runId}`));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(state.operations).toContain("in:version:life-climate-b1-v1,life-climate-b2-v1");
    expect(state.operations).toContain(`eq:user_id:${userId}`);
    expect(body.run.result).toMatchObject({ version: "life-climate-b2-v1", horizon: "3_years" });
    expect(body.run.result.paths[0].periods).toHaveLength(3);
  });

  it("applies the safety gate to the current submitted Seed before invoking the writer", async () => {
    state.client = authClient(userId);
    state.tables.seed_contexts = { data: seedRow({ user_question: "How should I attack my manager?" }), error: null };
    state.tables.reality_profiles = { data: profileRow(), error: null };
    const resultBundle = buildLifeClimateRun(createEmptyRealityProfileDraft(7), {
      horizon: "1_year",
      profileRevision: 7,
      change,
    });
    state.rpc.mockResolvedValue({ data: [{ id: runId, idempotent: false, created_at: "2026-09-28T00:00:00.000Z", result_bundle: resultBundle }], error: null });

    const response = await POST(new Request("http://local/api/life-climate/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idempotency_key: "55555555-5555-4555-8555-555555555555", profile_revision: 7, change }),
    }));

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "safety_downgrade" });
    expect(state.serviceFactory).not.toHaveBeenCalled();
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it("reads versioned owner-scoped Track B entries and rejects malformed query selectors", async () => {
    state.client = authClient(userId);
    state.tables.life_climate_runs = { data: [], error: null };

    const response = await GET(new Request("http://local/api/life-climate/runs?limit=10"));
    const invalid = await GET(new Request("http://local/api/life-climate/runs?user_id=99999999-9999-4999-8999-999999999999"));

    expect(response.status).toBe(200);
    expect(state.operations).toContain(`eq:user_id:${userId}`);
    expect(state.operations).toContain("in:version:life-climate-b1-v1,life-climate-b2-v1");
    expect(invalid.status).toBe(422);
  });
});
