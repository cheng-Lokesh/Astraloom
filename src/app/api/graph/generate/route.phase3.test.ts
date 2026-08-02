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
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }, "application/jsonp"))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls exactly one controlled Graph RPC without a client weight or direct table write", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, graph: { id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, edges: [{ id: "55555555-5555-4555-8555-555555555555", graph_snapshot_id: graphId, agent_snapshot_id: "44444444-4444-4444-8444-444444444444", from_agent_id: "66666666-6666-4666-8666-666666666666", to_agent_id: "77777777-7777-4777-8777-777777777777", version: "phase3-graph-snapshot-v1", relationship_type: "professional", weights: { trust: 50 }, confidence: 67, evidence_refs: ["agent:confirmed"], safety_level: "safe" }] }], error: null });
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
});
