import { describe, expect, it, vi } from "vitest";

import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";
import { buildFormalSandboxRunV2 } from "./runtime";
import { attachedSymbolicFixture, emptySymbolicFixture } from "./symbolic-lens.test-fixtures";

const frozenProfile = createEmptyRealityProfileDraft(4);
frozenProfile.lifeClimate = { value: "当前生活节奏正在调整", classification: "fact", evidenceSummary: "由本人在 Reality Profile 中记录" };
frozenProfile.resources = { value: "未来30天可能有项目安排变化", classification: "assumption", evidenceSummary: "由本人作为待验证假设提交" };
frozenProfile.goals = [{ value: "保留每周学习时间", classification: "fact", evidenceSummary: "由本人在 Reality Profile 中记录" }];
frozenProfile.worldInputs.resources = [{
  key: "focus-time",
  label: "每周可投入时间",
  resourceType: "time",
  available: 8,
  unit: "小时",
  minimum: 1,
  maximum: 8,
  usePerTick: 1,
  classification: "assumption",
  evidenceSummary: "本人明确设定的模拟参数",
}];

const input = {
  ownerId: "11111111-1111-4111-8111-111111111111",
  seedContextId: "22222222-2222-4222-8222-222222222222",
  graphSnapshotId: "33333333-3333-4333-8333-333333333333",
  agentSnapshotId: "44444444-4444-4444-8444-444444444444",
  horizonDays: 30 as const,
  deterministicSeed: 1701,
  startedAt: "2026-08-30T04:00:00.000Z",
  seedSummary: "A user is comparing two career paths under a stated deadline.",
  realityProfileSnapshot: {
    ownerId: "11111111-1111-4111-8111-111111111111",
    seedContextId: "22222222-2222-4222-8222-222222222222",
    profileId: "88888888-8888-4888-8888-888888888888",
    revision: frozenProfile.revision,
    profile: frozenProfile,
  },
  agents: [
    { id: "55555555-5555-4555-8555-555555555555", displayName: "User", actorType: "self" as const, evidenceRefs: ["seed:user_question"] },
    { id: "66666666-6666-4666-8666-666666666666", displayName: "Decision counterpart", actorType: "third_party" as const, evidenceRefs: ["seed:key_people"] },
  ],
  edges: [{ id: "77777777-7777-4777-8777-777777777777", fromAgentId: "55555555-5555-4555-8555-555555555555", toAgentId: "66666666-6666-4666-8666-666666666666", relationshipType: "professional", evidenceRefs: ["seed:key_people"] }],
  safetyLevel: "safe" as const,
  symbolicLens: { mode: "bounded_fusion" as const, summary: "Symbolic context is optional framing only." },
  calibrationSnapshot: { source: "none", signals: [] as string[] },
};

describe("formal account sandbox V2 runtime adapter", () => {
  it("records actual Boundary and forecast-lock times before a reserved future window without one-millisecond backdating", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T07:00:00.000Z"));
    try {
      const result = await buildFormalSandboxRunV2({ ...input, acceptedAt: "2026-10-06T07:00:00.000Z", graphLockedAt: input.startedAt, startedAt: "2026-10-06T07:05:00.000Z" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.bundle.sourceBoundary.updatedAt).toBe("2026-10-06T07:00:00.000Z");
      expect((result.bundle as unknown as { forecastTiming: unknown }).forecastTiming).toEqual({ acceptedAt: "2026-10-06T07:00:00.000Z", boundaryAt: "2026-10-06T07:00:00.000Z", lockedAt: "2026-10-06T07:00:00.000Z", generatedPersistedAt: "2026-10-06T07:00:00.000Z", simulationStartAt: "2026-10-06T07:05:00.000Z" });
    } finally { vi.useRealTimers(); }
  }, 30_000);
  it("rejects execution once the original pending reservation window has started", async () => {
    const result = await buildFormalSandboxRunV2({ ...input, acceptedAt: input.startedAt, graphLockedAt: input.startedAt });
    expect(result).toEqual({ ok: false, errorCode: "reservation_expired" });
  });
  it("reuses the canonical V2 pipeline and emits Event-backed Claims before a Report", async () => {
    const result = await buildFormalSandboxRunV2(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bundle.runtimePath).toEqual([
      "reality_boundary_v2",
      "agent_world_v2",
      "seeded_trajectory_v2",
      "trajectory_analysis_v2",
      "claims_reports_v2",
      "outcome_lock_v2",
      "stage8_canonical_validation",
    ]);
    expect(result.bundle.events.length).toBeGreaterThan(0);
    expect(result.bundle.claims.length).toBeGreaterThan(0);
    const eventIds = new Set(result.bundle.events.map((event) => event.id));
    for (const claim of result.bundle.claims) {
      expect(claim.simulationEventIds.length).toBeGreaterThan(0);
      expect(claim.simulationEventIds.every((id) => eventIds.has(id))).toBe(true);
    }
    expect(result.bundle.report.claimIds).toEqual(result.bundle.claims.map((claim) => claim.id).sort());
    expect(result.bundle.inputSnapshot.realityProfileSnapshot).toEqual(input.realityProfileSnapshot);
    expect(result.bundle.sourceBoundary.evidenceLedger.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ claimKey: "reality.profile.lifeclimate", statement: "人生气候：当前生活节奏正在调整" }),
      expect.objectContaining({ claimKey: "reality.profile.goals.1", statement: "目标：保留每周学习时间" }),
    ]));
    expect(result.bundle.sourceBoundary.assumptionLedger.assumptions).toEqual(expect.arrayContaining([
      expect.objectContaining({ statement: "未来30天可能有项目安排变化", factStatus: "not_real_world_fact" }),
    ]));
    expect(JSON.stringify({ boundary: result.bundle.sourceBoundary, world: result.bundle.worldSnapshots, events: result.bundle.events })).not.toContain("明确未知");
  }, 30_000);

  it("is structurally reproducible for the same fixed input and seed", async () => {
    const first = await buildFormalSandboxRunV2(input);
    const second = await buildFormalSandboxRunV2(structuredClone(input));
    const editedProfile = structuredClone(input);
    editedProfile.realityProfileSnapshot.revision += 1;
    editedProfile.realityProfileSnapshot.profile.revision += 1;
    const third = await buildFormalSandboxRunV2(editedProfile);
    expect(first).toEqual(second);
    expect(first.ok && third.ok).toBe(true);
    if (first.ok && third.ok) {
      expect(first.bundle.causalFingerprint).not.toBe(third.bundle.causalFingerprint);
      expect(third.bundle.inputSnapshot.realityProfileSnapshot.revision).toBe(5);
    }
  }, 30_000);

  it("keeps Symbolic Lens outside causal output and confidence", async () => {
    const first = await buildFormalSandboxRunV2(input);
    const second = await buildFormalSandboxRunV2({ ...input, symbolicLens: { mode: "bounded_fusion", summary: "Different optional framing." } });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.bundle.causalFingerprint).toBe(second.bundle.causalFingerprint);
    expect(first.bundle.claims).toEqual(second.bundle.claims);
    expect(first.bundle.symbolicLensSnapshot).not.toEqual(second.bundle.symbolicLensSnapshot);
  }, 30_000);

  it("freezes a real symbolic frame while leaving all controlled causal artifacts unchanged", async () => {
    const attached = attachedSymbolicFixture(input.startedAt);
    attached.provenance.ownerId = input.ownerId;
    const first = await buildFormalSandboxRunV2({ ...input, symbolicLens: attached });
    const second = await buildFormalSandboxRunV2({ ...input, symbolicLens: emptySymbolicFixture("not_authorized", input.startedAt) });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.bundle.symbolicLensSnapshot).toEqual(attached);
    expect(first.bundle.causalFingerprint).toBe(second.bundle.causalFingerprint);
    expect(first.bundle.inputSnapshot).toEqual(second.bundle.inputSnapshot);
    expect(first.bundle.sourceBoundary).toEqual(second.bundle.sourceBoundary);
    expect(first.bundle.worldSnapshots).toEqual(second.bundle.worldSnapshots);
    expect(first.bundle.events).toEqual(second.bundle.events);
    expect(first.bundle.trajectoryAnalysis).toEqual(second.bundle.trajectoryAnalysis);
    expect(first.bundle.claims).toEqual(second.bundle.claims);
    expect(first.bundle.report).toEqual(second.bundle.report);
  }, 30_000);

  it("blocks unsafe input before creating Events, Claims, or Report", async () => {
    await expect(buildFormalSandboxRunV2({ ...input, safetyLevel: "blocked" })).resolves.toEqual({ ok: false, errorCode: "safety_blocked" });
  });

  it("does not invent a resource when the frozen Reality Profile has no executable world inputs", async () => {
    const unknownWorld = structuredClone(input);
    unknownWorld.realityProfileSnapshot.profile.worldInputs.resources = [];
    await expect(buildFormalSandboxRunV2(unknownWorld)).resolves.toEqual({ ok: false, errorCode: "world_model_required" });
  });

  it("supports only Track A 30 and 90 day horizons", async () => {
    const ninety = await buildFormalSandboxRunV2({ ...input, horizonDays: 90 });
    expect(ninety.ok).toBe(true);
    await expect(buildFormalSandboxRunV2({ ...input, horizonDays: 365 as 30 })).resolves.toEqual({ ok: false, errorCode: "invalid_run_input" });
  }, 30_000);

  it("freezes explicit structured resources and constraints into the simulated World State", async () => {
    const modeledInput = structuredClone(input);
    modeledInput.realityProfileSnapshot.profile.worldInputs = {
      version: 1,
      resources: [{
        key: "weekly-focus",
        label: "每周可投入时间",
        resourceType: "time",
        available: 8,
        unit: "小时",
        minimum: 2,
        maximum: 8,
        usePerTick: 2,
        classification: "assumption",
        evidenceSummary: "本人明确设定的模拟参数",
      }],
      constraints: [{
        key: "focus-deadline",
        label: "阶段时间边界",
        resourceKey: "weekly-focus",
        rule: { kind: "before_time", value: "2026-10-01T00:00:00.000Z" },
        classification: "fact",
        evidenceSummary: "本人记录的时间限制",
      }],
    };
    const result = await buildFormalSandboxRunV2(modeledInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const world of result.bundle.worldSnapshots) {
      expect(world.resources).toEqual(expect.arrayContaining([expect.objectContaining({
        label: "每周可投入时间",
        resourceType: "time",
        available: 2,
        unit: "小时",
        min: 2,
        max: 8,
      })]));
      expect(world.resources.map((resource) => resource.label)).not.toContain("Decision capacity");
      expect(world.constraints).toEqual(expect.arrayContaining([expect.objectContaining({
        constraintType: "deadline",
        rule: { kind: "before_time", value: "2026-10-01T00:00:00.000Z" },
        target: expect.objectContaining({ type: "resource" }),
      })]));
    }
  }, 30_000);

  it("models explicitly classified pressures and external variables as static World variables", async () => {
    const modeledInput = structuredClone(input);
    modeledInput.realityProfileSnapshot.profile.pressures = [{
      value: "本季度存在明确的交付压力",
      classification: "assumption",
      evidenceSummary: "本人提交的待验证情境",
    }];
    modeledInput.realityProfileSnapshot.profile.externalVariables = [
      { value: "团队预算尚未确认", classification: "fact", evidenceSummary: "本人记录的当前状态" },
      { value: "", classification: "unknown", evidenceSummary: "明确未知" },
    ];

    const result = await buildFormalSandboxRunV2(modeledInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bundle.inputSnapshot.realityProfileSnapshot).toEqual(modeledInput.realityProfileSnapshot);
    expect(result.bundle.sourceBoundary.evidenceLedger.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ claimKey: "reality.profile.externalvariables.1", statement: "外部变量（第1项）：团队预算尚未确认" }),
    ]));
    expect(result.bundle.sourceBoundary.assumptionLedger.assumptions).toEqual(expect.arrayContaining([
      expect.objectContaining({ statement: "本季度存在明确的交付压力" }),
    ]));
    for (const world of result.bundle.worldSnapshots) {
      expect(world.externalVariables).toHaveLength(2);
      expect(world.externalVariables).toEqual(expect.arrayContaining([
        expect.objectContaining({ variableType: "enum", value: "本季度存在明确的交付压力", allowedValues: ["本季度存在明确的交付压力"], provisional: true }),
        expect.objectContaining({ variableType: "enum", value: "团队预算尚未确认", allowedValues: ["团队预算尚未确认"], provisional: false }),
      ]));
    }
    expect(result.bundle.events.some((event) => event.eventType === "update_external_variable")).toBe(false);
  }, 30_000);

  it("does not pull long-horizon life-model facts into a Track A evidence ledger", async () => {
    const trackAInput = structuredClone(input);
    trackAInput.realityProfileSnapshot.profile.lifeModelDomains.identity = [{
      value: "长期照护家人",
      classification: "fact",
      evidenceSummary: "本人确认的长期责任",
    }];

    const result = await buildFormalSandboxRunV2(trackAInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bundle.sourceBoundary.evidenceLedger.items.map(item => item.claimKey)).not.toContain("reality.profile.lifeModelDomains.identity.1");
    expect(result.bundle.sourceBoundary.evidenceLedger.items.map(item => item.statement)).not.toContain("身份结构（第1项）：长期照护家人");
  }, 30_000);
});
