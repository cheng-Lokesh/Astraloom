import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { normalizeSeedContextDraft } from "@/lib/seed-context/storage";
import { createControlledAsyncSimulationExecutorV2, createInMemoryAsyncSimulationJobRepositoryV2, createStage2To7CanonicalArtifactValidatorV2, createV1DraftMigrationServiceV2 } from "./index";
import { forecastLockPersistenceFixtureV2, persistedForecastLockReferenceFixtureV2, stage6SourceFixtureV2 } from "../outcome-calibration/test-fixtures";
import { createInMemoryOutcomeCalibrationRepositoryV2 } from "../outcome-calibration/in-memory-repository";

function v1(overrides: Record<string, unknown> = {}) {
  return { ok: true as const, draft: normalizeSeedContextDraft({
    id: "seed_a", questionText: "Should I seek the internal role?", trackType: "crossroad", timeWindow: "30_days",
    situationSummary: "A real workplace decision with evidence and uncertainty.", recentEventsText: "The team changed yesterday.", keyPeopleText: "Manager and sponsor.",
    decisionOptionsText: "Apply now or wait.", worries: "Relationship risk.", forbiddenActionsText: "No coercion.", desiredOutputText: "Compare options.",
    privacyAck: true, locale: "en", status: "draft", createdAt: "2026-07-20T10:00:00.123Z", updatedAt: "2026-07-20T10:00:00.123Z", ...overrides,
  }) };
}

async function validJob() {
  const source = stage6SourceFixtureV2();
  const lock = await persistedForecastLockReferenceFixtureV2({ source });
  const analysis = source.run.payload;
  return {
    request: { idempotencyKey: "stage8_job_key_valid_bundle", seedContext: { id: analysis.spec.seedContextId, summary: "Career context" }, runSpec: analysis.spec, schemaVersion: "2.0" as const },
    outcomeRepository: lock.repository,
    persistenceVersion: lock.persistenceVersion,
    forecastLockId: lock.forecastLock.id,
    bundle: { stage2RealityBoundary: source.claimSet.realityBoundary, stage3World: analysis.spec.trajectoryTemplate.initialWorld, stage4: { runSpec: analysis.spec, trajectories: analysis.trajectories }, stage5Analysis: analysis, stage6: { claimSet: source.claimSet, claims: source.claims, report: source.report }, stage7: { forecastLockReference: lock.forecastLockReference } },
  };
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}
const fingerprint = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex").slice(0, 24);

function createManualRuntime(nowEpochMs: number) {
  let current = nowEpochMs;
  return {
    runtime: { nowEpochMs: () => current },
    setNowEpochMs: (next: number) => { current = next; },
  };
}

function validCompletionSignature(job: import("./index").AsyncSimulationJobV2, fixture: Awaited<ReturnType<typeof validJob>>) {
  const ids = {
    evidenceLedgerId: (fixture.bundle.stage2RealityBoundary as { evidenceLedger: { id: string } }).evidenceLedger.id,
    worldId: (fixture.bundle.stage3World as { id: string }).id,
    analysisRunSpecId: fixture.bundle.stage5Analysis.spec.analysisRunSpecId,
    reportId: (fixture.bundle.stage6.report as { id: string }).id,
    forecastLockPersistenceVersionId: fixture.persistenceVersion.id,
    forecastLockId: fixture.forecastLockId,
  };
  return fingerprint({ jobId: job.jobId, requestFingerprint: job.requestFingerprint, attempt: job.attempt, workerId: job.workerId, leaseToken: job.leaseToken, resultIds: ids, artifactFingerprints: { stage2: fingerprint(fixture.bundle.stage2RealityBoundary), stage3: fingerprint(fixture.bundle.stage3World), stage4: fingerprint(fixture.bundle.stage4), stage5: fingerprint(fixture.bundle.stage5Analysis), stage6: fingerprint(fixture.bundle.stage6), stage7: fingerprint(fixture.persistenceVersion) }, versions: { schemaVersion: job.schemaVersion, engineVersion: job.engineVersion, persistenceSchemaVersion: fixture.persistenceVersion.persistenceSchemaVersion, forecastLockSchemaVersion: (fixture.persistenceVersion.artifact.value as { versions: { forecastLockSchemaVersion: string } }).versions.forecastLockSchemaVersion } });
}

describe("Stage 8 repair: V1 contract, lineage, and server-owned Job authority", () => {
  it("derives the complete Job lifecycle from an explicit runtime clock", async () => {
    const fixture = await validJob();
    const clock = createManualRuntime(Date.parse("2042-02-03T04:05:06.789Z"));
    const repository = createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository, clock.runtime);

    const submitted = await repository.submit(fixture.request);
    if (!submitted.ok) throw new Error(submitted.errorCode);
    expect(submitted.data.createdAt).toBe("2042-02-03T04:05:06.789Z");

    const lease = await repository.claim({ workerId: "worker_a" });
    if (!lease.ok || !lease.data) throw new Error("lease");
    expect(lease.data.leasedAt).toBe("2042-02-03T04:05:06.789Z");
    expect(lease.data.leaseExpiresAt).toBe("2042-02-03T04:06:06.789Z");

    clock.setNowEpochMs(Date.parse("2042-02-03T04:06:06.789Z"));
    expect(await repository.fail({ jobId: lease.data.jobId, workerId: lease.data.workerId, leaseToken: lease.data.leaseToken, attempt: lease.data.attempt, errorCode: "expired" })).toMatchObject({ ok: false, errorCode: "lease_mismatch" });
  });

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
    expect(alias.data).toEqual(first.data);
    const read = service.history(); read[0]!.lineage.sourceIdentities.push("forged"); expect(service.history()[0]!.lineage.sourceIdentities).not.toContain("forged");
    expect(service.parseArtifact(revised.data)).toMatchObject({ ok: true });
  });

  it("rejects caller-controlled terminal finalization, forged signatures, wrong worker/lease/attempt, and hostile finalize input", async () => {
    const fixture = await validJob();
    const repository = createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository);
    expect(repository).not.toHaveProperty("finalize");
    await expect(repository.complete(null)).resolves.toMatchObject({ ok: false });
    await expect(repository.complete(Object.defineProperty({}, "jobId", { enumerable: true, get: () => { throw new Error("hostile"); } }))).resolves.toMatchObject({ ok: false });
    const submitted = await repository.submit(fixture.request); if (!submitted.ok) throw new Error(submitted.errorCode);
    const lease = await repository.claim({ workerId: "worker_a" }); if (!lease.ok || !lease.data) throw new Error("lease");
    const bad = await repository.complete({ jobId: lease.data.jobId, workerId: "worker_b", leaseToken: lease.data.leaseToken, attempt: lease.data.attempt, resultBundle: fixture.bundle, resultBindingIntegritySignature: "a".repeat(24) });
    expect(bad).toMatchObject({ ok: false, errorCode: "lease_mismatch" });
    expect(await repository.get({ jobId: lease.data.jobId })).toMatchObject({ ok: true, data: { status: "running", resultIds: null } });
    const executor = createControlledAsyncSimulationExecutorV2(repository, fixture.outcomeRepository, async () => fixture.bundle);
    expect(await executor.runOnce("worker_a")).toMatchObject({ status: "idle" });
    expect(await repository.fail({ jobId: lease.data.jobId, workerId: "worker_a", leaseToken: lease.data.leaseToken, attempt: lease.data.attempt + 1, errorCode: "forged" })).toMatchObject({ ok: false, errorCode: "lease_mismatch" });
  });

  it("hard-wires the canonical publication gate: six fake ids and a caller validate bypass cannot publish", async () => {
    const fixture = await validJob(); const repository = createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository);
    await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_fake_bundle" });
    const executor = createControlledAsyncSimulationExecutorV2(repository, fixture.outcomeRepository, async () => ({ stage2RealityBoundary: { id: "evidence" }, stage3World: { id: "world" }, stage4: { runSpec: fixture.request.runSpec, trajectories: [] }, stage5Analysis: fixture.bundle.stage5Analysis, stage6: { claimSet: {}, claims: [], report: {} }, stage7: { forecastLockReference: { streamId: "outcome_calibration_stream_v2_fake", version: 1 } } }));
    expect(await executor.runOnce("worker_a")).toMatchObject({ status: "failed", errorCode: "invalid_canonical_artifacts" });
  });

  it("rejects forged result bindings atomically after full bundle revalidation", async () => {
    const fixture = await validJob(); const repository = createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository);
    await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_binding" });
    const lease = await repository.claim({ workerId: "worker_a" }); if (!lease.ok || !lease.data) throw new Error("lease");
    await expect(repository.complete({ jobId: lease.data.jobId, workerId: lease.data.workerId, leaseToken: lease.data.leaseToken, attempt: lease.data.attempt, resultBundle: fixture.bundle, resultBindingIntegritySignature: "a".repeat(24) })).resolves.toMatchObject({ ok: false });
    expect(await repository.get({ jobId: lease.data.jobId })).toMatchObject({ ok: true, data: { status: "running", resultIds: null } });
  });

  it("publishes a Stage 6/7 official fixture bundle once and never republishes a terminal Job", async () => {
    const fixture = await validJob(); const repository = createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository);
    await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_positive" });
    const executor = createControlledAsyncSimulationExecutorV2(repository, fixture.outcomeRepository, async () => fixture.bundle);
    expect(await executor.runOnce("worker_a")).toMatchObject({ status: "succeeded" });
    expect(await executor.runOnce("worker_b")).toMatchObject({ status: "idle" });
  });

  it("rejects an unappended self-consistent Forecast Lock and keeps the Job atomic", async () => {
    const fixture = await validJob();
    const unappended = forecastLockPersistenceFixtureV2({ source: stage6SourceFixtureV2() });
    const repository = createInMemoryAsyncSimulationJobRepositoryV2(createInMemoryOutcomeCalibrationRepositoryV2());
    const submitted = await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_unappended_lock" });
    if (!submitted.ok) throw new Error(submitted.errorCode);
    const lease = await repository.claim({ workerId: "worker_a" });
    if (!lease.ok || !lease.data) throw new Error("lease");
    const rejected = await repository.complete({
      jobId: lease.data.jobId, workerId: lease.data.workerId, leaseToken: lease.data.leaseToken, attempt: lease.data.attempt,
      resultBundle: { ...fixture.bundle, stage7: { forecastLockReference: { streamId: unappended.persistenceVersion.streamId, version: 1 } } },
      resultBindingIntegritySignature: "a".repeat(24),
    });
    expect(rejected).toMatchObject({ ok: false, errorCode: "invalid_canonical_artifacts" });
    expect(await repository.get({ jobId: lease.data.jobId })).toMatchObject({ ok: true, data: { status: "running", resultIds: null } });
  });

  it("uses repository records only: wrong references, missing versions, truncated history, and a broken parent chain reject", async () => {
    const fixture = await validJob();
    const submitted = await createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository).submit(fixture.request);
    if (!submitted.ok) throw new Error(submitted.errorCode);
    const validator = createStage2To7CanonicalArtifactValidatorV2(fixture.outcomeRepository);
    await expect(validator.validate({ ...fixture.bundle, stage7: { forecastLockReference: { streamId: "outcome_calibration_stream_v2_wrong", version: 1 } } }, submitted.data)).resolves.toBe(false);
    await expect(validator.validate({ ...fixture.bundle, stage7: { forecastLockReference: { ...fixture.bundle.stage7.forecastLockReference, version: 2 } } }, submitted.data)).resolves.toBe(false);
    const truncated = { ...fixture.outcomeRepository, loadHistory: async () => ({ ok: true as const, data: [], errorCode: null }) };
    await expect(createStage2To7CanonicalArtifactValidatorV2(truncated).validate(fixture.bundle, submitted.data)).resolves.toBe(false);
    const history = await fixture.outcomeRepository.loadHistory({ streamId: fixture.bundle.stage7.forecastLockReference.streamId });
    if (!history.ok) throw new Error(history.errorCode);
    const broken = structuredClone(history.data); broken[0]!.parentVersionId = "outcome_calibration_version_v2_forged";
    const brokenChain = { ...fixture.outcomeRepository, loadHistory: async () => ({ ok: true as const, data: broken, errorCode: null }) };
    await expect(createStage2To7CanonicalArtifactValidatorV2(brokenChain).validate(fixture.bundle, submitted.data)).resolves.toBe(false);
    for (const mutate of [
      (record: Record<string, unknown>) => { record.requestFingerprint = "a".repeat(24); },
      (record: Record<string, unknown>) => { record.id = "outcome_calibration_version_v2_forged"; },
      (record: Record<string, unknown>) => { record.persistenceIntegritySignature = "a".repeat(24); },
    ]) {
      const tampered = structuredClone(history.data);
      mutate(tampered[0]! as unknown as Record<string, unknown>);
      const tamperedRepository = { ...fixture.outcomeRepository, loadHistory: async () => ({ ok: true as const, data: tampered, errorCode: null }) };
      await expect(createStage2To7CanonicalArtifactValidatorV2(tamperedRepository).validate(fixture.bundle, submitted.data)).resolves.toBe(false);
    }
  });

  it("enforces the exact lease boundary and makes a reclaimed lease permanently stale", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2040-01-01T00:00:00.000Z"));
      const fixture = await validJob(); const repository = createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository);
      await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_lease_expiry" });
      const first = await repository.claim({ workerId: "worker_a" }); if (!first.ok || !first.data) throw new Error("lease");
      await vi.advanceTimersByTimeAsync(59_999);
      await expect(repository.fail({ jobId: first.data.jobId, workerId: first.data.workerId, leaseToken: first.data.leaseToken, attempt: first.data.attempt, errorCode: "before_expiry" })).resolves.toMatchObject({ ok: true });

      await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_reclaim_expiry" });
      const stale = await repository.claim({ workerId: "worker_a" }); if (!stale.ok || !stale.data) throw new Error("lease");
      await vi.advanceTimersByTimeAsync(60_000);
      await expect(repository.complete({ jobId: stale.data.jobId, workerId: stale.data.workerId, leaseToken: stale.data.leaseToken, attempt: stale.data.attempt, resultBundle: fixture.bundle, resultBindingIntegritySignature: "a".repeat(24) })).resolves.toMatchObject({ ok: false, errorCode: "lease_mismatch" });
      await expect(repository.fail({ jobId: stale.data.jobId, workerId: stale.data.workerId, leaseToken: stale.data.leaseToken, attempt: stale.data.attempt, errorCode: "at_expiry" })).resolves.toMatchObject({ ok: false, errorCode: "lease_mismatch" });
      const reclaimed = await repository.claim({ workerId: "worker_b" }); if (!reclaimed.ok || !reclaimed.data) throw new Error("reclaim");
      expect(reclaimed.data.attempt).toBe(stale.data.attempt + 1);
      await expect(repository.fail({ jobId: stale.data.jobId, workerId: stale.data.workerId, leaseToken: stale.data.leaseToken, attempt: stale.data.attempt, errorCode: "stale" })).resolves.toMatchObject({ ok: false, errorCode: "lease_mismatch" });
    } finally { vi.useRealTimers(); }
  });

  it("contains execution and repository-input failures without publishing an artifact", async () => {
    const fixture = await validJob(); const repository = createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository);
    await expect(repository.submit(null)).resolves.toMatchObject({ ok: false, errorCode: "invalid_job_input" });
    await expect(repository.claim(null)).resolves.toMatchObject({ ok: false, errorCode: "invalid_worker_input" });
    const first = await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_conflict" });
    if (!first.ok) throw new Error(first.errorCode);
    await expect(repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_conflict", seedContext: { ...fixture.request.seedContext, summary: "different" } })).resolves.toMatchObject({ ok: false, errorCode: "idempotency_conflict" });
    const executor = createControlledAsyncSimulationExecutorV2(repository, fixture.outcomeRepository, async () => { throw new Error("execution"); });
    expect(await executor.runOnce("worker_a")).toMatchObject({ status: "failed", errorCode: "execution_failed" });
    expect(await repository.get({ jobId: first.data.jobId })).toMatchObject({ ok: true, data: { status: "failed", resultIds: null } });
  });

  it("rejects repository exceptions and hostile migration artifacts without throwing", async () => {
    const fixture = await validJob();
    const submitted = await createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository).submit(fixture.request);
    if (!submitted.ok) throw new Error(submitted.errorCode);
    const unavailable = { ...fixture.outcomeRepository, loadVersion: async () => { throw new Error("repository unavailable"); } };
    await expect(createStage2To7CanonicalArtifactValidatorV2(unavailable).validate(fixture.bundle, submitted.data)).resolves.toBe(false);
    const hostile = Object.defineProperty({}, "artifactId", { enumerable: true, get: () => { throw new Error("hostile"); } });
    expect(createV1DraftMigrationServiceV2().parseArtifact(hostile)).toMatchObject({ ok: false, errorCode: "invalid_migration_input" });
    const hostileDraft = Object.defineProperty({}, "id", { enumerable: true, get: () => { throw new Error("hostile"); } });
    expect(createV1DraftMigrationServiceV2().migrate(hostileDraft)).toMatchObject({ ok: false, errorCode: "invalid_migration_input" });
  });

  it("rejects a later Boundary, final World, and a persisted Lock from another Stage 5/6 source", async () => {
    const fixture = await validJob();
    const submitted = await createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository).submit(fixture.request);
    if (!submitted.ok) throw new Error(submitted.errorCode);
    const validator = createStage2To7CanonicalArtifactValidatorV2(fixture.outcomeRepository);
    const laterBoundary = structuredClone(fixture.bundle.stage2RealityBoundary) as { revision: number };
    laterBoundary.revision += 1;
    await expect(validator.validate({ ...fixture.bundle, stage2RealityBoundary: laterBoundary }, submitted.data)).resolves.toBe(false);
    const finalWorld = (fixture.bundle.stage4.trajectories[0] as { finalWorld?: unknown }).finalWorld;
    await expect(validator.validate({ ...fixture.bundle, stage3World: finalWorld }, submitted.data)).resolves.toBe(false);
    const unrelated = await persistedForecastLockReferenceFixtureV2({ source: stage6SourceFixtureV2({ unitIndex: 1 }) });
    await expect(createStage2To7CanonicalArtifactValidatorV2(unrelated.repository).validate({ ...fixture.bundle, stage7: { forecastLockReference: unrelated.forecastLockReference } }, submitted.data)).resolves.toBe(false);
  });

  it("rejects malformed Stage 2–7 layers before they can reach publication", async () => {
    const fixture = await validJob();
    const submitted = await createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository).submit(fixture.request);
    if (!submitted.ok) throw new Error(submitted.errorCode);
    const validator = createStage2To7CanonicalArtifactValidatorV2(fixture.outcomeRepository);
    const attempts = [
      { ...fixture.bundle, stage7: { forecastLockReference: { ...fixture.bundle.stage7.forecastLockReference, extra: true } } },
      { ...fixture.bundle, stage4: { runSpec: null as never, trajectories: fixture.bundle.stage4.trajectories } },
      { ...fixture.bundle, stage4: { ...fixture.bundle.stage4, trajectories: [] } },
      { ...fixture.bundle, stage5Analysis: {} as never },
      { ...fixture.bundle, stage6: { ...fixture.bundle.stage6, claimSet: {} } },
      { ...fixture.bundle, stage6: { ...fixture.bundle.stage6, claims: [] } },
    ];
    for (const attempt of attempts) await expect(validator.validate(attempt, submitted.data)).resolves.toBe(false);
  });

  it("rechecks lease authority after async validation at expiry and after reclaim", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2041-01-01T00:00:00.000Z"));
      const fixture = await validJob();
      const repository = createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository);
      const submit = await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_toctou_expiry" });
      if (!submit.ok) throw new Error(submit.errorCode);
      const lease = await repository.claim({ workerId: "worker_a" }); if (!lease.ok || !lease.data) throw new Error("lease");
      await vi.advanceTimersByTimeAsync(59_999);
      await expect(repository.complete({ jobId: lease.data.jobId, workerId: lease.data.workerId, leaseToken: lease.data.leaseToken, attempt: lease.data.attempt, resultBundle: fixture.bundle, resultBindingIntegritySignature: validCompletionSignature(lease.data, fixture) })).resolves.toMatchObject({ ok: true, data: { status: "succeeded" } });

      const secondFixture = await validJob();
      const validationGate: { release: (() => void) | null } = { release: null };
      let validationStarted = false;
      const delayedOutcomeRepository = {
        ...secondFixture.outcomeRepository,
        loadVersion: async (input: unknown) => {
          validationStarted = true;
          await new Promise<void>((resolve) => { validationGate.release = resolve; });
          return secondFixture.outcomeRepository.loadVersion(input);
        },
      };
      const delayedRepository = createInMemoryAsyncSimulationJobRepositoryV2(delayedOutcomeRepository);
      const second = await delayedRepository.submit({ ...secondFixture.request, idempotencyKey: "stage8_job_key_toctou_reclaim" });
      if (!second.ok) throw new Error(second.errorCode);
      const oldLease = await delayedRepository.claim({ workerId: "worker_a" }); if (!oldLease.ok || !oldLease.data) throw new Error("lease");
      const completion = delayedRepository.complete({ jobId: oldLease.data.jobId, workerId: oldLease.data.workerId, leaseToken: oldLease.data.leaseToken, attempt: oldLease.data.attempt, resultBundle: secondFixture.bundle, resultBindingIntegritySignature: validCompletionSignature(oldLease.data, secondFixture) });
      await vi.advanceTimersByTimeAsync(0);
      expect(validationStarted).toBe(true);
      await vi.advanceTimersByTimeAsync(60_000);
      const reclaimed = await delayedRepository.claim({ workerId: "worker_b" }); if (!reclaimed.ok || !reclaimed.data) throw new Error("reclaim");
      validationGate.release?.();
      await expect(completion).resolves.toMatchObject({ ok: false, errorCode: "lease_mismatch" });
      expect(await delayedRepository.get({ jobId: oldLease.data.jobId })).toMatchObject({ ok: true, data: { status: "running", workerId: "worker_b", attempt: oldLease.data.attempt + 1, resultIds: null, resultBindingIntegritySignature: null } });
    } finally { vi.useRealTimers(); }
  });

  it("strictly rejects extra, missing, malformed, and hostile canonical Bundle wrappers atomically", async () => {
    const fixture = await validJob();
    const repository = createInMemoryAsyncSimulationJobRepositoryV2(fixture.outcomeRepository);
    const submitted = await repository.submit({ ...fixture.request, idempotencyKey: "stage8_job_key_bundle_schema" });
    if (!submitted.ok) throw new Error(submitted.errorCode);
    const validator = createStage2To7CanonicalArtifactValidatorV2(fixture.outcomeRepository);
    const malformed = [
      { ...fixture.bundle, extra: true },
      { ...fixture.bundle, stage4: { ...fixture.bundle.stage4, extra: true } },
      { ...fixture.bundle, stage6: { ...fixture.bundle.stage6, extra: true } },
      { ...fixture.bundle, stage7: { ...fixture.bundle.stage7, extra: true } },
      { ...fixture.bundle, stage4: { runSpec: fixture.bundle.stage4.runSpec } },
      { ...fixture.bundle, stage6: { claimSet: fixture.bundle.stage6.claimSet, claims: fixture.bundle.stage6.claims } },
      { ...fixture.bundle, stage7: {} },
      { ...fixture.bundle, stage6: null },
      Object.defineProperty({ ...fixture.bundle }, "stage4", { enumerable: true, get: () => { throw new Error("hostile"); } }),
    ];
    for (const bundle of malformed) await expect(validator.validate(bundle as unknown as import("./index").CanonicalStage2To7ResultBundleV2, submitted.data)).resolves.toBe(false);
    const lease = await repository.claim({ workerId: "worker_a" }); if (!lease.ok || !lease.data) throw new Error("lease");
    await expect(repository.complete({ jobId: lease.data.jobId, workerId: lease.data.workerId, leaseToken: lease.data.leaseToken, attempt: lease.data.attempt, resultBundle: { ...fixture.bundle, extra: true }, resultBindingIntegritySignature: validCompletionSignature(lease.data, fixture) })).resolves.toMatchObject({ ok: false, errorCode: "invalid_canonical_artifacts" });
    expect(await repository.get({ jobId: lease.data.jobId })).toMatchObject({ ok: true, data: { status: "running", resultIds: null, resultBindingIntegritySignature: null } });
  });
});
