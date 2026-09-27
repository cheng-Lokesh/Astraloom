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

function createService(profile: Row | null, operations: string[] = []) {
  const rows: Record<string, unknown> = {
    relation_graph_snapshots: { id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.agentSnapshot, graph_locked: true, locked_at: "2026-09-01T00:00:00.000Z", safety_level: "safe" },
    seed_contexts: { id: ids.seed, user_question: "A bounded question", raw_context: "Private raw scenario text", safety_flags: [] },
    agent_profiles: [
      { id: ids.self, display_name: "Self", agent_type: "user_core", evidence_refs: ["seed:self"] },
      { id: ids.other, display_name: "Colleague", agent_type: "npc", evidence_refs: ["seed:person"] },
    ],
    relation_edges: [{ id: ids.edge, from_agent_id: ids.self, to_agent_id: ids.other, relationship_type: "professional", evidence_refs: ["seed:person"] }],
    feedback_logs: [],
    reality_profiles: profile,
  };

  const client = {
    from(table: string) {
      const value = rows[table];
      const builder: Record<string, (...args: unknown[]) => unknown> = {};
      builder.select = () => builder;
      builder.eq = (column, val) => { operations.push(`${table}:eq:${String(column)}:${String(val)}`); return builder; };
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
    expect(operations).toContain(`reality_profiles:eq:user_id:${ids.owner}`);
    expect(operations).toContain(`reality_profiles:eq:seed_context_id:${ids.seed}`);
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
});
