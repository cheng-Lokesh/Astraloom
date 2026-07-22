import { describe, expect, it } from "vitest";

import {
  MIGRATION_ENGINE_VERSION_V2,
  createInMemoryAsyncSimulationJobRepositoryV2,
  createV1DraftMigrationServiceV2,
  createControlledAsyncSimulationExecutorV2,
  createStage2To7CanonicalArtifactValidatorV2,
} from "./index";
import { realityBoundaryV2 } from "../agent-world/test-fixtures";

const source = (overrides: Record<string, unknown> = {}) => ({
  source: {
    kind: "v1_local_draft",
    identity: "seed_v1_career_001",
    artifactVersion: "local-deterministic-v0",
    draft: {
      id: "seed_v1_career_001",
      questionText: "Should I accept the internal leadership opportunity?",
      trackType: "crossroad",
      timeWindow: "30_days",
      situationSummary: "A team restructuring creates a leadership opening with uncertain sponsorship and limited time.",
      recentEvents: "The manager announced the restructuring yesterday.",
      keyPeopleText: "Current manager, prospective sponsor, and direct team.",
      decisionOptions: "Apply now; wait for clarity.",
      worries: "Losing trust if the team changes again.",
      forbiddenActions: "Do not pressure colleagues for confidential information.",
      safetyBoundaries: "No monitoring or coercion.",
      desiredOutput: "Compare preparation options and evidence gaps.",
      privacyAck: true,
      locale: "en",
      status: "draft",
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-07-20T10:00:00.000Z",
      destinyBirthInfo: "Legacy compatibility text only.",
    },
  },
  ...overrides,
});

const request = (overrides: Record<string, unknown> = {}) => ({
  idempotencyKey: "stage8_job_key_career_001",
  seedContext: { id: "seed_context_v2_career_001", summary: "Career decision context" },
  runSpec: { id: "run_spec_v2_career_001", seedContextId: "seed_context_v2_career_001", horizonDays: 30 },
  schemaVersion: "2.0",
  engineVersion: "stage8-test-engine",
  ...overrides,
});

describe("Stage 8 V1 draft migration and controlled async execution", () => {
  it("migrates only a compatible V1 local draft deterministically, preserves source lineage, and ignores destiny", () => {
    const service = createV1DraftMigrationServiceV2();
    const first = service.migrate(source());
    const second = service.migrate(source());
    const changedDestiny = service.migrate(source({ source: { ...source().source as object, draft: { ...(source().source as { draft: Record<string, unknown> }).draft, destinyBirthInfo: "Different legacy text" } } }));

    expect(first).toMatchObject({ ok: true, idempotent: false, warningCodes: ["legacy_destiny_isolated"] });
    expect(second).toMatchObject({ ok: true, idempotent: true, data: { artifactId: first.ok ? first.data.artifactId : "" } });
    expect(changedDestiny).toMatchObject({ ok: true, idempotent: true, data: { artifactId: first.ok ? first.data.artifactId : "" } });
    if (first.ok) {
      expect(first.data.lineage).toMatchObject({ sourceIdentity: "seed_v1_career_001", sourceVersion: "local-deterministic-v0", migrationEngineVersion: MIGRATION_ENGINE_VERSION_V2 });
      expect(first.data.v2Draft).not.toHaveProperty("destinyBirthInfo");
    }
  });

  it("content-binds migration identity across a namespace-only V1 id alias and versions changed source content without overwriting history", () => {
    const service = createV1DraftMigrationServiceV2();
    const first = service.migrate(source());
    const alias = service.migrate(source({ source: { ...source().source as object, identity: "legacy:seed_v1_career_001", draft: { ...(source().source as { draft: Record<string, unknown> }).draft, id: "legacy:seed_v1_career_001" } } }));
    const changed = service.migrate(source({ source: { ...source().source as object, draft: { ...(source().source as { draft: Record<string, unknown> }).draft, situationSummary: "A materially changed career decision context." } } }));

    expect(alias).toMatchObject({ ok: true, idempotent: true });
    expect(changed).toMatchObject({ ok: true, idempotent: false });
    if (first.ok && alias.ok && changed.ok) {
      expect(alias.data.artifactId).toBe(first.data.artifactId);
      expect(changed.data.artifactId).not.toBe(first.data.artifactId);
      expect(changed.data.lineage.parentArtifactId).toBe(first.data.artifactId);
      expect(service.history()).toHaveLength(2);
    }
  });

  it("keeps compatible destiny-free drafts warning-free and rejects a mismatched source identity", () => {
    const service = createV1DraftMigrationServiceV2();
    const destinyFree = service.migrate(source({ source: { ...source().source as object, draft: { ...(source().source as { draft: Record<string, unknown> }).draft, destinyBirthInfo: undefined } } }));
    const crossDraft = service.migrate(source({ source: { ...source().source as object, identity: "seed_v1_other" } }));
    expect(destinyFree).toMatchObject({ ok: true, warningCodes: [] });
    expect(crossDraft).toMatchObject({ ok: false, errorCode: "incompatible_v1_draft" });
    expect(service.migrate(Object.defineProperty({}, "source", { enumerable: true, get: () => { throw new Error("hostile migration"); } }))).toMatchObject({ ok: false });
  });

  it("rejects unknown versions, unknown fields, damaged nested data, historical V1 artifacts, and cross-draft references atomically", () => {
    const service = createV1DraftMigrationServiceV2();
    const attacks = [
      source({ source: { ...source().source as object, artifactVersion: "v1.unknown" } }),
      source({ source: { ...source().source as object, draft: { ...(source().source as { draft: Record<string, unknown> }).draft, unknown: true } } }),
      source({ source: { ...source().source as object, draft: { ...(source().source as { draft: Record<string, unknown> }).draft, privacyAck: "true" } } }),
      source({ source: { ...source().source as object, run: { id: "run_v1_history" } } }),
      source({ source: { ...source().source as object, draft: { ...(source().source as { draft: Record<string, unknown> }).draft, sourceDraftId: "seed_v1_other" } } }),
    ];
    for (const attack of attacks) expect(service.migrate(attack)).toMatchObject({ ok: false, data: null });
    expect(service.history()).toEqual([]);
  });

  it("creates one queued job per idempotency key and content, rejects caller-controlled status, and returns defensive snapshots", async () => {
    const repository = createInMemoryAsyncSimulationJobRepositoryV2();
    const first = await repository.submit(request());
    const repeat = await repository.submit(request());
    const conflict = await repository.submit(request({ runSpec: { id: "run_spec_v2_changed", seedContextId: "seed_context_v2_career_001", horizonDays: 90 } }));
    const forged = await repository.submit(request({ status: "succeeded" }));
    expect(first).toMatchObject({ ok: true, idempotent: false, data: { status: "queued", attempt: 0 } });
    expect(repeat).toMatchObject({ ok: true, idempotent: true });
    expect(conflict).toMatchObject({ ok: false, errorCode: "idempotency_conflict" });
    expect(forged).toMatchObject({ ok: false, errorCode: "invalid_job_input" });
    if (first.ok) {
      first.data.status = "succeeded";
      expect(await repository.get({ jobId: first.data.jobId })).toMatchObject({ ok: true, data: { status: "queued" } });
    }
    expect(await repository.get({ jobId: "forged" })).toMatchObject({ ok: false, errorCode: "invalid_job_input" });
    expect(await repository.get({ jobId: "async_simulation_job_v2_aaaaaaaaaaaaaaaaaaaaaaaa" })).toMatchObject({ ok: true, data: null });
    expect(await repository.submit(Object.defineProperty({}, "idempotencyKey", { enumerable: true, get: () => { throw new Error("hostile job"); } }))).toMatchObject({ ok: false });
  });

  it("leases a job to one worker, makes retry and completed re-execution idempotent, and only publishes complete canonical artifacts", async () => {
    const repository = createInMemoryAsyncSimulationJobRepositoryV2();
    const executor = createControlledAsyncSimulationExecutorV2(repository, {
      execute: async (job) => ({
        stage2Evidence: { id: `evidence_${job.jobId}` }, stage3World: { id: `world_${job.jobId}` }, stage4Trajectory: { id: `trajectory_${job.jobId}` },
        stage5Analysis: { id: `analysis_${job.jobId}` }, stage6ClaimsReport: { id: `report_${job.jobId}` }, stage7OutcomeCalibration: { id: `calibration_${job.jobId}` },
      }),
      validate: (artifacts) => Object.values(artifacts).every((artifact) => typeof artifact === "object" && artifact !== null && "id" in artifact),
    });
    const submitted = await repository.submit(request());
    if (!submitted.ok) throw new Error(submitted.errorCode);
    const [workerA, workerB] = await Promise.all([executor.runOnce("worker_a"), executor.runOnce("worker_b")]);
    expect([workerA.status, workerB.status].sort()).toEqual(["idle", "succeeded"]);
    expect(await executor.runOnce("worker_retry")).toMatchObject({ status: "idle" });
    expect(await repository.get({ jobId: submitted.data.jobId })).toMatchObject({ ok: true, data: { status: "succeeded", attempt: 1, resultIds: expect.any(Object), integritySignature: expect.any(String) } });
  });

  it("fails atomically without result publication on executor failure or incomplete/tampered artifacts, and never throws for hostile repository/worker input", async () => {
    const repository = createInMemoryAsyncSimulationJobRepositoryV2();
    const failureExecutor = createControlledAsyncSimulationExecutorV2(repository, { execute: async () => { throw new Error("interrupted"); }, validate: () => true });
    const first = await repository.submit(request({ idempotencyKey: "stage8_job_key_failure" }));
    if (!first.ok) throw new Error(first.errorCode);
    await expect(failureExecutor.runOnce("worker_failure")).resolves.toMatchObject({ status: "failed", errorCode: "execution_failed" });
    expect(await repository.get({ jobId: first.data.jobId })).toMatchObject({ ok: true, data: { status: "failed", resultIds: null, errorCode: "execution_failed" } });
    await expect(repository.get(Object.defineProperty({}, "jobId", { enumerable: true, get: () => { throw new Error("hostile"); } }))).resolves.toMatchObject({ ok: false });
    await expect(failureExecutor.runOnce({})).resolves.toMatchObject({ status: "invalid_worker_input" });
    await expect(repository.claim(Object.defineProperty({}, "workerId", { enumerable: true, get: () => { throw new Error("hostile worker"); } }))).resolves.toMatchObject({ ok: false });

    const invalidRepository = createInMemoryAsyncSimulationJobRepositoryV2();
    const invalidExecutor = createControlledAsyncSimulationExecutorV2(invalidRepository, {
      execute: async () => ({ stage2Evidence: { id: "e" }, stage3World: { id: "w" }, stage4Trajectory: { id: "t" }, stage5Analysis: { id: "a" }, stage6ClaimsReport: { id: "r" }, stage7OutcomeCalibration: { id: "c" } }),
      validate: () => false,
    });
    await invalidRepository.submit(request({ idempotencyKey: "stage8_job_key_invalid_artifacts" }));
    await expect(invalidExecutor.runOnce("worker_invalid")).resolves.toMatchObject({ status: "failed", errorCode: "invalid_canonical_artifacts" });
    expect(createStage2To7CanonicalArtifactValidatorV2().validate({ stage2Evidence: null, stage3World: null, stage4Trajectory: null, stage5Analysis: null, stage6ClaimsReport: null, stage7OutcomeCalibration: null })).toBe(false);
    expect(createStage2To7CanonicalArtifactValidatorV2().validate({ stage2Evidence: realityBoundaryV2(), stage3World: null, stage4Trajectory: null, stage5Analysis: null, stage6ClaimsReport: null, stage7OutcomeCalibration: null })).toBe(false);
    expect(createStage2To7CanonicalArtifactValidatorV2().validate(Object.defineProperty({}, "stage2Evidence", { enumerable: true, get: () => { throw new Error("hostile artifact"); } }) as never)).toBe(false);
  });
});
