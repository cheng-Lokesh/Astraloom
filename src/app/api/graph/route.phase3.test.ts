import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));
vi.mock("server-only", () => ({}));

import { GET } from "./route";

const seedId = "11111111-1111-4111-8111-111111111111";
const graphId = "22222222-2222-4222-8222-222222222222";
const agentSnapshotId = "33333333-3333-4333-8333-333333333333";
const edgeId = "44444444-4444-4444-8444-444444444444";

describe("GET /api/graph", () => {
  beforeEach(() => createSupabaseServerClient.mockReset());

  it("requires authentication and validates one exact UUID seed_id selector", async () => {
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } });
    expect((await GET(new Request(`http://localhost/api/graph?seed_id=${seedId}`))).status).toBe(401);
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) } });
    for (const query of ["", "?seed_id=bad", `?seed_id=${seedId}&seed_id=${seedId}`, `?seed_id=${seedId}&extra=forbidden`]) {
      expect((await GET(new Request(`http://localhost/api/graph${query}`))).status).toBe(400);
    }
  });

  it("returns the latest owner/Seed Graph before or after lock and only its safe Edge projection", async () => {
    const edgeOrder = vi.fn().mockResolvedValue({ data: [{ id: edgeId, graph_snapshot_id: graphId, agent_snapshot_id: agentSnapshotId, from_agent_id: "55555555-5555-4555-8555-555555555555", to_agent_id: "66666666-6666-4666-8666-666666666666", version: "phase3-graph-snapshot-v1", relationship_type: "professional", weights: { trust: 50, hostility: 0, dependency: 0, attraction: 0, competition: 0, information_gap: 0, resource_control: 0, emotional_debt: 0 }, confidence: 67, evidence_refs: ["agent:confirmed"], safety_level: "safe", trace_id: "private" }], error: null });
    const edgeGraph = vi.fn(() => ({ order: edgeOrder }));
    const edgeSelect = vi.fn(() => ({ eq: edgeGraph }));
    const graphMaybe = vi.fn().mockResolvedValue({ data: { id: graphId, agent_snapshot_id: agentSnapshotId, version: "phase3-graph-snapshot-v1", graph_locked: true, locked_at: "2026-08-02T00:00:00.000Z", safety_level: "safe", error_code: null, trace_id: "private" }, error: null });
    const graphLimit = vi.fn(() => ({ maybeSingle: graphMaybe }));
    const graphOrder = vi.fn(() => ({ limit: graphLimit }));
    const graphSeed = vi.fn(() => ({ order: graphOrder }));
    const graphOwner = vi.fn(() => ({ eq: graphSeed }));
    const graphSelect = vi.fn(() => ({ eq: graphOwner }));
    const seedMaybe = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
    const seedFrozen = vi.fn(() => ({ maybeSingle: seedMaybe }));
    const seedSubmitted = vi.fn(() => ({ not: seedFrozen }));
    const seedStatus = vi.fn(() => ({ not: seedSubmitted }));
    const seedOwner = vi.fn(() => ({ eq: seedStatus }));
    const seedSelect = vi.fn(() => ({ eq: seedOwner }));
    const from = vi.fn((table: string) => table === "seed_contexts" ? { select: seedSelect } : table === "relation_graph_snapshots" ? { select: graphSelect } : { select: edgeSelect });
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) }, from });

    const response = await GET(new Request(`http://localhost/api/graph?seed_id=${seedId}`));
    const text = JSON.stringify(await response.json());
    expect(response.status).toBe(200);
    expect(graphSelect).toHaveBeenCalledWith("id,agent_snapshot_id,version,graph_locked,locked_at,safety_level,error_code");
    expect(graphOwner).toHaveBeenCalledWith("user_id", "owner-a");
    expect(graphSeed).toHaveBeenCalledWith("seed_context_id", seedId);
    expect(edgeSelect).toHaveBeenCalledWith("id,graph_snapshot_id,agent_snapshot_id,from_agent_id,to_agent_id,version,relationship_type,weights,confidence,evidence_refs,safety_level");
    expect(edgeGraph).toHaveBeenCalledWith("graph_snapshot_id", graphId);
    expect(text).not.toContain("private");
  });

  it("uses the same safe not-found response for absent, foreign, or draft Seeds", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ not: vi.fn(() => ({ not: vi.fn(() => ({ maybeSingle })) })) })) })) })) }));
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) }, from });
    const response = await GET(new Request(`http://localhost/api/graph?seed_id=${seedId}`));
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "seed_not_found" });
  });

  it("allows review of a safe generated unlocked Graph rather than requiring lock before GET", async () => {
    const seedChain = {
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: seedId }, error: null }),
      eq: vi.fn(),
      not: vi.fn(),
    };
    seedChain.eq.mockImplementation(() => seedChain);
    seedChain.not.mockImplementation(() => seedChain);
    const graphChain = {
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: graphId, agent_snapshot_id: agentSnapshotId, version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, error: null }),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    graphChain.eq.mockImplementation(() => graphChain);
    graphChain.order.mockImplementation(() => graphChain);
    graphChain.limit.mockImplementation(() => graphChain);
    const edgeChain = {
      order: vi.fn().mockResolvedValue({ data: [{ id: edgeId, graph_snapshot_id: graphId, agent_snapshot_id: agentSnapshotId, from_agent_id: "55555555-5555-4555-8555-555555555555", to_agent_id: "66666666-6666-4666-8666-666666666666", version: "phase3-graph-snapshot-v1", relationship_type: "professional", weights: { trust: 50, hostility: 0, dependency: 0, attraction: 0, competition: 0, information_gap: 0, resource_control: 0, emotional_debt: 0 }, confidence: 67, evidence_refs: ["agent:confirmed"], safety_level: "safe" }], error: null }),
      eq: vi.fn(),
    };
    edgeChain.eq.mockImplementation(() => edgeChain);
    const from = vi.fn((table: string) => ({ select: vi.fn(() => table === "seed_contexts" ? seedChain : table === "relation_graph_snapshots" ? graphChain : edgeChain) }));
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) }, from });
    const response = await GET(new Request(`http://localhost/api/graph?seed_id=${seedId}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, graph: { graph_locked: false, locked_at: null } });
  });

  it("fails closed for private database errors and malformed Edge projections", async () => {
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) }, from: vi.fn(() => { throw new Error("private database detail"); }) });
    const response = await GET(new Request(`http://localhost/api/graph?seed_id=${seedId}`));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("private database detail");
  });

  it("fails closed when an Edge safety level or evidence format is inconsistent with its parent Graph", async () => {
    const seedChain = { maybeSingle: vi.fn().mockResolvedValue({ data: { id: seedId }, error: null }), eq: vi.fn(), not: vi.fn() };
    seedChain.eq.mockImplementation(() => seedChain); seedChain.not.mockImplementation(() => seedChain);
    const graphChain = { maybeSingle: vi.fn().mockResolvedValue({ data: { id: graphId, agent_snapshot_id: agentSnapshotId, version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null }, error: null }), eq: vi.fn(), order: vi.fn(), limit: vi.fn() };
    graphChain.eq.mockImplementation(() => graphChain); graphChain.order.mockImplementation(() => graphChain); graphChain.limit.mockImplementation(() => graphChain);
    const edgeChain = { order: vi.fn().mockResolvedValue({ data: [{ id: edgeId, graph_snapshot_id: graphId, agent_snapshot_id: agentSnapshotId, from_agent_id: "55555555-5555-4555-8555-555555555555", to_agent_id: "66666666-6666-4666-8666-666666666666", version: "phase3-graph-snapshot-v1", relationship_type: "professional", weights: { trust: 50, hostility: 0, dependency: 0, attraction: 0, competition: 0, information_gap: 0, resource_control: 0, emotional_debt: 0 }, confidence: 67, evidence_refs: ["seed:submitted"], safety_level: "caution" }], error: null }), eq: vi.fn() };
    edgeChain.eq.mockImplementation(() => edgeChain);
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) }, from: vi.fn((table: string) => ({ select: vi.fn(() => table === "seed_contexts" ? seedChain : table === "relation_graph_snapshots" ? graphChain : edgeChain) })) });
    const response = await GET(new Request(`http://localhost/api/graph?seed_id=${seedId}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "persistence_failed" });
  });

  it("never discloses authentication lookup details", async () => {
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "private auth detail" } }) } });
    const response = await GET(new Request(`http://localhost/api/graph?seed_id=${seedId}`));
    expect(response.status).toBe(401);
    expect(JSON.stringify(await response.json())).not.toContain("private auth detail");
  });

  it("does not query Edges after a missing latest Graph parent", async () => {
    const from = vi.fn(() => { throw new Error("missing parent"); });
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) }, from });
    const response = await GET(new Request(`http://localhost/api/graph?seed_id=${seedId}`));
    expect(response.status).toBe(500);
    expect(from).not.toHaveBeenCalledWith("relation_edges");
  });

  it("fails closed for an Edge with private raw evidence or invalid confidence", async () => {
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) }, from: vi.fn(() => { throw new Error("raw evidence") }) });
    const response = await GET(new Request(`http://localhost/api/graph?seed_id=${seedId}`));
    expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain("raw evidence");
  });

  it("rejects an authenticated selector with a client Graph or Agent snapshot override", async () => {
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) } });
    for (const query of [`?seed_id=${seedId}&graph_id=${graphId}`, `?seed_id=${seedId}&agent_snapshot_id=${agentSnapshotId}`]) {
      expect((await GET(new Request(`http://localhost/api/graph${query}`))).status).toBe(400);
    }
  });
});
