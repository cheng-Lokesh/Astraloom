import { describe, expect, it } from "vitest";

import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";
import { buildFormalSandboxRunV2 } from "./runtime";

const frozenProfile = createEmptyRealityProfileDraft(4);
frozenProfile.lifeClimate = { value: "当前生活节奏正在调整", classification: "fact", evidenceSummary: "由本人在 Reality Profile 中记录" };
frozenProfile.resources = { value: "未来30天可能有项目安排变化", classification: "assumption", evidenceSummary: "由本人作为待验证假设提交" };
frozenProfile.goals = [{ value: "保留每周学习时间", classification: "fact", evidenceSummary: "由本人在 Reality Profile 中记录" }];

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

  it("blocks unsafe input before creating Events, Claims, or Report", async () => {
    await expect(buildFormalSandboxRunV2({ ...input, safetyLevel: "blocked" })).resolves.toEqual({ ok: false, errorCode: "safety_blocked" });
  });

  it("supports only Track A 30 and 90 day horizons", async () => {
    const ninety = await buildFormalSandboxRunV2({ ...input, horizonDays: 90 });
    expect(ninety.ok).toBe(true);
    await expect(buildFormalSandboxRunV2({ ...input, horizonDays: 365 as 30 })).resolves.toEqual({ ok: false, errorCode: "invalid_run_input" });
  }, 30_000);
});
