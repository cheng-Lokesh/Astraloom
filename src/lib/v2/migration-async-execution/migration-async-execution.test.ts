import { describe, expect, it } from "vitest";

import { normalizeSeedContextDraft } from "@/lib/seed-context/storage";
import { createControlledAsyncSimulationExecutorV2, createInMemoryAsyncSimulationJobRepositoryV2, createV1DraftMigrationServiceV2 } from "./index";
import { forecastLockPersistenceFixtureV2, stage6SourceFixtureV2 } from "../outcome-calibration/test-fixtures";

function v1(overrides: Record<string, unknown> = {}) {
  return { ok: true as const, draft: normalizeSeedContextDraft({
    id: "seed_a", questionText: "Should I seek the internal role?", trackType: "crossroad", timeWindow: "30_days",
    situationSummary: "A real workplace decision with evidence and uncertainty.", recentEventsText: "The team changed yesterday.", keyPeopleText: "Manager and sponsor.",
    decisionOptionsText: "Apply now or wait.", worries: "Relationship risk.", forbiddenActionsText: "No coercion.", desiredOutputText: "Compare options.",
    privacyAck: true, locale: "en", status: "draft", createdAt: "2026-07-20T10:00:00.123Z", updatedAt: "2026-07-20T10:00:00.123Z", ...overrides,
  }) };
}

function validJob() {
  const source = stage6SourceFixtureV2();
  const lock = forecastLockPersistenceFixtureV2({ source });
  const analysis = source.run.payload;
  return {
    request: { idempotencyKey: "stage8_job_key_valid_bundle", seedContext: { id: analysis.spec.seedContextId, summary: "Career context" }, runSpec: analysis.spec, schemaVersion: "2.0" as const },
    bundle: { stage2RealityBoundary: source.claimSet.realityBoundary, stage3World: analysis.spec.trajectoryTemplate.initialWorld, stage4: { runSpec: analysis.spec, trajectories: analysis.trajectories }, stage5Analysis: analysis, stage6: { claimSet: source.claimSet, claims: source.claims, report: source.report }, stage7: { forecastLockPersistenceVersion: lock.persistenceVersion, history: [lock.persistenceVersion] } },
  };
}

describe("Stage 8 repair: V1 contract, lineage, and server-owned Job authority", () => {
  it("accepts an actual normalizeSeedContextDraft output without mutating it and isolates destiny", () => {
    const draft = v1({ destinyBirthInfo: "legacy-only", privacySafetyAck: true, contextQualityScore: 80, missingContextHints: ["Add evidence."] });
    const before = structuredClone(draft.draft);
    const result = createV1DraftMigrationServiceV2().migrate(draft.draft);
    expect(result).toMatchObject({ ok: true, warningCodes: ["legacy_destiny_isolated"] });
    expect(draft.draft).toEqual(before);
    if (result.ok) expect(result.data.v2Draft).not.toHaveProperty("destinyBirthInfo");
  });

  it("canonicalizes real alias pairs but rejects semantic conflicts and invalid millisecond timestamps", () => {
    const service = createV1DraftMigrationServiceV2();
    const canonical = v1({ recentEvents: "The team changed yesterday.", decisionOptions: "Apply now or wait.", forbiddenActions: "No coercion.", desiredOutput: "Compare options.", privacySafetyAck: true });
    const legacy = v1({ privacySafetyAck: true });
    if (!canonical.ok || !legacy.ok) throw new Error("fixture");
    const a = service.migrate(canonical.draft); const b = service.migrate(legacy.draft);
    expect(a).toMatchObject({ ok: true }); expect(b).toMatchObject({ ok: true, idempotent: true });
    if (a.ok && b.ok) expect(b.data.artifactId).toBe(a.data.artifactId);
    expect(service.migrate(v1({ recentEvents: "conflict", recentEventsText: "other" }).ok ? v1({ recentEvents: "conflict", recentEventsText: "other" }).draft : null)).toMatchObject({ ok: false, errorCode: "incompatible_v1_draft" });
    expect(service.migrate({ ...legacy.draft, createdAt: "2026-02-30T10:00:00.123Z" })).toMatchObject({ ok: false });
  });

  it("keeps lineage per logical source: A1 -> B1 -> A2, and aliases join A only", () => {
    const service = createV1DraftMigrationServiceV2();
    const a1 = v1(); const b1 = v1({ id: "seed_b", questionText: "A separate draft." }); const a2 = v1({ situationSummary: "A materially revised workplace decision." });
    if (!a1.ok || !b1.ok || !a2.ok) throw new Error("fixture");
    const first = service.migrate(a1.draft); const other = service.migrate(b1.draft); const revised = service.migrate(a2.draft); const alias = service.migrate({ ...a1.draft, id: "legacy:seed_a" });
    if (!first.ok || !other.ok || !revised.ok || !alias.ok) throw new Error("migration");
    expect(first.data.lineage.parentArtifactId).toBeNull(); expect(other.data.lineage.parentArtifactId).toBeNull(); expect(revised.data.lineage.parentArtifactId).toBe(first.data.artifactId);
    expect(alias.data.lineage.sourceIdentities).toEqual(expect.arrayContaining(["seed_a", "legacy:seed_a"]));
    const read = service.history(); read[0]!.lineage.sourceIdentities.push("forged"); expect(service.history()[0]!.lineage.sourceIdentities).not.toContain("forged");
    expect(service.parseArtifact(revised.data)).toMatchObject({ ok: true });
  });

  it("rejects caller-controlled terminal finalization, forged signatures, wrong worker/lease/attempt, and hostile finalize input", async () => {
    const repository = createInMemoryAsyncSimulationJobRepositoryV2();
    expect(repository).not.toHaveProperty("finalize");
    await expect(repository.complete(null)).resolves.toMatchObject({ ok: false });
    await expect(repository.complete(Object.defineProperty({}, "jobId", { enumerable: true, get: () => { throw new Error("hostile"); } }))).resolves.toMatchObject({ ok: false });
    const fixture = validJob();
    const submitted = await repository.submit(fixture.request); if (!submitted.ok) throw new Error(submitted.errorCode);
    const lease = await repository.claim({ workerId: "worker_a" }); if (!lease.ok || !lease.data) throw new Error("lease");
    const bad = await repository.complete({ jobId: lease.data.jobId, workerId: "worker_b", leaseToken: lease.data.leaseToken, attempt: lease.data.attempt, resultBundle: fixture.bundle, resultBindingIntegritySignature: "a".repeat(24) });
    expect(bad).toMatchObject({ ok: false, errorCode: "lease_mismatch" });
    expect(await repository.get({ jobId: lease.data.jobId })).toMatchObject({ ok: true, data: { status: "running", resultIds: null } });
    const executor = createControlledAsyncSimulationExecutorV2(repository, async () => fixture.bundle);
    expect(await executor.runOnce("worker_a")).toMatchObject({ status: "idle" });
    expect(await repository.fail({ jobId: lease.data.jobId, workerId: "worker_a", leaseToken: lease.data.leaseToken, attempt: lease.data.attempt + 1, errorCode: "forged" })).toMatchObject({ ok: false, errorCode: "lease_mismatch" });
  });

  it("hard-wires the canonical publication gate: six fake ids and a caller validate bypass cannot publish", async () => {
    const repository = createInMemoryAsyncSimulationJobRepositoryV2(); const fixture = validJob();
    await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_fake_bundle" });
    const executor = createControlledAsyncSimulationExecutorV2(repository, async () => ({ stage2RealityBoundary: { id: "evidence" }, stage3World: { id: "world" }, stage4: { runSpec: fixture.request.runSpec, trajectories: [] }, stage5Analysis: fixture.bundle.stage5Analysis, stage6: { claimSet: {}, claims: [], report: {} }, stage7: { forecastLockPersistenceVersion: {}, history: [] } }));
    expect(await executor.runOnce("worker_a")).toMatchObject({ status: "failed", errorCode: "invalid_canonical_artifacts" });
  });

  it("rejects forged result bindings atomically after full bundle revalidation", async () => {
    const repository = createInMemoryAsyncSimulationJobRepositoryV2(); const fixture = validJob();
    await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_binding" });
    const lease = await repository.claim({ workerId: "worker_a" }); if (!lease.ok || !lease.data) throw new Error("lease");
    await expect(repository.complete({ jobId: lease.data.jobId, workerId: lease.data.workerId, leaseToken: lease.data.leaseToken, attempt: lease.data.attempt, resultBundle: fixture.bundle, resultBindingIntegritySignature: "a".repeat(24) })).resolves.toMatchObject({ ok: false });
    expect(await repository.get({ jobId: lease.data.jobId })).toMatchObject({ ok: true, data: { status: "running", resultIds: null } });
  });
});
