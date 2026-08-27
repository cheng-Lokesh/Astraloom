import { describe, expect, it, type Mock, vi } from "vitest";

import {
  FormalAgentsController,
  type FormalAgentsFetch,
} from "./formal-agents-client";

const seedA = "11111111-1111-4111-8111-111111111111";
const seedB = "22222222-2222-4222-8222-222222222222";
const personId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const snapshotId = "33333333-3333-4333-8333-333333333333";
const agentId = "44444444-4444-4444-8444-444444444444";

const person = {
  id: personId, display_name: "Project lead", relationship_to_user: "manager", role_type: "decision partner",
  confidence: 72, known_evidence: ["Named in submitted context"], missing_fields: [], status: "confirmed",
  merged_into_id: null, evidence_refs: ["seed:person:1"], version: "phase3-key-person-v1",
};
const snapshot = { id: snapshotId, version: "phase3-agent-snapshot-v1", safety_level: "safe", error_code: null };
const core = {
  id: agentId, snapshot_id: snapshotId, key_person_id: null, version: "phase3-agent-snapshot-v1",
  agent_type: "user_core", display_name: "You", relationship_to_user: "self", source: "conservative_snapshot",
  confidence: 58, evidence_refs: ["seed:submitted"], safety_level: "safe",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function recoverFetch(options: { people?: unknown[]; snapshot?: unknown; agents?: unknown[] } = {}): Mock<FormalAgentsFetch> {
  return vi.fn()
    .mockResolvedValueOnce(json({ seedContexts: [
      { id: seedA, version: "1", submittedAt: "2026-08-26T12:00:00+00:00", frozenAt: "2026-08-26T12:00:00+00:00" },
      { id: seedB, version: "2", submittedAt: "2026-08-27T12:00:00+00:00", frozenAt: "2026-08-27T12:00:00+00:00" },
    ] }))
    .mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", people: options.people ?? [person] }))
    .mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", snapshot: options.snapshot ?? null, agents: options.agents ?? [] }));
}

function controller(fetcher: FormalAgentsFetch, ids = [
  "55555555-5555-4555-8555-555555555555",
  "66666666-6666-4666-8666-666666666666",
]) {
  return new FormalAgentsController({ fetcher, newId: () => {
    const value = ids.shift();
    if (!value) throw new Error("test UUIDs exhausted");
    return value;
  } });
}

describe("FormalAgentsController", () => {
  it("recovers the newest submitted Seed, server People, and its latest empty Agent snapshot", async () => {
    const fetcher = recoverFetch();
    const subject = controller(fetcher);

    await subject.recover();

    expect(subject.state).toMatchObject({ phase: "ready", seed: { id: seedB }, people: [person], snapshot: null, agents: [] });
    expect(fetcher).toHaveBeenNthCalledWith(2, `/api/key-people?seed_id=${seedB}`, { method: "GET" });
    expect(fetcher).toHaveBeenNthCalledWith(3, `/api/agents?seed_id=${seedB}`, { method: "GET" });
  });

  it("maps authentication, absent Seed, and recovery failures to safe states", async () => {
    const unauthenticated = controller(vi.fn().mockResolvedValue(json({ error_code: "unauthenticated" }, 401)));
    await unauthenticated.recover();
    expect(unauthenticated.state).toMatchObject({ phase: "unauthenticated", people: [], agents: [] });

    const noSeed = controller(vi.fn().mockResolvedValue(json({ seedContexts: [] })));
    await noSeed.recover();
    expect(noSeed.state).toMatchObject({ phase: "no_seed", people: [], agents: [] });

    const failure = controller(vi.fn().mockResolvedValue(json({ seedContexts: [{ id: seedB, raw_context: "private" }] })));
    await failure.recover();
    expect(failure.state).toMatchObject({ phase: "failure", notice: "We couldn't recover your saved Agent ledger. Please try again." });
  });

  it("does not let candidates, deleted, or merged People enter generation", async () => {
    const fetcher = recoverFetch({ people: [
      { ...person, status: "candidate" }, { ...person, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", status: "deleted" },
    ] });
    const subject = controller(fetcher);
    await subject.recover();

    expect(subject.canGenerate).toBe(false);
    expect(await subject.generate(true)).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(subject.state.notice).toBe("Confirm at least one saved person before generating Agents.");
  });

  it("uses a fresh UUID, the narrow generate body, and adopts the controlled immutable snapshot", async () => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", source: "controlled_snapshot", idempotent: false, snapshot, agents: [core] }, 201));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate(false);

    expect(fetcher).toHaveBeenLastCalledWith("/api/agents/generate", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ selector: { seed_id: seedB }, idempotency_key: "55555555-5555-4555-8555-555555555555", include_parallel_selves: false }),
    }));
    expect(subject.state).toMatchObject({ phase: "ready", snapshot, agents: [core] });
  });

  it("keeps snapshots immutable in the browser controller and can generate a new version only through the writer", async () => {
    const fetcher = recoverFetch({ snapshot, agents: [core] });
    const subject = controller(fetcher);
    await subject.recover();

    expect(Object.keys(subject.state.agents[0] ?? {})).not.toContain("field_sources");
    expect(subject.state.snapshot).toEqual(snapshot);
    expect(subject.canGenerate).toBe(true);
  });

  it("shows a conservative downgraded snapshot without inventing NPCs", async () => {
    const downgraded = { ...snapshot, safety_level: "downgraded", error_code: "safety_downgraded" };
    const downgradedCore = { ...core, snapshot_id: snapshotId, safety_level: "downgraded" };
    const subject = controller(recoverFetch({ snapshot: downgraded, agents: [downgradedCore] }));
    await subject.recover();

    expect(subject.state).toMatchObject({ phase: "ready", snapshot: downgraded, agents: [downgradedCore] });
    expect(subject.state.agents.some((agent) => agent.agent_type === "npc")).toBe(false);
  });

  it("maps safety blocked generation to a zero-write blocked state without retrying a new key", async () => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: "safety_blocked", trace_id: "private-trace" }, 409));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate(true);

    expect(subject.state).toMatchObject({ phase: "blocked", pendingGeneration: false, notice: "Generation was blocked by the saved safety boundary. No Agent snapshot was written." });
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(JSON.stringify(subject.state)).not.toContain("private-trace");
  });

  it.each([
    [404, "seed_not_found", "This submitted scenario is no longer available. Return to intake to recover it."],
    [409, "idempotency_key_content_conflict", "This generation request conflicted with saved state. Reload the Agent ledger before trying again."],
    [500, "persistence_failed", "We couldn't generate an Agent snapshot. Your saved ledger has not changed."],
  ])("retains the last safe ledger for %s failures without exposing error bodies", async (status, code, notice) => {
    const fetcher = recoverFetch({ snapshot, agents: [core] });
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: code, trace_id: "private-trace" }, status));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate(true);

    expect(subject.state).toMatchObject({ phase: "ready", snapshot, agents: [core], notice });
    expect(JSON.stringify(subject.state)).not.toContain("private-trace");
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("fails closed on unsafe schemas and never falls back to a local repository", async () => {
    const fetcher = recoverFetch({ snapshot, agents: [core] });
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", source: "controlled_snapshot", idempotent: false, snapshot, agents: [{ ...core, raw_context: "private raw input" }] }));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate(true);

    expect(subject.state).toMatchObject({ phase: "ready", snapshot, agents: [core], notice: "We couldn't generate an Agent snapshot. Your saved ledger has not changed." });
    expect(JSON.stringify(subject.state)).not.toContain("private raw input");
  });

  it("blocks duplicate in-flight generation requests", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const fetcher = recoverFetch();
    fetcher.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    const subject = controller(fetcher);
    await subject.recover();

    const first = subject.generate(true);
    await Promise.resolve();
    const second = subject.generate(true);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(subject.state.pendingGeneration).toBe(true);

    resolveRequest?.(json({ ok: true, error_code: null, trace_id: "opaque", source: "controlled_snapshot", idempotent: false, snapshot, agents: [core] }, 201));
    await Promise.all([first, second]);
    expect(subject.state).toMatchObject({ phase: "ready", pendingGeneration: false, snapshot, agents: [core] });
  });

  it("reloads server truth after a conflict without replaying the failed mutation", async () => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: "idempotency_key_content_conflict", trace_id: "opaque" }, 409));
    fetcher.mockResolvedValueOnce(json({ seedContexts: [{ id: seedA, version: "1", submittedAt: "2026-08-28T12:00:00+00:00", frozenAt: "2026-08-28T12:00:00+00:00" }] }));
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", people: [person] }));
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", snapshot, agents: [core] }));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.generate(true);
    await subject.recover();

    expect(fetcher).toHaveBeenCalledTimes(7);
    expect(subject.state).toMatchObject({ phase: "ready", seed: { id: seedA }, snapshot, agents: [core] });
  });
});
