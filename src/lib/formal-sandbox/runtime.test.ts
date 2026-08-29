import { describe, expect, it } from "vitest";

import { buildFormalSandboxRunV2 } from "./runtime";

const input = {
  ownerId: "11111111-1111-4111-8111-111111111111",
  seedContextId: "22222222-2222-4222-8222-222222222222",
  graphSnapshotId: "33333333-3333-4333-8333-333333333333",
  agentSnapshotId: "44444444-4444-4444-8444-444444444444",
  horizonDays: 30 as const,
  deterministicSeed: 1701,
  startedAt: "2026-08-30T04:00:00.000Z",
  seedSummary: "A user is comparing two career paths under a stated deadline.",
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
  });

  it("is structurally reproducible for the same fixed input and seed", async () => {
    const first = await buildFormalSandboxRunV2(input);
    const second = await buildFormalSandboxRunV2(structuredClone(input));
    expect(first).toEqual(second);
  });

  it("keeps Symbolic Lens outside causal output and confidence", async () => {
    const first = await buildFormalSandboxRunV2(input);
    const second = await buildFormalSandboxRunV2({ ...input, symbolicLens: { mode: "bounded_fusion", summary: "Different optional framing." } });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.bundle.causalFingerprint).toBe(second.bundle.causalFingerprint);
    expect(first.bundle.claims).toEqual(second.bundle.claims);
    expect(first.bundle.symbolicLensSnapshot).not.toEqual(second.bundle.symbolicLensSnapshot);
  });

  it("blocks unsafe input before creating Events, Claims, or Report", async () => {
    await expect(buildFormalSandboxRunV2({ ...input, safetyLevel: "blocked" })).resolves.toEqual({ ok: false, errorCode: "safety_blocked" });
  });

  it("supports only Track A 30 and 90 day horizons", async () => {
    const ninety = await buildFormalSandboxRunV2({ ...input, horizonDays: 90 });
    expect(ninety.ok).toBe(true);
    await expect(buildFormalSandboxRunV2({ ...input, horizonDays: 365 as 30 })).resolves.toEqual({ ok: false, errorCode: "invalid_run_input" });
  });
});
