import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));
vi.mock("server-only", () => ({}));
import { POST } from "./route";

const seedId = "11111111-1111-4111-8111-111111111111";
const idempotencyKey = "22222222-2222-4222-8222-222222222222";
const graphId = "33333333-3333-4333-8333-333333333333";
const request = (body: unknown, contentType = "application/json") => new Request("http://localhost/api/graph/generate", { method: "POST", headers: { "content-type": contentType }, body: JSON.stringify(body) });

describe("POST /api/graph/generate", () => {
  const rpc = vi.fn();
  beforeEach(() => {
    rpc.mockReset();
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) }, rpc, from: vi.fn() });
  });

  it("authenticates before input validation and permits only a Seed selector with one idempotency key", async () => {
    createSupabaseServerClient.mockResolvedValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(401);
    for (const body of [{}, { selector: { seed_id: seedId }, idempotency_key: idempotencyKey, weights: { trust: 100 } }, { selector: { seed_id: seedId }, idempotency_key: idempotencyKey, agent_snapshot_id: graphId }, { selector: { seed_id: seedId, user_id: "forbidden" }, idempotency_key: idempotencyKey }]) {
      expect((await POST(request(body))).status).toBe(400);
    }
    for (const contentType of ["application/jsonp", "application/jsonx", "text/plain"]) {
      expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }, contentType))).status).toBe(400);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls exactly one controlled Graph RPC without a client weight or direct table write", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, edges: [{ id: "55555555-5555-4555-8555-555555555555", graph_snapshot_id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", from_agent_id: "66666666-6666-4666-8666-666666666666", to_agent_id: "77777777-7777-4777-8777-777777777777", version: "phase3-graph-snapshot-v1", relationship_type: "professional", weights: { trust: 50, hostility: 0, dependency: 0, attraction: 0, competition: 0, information_gap: 0, resource_control: 0, emotional_debt: 0 }, confidence: 67, evidence_refs: ["seed_context:11111111-1111-4111-8111-111111111111:93096255c09b034a"], safety_level: "safe" }] }], error: null });
    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("generate_relation_graph_phase3", { p_seed_context_id: seedId, p_idempotency_key: idempotencyKey });
    expect(JSON.stringify(await response.json())).not.toContain("trace");
  });

  it("maps stale Agent, illegal evidence/weight, graph lock, safety, replay conflict, and persistence errors to stable safe results", async () => {
    const payload = { selector: { seed_id: seedId }, idempotency_key: idempotencyKey };
    for (const [message, status] of [["agent_snapshot_invalid", 409], ["graph_snapshot_invalid", 409], ["evidence_required", 400], ["illegal_weight", 400], ["self_edge_forbidden", 400], ["graph_locked", 409], ["safety_downgraded", 409], ["safety_blocked", 409], ["idempotency_key_content_conflict", 409]] as const) {
      rpc.mockResolvedValueOnce({ data: null, error: { message, details: "private" } });
      const response = await POST(request(payload));
      expect(response.status).toBe(status);
      expect(JSON.stringify(await response.json())).not.toContain("private");
    }
    rpc.mockResolvedValueOnce({ data: [], error: null });
    expect((await POST(request(payload))).status).toBe(500);
  });

  it("authenticates before parsing malformed JSON and accepts only application/json with an optional charset", async () => {
    createSupabaseServerClient.mockResolvedValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } });
    const malformed = new Request("http://localhost/api/graph/generate", { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
    expect((await POST(malformed)).status).toBe(401);
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, edges: [{ id: "55555555-5555-4555-8555-555555555555", graph_snapshot_id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", from_agent_id: "66666666-6666-4666-8666-666666666666", to_agent_id: "77777777-7777-4777-8777-777777777777", version: "phase3-graph-snapshot-v1", relationship_type: "professional", weights: { trust: 50, hostility: 0, dependency: 0, attraction: 0, competition: 0, information_gap: 0, resource_control: 0, emotional_debt: 0 }, confidence: 67, evidence_refs: ["agent:confirmed"], safety_level: "safe" }] }], error: null });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }, "application/json; charset=utf-8"))).status).toBe(201);
  });

  it("fails closed when a controlled writer returns a malformed Graph, duplicate Edge pair, private field, or illegal weight object", async () => {
    for (const edges of [[], [{ id: "55555555-5555-4555-8555-555555555555", graph_snapshot_id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", from_agent_id: "66666666-6666-4666-8666-666666666666", to_agent_id: "66666666-6666-4666-8666-666666666666", version: "phase3-graph-snapshot-v1", relationship_type: "invented", weights: { trust: 101 }, confidence: 101, evidence_refs: [], safety_level: "safe", trace_id: "private" }]]) {
      rpc.mockResolvedValueOnce({ data: [{ idempotent: false, graph: { id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null, trace_id: "private" }, edges }], error: null });
      const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
      expect(response.status).toBe(500);
      expect(JSON.stringify(await response.json())).not.toContain("private");
    }
  });

  it("returns 200 with the identical safe Graph on a controlled replay", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: true, graph: { id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, edges: [{ id: "55555555-5555-4555-8555-555555555555", graph_snapshot_id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", from_agent_id: "66666666-6666-4666-8666-666666666666", to_agent_id: "77777777-7777-4777-8777-777777777777", version: "phase3-graph-snapshot-v1", relationship_type: "professional", weights: { trust: 50, hostility: 0, dependency: 0, attraction: 0, competition: 0, information_gap: 0, resource_control: 0, emotional_debt: 0 }, confidence: 67, evidence_refs: ["agent:confirmed"], safety_level: "safe" }] }], error: null });
    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, idempotent: true, graph: { id: graphId } });
  });

  it("fails closed for an invalid Graph UUID without echoing persistence data", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: "bad", agent_snapshot_id: graphId, version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null, trace_id: "private" }, edges: [] }], error: null });
    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    expect(response.status).toBe(500); expect(await response.json()).toMatchObject({ error_code: "persistence_failed" });
  });

  it("fails closed for mismatched Graph and Agent snapshot ids in Edge rows", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, edges: [{ id: "55555555-5555-4555-8555-555555555555", graph_snapshot_id: "66666666-6666-4666-8666-666666666666", agent_snapshot_id: "77777777-7777-4777-8777-777777777777" }] }], error: null });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(500);
  });

  it("fails closed when a server result gives an Edge a different safety level than its parent Graph", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, edges: [{ id: "55555555-5555-4555-8555-555555555555", graph_snapshot_id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", from_agent_id: "66666666-6666-4666-8666-666666666666", to_agent_id: "77777777-7777-4777-8777-777777777777", version: "phase3-graph-snapshot-v1", relationship_type: "professional", weights: { trust: 50, hostility: 0, dependency: 0, attraction: 0, competition: 0, information_gap: 0, resource_control: 0, emotional_debt: 0 }, confidence: 67, evidence_refs: ["seed:submitted"], safety_level: "caution" }] }], error: null });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(500);
  });

  it("fails closed for self-edges, duplicate unordered pairs, and unknown relationship values", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: graphId, agent_snapshot_id: graphId, version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, edges: [{ id: graphId, graph_snapshot_id: graphId, agent_snapshot_id: graphId, from_agent_id: graphId, to_agent_id: graphId, relationship_type: "unknown" }] }], error: null });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(500);
  });

  it("fails closed for missing or extra weight keys and fractional, NaN, or out-of-range weights", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: graphId, agent_snapshot_id: graphId, version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, edges: [{ id: graphId, graph_snapshot_id: graphId, agent_snapshot_id: graphId, from_agent_id: "55555555-5555-4555-8555-555555555555", to_agent_id: "66666666-6666-4666-8666-666666666666", weights: { trust: 0.5, hostility: Number.NaN, extra: 101 }, confidence: 101 }] }], error: null });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(500);
  });

  it("fails closed for empty/raw evidence, non-integer confidence, invalid version or safety/error/lock mismatch", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: graphId, agent_snapshot_id: graphId, version: "legacy", graph_locked: true, locked_at: null, safety_level: "safe", error_code: "safety_downgraded" }, edges: [] }], error: null });
    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain("legacy");
  });
});
