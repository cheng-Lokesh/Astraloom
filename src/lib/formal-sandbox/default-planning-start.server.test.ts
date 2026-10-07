import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDigitalLifeModel } from "@/lib/digital-life/model";
import { digitalLifeInput } from "@/lib/digital-life/test-fixtures";
import { freezeDefaultPlanning } from "@/lib/formal-planning";
import { defaultPlanningRequestSchema } from "@/lib/formal-planning/contracts";
import { planningRequest, planningSource } from "@/lib/formal-planning/test-fixtures";
import { realityProfileDraftFromDatabaseRow } from "@/lib/reality-profile/profile";
import { buildFormalSandboxRunV2, type FormalSandboxRuntimeInput } from "./runtime";
import { persistFormalSandboxRun } from "./repository.server";
import { formalSandboxStartRequestSchema } from "./start-request";
import { startFormalSandboxRun } from "./start.server";

vi.mock("./runtime", () => ({ buildFormalSandboxRunV2: vi.fn() }));
vi.mock("./repository.server", () => ({ persistFormalSandboxRun: vi.fn() }));
const key = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const runId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function fixture(withPlanning = true) {
  const accepted = planningSource();
  const people = digitalLifeInput();
  const profile = accepted.realityProfileSnapshot.profile;
  const profileRow = {
    id: accepted.realityProfileSnapshot.profileId, user_id: accepted.model.ownerId, seed_context_id: accepted.model.seedContextId,
    life_climate_value: profile.lifeClimate.value, life_climate_classification: profile.lifeClimate.classification, life_climate_evidence_summary: profile.lifeClimate.evidenceSummary,
    resources_value: profile.resources.value, resources_classification: profile.resources.classification, resources_evidence_summary: profile.resources.evidenceSummary,
    constraints_value: profile.constraints.value, constraints_classification: profile.constraints.classification, constraints_evidence_summary: profile.constraints.evidenceSummary,
    life_goals: profile.goals, core_values: profile.values, life_themes: profile.lifeThemes, pressures: profile.pressures, external_variables: profile.externalVariables,
    life_model_domains: profile.lifeModelDomains, world_model_inputs: profile.worldInputs, revision: profile.revision,
  };
  // Validate the database-shaped synthetic Profile rather than relying on a loose mock row.
  expect(JSON.stringify(realityProfileDraftFromDatabaseRow(profileRow)) === JSON.stringify(profile)).toBe(true);
  const planning = defaultPlanningRequestSchema.parse(planningRequest());
  const request = formalSandboxStartRequestSchema.parse({ graph_snapshot_id: accepted.model.graphSnapshotId, idempotency_key: key, horizon_days: 30,
    digital_life_rules: accepted.model.rules, ...(withPlanning ? { default_planning: planning } : {}),
  });
  const source = {
    relation_graph_snapshots: { id: accepted.model.graphSnapshotId, user_id: accepted.model.ownerId, seed_context_id: accepted.model.seedContextId,
      agent_snapshot_id: accepted.model.agentSnapshotId, graph_locked: true, locked_at: "2026-09-01T00:00:00.000Z", safety_level: "safe" },
    seed_contexts: { id: accepted.model.seedContextId, user_question: "本人确认的有限模拟问题", raw_context: "合成情境，仅用于入场合同测试", safety_flags: [] },
    agent_profiles: people.agents.map(person => ({ id: person.id, display_name: person.displayName, agent_type: person.sourceRole, evidence_refs: person.evidenceRefs })),
    relation_edges: people.edges.map(edge => ({ id: edge.id, from_agent_id: edge.fromAgentId, to_agent_id: edge.toAgentId, relationship_type: edge.relationshipType, evidence_refs: edge.evidenceRefs })),
    reality_profiles: profileRow, symbolic_lens: accepted.symbolicLens, feedback_logs: [], digital_life_rules: accepted.model.rules,
    ...(withPlanning ? { default_planning: planning, planning_consent_context: accepted.consentContext } : {}),
  };
  const run = { id: runId, status: "completed" as const, graph_snapshot_id: accepted.model.graphSnapshotId, time_horizon: "30_days" as const };
  const receipt = { accepted_at: accepted.acceptedAt, simulation_start_at: new Date(Date.parse(accepted.acceptedAt) + 300_000).toISOString(), frozen_source_input: source, run: null as typeof run | null };
  const rpc = vi.fn(async () => ({ data: [structuredClone(receipt)], error: null }));
  const from = vi.fn(() => { throw new Error("current_source_read_forbidden"); });
  const caller = { rpc, from } as unknown as SupabaseClient;
  return { accepted, planning, request, source, receipt, caller, rpc, from, run };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-06T00:00:01.000Z"));
  vi.mocked(buildFormalSandboxRunV2).mockResolvedValue({ ok: true, bundle: { inputSnapshot: {} } } as never);
  vi.mocked(persistFormalSandboxRun).mockResolvedValue({ ok: true, idempotent: false, run: { id: runId, status: "completed" } } as never);
});
afterEach(() => vi.useRealTimers());

describe("default planning Start admission and frozen receipt transport", () => {
  it("sends the sixth planning parameter and forwards only the reserved request/context to the runtime", async () => {
    const input = fixture();
    const result = await startFormalSandboxRun(input.caller, input.accepted.model.ownerId, input.request);
    expect(result.ok).toBe(true);
    expect(input.rpc.mock.calls.length).toBe(1);
    const call = vi.mocked(input.caller.rpc).mock.calls[0];
    expect(call[0] === "reserve_account_sandbox_run").toBe(true);
    const args = call[1] as Record<string, unknown>;
    expect(Object.keys(args).sort()).toEqual(["p_default_planning", "p_digital_life_rules", "p_graph_snapshot_id", "p_horizon_days", "p_idempotency_key", "p_outcome_calibration"].sort());
    expect(JSON.stringify(args.p_default_planning) === JSON.stringify(input.planning)).toBe(true);
    expect(args.p_graph_snapshot_id === input.request.graph_snapshot_id && args.p_idempotency_key === key).toBe(true);
    expect(input.from.mock.calls.length).toBe(0);
    expect(vi.mocked(buildFormalSandboxRunV2).mock.calls.length).toBe(1);
    const runtime = vi.mocked(buildFormalSandboxRunV2).mock.calls[0][0] as FormalSandboxRuntimeInput;
    expect(JSON.stringify(runtime.defaultPlanning) === JSON.stringify(input.source.default_planning)).toBe(true);
    expect(runtime.planningConsentContext === input.source.planning_consent_context).toBe(true);
    expect(runtime.acceptedAt === input.receipt.accepted_at && runtime.startedAt === input.receipt.simulation_start_at).toBe(true);
    expect(runtime.ownerId === input.accepted.model.ownerId && runtime.seedContextId === input.accepted.model.seedContextId).toBe(true);
    expect(runtime.realityProfileSnapshot.revision).toBe(input.accepted.realityProfileSnapshot.revision);
    const model = buildDigitalLifeModel(runtime, runtime.digitalLifeRules);
    expect(model.ok).toBe(true);
    if (!model.ok) return;
    const frozen = freezeDefaultPlanning(runtime.defaultPlanning, { model: model.model, realityProfileSnapshot: runtime.realityProfileSnapshot,
      horizonDays: runtime.horizonDays, acceptedAt: runtime.acceptedAt, symbolicLens: runtime.symbolicLens, consentContext: runtime.planningConsentContext });
    expect(frozen.ok).toBe(true);
    expect(vi.mocked(persistFormalSandboxRun).mock.calls.length).toBe(1);
  });
  it("restores a completed same-key planning receipt with one RPC and no source read or rebuild, even after the clock expires", async () => {
    const input = fixture();
    input.receipt.run = input.run;
    vi.setSystemTime(new Date("2026-10-07T00:00:00.000Z"));
    const result = await startFormalSandboxRun(input.caller, input.accepted.model.ownerId, input.request);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.idempotent).toBe(true);
    expect(result.run.id === input.run.id).toBe(true);
    expect(input.rpc.mock.calls.length).toBe(1);
    expect(input.from.mock.calls.length).toBe(0);
    expect(vi.mocked(buildFormalSandboxRunV2).mock.calls.length).toBe(0);
    expect(vi.mocked(persistFormalSandboxRun).mock.calls.length).toBe(0);
  });
  it("preserves the old five-parameter admission and adds no planning metadata when absent", async () => {
    const input = fixture(false);
    const result = await startFormalSandboxRun(input.caller, input.accepted.model.ownerId, input.request);
    expect(result.ok).toBe(true);
    const args = vi.mocked(input.caller.rpc).mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(args).sort()).toEqual(["p_digital_life_rules", "p_graph_snapshot_id", "p_horizon_days", "p_idempotency_key", "p_outcome_calibration"].sort());
    const runtime = vi.mocked(buildFormalSandboxRunV2).mock.calls[0][0] as FormalSandboxRuntimeInput;
    expect(Object.hasOwn(runtime, "defaultPlanning")).toBe(false);
    expect(Object.hasOwn(runtime, "planningConsentContext")).toBe(false);
    expect(input.from.mock.calls.length).toBe(0);
    expect(input.rpc.mock.calls.length).toBe(1);
    expect(vi.mocked(persistFormalSandboxRun).mock.calls.length).toBe(1);
  });
  it("rejects a frozen consent-context mismatch before runtime or completion writes", async () => {
    const input = fixture();
    input.source.planning_consent_context = "b".repeat(64);
    const result = await startFormalSandboxRun(input.caller, input.accepted.model.ownerId, input.request);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe("invalid_planning_source");
    expect(input.rpc.mock.calls.length).toBe(1);
    expect(input.from.mock.calls.length).toBe(0);
    expect(vi.mocked(buildFormalSandboxRunV2).mock.calls.length).toBe(0);
    expect(vi.mocked(persistFormalSandboxRun).mock.calls.length).toBe(0);
  });
});
