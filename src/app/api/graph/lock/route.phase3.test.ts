import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));
vi.mock("server-only", () => ({}));
import { POST } from "./route";

const seedId = "11111111-1111-4111-8111-111111111111";
const idempotencyKey = "22222222-2222-4222-8222-222222222222";
const request = (body: unknown) => new Request("http://localhost/api/graph/lock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("POST /api/graph/lock", () => {
  const rpc = vi.fn();
  beforeEach(() => {
    rpc.mockReset();
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) }, rpc, from: vi.fn() });
  });

  it("requires auth, exact JSON, and a strict body that never accepts Graph ids, edges, evidence, or client weights", async () => {
    createSupabaseServerClient.mockResolvedValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(401);
    for (const body of [{}, { selector: { seed_id: seedId }, idempotency_key: idempotencyKey, graph_id: seedId }, { selector: { seed_id: seedId }, idempotency_key: idempotencyKey, edges: [] }, { selector: { seed_id: seedId }, idempotency_key: idempotencyKey, weights: { trust: 100 } }]) {
      expect((await POST(request(body))).status).toBe(400);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses one controlled lock RPC and returns only a safe locked parent", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: "33333333-3333-4333-8333-333333333333", agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: true, locked_at: "2026-08-02T00:00:00+00:00", safety_level: "safe", error_code: null, trace_id: "private" } }], error: null });
    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("lock_relation_graph_phase3", { p_seed_context_id: seedId, p_idempotency_key: idempotencyKey });
    expect(JSON.stringify(await response.json())).not.toContain("private");
  });

  it("replays a completed lock stably and fails closed for missing, foreign, stale, downgraded, blocked, empty, or malformed persistence", async () => {
    rpc.mockResolvedValueOnce({ data: [{ idempotent: true, graph: { id: "33333333-3333-4333-8333-333333333333", agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: true, locked_at: "2026-08-02T00:00:00.000Z", safety_level: "safe", error_code: null } }], error: null });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(200);
    for (const [message, status] of [["seed_not_found", 404], ["agent_snapshot_invalid", 409], ["graph_snapshot_invalid", 409], ["graph_locked", 409], ["evidence_required", 400], ["safety_downgraded", 409], ["safety_blocked", 409], ["idempotency_key_content_conflict", 409]] as const) {
      rpc.mockResolvedValueOnce({ data: null, error: { message } });
      const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({ ok: false, error_code: message });
    }
    rpc.mockResolvedValueOnce({ data: [], error: null });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(500);
  });

  it("authenticates before malformed JSON and accepts JSON with charset but rejects JSON lookalikes", async () => {
    createSupabaseServerClient.mockResolvedValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } });
    const malformed = new Request("http://localhost/api/graph/lock", { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
    expect((await POST(malformed)).status).toBe(401);
    for (const type of ["application/jsonp", "application/jsonx", "text/plain"]) {
      const response = await POST(new Request("http://localhost/api/graph/lock", { method: "POST", headers: { "content-type": type }, body: JSON.stringify({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }) }));
      expect(response.status).toBe(400);
    }
  });

  it("does not read tables and fails closed for an unlocked, stale, malformed, or private lock projection", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: "33333333-3333-4333-8333-333333333333", agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null, trace_id: "private" } }], error: null });
    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("private");
  });

  it("requires UUID values and never accepts an Agent selector or a client lock timestamp", async () => {
    for (const body of [{ selector: { seed_id: "bad" }, idempotency_key: idempotencyKey }, { selector: { seed_id: seedId }, idempotency_key: "bad" }, { selector: { seed_id: seedId, agent_snapshot_id: seedId }, idempotency_key: idempotencyKey }, { selector: { seed_id: seedId }, idempotency_key: idempotencyKey, locked_at: "client" }]) {
      expect((await POST(request(body))).status).toBe(400);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("accepts JSON charset with a valid controlled lock result and never calls from", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: "33333333-3333-4333-8333-333333333333", agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: true, locked_at: "2026-08-02T00:00:00.000Z", safety_level: "safe", error_code: null } }], error: null });
    const response = await POST(new Request("http://localhost/api/graph/lock", { method: "POST", headers: { "content-type": "application/json; charset=utf-8" }, body: JSON.stringify({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }) }));
    expect(response.status).toBe(201); expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("fails closed for an invalid lock Graph projection without echoing private fields", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: "bad", agent_snapshot_id: "bad", version: "legacy", graph_locked: true, locked_at: null, safety_level: "safe", error_code: "private" } }], error: null });
    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain("private");
  });
});
