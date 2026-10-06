import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";
import { persistFormalSandboxRun } from "./repository.server";
import { buildFormalSandboxRunV2 } from "./runtime";
import { startFormalSandboxRun } from "./start.server";

vi.mock("./repository.server", () => ({ persistFormalSandboxRun: vi.fn() }));
vi.mock("./runtime", () => ({ buildFormalSandboxRunV2: vi.fn() }));

const ids = {
  owner: "11111111-1111-4111-8111-111111111111",
  otherOwner: "99999999-9999-4999-8999-999999999999",
  seed: "22222222-2222-4222-8222-222222222222",
  otherSeed: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  graph: "33333333-3333-4333-8333-333333333333",
  agentSnapshot: "44444444-4444-4444-8444-444444444444",
  self: "55555555-5555-4555-8555-555555555555",
  other: "66666666-6666-4666-8666-666666666666",
  edge: "77777777-7777-4777-8777-777777777777",
  profile: "88888888-8888-4888-8888-888888888888",
  run: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  request: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
};

type Row = Record<string, unknown>;

function profileRow(ownerId = ids.owner, seedId = ids.seed) {
  const profile = createEmptyRealityProfileDraft(9);
  profile.lifeClimate = { value: "当前节奏有调整", classification: "fact", evidenceSummary: "本人在现实档案中记录" };
  profile.resources = { value: "下月可能有项目变化", classification: "assumption", evidenceSummary: "本人作为待验证假设记录" };
  return {
    id: ids.profile,
    user_id: ownerId,
    seed_context_id: seedId,
    life_climate_value: profile.lifeClimate.value,
    life_climate_classification: profile.lifeClimate.classification,
    life_climate_evidence_summary: profile.lifeClimate.evidenceSummary,
    resources_value: profile.resources.value,
    resources_classification: profile.resources.classification,
    resources_evidence_summary: profile.resources.evidenceSummary,
    constraints_value: null,
    constraints_classification: "unknown",
    constraints_evidence_summary: "明确未知",
    life_goals: profile.goals,
    core_values: profile.values,
    life_themes: profile.lifeThemes,
    pressures: profile.pressures,
    external_variables: profile.externalVariables,
    revision: profile.revision,
  };
}

function createService(profile: Row | null, operations: string[] = [], feedbackRows: Row[] = [], additionalAgents: Row[] = []) {
  const rows: Record<string, unknown> = {
    relation_graph_snapshots: { id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.agentSnapshot, graph_locked: true, locked_at: "2026-09-01T00:00:00.000Z", safety_level: "safe" },
    seed_contexts: { id: ids.seed, user_question: "A bounded question", raw_context: "Private raw scenario text", safety_flags: [] },
    agent_profiles: [
      { id: ids.self, display_name: "Self", agent_type: "user_core", evidence_refs: ["seed:self"] },
      { id: ids.other, display_name: "Colleague", agent_type: "npc", evidence_refs: ["seed:person"] },
      ...additionalAgents,
    ],
    relation_edges: [{ id: ids.edge, from_agent_id: ids.self, to_agent_id: ids.other, relationship_type: "professional", evidence_refs: ["seed:person"] }],
    feedback_logs: feedbackRows,
    reality_profiles: profile,
    symbolic_lens: { mode: "bounded_fusion", summary: "Legacy reservation framing only." },
  };

  const client = {
    rpc: vi.fn(async () => ({ data: [{
      accepted_at: new Date().toISOString(),
      simulation_start_at: new Date(Date.now() + 300_000).toISOString(),
      frozen_source_input: structuredClone(rows),
      run: null,
    }], error: null })),
    from(table: string) {
      const value = rows[table];
      const builder: Record<string, (...args: unknown[]) => unknown> = {};
      builder.select = () => builder;
      builder.eq = (column, val) => { operations.push(`${table}:eq:${String(column)}:${String(val)}`); return builder; };
      builder.in = (column, values) => { operations.push(`${table}:in:${String(column)}:${Array.isArray(values) ? values.join(",") : String(values)}`); return builder; };
      builder.order = () => builder;
      builder.limit = () => builder;
      builder.maybeSingle = async () => ({ data: value ?? null, error: null });
      builder.then = (resolve, reject) => Promise.resolve({ data: Array.isArray(value) ? value : [], error: null }).then(resolve as (value: unknown) => unknown, reject as (reason: unknown) => never);
      return builder;
    },
  };
  return client as unknown as SupabaseClient;
}

beforeEach(() => {
  vi.mocked(buildFormalSandboxRunV2).mockImplementation(async (rawInput) => {
    const realityProfileSnapshot = (rawInput as { realityProfileSnapshot?: unknown }).realityProfileSnapshot;
    return { ok: true, bundle: { inputSnapshot: { realityProfileSnapshot } } } as never;
  });
  vi.mocked(persistFormalSandboxRun).mockResolvedValue({
    ok: true,
    idempotent: false,
    run: { id: ids.run, status: "completed", seed_context_id: ids.seed, graph_snapshot_id: ids.graph, time_horizon: "30_days" },
  } as never);
});

describe("formal Run freezes the Reality Profile on its locked owner Seed", () => {
  it("a new request accepted weeks after Graph lock starts a future simulation instead of backdating current feedback", async () => {
    const acceptedBefore = Date.now();
    const service = createService(profileRow(), [], [{ rating: "off", target_type: "claim", created_at: "2026-09-28T01:00:00.000Z" }]);
    const result = await startFormalSandboxRun(service, ids.owner, { graph_snapshot_id: ids.graph, idempotency_key: ids.request, horizon_days: 30 });
    expect(result.ok).toBe(true);
    const runtimeInput = vi.mocked(buildFormalSandboxRunV2).mock.calls[0]?.[0] as { startedAt: string };
    expect(Date.parse(runtimeInput.startedAt)).toBeGreaterThan(acceptedBefore);
  });
  it("uses the first reserved clock and Profile even after a failed generation and a later Profile change", async () => {
    const originalRows = {
      relation_graph_snapshots: { id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.agentSnapshot, graph_locked: true, locked_at: "2026-09-01T00:00:00.000Z", safety_level: "safe" },
      seed_contexts: { id: ids.seed, user_question: "A bounded question", raw_context: "Private raw scenario text", safety_flags: [] },
      agent_profiles: [{ id: ids.self, display_name: "Self", agent_type: "user_core", evidence_refs: ["seed:self"] }, { id: ids.other, display_name: "Colleague", agent_type: "npc", evidence_refs: ["seed:person"] }],
      relation_edges: [{ id: ids.edge, from_agent_id: ids.self, to_agent_id: ids.other, relationship_type: "professional", evidence_refs: ["seed:person"] }],
      feedback_logs: [], reality_profiles: profileRow(),
      symbolic_lens: { mode: "bounded_fusion", summary: "Legacy reservation framing only." },
    };
    const accepted = new Date().toISOString();
    const start = new Date(Date.now() + 300_000).toISOString();
    const changed = profileRow(); changed.revision = 10; changed.life_climate_value = "后来的不同档案";
    const service = createService(changed);
    const reserve = vi.fn(async () => ({ data: [{ accepted_at: accepted, simulation_start_at: start, frozen_source_input: originalRows, run: null }], error: null }));
    Object.assign(service, { rpc: reserve });
    vi.mocked(buildFormalSandboxRunV2).mockResolvedValueOnce({ ok: false, errorCode: "runtime_failed" } as never);
    const request = { graph_snapshot_id: ids.graph, idempotency_key: ids.request, horizon_days: 30 };
    await startFormalSandboxRun(service, ids.owner, request);
    await startFormalSandboxRun(service, ids.owner, request);
    const inputs = vi.mocked(buildFormalSandboxRunV2).mock.calls.map(call => call[0]) as Array<{ startedAt: string; realityProfileSnapshot: { revision: number } }>;
    expect(inputs[1]?.startedAt).toBe(start);
    expect(inputs[1]?.realityProfileSnapshot.revision).toBe(9);
    expect(reserve).toHaveBeenCalledTimes(2);
  });
  it("an expired pending reservation returns an actionable error instead of moving its frozen start", async () => {
    const service = createService(profileRow());
    Object.assign(service, { rpc: vi.fn(async () => ({ data: null, error: { message: "reservation_expired" } })) });
    expect(await startFormalSandboxRun(service, ids.owner, { graph_snapshot_id: ids.graph, idempotency_key: ids.request, horizon_days: 30 })).toEqual({ ok: false, errorCode: "reservation_expired" });
    expect(buildFormalSandboxRunV2).not.toHaveBeenCalled();
  });
  it("a completed reservation restores the original Run without rereading a changed Profile or regenerating", async () => {
    const service = createService(profileRow());
    const run = { id: ids.run, status: "completed", seed_context_id: ids.seed, graph_snapshot_id: ids.graph, time_horizon: "30_days" };
    Object.assign(service, { rpc: vi.fn(async () => ({ data: [{ accepted_at: "2026-09-29T00:00:00.000Z", simulation_start_at: "2026-09-29T00:05:00.000Z", frozen_source_input: null, run }], error: null })) });
    expect(await startFormalSandboxRun(service, ids.owner, { graph_snapshot_id: ids.graph, idempotency_key: ids.request, horizon_days: 30 })).toEqual({ ok: true, idempotent: true, run });
    expect(buildFormalSandboxRunV2).not.toHaveBeenCalled();
    expect(persistFormalSandboxRun).not.toHaveBeenCalled();
  });
  it("preserves a user variant as a strategy self rather than reclassifying it as a third party", async () => {
    const service = createService(null, [], [], [{ id: ids.otherOwner, display_name: "Parallel self", agent_type: "user_variant", evidence_refs: ["seed:self"] }]);
    const result = await startFormalSandboxRun(service, ids.owner, { graph_snapshot_id: ids.graph, idempotency_key: ids.request, horizon_days: 30 });
    expect(result.ok).toBe(true);
    expect(buildFormalSandboxRunV2).toHaveBeenCalledWith(expect.objectContaining({ agents: expect.arrayContaining([expect.objectContaining({ sourceRole: "user_variant", actorType: "self" })]) }));
  });
  it("reads only this authenticated owner's locked Graph Seed, snapshots the full matching Profile and persists it", async () => {
    const operations: string[] = [];
    const storedProfile = profileRow();
    const service = createService(storedProfile, operations);

    const result = await startFormalSandboxRun(service, ids.owner, {
      graph_snapshot_id: ids.graph,
      idempotency_key: ids.request,
      horizon_days: 30,
    });

    expect(result.ok).toBe(true);
    expect(operations).toEqual([]);
    expect(service.rpc).toHaveBeenCalledWith("reserve_account_sandbox_run", { p_graph_snapshot_id: ids.graph, p_idempotency_key: ids.request, p_horizon_days: 30, p_digital_life_rules: null });
    expect(vi.mocked(buildFormalSandboxRunV2)).toHaveBeenCalledWith(expect.objectContaining({
      realityProfileSnapshot: {
        ownerId: ids.owner,
        seedContextId: ids.seed,
        profileId: ids.profile,
        revision: 9,
        profile: expect.objectContaining({ lifeClimate: storedProfile.life_climate_value && { value: storedProfile.life_climate_value, classification: "fact", evidenceSummary: storedProfile.life_climate_evidence_summary }, revision: 9 }),
      },
    }));
    expect(vi.mocked(persistFormalSandboxRun)).toHaveBeenCalledWith(service, expect.objectContaining({
      bundle: expect.objectContaining({ inputSnapshot: expect.objectContaining({ realityProfileSnapshot: expect.objectContaining({ profileId: ids.profile, revision: 9 }) }) }),
    }));
  });

  it("freezes an absent profile as revision zero with every dimension explicitly unknown", async () => {
    const result = await startFormalSandboxRun(createService(null), ids.owner, {
      graph_snapshot_id: ids.graph,
      idempotency_key: ids.request,
      horizon_days: 90,
    });

    expect(result.ok).toBe(true);
    const runtimeInput = vi.mocked(buildFormalSandboxRunV2).mock.calls[0]?.[0] as { realityProfileSnapshot?: { revision: number; profileId: string | null; profile: ReturnType<typeof createEmptyRealityProfileDraft> } };
    expect(runtimeInput.realityProfileSnapshot?.profileId).toBeNull();
    expect(runtimeInput.realityProfileSnapshot?.revision).toBe(0);
    expect(runtimeInput.realityProfileSnapshot?.profile).toEqual(createEmptyRealityProfileDraft(0));
  });

  it.each([
    ["another owner", profileRow(ids.otherOwner, ids.seed)],
    ["another Seed", profileRow(ids.owner, ids.otherSeed)],
  ])("rejects a Reality Profile row belonging to %s", async (_label, foreignProfile) => {
    const result = await startFormalSandboxRun(createService(foreignProfile), ids.owner, {
      graph_snapshot_id: ids.graph,
      idempotency_key: ids.request,
      horizon_days: 30,
    });

    expect(result).toEqual({ ok: false, errorCode: "incomplete_object_chain" });
    expect(persistFormalSandboxRun).not.toHaveBeenCalled();
  });

  it("includes targeted feedback categories as bounded input to a later Run", async () => {
    const operations: string[] = [];
    const feedbackRows = [{ rating: "off", target_type: "claim", created_at: "2026-09-28T01:00:00.000Z" }];
    const service = createService(null, operations, feedbackRows);

    const result = await startFormalSandboxRun(service, ids.owner, {
      graph_snapshot_id: ids.graph,
      idempotency_key: ids.request,
      horizon_days: 30,
    });

    expect(result.ok).toBe(true);
    expect(operations).toEqual([]);
    expect(vi.mocked(buildFormalSandboxRunV2)).toHaveBeenCalledWith(expect.objectContaining({
      calibrationSnapshot: {
        source: "account_feedback",
        signals: [{ rating: "off", targetType: "claim", createdAt: "2026-09-28T01:00:00.000Z" }],
      },
    }));
  });
});
