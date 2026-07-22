import { describe, expect, it } from "vitest";

import { backtestClaimsReportV2 } from "./backtesting";
import { calibrateBacktestsV2 } from "./calibration";
import { createInMemoryOutcomeCalibrationRepositoryV2 } from "./in-memory-repository";
import { captureOutcomeV2 } from "./outcome-capture";
import {
  outcomeCaptureInputFixtureV2,
  outcomeRealityBoundaryFixtureV2,
  persistedForecastLockReferenceFixtureV2,
  stage6SourceFixtureV2,
} from "./test-fixtures";
import {
  CALIBRATION_METHOD_NAME_V2,
  CALIBRATION_METHOD_VERSION_V2,
  MIN_CALIBRATION_SAMPLE_SIZE_V2,
  PERSISTENCE_SCHEMA_VERSION_V2,
} from "./types";

async function artifacts() {
  const boundary = outcomeRealityBoundaryFixtureV2({ count: 1 });
  const captured = captureOutcomeV2(outcomeCaptureInputFixtureV2({ boundary }));
  if (!captured.ok) throw new Error(captured.errorCode);
  const source = stage6SourceFixtureV2();
  const lock = await persistedForecastLockReferenceFixtureV2({ source });
  const tested = await backtestClaimsReportV2({
    backtestSpecId: "backtest_spec_v2_repository_fixture",
    run: source.run,
    claimSet: source.claimSet,
    claims: source.claims,
    report: source.report,
    forecastLockReference: lock.forecastLockReference,
    outcome: captured.outcome,
    outcomeRealityBoundary: boundary,
  }, lock.repository);
  if (!tested.ok) throw new Error(tested.errorCode);
  const calibrated = calibrateBacktestsV2({
    calibrationSpecId: "calibration_spec_v2_repository_fixture",
    method: {
      name: CALIBRATION_METHOD_NAME_V2,
      version: CALIBRATION_METHOD_VERSION_V2,
      minimumSampleSize: MIN_CALIBRATION_SAMPLE_SIZE_V2,
    },
    backtests: [tested.backtest],
  });
  if (!calibrated.ok) throw new Error(calibrated.errorCode);
  return {
    forecastLock: lock.forecastLock,
    forecastLockPersistenceVersion: lock.persistenceVersion,
    outcome: captured.outcome,
    backtest: tested.backtest,
    calibration: calibrated.calibration,
  };
}

const streamId = "outcome_calibration_stream_v2_career_fixture";

describe("Stage 7 versioned persistence port and deterministic memory adapter", () => {
  it("appends immutable versions in dependency order and returns defensive snapshots", async () => {
    const repository = createInMemoryOutcomeCalibrationRepositoryV2();
    const values = await artifacts();
    const first = await repository.append({
      streamId,
      expectedVersion: 0,
      idempotencyKey: values.forecastLockPersistenceVersion.idempotencyKey,
      persistedAt: values.forecastLockPersistenceVersion.persistedAt,
      artifact: { kind: "forecast_lock", value: values.forecastLock },
    });
    expect(first).toMatchObject({
      ok: true,
      idempotent: false,
      data: { version: 1, parentVersionId: null, persistenceSchemaVersion: PERSISTENCE_SCHEMA_VERSION_V2 },
    });
    const second = await repository.append({
      streamId,
      expectedVersion: 1,
      idempotencyKey: "stage7_idempotency_v2_outcome_01",
      persistedAt: "2026-07-29T10:01:00.000Z",
      artifact: { kind: "outcome", value: values.outcome },
    });
    const third = await repository.append({
      streamId,
      expectedVersion: 2,
      idempotencyKey: "stage7_idempotency_v2_backtest_01",
      persistedAt: "2026-07-29T10:02:00.000Z",
      artifact: { kind: "backtest", value: values.backtest },
    });
    const fourth = await repository.append({
      streamId,
      expectedVersion: 3,
      idempotencyKey: "stage7_idempotency_v2_calibration_01",
      persistedAt: "2026-07-29T10:03:00.000Z",
      artifact: { kind: "calibration", value: values.calibration },
    });
    expect(second).toMatchObject({ ok: true, data: { version: 2 } });
    expect(third).toMatchObject({ ok: true, data: { version: 3 } });
    expect(fourth).toMatchObject({ ok: true, data: { version: 4 } });

    const history = await repository.loadHistory({ streamId });
    expect(history).toMatchObject({ ok: true });
    if (!history.ok || !first.ok) throw new Error("Expected persisted history.");
    expect(history.data.map((item) => item.version)).toEqual([1, 2, 3, 4]);
    (history.data[1]!.artifact.value as typeof values.outcome).observed = "did_not_occur";
    const versionTwo = await repository.loadVersion({ streamId, version: 2 });
    expect(versionTwo).toMatchObject({
      ok: true,
      data: { artifact: { kind: "outcome", value: { observed: "occurred" } } },
    });
  }, 15_000);

  it("enforces optimistic concurrency and content-bound idempotency", async () => {
    const repository = createInMemoryOutcomeCalibrationRepositoryV2();
    const values = await artifacts();
    const request = {
      streamId,
      expectedVersion: 0,
      idempotencyKey: "stage7_idempotency_v2_forecast_lock_idempotent",
      persistedAt: values.forecastLockPersistenceVersion.persistedAt,
      artifact: { kind: "forecast_lock" as const, value: values.forecastLock },
    };
    const first = await repository.append(request);
    const repeated = await repository.append(structuredClone(request));
    const changed = structuredClone(request);
    changed.artifact.value.lockedAt = "2026-07-19T10:02:00.000Z";
    const conflict = await repository.append(changed);
    const stale = await repository.append({
      ...request,
      idempotencyKey: "stage7_idempotency_v2_outcome_03",
    });

    expect(first).toMatchObject({ ok: true, idempotent: false });
    expect(repeated).toMatchObject({ ok: true, idempotent: true });
    expect(repeated).toEqual({ ...first, idempotent: true });
    expect(conflict).toMatchObject({ ok: false, data: null, errorCode: "idempotency_conflict" });
    expect(stale).toMatchObject({ ok: false, data: null, errorCode: "stale_version" });
  }, 15_000);

  it("fails atomically for missing dependencies, extra input, illegal ids, or corrupt nested artifacts", async () => {
    const repository = createInMemoryOutcomeCalibrationRepositoryV2();
    const values = await artifacts();
    const missingDependency = await repository.append({
      streamId,
      expectedVersion: 0,
      idempotencyKey: "stage7_idempotency_v2_backtest_missing",
      persistedAt: "2026-08-20T10:02:00.000Z",
      artifact: { kind: "backtest", value: values.backtest },
    });
    const extraInput = await repository.append({
      streamId,
      expectedVersion: 0,
      idempotencyKey: "stage7_idempotency_v2_extra",
      persistedAt: "2026-08-20T10:02:00.000Z",
      artifact: { kind: "forecast_lock", value: values.forecastLock },
      unexpected: true,
    });
    const illegalId = await repository.loadLatest({ streamId: "stream:illegal" });
    const corrupt = structuredClone(values.outcome);
    corrupt.uncertainty.statement = "";
    const corruptArtifact = await repository.append({
      streamId,
      expectedVersion: 0,
      idempotencyKey: "stage7_idempotency_v2_corrupt",
      persistedAt: "2026-08-20T10:02:00.000Z",
      artifact: { kind: "outcome", value: corrupt },
    });

    expect(missingDependency).toMatchObject({ ok: false, data: null, errorCode: "missing_dependency" });
    expect(extraInput).toMatchObject({ ok: false, data: null, errorCode: "invalid_repository_input" });
    expect(illegalId).toMatchObject({ ok: false, data: null, errorCode: "invalid_id" });
    expect(corruptArtifact).toMatchObject({ ok: false, data: null, errorCode: "invalid_artifact" });
    await expect(repository.loadHistory({ streamId })).resolves.toEqual({
      ok: true,
      data: [],
      errorCode: null,
    });
    await expect(repository.append({
      streamId,
      expectedVersion: 0,
      idempotencyKey: "stage7_idempotency_v2_valid_leap_date",
      persistedAt: "2028-02-29T10:00:00.000Z",
      artifact: { kind: "forecast_lock", value: values.forecastLock },
    })).resolves.toMatchObject({ ok: true, data: { version: 1 } });
  });

  it("rejects calendar-invalid persistence timestamps instead of normalizing them", async () => {
    const repository = createInMemoryOutcomeCalibrationRepositoryV2();
    const values = await artifacts();

    await expect(repository.append({
      streamId,
      expectedVersion: 0,
      idempotencyKey: "stage7_idempotency_v2_invalid_date",
      persistedAt: "2026-02-30T10:00:00.000Z",
      artifact: { kind: "outcome", value: values.outcome },
    })).resolves.toMatchObject({
      ok: false,
      data: null,
      errorCode: "invalid_repository_input",
    });
    await expect(repository.loadHistory({ streamId })).resolves.toEqual({
      ok: true,
      data: [],
      errorCode: null,
    });
  });

  it("rejects immutable artifact replacement and cross-Seed or cross-Ledger stream mixing", async () => {
    const repository = createInMemoryOutcomeCalibrationRepositoryV2();
    const values = await artifacts();
    const first = await repository.append({
      streamId,
      expectedVersion: 0,
      idempotencyKey: "stage7_idempotency_v2_original",
      persistedAt: values.forecastLockPersistenceVersion.persistedAt,
      artifact: { kind: "forecast_lock", value: values.forecastLock },
    });
    if (!first.ok) throw new Error(first.errorCode);
    const outcomeRecord = await repository.append({
      streamId,
      expectedVersion: 1,
      idempotencyKey: "stage7_idempotency_v2_original_outcome",
      persistedAt: "2026-07-29T10:01:00.000Z",
      artifact: { kind: "outcome", value: values.outcome },
    });
    if (!outcomeRecord.ok) throw new Error(outcomeRecord.errorCode);
    const duplicate = await repository.append({
      streamId,
      expectedVersion: 2,
      idempotencyKey: "stage7_idempotency_v2_duplicate",
      persistedAt: "2026-07-29T10:02:00.000Z",
      artifact: { kind: "outcome", value: values.outcome },
    });
    const otherSeedBoundary = outcomeRealityBoundaryFixtureV2({ count: 1, seedContextId: "seed_context_v2_other" });
    const otherSeed = captureOutcomeV2(outcomeCaptureInputFixtureV2({ boundary: otherSeedBoundary }));
    if (!otherSeed.ok) throw new Error(otherSeed.errorCode);
    const crossSeed = await repository.append({
      streamId,
      expectedVersion: 2,
      idempotencyKey: "stage7_idempotency_v2_cross_seed",
      persistedAt: "2026-08-20T10:02:00.000Z",
      artifact: { kind: "outcome", value: otherSeed.outcome },
    });
    const otherLedgerBoundary = outcomeRealityBoundaryFixtureV2({ count: 1, alternateLedger: true });
    const otherLedger = captureOutcomeV2(outcomeCaptureInputFixtureV2({ boundary: otherLedgerBoundary }));
    if (!otherLedger.ok) throw new Error(otherLedger.errorCode);
    const crossLedger = await repository.append({
      streamId,
      expectedVersion: 2,
      idempotencyKey: "stage7_idempotency_v2_cross_ledger",
      persistedAt: "2026-08-20T10:02:00.000Z",
      artifact: { kind: "outcome", value: otherLedger.outcome },
    });

    expect(duplicate).toMatchObject({ ok: false, data: null, errorCode: "immutable_artifact_conflict" });
    expect(crossSeed).toMatchObject({ ok: false, data: null, errorCode: "cross_seed_reference" });
    expect(crossLedger).toMatchObject({ ok: false, data: null, errorCode: "cross_ledger_reference" });
    const latest = await repository.loadLatest({ streamId });
    expect(latest).toMatchObject({ ok: true, data: { version: 2 } });
  });
});
