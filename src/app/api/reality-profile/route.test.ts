import { beforeEach, describe, expect, it, vi } from "vitest";

type MockResponse = { data: unknown; error: { code?: string } | null };
type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};
type MockClient = { auth: { getUser: ReturnType<typeof vi.fn> }; from: ReturnType<typeof vi.fn> };

const state = vi.hoisted(() => ({ client: null as MockClient | null, queries: [] as MockQuery[] }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => state.client }));

import { GET, PUT } from "./route";

describe("/api/reality-profile", () => {
  beforeEach(() => {
    state.queries.length = 0;
    state.client = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }, from: vi.fn() };
  });

  it("rejects anonymous reads and writes", async () => {
    expect((await GET()).status).toBe(401);
    expect((await PUT(new Request("http://localhost/api/reality-profile", { method: "PUT", body: "{}" }))).status).toBe(401);
  });

  it("fails closed on malformed JSON and unsafe content", async () => {
    await authenticatedClient([
      { data: { id: "current-seed" }, error: null },
      { data: { id: "current-seed" }, error: null },
    ]);
    expect((await PUT(new Request("http://localhost/api/reality-profile", { method: "PUT", body: "{" }))).status).toBe(400);
    expect((await PUT(new Request("http://localhost/api/reality-profile", { method: "PUT", body: JSON.stringify(validInput("550e8400-e29b-41d4-a716-446655440000")) }))).status).toBe(400);
    expect(state.queries).toHaveLength(2);
  });

  it("reads only the latest formal Seed for the authenticated owner", async () => {
    const row = dbRow(3);
    await authenticatedClient([
      { data: { id: "current-seed" }, error: null },
      { data: row, error: null },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body.profile.revision).toBe(3);
    expect(body.profile.goals).toEqual([{ value: "完成职业转向", classification: "fact", evidenceSummary: "用户确认的计划" }]);
    expect(body.profile.externalVariables).toEqual([{ value: "", classification: "unknown", evidenceSummary: "明确未知" }]);
    expect(body.trace_id).toMatch(/^reality_profile_[0-9a-f-]{36}$/i);
    expect(body.profile).not.toHaveProperty("id");
    expect(body.profile).not.toHaveProperty("seed_context_id");
    expect(state.queries[0].eq).toHaveBeenCalledWith("user_id", "signed-in-owner");
    expect(state.queries[1].eq).toHaveBeenCalledWith("user_id", "signed-in-owner");
    expect(state.queries[1].eq).toHaveBeenCalledWith("seed_context_id", "current-seed");
  });

  it("creates a first profile with revision 1 and safe response fields", async () => {
    const inserted = dbRow(1);
    await authenticatedClient([
      { data: { id: "current-seed" }, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: inserted, error: null },
    ]);

    const response = await PUT(new Request("http://localhost/api/reality-profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(validInput(0)) }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.profile.revision).toBe(1);
    expect(body.profile.lifeClimate.classification).toBe("fact");
    expect(body.profile.constraints).toEqual({ value: "", classification: "unknown", evidenceSummary: "明确未知" });
    expect(body.profile.values).toEqual(validInput(0) && (validInput(0) as { values: unknown }).values);
    expect(body).not.toHaveProperty("id");
    expect(state.queries[3].insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "signed-in-owner", seed_context_id: "current-seed", revision: 1 }));
    expect(state.queries[3].insert).toHaveBeenCalledWith(expect.objectContaining({ life_goals: (validInput(0) as { goals: unknown }).goals }));
  });

  it("rejects a stale revision without overwriting the newer profile", async () => {
    await authenticatedClient([
      { data: { id: "current-seed" }, error: null },
      { data: null, error: null },
      { data: { revision: 8 }, error: null },
    ]);

    const response = await PUT(new Request("http://localhost/api/reality-profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(validInput(4)) }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error_code).toBe("reality_profile_conflict");
    expect(state.queries[1].eq).toHaveBeenCalledWith("revision", 4);
    expect(state.queries[1].insert).not.toHaveBeenCalled();
  });
});

function createQuery(response: MockResponse): MockQuery {
  const query: MockQuery = {
    select: vi.fn(), eq: vi.fn(), not: vi.fn(), order: vi.fn(), limit: vi.fn(),
    update: vi.fn(), insert: vi.fn(), maybeSingle: vi.fn(async () => response), single: vi.fn(async () => response),
  };
  query.select.mockImplementation(() => query);
  query.eq.mockImplementation(() => query);
  query.not.mockImplementation(() => query);
  query.order.mockImplementation(() => query);
  query.limit.mockImplementation(() => query);
  query.update.mockImplementation(() => query);
  query.insert.mockImplementation(() => query);
  return query;
}

async function authenticatedClient(responses: MockResponse[]) {
  state.queries.length = 0;
  const client: MockClient = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "signed-in-owner" } } }) },
    from: vi.fn((table: string) => {
      expect(["seed_contexts", "reality_profiles"]).toContain(table);
      const query = createQuery(responses.shift() ?? { data: null, error: null });
      state.queries.push(query);
      return query;
    }),
  };
  state.client = client;
  return client;
}

function validInput(revision: number | string): unknown {
  return {
    lifeClimate: { value: "协作节奏有所变化", classification: "fact", evidenceSummary: "用户确认的近期观察" },
    resources: { value: "支持有限", classification: "assumption", evidenceSummary: "仍需复核" },
    constraints: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
    goals: [{ value: "完成职业转向", classification: "fact", evidenceSummary: "用户确认的计划" }],
    values: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
    lifeThemes: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
    pressures: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
    externalVariables: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
    revision,
  };
}

function dbRow(revision: number) {
  return {
    life_climate_value: "协作节奏有所变化", life_climate_classification: "fact", life_climate_evidence_summary: "用户确认的近期观察",
    resources_value: "支持有限", resources_classification: "assumption", resources_evidence_summary: "仍需复核",
    constraints_value: null, constraints_classification: "unknown", constraints_evidence_summary: "明确未知", revision,
    life_goals: [{ value: "完成职业转向", classification: "fact", evidenceSummary: "用户确认的计划" }],
    core_values: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
    life_themes: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
    pressures: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
    external_variables: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
  };
}
