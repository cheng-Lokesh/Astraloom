import { describe, expect, it, type Mock, vi } from "vitest";

import {
  FormalGraphController,
  runFormalGraphUiAction,
  type FormalGraphFetch,
} from "./formal-graph-client";

const seedA = "11111111-1111-4111-8111-111111111111";
const seedB = "22222222-2222-4222-8222-222222222222";
const seedC = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const snapshotId = "33333333-3333-4333-8333-333333333333";
const coreId = "44444444-4444-4444-8444-444444444444";
const npcId = "55555555-5555-4555-8555-555555555555";
const graphId = "66666666-6666-4666-8666-666666666666";
const edgeId = "77777777-7777-4777-8777-777777777777";

const snapshot = { id: snapshotId, version: "phase3-agent-snapshot-v1", safety_level: "safe", error_code: null };
const core = { id: coreId, snapshot_id: snapshotId, key_person_id: null, version: "phase3-agent-snapshot-v1", agent_type: "user_core", display_name: "You", relationship_to_user: "self", source: "conservative_snapshot", confidence: 58, evidence_refs: ["seed:submitted"], safety_level: "safe" };
const npc = { id: npcId, snapshot_id: snapshotId, key_person_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", version: "phase3-agent-snapshot-v1", agent_type: "npc", display_name: "Project lead", relationship_to_user: "manager", source: "confirmed_person_snapshot", confidence: 72, evidence_refs: ["key_person:confirmed"], safety_level: "safe" };
const graph = { id: graphId, agent_snapshot_id: snapshotId, version: "phase3-graph-snapshot-v1", graph_locked: false, locked_at: null, safety_level: "safe", error_code: null };
const edge = { id: edgeId, graph_snapshot_id: graphId, agent_snapshot_id: snapshotId, from_agent_id: coreId, to_agent_id: npcId, version: "phase3-graph-snapshot-v1", relationship_type: "professional", weights: { trust: 61, hostility: 10, dependency: 44, attraction: 0, competition: 25, information_gap: 31, resource_control: 42, emotional_debt: 12 }, confidence: 70, evidence_refs: ["seed:submitted", "agent:user_core"], safety_level: "safe" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function recoverFetch(options: { snapshot?: unknown; agents?: unknown[]; graph?: unknown; edges?: unknown[] } = {}): Mock<FormalGraphFetch> {
  const has = (key: keyof typeof options) => Object.prototype.hasOwnProperty.call(options, key);
  return vi.fn()
    .mockResolvedValueOnce(json({ seedContexts: [
      { id: seedA, version: "1", submittedAt: "2026-08-26T12:00:00+00:00", frozenAt: "2026-08-26T12:00:00+00:00" },
      { id: seedB, version: "2", submittedAt: "2026-08-27T12:00:00+00:00", frozenAt: "2026-08-27T12:00:00+00:00" },
    ] }))
    .mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", snapshot: has("snapshot") ? options.snapshot : snapshot, agents: has("agents") ? options.agents : [core, npc] }))
    .mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", graph: has("graph") ? options.graph : null, edges: has("edges") ? options.edges : [] }));
}

function controller(fetcher: FormalGraphFetch, ids = ["88888888-8888-4888-8888-888888888888", "99999999-9999-4999-8999-999999999999"]) {
  return new FormalGraphController({ fetcher, newId: () => {
    const value = ids.shift();
    if (!value) throw new Error("test UUIDs exhausted");
    return value;
  } });
}

describe("FormalGraphController", () => {
  it("recovers the newest submitted Seed, safe Agent snapshot, and server Graph projection", async () => {
    const fetcher = recoverFetch({ graph, edges: [edge] });
    const subject = controller(fetcher);
    await subject.recover();
    expect(subject.state).toMatchObject({ phase: "ready", seed: { id: seedB }, snapshot, agents: [core, npc], graph, edges: [edge] });
    expect(fetcher).toHaveBeenNthCalledWith(2, `/api/agents?seed_id=${seedB}`, { method: "GET" });
    expect(fetcher).toHaveBeenNthCalledWith(3, `/api/graph?seed_id=${seedB}`, { method: "GET" });
  });

  it("selects the latest submitted instant across offsets, then breaks an exact-time tie by id", async () => {
    const fetcher: Mock<FormalGraphFetch> = vi.fn()
      .mockResolvedValueOnce(json({ seedContexts: [
        { id: seedA, version: "1", submittedAt: "2026-08-28T01:00:00+02:00", frozenAt: "2026-08-28T01:00:00+02:00" },
        { id: seedB, version: "2", submittedAt: "2026-08-28T00:00:00+00:00", frozenAt: "2026-08-28T00:00:00+00:00" },
        { id: seedC, version: "3", submittedAt: "2026-08-28T00:00:00+00:00", frozenAt: "2026-08-28T00:00:00+00:00" },
      ] }))
      .mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", snapshot, agents: [core, npc] }))
      .mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", graph: null, edges: [] }));
    const subject = controller(fetcher);

    await subject.recover();

    expect(subject.state).toMatchObject({ phase: "ready", seed: { id: seedC } });
    expect(fetcher).toHaveBeenNthCalledWith(2, `/api/agents?seed_id=${seedC}`, { method: "GET" });
  });

  it("maps authentication, no submitted Seed, no Agent snapshot, and malformed recovery into safe states", async () => {
    const unauthenticated = controller(vi.fn().mockResolvedValue(json({ error_code: "unauthenticated" }, 401)));
    await unauthenticated.recover();
    expect(unauthenticated.state).toMatchObject({ phase: "unauthenticated", agents: [], edges: [] });

    const noSeed = controller(vi.fn().mockResolvedValue(json({ seedContexts: [] })));
    await noSeed.recover();
    expect(noSeed.state).toMatchObject({ phase: "no_seed", agents: [], edges: [] });

    const noAgents = controller(recoverFetch({ snapshot: null, agents: [] }));
    await noAgents.recover();
    expect(noAgents.state).toMatchObject({ phase: "no_agents", graph: null, edges: [] });

    const failure = controller(vi.fn().mockResolvedValue(json({ seedContexts: [{ id: seedB, raw_context: "private" }] })));
    await failure.recover();
    expect(failure.state).toMatchObject({ phase: "failure", notice: "We couldn't recover your saved Graph ledger. Please try again." });
  });

  it("keeps downgraded snapshots out of Graph generation and never invents an NPC", async () => {
    const downgraded = { ...snapshot, safety_level: "downgraded", error_code: "safety_downgraded" };
    const subject = controller(recoverFetch({ snapshot: downgraded, agents: [{ ...core, safety_level: "downgraded" }] }));
    await subject.recover();
    expect(subject.state).toMatchObject({ phase: "downgraded", snapshot: downgraded, agents: [{ ...core, safety_level: "downgraded" }] });
    expect(subject.canGenerate).toBe(false);
    expect(await subject.generate()).toBe(false);
  });

  it("uses a fresh UUID and only the Seed selector to generate a server-derived Graph", async () => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, idempotent: false, graph, edges: [edge] }, 201));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate();
    expect(fetcher).toHaveBeenLastCalledWith("/api/graph/generate", expect.objectContaining({ method: "POST", body: JSON.stringify({ selector: { seed_id: seedB }, idempotency_key: "88888888-8888-4888-8888-888888888888" }) }));
    expect(subject.state).toMatchObject({ phase: "ready", graph, edges: [edge], pendingGeneration: false });
  });

  it.each([
    [404, "seed_not_found", "This submitted scenario is no longer available. Return to intake to recover it."],
    [409, "graph_locked", "This Graph is already locked. Reload the saved Graph ledger."],
    [409, "idempotency_key_content_conflict", "This generation request conflicted with saved state. Reload the Graph ledger before trying again."],
    [500, "persistence_failed", "We couldn't generate a Graph snapshot. Your saved ledger has not changed."],
  ])("preserves the prior safe Graph on generation failure %s without exposing response bodies", async (status, code, notice) => {
    const fetcher = recoverFetch({ graph, edges: [edge] });
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: code, trace_id: "private-trace" }, status));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate();
    expect(subject.state).toMatchObject({ phase: "ready", graph, edges: [edge], notice });
    expect(JSON.stringify(subject.state)).not.toContain("private");
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("maps a blocked generation to a zero-write state while preserving a previous safe Graph", async () => {
    const fetcher = recoverFetch({ graph, edges: [edge] });
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: "safety_blocked", trace_id: "private-trace" }, 409));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate();
    expect(subject.state).toMatchObject({ phase: "blocked", graph, edges: [edge], notice: "Graph generation was blocked by the saved safety boundary. No Graph snapshot was written." });
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["generate", "Graph generation was blocked by the saved safety boundary. No Graph snapshot was written."],
    ["lock", "Graph locking was blocked by the saved safety boundary. No Graph snapshot was written."],
  ] as const)("uses action-specific safety-blocked copy for %s", async (action, notice) => {
    const fetcher = recoverFetch({ graph, edges: [edge] });
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: "safety_blocked", trace_id: "private-trace" }, 409));
    const subject = controller(fetcher);
    await subject.recover();

    await subject[action]();

    expect(subject.state).toMatchObject({ phase: "blocked", graph, edges: [edge], notice });
    expect(subject.canGenerate).toBe(false);
    expect(subject.canLock).toBe(false);
  });

  it("fails closed on inconsistent Graph schemas and does not fall back to local data", async () => {
    const fetcher = recoverFetch({ graph, edges: [edge] });
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, idempotent: false, graph, edges: [{ ...edge, weights: { ...edge.weights, client_weight: 100 } }], raw_context: "private" }, 201));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate();
    expect(subject.state).toMatchObject({ phase: "ready", graph, edges: [edge], notice: "We couldn't generate a Graph snapshot. Your saved ledger has not changed." });
    expect(JSON.stringify(subject.state)).not.toContain("private");
  });

  it("rejects a Graph whose relationship only connects the user core and a parallel variant", async () => {
    const variant = { ...core, id: "abababab-abab-4bab-8bab-abababababab", agent_type: "user_variant", display_name: "Parallel self" };
    const nonNpcEdge = { ...edge, to_agent_id: variant.id };
    const subject = controller(recoverFetch({ agents: [core, variant], graph, edges: [nonNpcEdge] }));

    await subject.recover();

    expect(subject.state).toMatchObject({ phase: "failure", graph: null, edges: [] });
  });

  it.each([
    ["generate", "safety_downgraded", "safety_downgraded", "Graph generation is unavailable because the saved safety boundary was downgraded. No Graph snapshot was written."],
    ["lock", "safety_downgraded", "safety_downgraded", "Graph locking is unavailable because the saved safety boundary was downgraded. No Graph snapshot was written."],
    ["generate", "agent_snapshot_invalid", "stale_agents", "Graph generation is unavailable because the saved Agent snapshot is no longer eligible. No Graph snapshot was written."],
    ["lock", "agent_snapshot_invalid", "stale_agents", "Graph locking is unavailable because the saved Agent snapshot is no longer eligible. No Graph snapshot was written."],
  ] as const)("preserves a safe Graph but disables later writes when %s receives %s", async (action, errorCode, phase, notice) => {
    const fetcher = recoverFetch({ graph, edges: [edge] });
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: errorCode, trace_id: "private-trace" }, 409));
    const subject = controller(fetcher);
    await subject.recover();

    await subject[action]();

    expect(subject.state).toMatchObject({ phase, graph, edges: [edge], notice, pendingGeneration: false, pendingLock: false });
    expect(subject.canGenerate).toBe(false);
    expect(subject.canLock).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("locks only a complete current Graph through a fresh UUID and adopts the irreversible server result", async () => {
    const fetcher = recoverFetch({ graph, edges: [edge] });
    const locked = { ...graph, graph_locked: true, locked_at: "2026-08-27T12:00:00+00:00" };
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", idempotent: false, graph: locked }, 201));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.lock();
    expect(fetcher).toHaveBeenLastCalledWith("/api/graph/lock", expect.objectContaining({ method: "POST", body: JSON.stringify({ selector: { seed_id: seedB }, idempotency_key: "88888888-8888-4888-8888-888888888888" }) }));
    expect(subject.state).toMatchObject({ phase: "ready", graph: locked, edges: [edge], pendingLock: false });
    expect(subject.canLock).toBe(false);
  });

  it("does not retry 409 lock failures with another key and preserves the safe Graph", async () => {
    const fetcher = recoverFetch({ graph, edges: [edge] });
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: "idempotency_key_content_conflict", trace_id: "private-trace" }, 409));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.lock();
    expect(subject.state).toMatchObject({ phase: "ready", graph, edges: [edge], notice: "This lock request conflicted with saved state. Reload the Graph ledger before trying again." });
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("blocks duplicate in-flight generation and synchronizes pending state immediately", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const fetcher = recoverFetch();
    fetcher.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    const subject = controller(fetcher);
    await subject.recover();
    const pending: boolean[] = [];
    const first = runFormalGraphUiAction(() => subject.generate(), () => pending.push(subject.state.pendingGeneration));
    await Promise.resolve();
    const second = subject.generate();
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(subject.state.pendingGeneration).toBe(true);
    resolveRequest?.(json({ ok: true, error_code: null, idempotent: false, graph, edges: [edge] }, 201));
    await Promise.all([first, second]);
    expect(pending).toEqual([true, false]);
  });

  it("reloads server truth after a conflict without replaying the failed mutation", async () => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: "idempotency_key_content_conflict", trace_id: "opaque" }, 409));
    fetcher.mockResolvedValueOnce(json({ seedContexts: [{ id: seedA, version: "3", submittedAt: "2026-08-28T12:00:00+00:00", frozenAt: "2026-08-28T12:00:00+00:00" }] }));
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", snapshot, agents: [core, npc] }));
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", graph, edges: [edge] }));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate();
    await subject.recover();
    expect(fetcher).toHaveBeenCalledTimes(7);
    expect(subject.state).toMatchObject({ phase: "ready", seed: { id: seedA }, graph, edges: [edge] });
  });
});
