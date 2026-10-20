import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ client: null as unknown, service: null as unknown, rpc: vi.fn(), serviceFactory: vi.fn(), tables: {} as Record<string, { data: unknown; error: unknown }>, operations: [] as string[] }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => state.client }));
vi.mock("@/lib/supabase/service-role.server", () => ({ getServiceRoleSupabaseClient: () => state.serviceFactory() }));

import { POST } from "@/app/api/life-climate/runs/route";
import { GET as sourceGET } from "@/app/api/life-climate/b3/source/route";
import { GET as intentsGET } from "@/app/api/life-climate/b3/intents/route";
import { GET as runsGET } from "@/app/api/life-climate/b3/runs/route";
import { buildLifeClimateB3Run, lifeClimateB3RequestSchema } from "@/lib/life-climate/b3";
import { businessFixture } from "@/lib/life-climate/b3/business.test-fixtures";

const owner = "22222222-2222-4222-8222-222222222222";
const key = "55555555-5555-4555-8555-555555555555";
const intentId = "66666666-6666-4666-8666-666666666666";
const runId = "77777777-7777-4777-8777-777777777777";
const createdAt = "2026-10-20T00:00:00.000Z";

function query(table: string) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "limit"]) builder[method] = (...args: unknown[]) => {
    state.operations.push(`${table}:${method}:${args.map(String).join(":")}`); return builder;
  };
  builder.maybeSingle = async () => state.tables[table];
  builder.then = (resolve: (value: unknown) => unknown, reject: (value: unknown) => unknown) => Promise.resolve(state.tables[table]).then(resolve, reject);
  return builder;
}

function auth(error: unknown = null, anonymous = false) {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: owner, is_anonymous: anonymous } }, error }) }, from: vi.fn((table: string) => query(table)) };
}
function bodyFixture() {
  const fixture = businessFixture();
  const request = lifeClimateB3RequestSchema.parse(fixture.request);
  const body = { idempotency_key: key, request };
  const intent = {
    id: intentId, idempotency_key: key, created_at: createdAt, normalized_request: request, source_snapshot: fixture.source,
    seed_safety: { user_question: "如何安排未来的学习和生活", raw_context: "本人确认的结构对照", safety_flags: [] }, symbolic_input: null,
  };
  return { ...fixture, request, body, intent };
}
function privateFree(intent: ReturnType<typeof bodyFixture>["intent"]) {
  const { seed_safety: _seed, symbolic_input: _symbolic, ...publicIntent } = intent;
  void _seed; void _symbolic;
  return publicIntent;
}
async function completedFixture() {
  const fixture = bodyFixture();
  const run = await buildLifeClimateB3Run(fixture.source, fixture.request);
  const receipt = { id: runId, intent_id: intentId, created_at: createdAt, status: "completed", error_code: null, result_bundle: run };
  return { ...fixture, run, receipt };
}
function post(body: unknown) { return POST(new Request("http://local/api/life-climate/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })); }

describe("B3 frozen intent lifecycle and owner recovery", () => {
  beforeEach(() => {
    state.rpc.mockReset(); state.serviceFactory.mockReset(); state.operations = []; state.tables = {};
    state.client = auth(); state.service = { rpc: state.rpc }; state.serviceFactory.mockReturnValue(state.service);
  });

  it("persists the actual three-path resource/learning result, then projects away private source bindings", async () => {
    const fixture = bodyFixture();
    state.rpc.mockImplementation(async (name, args) => name === "reserve_life_climate_b3_intent"
      ? { data: { intent: fixture.intent, receipt: null, idempotent: false }, error: null }
      : { data: { receipt: { id: runId, intent_id: intentId, created_at: createdAt, status: "completed", error_code: null, result_bundle: args.p_result_bundle }, idempotent: false }, error: null });
    const response = await post(fixture.body);
    const payload = await response.json();
    expect(response.status).toBe(201);
    expect(payload.run.result.paths).toHaveLength(3);
    expect(payload.run.result.events.length).toBeGreaterThan(0);
    expect(payload.run.result.claims.every((claim: { evidenceEventIds: string[] }) => claim.evidenceEventIds.length > 0)).toBe(true);
    expect(payload.run.result.sourceSnapshot).not.toHaveProperty("binding");
    expect(JSON.stringify(payload)).not.toMatch(/birthDate|birthTime|seed_safety/);
    expect(state.rpc.mock.calls[1]).toEqual(["finalize_life_climate_b3_receipt", expect.objectContaining({ p_user_id: owner, p_idempotency_key: key, p_request: fixture.request, p_error_code: null })]);
    expect((state.client as ReturnType<typeof auth>).from).not.toHaveBeenCalled();
  });

  it("recovers a completed original receipt without consulting today's changed Seed/Profile", async () => {
    const fixture = await completedFixture();
    state.rpc.mockResolvedValue({ data: { intent: fixture.intent, receipt: fixture.receipt, idempotent: true }, error: null });
    state.tables.reality_profiles = { data: { revision: 99 }, error: null };
    const response = await post(fixture.body);
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.idempotent).toBe(true);
    expect(payload.run.result.profileRevision).toBe(7);
    expect(payload.run.result.requestSnapshot).toEqual(fixture.request);
    expect(state.rpc).toHaveBeenCalledTimes(1);
    expect((state.client as ReturnType<typeof auth>).from).not.toHaveBeenCalled();
  });

  it("keeps a transport failure pending and retries exactly the same frozen request", async () => {
    const fixture = bodyFixture();
    let attempts = 0;
    state.rpc.mockImplementation(async (name, args) => {
      if (name === "reserve_life_climate_b3_intent") return { data: { intent: fixture.intent, receipt: null, idempotent: true }, error: null };
      attempts += 1;
      return attempts === 1 ? { data: null, error: { code: "08006", message: "temporary database detail" } }
        : { data: { receipt: { id: runId, intent_id: intentId, created_at: createdAt, status: "completed", error_code: null, result_bundle: args.p_result_bundle }, idempotent: false }, error: null };
    });
    expect((await post(fixture.body)).status).toBe(500);
    expect((await post(fixture.body)).status).toBe(201);
    const reservations = state.rpc.mock.calls.filter(([name]) => name === "reserve_life_climate_b3_intent");
    expect(reservations.map(([, args]) => args.p_request)).toEqual([fixture.request, fixture.request]);
    expect(state.rpc.mock.calls.filter(([name]) => name === "finalize_life_climate_b3_receipt").every(([, args]) => args.p_error_code === null)).toBe(true);
  });

  it("sanitizes a synchronous service-client configuration exception into a no-store failure", async () => {
    state.serviceFactory.mockImplementation(() => { throw new Error("private invalid service configuration"); });
    const response = await post(bodyFixture().body);
    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ ok: false, error_code: "persistence_failed" });
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it("writes a sanitized terminal safety rejection before creating any simulation Events", async () => {
    const fixture = bodyFixture();
    fixture.intent.seed_safety.user_question = "How should I attack my manager?";
    state.rpc.mockImplementation(async (name, args) => name === "reserve_life_climate_b3_intent"
      ? { data: { intent: fixture.intent, receipt: null, idempotent: false }, error: null }
      : { data: { receipt: { id: runId, intent_id: intentId, created_at: createdAt, status: "rejected", error_code: args.p_error_code, result_bundle: args.p_result_bundle }, idempotent: false }, error: null });
    const response = await post(fixture.body);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error_code: "safety_downgrade" });
    expect(state.rpc.mock.calls[1][1]).toMatchObject({ p_error_code: "safety_downgrade", p_result_bundle: null });
  });

  it("returns the original terminal refusal on replay without rebuilding or a new write", async () => {
    const fixture = bodyFixture();
    const receipt = { id: runId, intent_id: intentId, created_at: createdAt, status: "rejected", error_code: "safety_downgrade", result_bundle: null };
    state.rpc.mockResolvedValue({ data: { intent: fixture.intent, receipt, idempotent: true }, error: null });
    const response = await post(fixture.body);
    expect(response.status).toBe(403);
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });

  it.each([{ flags: ["self_harm"] }, { flags: { safetyLevel: "downgraded", flags: [] } }])("preserves an already-positive frozen safety decision even with neutral narrative: %o", async ({ flags }) => {
    const fixture = bodyFixture();
    const intent = { ...fixture.intent, seed_safety: { ...fixture.intent.seed_safety, safety_flags: flags } };
    state.rpc.mockImplementation(async (name, args) => name === "reserve_life_climate_b3_intent"
      ? { data: { intent, receipt: null, idempotent: false }, error: null }
      : { data: { receipt: { id: runId, intent_id: intentId, created_at: createdAt, status: args.p_error_code ? "rejected" : "completed", error_code: args.p_error_code, result_bundle: args.p_result_bundle }, idempotent: false }, error: null });
    const response = await post(fixture.body);
    expect(response.status).toBe(403);
    expect(state.rpc.mock.calls[1][1]).toMatchObject({ p_error_code: "safety_downgrade", p_result_bundle: null });
  });

  it.each([{ error: { message: "verification failed" }, anonymous: false }, { error: null, anonymous: true }])("rejects failed verified Auth and anonymous owners on every B3 surface: %o", async ({ error, anonymous }) => {
    state.client = auth(error, anonymous);
    expect((await post(bodyFixture().body)).status).toBe(401);
    for (const [handler, url] of [[sourceGET, "source"], [intentsGET, "intents"], [runsGET, "runs"]] as const) expect((await handler(new Request(`http://local/api/life-climate/b3/${url}`))).status).toBe(401);
    expect(state.serviceFactory).not.toHaveBeenCalled();
    expect((state.client as ReturnType<typeof auth>).from).not.toHaveBeenCalled();
  });

  it("prepares separately calculated future reference frames without exposing stored birth data", async () => {
    const fixture = bodyFixture();
    state.rpc.mockResolvedValue({ data: { source_snapshot: fixture.source, symbolic_input: { birthDate: "1990-06-15", birthTime: null, sourceVersion: 2, consentRevision: 4, referenceDate: "2026-10-20" } }, error: null });
    const response = await sourceGET(new Request("http://local/api/life-climate/b3/source?horizon=5_years"));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.source.symbolic.series).toHaveLength(5);
    expect(new Set(payload.source.symbolic.series.map((item: { frame: { referencePeriod: { referenceDate: string } } }) => item.frame.referencePeriod.referenceDate)).size).toBe(5);
    expect(payload.source.symbolic.series.every((item: { frame: { calculation: { precision: string } } }) => item.frame.calculation.precision === "date_only")).toBe(true);
    // inputUsed:['birthDate'] is safe precision metadata, not a raw source value.
    expect(JSON.stringify(payload)).not.toMatch(/1990-06-15|"birthDate":|"birthTime":|seedContextId|assessedAt/);
  });

  it("reopens a pending request after refresh using owner-scoped originalBody, without browser storage", async () => {
    const fixture = bodyFixture();
    state.tables.life_climate_b3_intents = { data: privateFree(fixture.intent), error: null };
    state.tables.life_climate_b3_receipts = { data: null, error: null };
    const response = await intentsGET(new Request(`http://local/api/life-climate/b3/intents?key=${key}`));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.intent).toMatchObject({ status: "pending", originalBody: fixture.body, receipt: null });
    expect(state.operations).toContain(`life_climate_b3_intents:eq:user_id:${owner}`);
    expect(state.operations).toContain(`life_climate_b3_receipts:eq:user_id:${owner}`);
    expect(state.serviceFactory).not.toHaveBeenCalled();
    expect(JSON.stringify(payload)).not.toMatch(/seed_safety|birthDate|seedContextId/);
  });

  it("reopens and revalidates a completed receipt through both recovery and History", async () => {
    const fixture = await completedFixture();
    state.tables.life_climate_b3_intents = { data: privateFree(fixture.intent), error: null };
    state.tables.life_climate_b3_receipts = { data: fixture.receipt, error: null };
    const recovery = await intentsGET(new Request(`http://local/api/life-climate/b3/intents?key=${key}`));
    expect((await recovery.json()).intent.receipt.run.result.events).toEqual(fixture.run.events);
    const history = await runsGET(new Request(`http://local/api/life-climate/b3/runs?run_id=${runId}`));
    expect(history.status).toBe(200);
    expect((await history.json()).run.result.sourceSnapshot).not.toHaveProperty("binding");
    expect(state.operations).toContain(`life_climate_b3_receipts:eq:status:completed`);
  });

  it("refuses a tampered historical resource result instead of treating schema shape as evidence", async () => {
    const fixture = await completedFixture();
    fixture.run.paths[0].stages[0].resources[0].balance = "999999";
    state.tables.life_climate_b3_intents = { data: privateFree(fixture.intent), error: null };
    state.tables.life_climate_b3_receipts = { data: fixture.receipt, error: null };
    const response = await runsGET(new Request(`http://local/api/life-climate/b3/runs?run_id=${runId}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error_code: "history_unavailable" });
  });

  it("uses the same hidden 404 for absent/foreign selectors and rejects duplicate or forged query keys", async () => {
    state.tables.life_climate_b3_intents = { data: null, error: null };
    state.tables.life_climate_b3_receipts = { data: null, error: null };
    expect((await intentsGET(new Request(`http://local/api/life-climate/b3/intents?key=${key}`))).status).toBe(404);
    expect((await runsGET(new Request(`http://local/api/life-climate/b3/runs?run_id=${runId}`))).status).toBe(404);
    expect((await intentsGET(new Request(`http://local/api/life-climate/b3/intents?key=${key}&key=${key}`))).status).toBe(422);
    expect((await sourceGET(new Request(`http://local/api/life-climate/b3/source?user_id=${owner}`))).status).toBe(422);
  });

  it("reports unavailable Auth/service configuration without touching any intent", async () => {
    state.client = null;
    expect((await sourceGET(new Request("http://local/api/life-climate/b3/source"))).status).toBe(503);
    state.client = auth(); state.serviceFactory.mockReturnValue(null);
    expect((await post(bodyFixture().body)).status).toBe(503);
    expect((await sourceGET(new Request("http://local/api/life-climate/b3/source"))).status).toBe(503);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it("rejects forged body owners and malformed persisted source envelopes", async () => {
    expect((await post({ ...bodyFixture().body, user_id: owner })).status).toBe(422);
    expect(state.rpc).not.toHaveBeenCalled();
    state.rpc.mockResolvedValue({ data: {}, error: null });
    expect((await sourceGET(new Request("http://local/api/life-climate/b3/source"))).status).toBe(500);
    expect((await post(bodyFixture().body)).status).toBe(500);
  });

  it("returns a source without symbolic attachment and classifies unsupported Profile precision explicitly", async () => {
    const fixture = bodyFixture();
    state.rpc.mockResolvedValue({ data: { source_snapshot: fixture.source, symbolic_input: null }, error: null });
    const good = await sourceGET(new Request("http://local/api/life-climate/b3/source"));
    expect(good.status).toBe(200);
    expect((await good.json()).source.symbolic).toBeNull();
    fixture.source.view.profile.worldInputs.resources[0].usePerTick = 0.0000001;
    const bad = await sourceGET(new Request("http://local/api/life-climate/b3/source"));
    expect(bad.status).toBe(409);
    expect(await bad.json()).toMatchObject({ error_code: "b3_unsupported_precision" });
  });

  it("keeps empty owner lists empty and recovers a terminal refusal with its original body", async () => {
    state.tables.life_climate_b3_intents = { data: [], error: null };
    state.tables.life_climate_b3_receipts = { data: [], error: null };
    for (const handler of [intentsGET, runsGET]) {
      const response = await handler(new Request("http://local/api/life-climate/b3/list?limit=5"));
      expect(response.status).toBe(200); expect((await response.json()).items).toEqual([]);
    }
    const fixture = bodyFixture();
    state.tables.life_climate_b3_intents = { data: privateFree(fixture.intent), error: null };
    state.tables.life_climate_b3_receipts = { data: { id: runId, intent_id: intentId, created_at: createdAt, status: "rejected", error_code: "safety_downgrade", result_bundle: null }, error: null };
    const response = await intentsGET(new Request(`http://local/api/life-climate/b3/intents?key=${key}`));
    expect((await response.json()).intent).toMatchObject({ status: "rejected", originalBody: fixture.body, receipt: { status: "rejected", error_code: "safety_downgrade" } });
  });

  it("keeps read failures and contradictory receipt sources sanitized", async () => {
    state.tables.life_climate_b3_intents = { data: null, error: { message: "private DB detail" } };
    expect((await intentsGET(new Request(`http://local/api/life-climate/b3/intents?key=${key}`))).status).toBe(500);
    state.tables.life_climate_b3_receipts = { data: null, error: { message: "private DB detail" } };
    expect((await runsGET(new Request(`http://local/api/life-climate/b3/runs?run_id=${runId}`))).status).toBe(500);
    const fixture = await completedFixture();
    fixture.receipt.intent_id = "88888888-8888-4888-8888-888888888888";
    state.rpc.mockResolvedValue({ data: { intent: fixture.intent, receipt: fixture.receipt, idempotent: true }, error: null });
    expect((await post(fixture.body)).status).toBe(500);
  });
});
