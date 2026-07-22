import { describe, expect, it } from "vitest";

import { backtestClaimsReportV2 } from "./backtesting";
import { calibrateBacktestsV2 } from "./calibration";
import { buildForecastLockV2, parseValidatedForecastLockV2 } from "./forecast-lock";
import { createInMemoryOutcomeCalibrationRepositoryV2 } from "./in-memory-repository";
import {
  buildForecastLockV2 as buildForecastLockFromIndexV2,
  parseValidatedForecastLockV2 as parseForecastLockFromIndexV2,
} from "./index";
import { captureOutcomeV2 } from "./outcome-capture";
import {
  forecastLockPersistenceFixtureV2,
  outcomeCaptureInputFixtureV2,
  outcomeRealityBoundaryFixtureV2,
  stage6SourceFixtureV2,
  persistedForecastLockReferenceFixtureV2,
} from "./test-fixtures";
import {
  CALIBRATION_METHOD_NAME_V2,
  CALIBRATION_METHOD_VERSION_V2,
  FORECAST_LOCK_SCHEMA_VERSION_V2,
  MIN_CALIBRATION_SAMPLE_SIZE_V2,
} from "./types";

function capture(index: number, source = stage6SourceFixtureV2({ unitIndex: index })) {
  const boundary = outcomeRealityBoundaryFixtureV2({ count: index + 1 });
  const result = captureOutcomeV2(outcomeCaptureInputFixtureV2({ index, boundary, source }));
  if (!result.ok) throw new Error(result.errorCode);
  return result.outcome;
}

async function buildBacktest({
  index = 0,
  source = stage6SourceFixtureV2({ unitIndex: index }),
  lockedAt = "2026-07-19T10:01:00.000Z",
}: {
  index?: number;
  source?: ReturnType<typeof stage6SourceFixtureV2>;
  lockedAt?: string;
} = {}) {
  const outcome = capture(index, source);
  const lock = await persistedForecastLockReferenceFixtureV2({ source, lockedAt });
  const result = await backtestClaimsReportV2({
    backtestSpecId: `backtest_spec_v2_forecast_lock_${index + 1}`,
    run: source.run,
    claimSet: source.claimSet,
    claims: source.claims,
    report: source.report,
    forecastLockReference: lock.forecastLockReference,
    outcome,
    outcomeRealityBoundary: outcome.realityBoundarySnapshot,
  }, lock.repository);
  if (!result.ok) throw new Error(result.errorCode);
  return { ...lock, outcome, backtest: result.backtest };
}

describe("Stage 7 Forecast Lock", () => {
  it("builds a deterministic lock only from a fully revalidated Run, Claim Set, Claims, and Report", () => {
    const source = stage6SourceFixtureV2();
    const input = {
      forecastLockSpecId: "forecast_lock_spec_v2_canonical",
      lockedAt: "2026-07-19T10:01:00.000Z",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
    };
    const first = buildForecastLockV2(input);
    const second = buildForecastLockV2(structuredClone(input));

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      ok: true,
      forecastLock: {
        status: "locked",
        lockedAt: input.lockedAt,
        canonicalContentSignature: expect.stringMatching(/^[a-f0-9]{24}$/),
        realityBoundaryBinding: {
          revision: source.claimSet.realityBoundary.revision,
          fingerprint: expect.stringMatching(/^[a-f0-9]{24}$/),
        },
        versions: { forecastLockSchemaVersion: FORECAST_LOCK_SCHEMA_VERSION_V2 },
      },
    });
    if (!first.ok) throw new Error(first.errorCode);
    const normalizedRun = JSON.stringify(first.forecastLock.forecastUnits[0]!.semantics.normalizedRunSpec);
    expect(normalizedRun).not.toContain("analysis_run_spec_v2_");
    expect(normalizedRun).not.toContain("trajectory_run_spec_v2_");
    expect(normalizedRun).not.toContain("trajectory_v2_");
    expect(normalizedRun).not.toContain(source.targetClaim.id);
    expect(normalizedRun).not.toContain(source.report.reportSpecId);
    expect(parseValidatedForecastLockV2(first.forecastLock)).toEqual({
      ok: true,
      forecastLock: first.forecastLock,
    });

    const extra = { ...input, unexpected: true };
    const tamperedClaim = structuredClone(input);
    tamperedClaim.claims[0]!.numerator = 0;
    expect(buildForecastLockV2(extra)).toMatchObject({ ok: false });
    expect(buildForecastLockV2(tamperedClaim)).toMatchObject({ ok: false });
  });

  it("rejects a Forecast locked or persisted after its primary Outcome Evidence was captured", async () => {
    const source = stage6SourceFixtureV2();
    const outcome = capture(0, source);
    const late = await persistedForecastLockReferenceFixtureV2({
      source,
      lockedAt: "2026-07-29T10:00:00.001Z",
      persistedAt: "2026-07-29T10:00:00.002Z",
    });

    expect(await backtestClaimsReportV2({
      backtestSpecId: "backtest_spec_v2_late_forecast_lock",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      forecastLockReference: late.forecastLockReference,
      outcome,
      outcomeRealityBoundary: outcome.realityBoundarySnapshot,
    }, late.repository)).toMatchObject({ ok: false, errorCode: "invalid_forecast_lock" });
  });

  it("rejects a tampered or unpersisted Forecast Lock and enforces Lock -> Outcome -> Backtest -> Calibration", async () => {
    const values = await buildBacktest();
    const source = stage6SourceFixtureV2();

    const missingReference = await persistedForecastLockReferenceFixtureV2({ source });
    expect(await backtestClaimsReportV2({
      backtestSpecId: "backtest_spec_v2_missing_forecast_lock",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      forecastLockReference: { streamId: missingReference.persistenceVersion.streamId, version: 2 },
      outcome: values.outcome,
      outcomeRealityBoundary: values.outcome.realityBoundarySnapshot,
    }, missingReference.repository)).toMatchObject({ ok: false, errorCode: "invalid_forecast_lock" });

    expect(await backtestClaimsReportV2({
      backtestSpecId: "backtest_spec_v2_tampered_forecast_lock",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      forecastLockReference: missingReference.forecastLockReference,
      outcome: values.outcome,
      outcomeRealityBoundary: values.outcome.realityBoundarySnapshot,
      forecastLockPersistenceVersion: missingReference.persistenceVersion,
    }, missingReference.repository)).toMatchObject({ ok: false, errorCode: "invalid_backtest_input" });

    const repository = createInMemoryOutcomeCalibrationRepositoryV2();
    await expect(repository.append({
      streamId: values.persistenceVersion.streamId,
      expectedVersion: 0,
      idempotencyKey: "stage7_idempotency_v2_outcome_before_lock",
      persistedAt: "2026-07-29T10:01:00.000Z",
      artifact: { kind: "outcome", value: values.outcome },
    })).resolves.toMatchObject({ ok: false, errorCode: "missing_dependency", data: null });
    await expect(repository.append({
      streamId: values.persistenceVersion.streamId,
      expectedVersion: 0,
      idempotencyKey: values.persistenceVersion.idempotencyKey,
      persistedAt: values.persistenceVersion.persistedAt,
      artifact: values.persistenceVersion.artifact,
    })).resolves.toMatchObject({ ok: true, data: { version: 1 } });
    await expect(repository.append({
      streamId: values.persistenceVersion.streamId,
      expectedVersion: 1,
      idempotencyKey: "stage7_idempotency_v2_backtest_before_outcome",
      persistedAt: "2026-07-29T10:01:00.000Z",
      artifact: { kind: "backtest", value: values.backtest },
    })).resolves.toMatchObject({ ok: false, errorCode: "missing_dependency", data: null });
  });

  it("treats five namespace-only Forecast aliases as one unit and does not cross the calibration minimum", async () => {
    const backtests = (await Promise.all(Array.from({ length: 5 }, (_, index) =>
      buildBacktest({ index, source: stage6SourceFixtureV2({ unitIndex: 0 }) }),
    ))).map((item) => item.backtest);
    expect(new Set(backtests.map((item) => item.forecastUnitSignature)).size).toBe(1);

    expect(calibrateBacktestsV2({
      calibrationSpecId: "calibration_spec_v2_namespace_alias_attack",
      method: {
        name: CALIBRATION_METHOD_NAME_V2,
        version: CALIBRATION_METHOD_VERSION_V2,
        minimumSampleSize: MIN_CALIBRATION_SAMPLE_SIZE_V2,
      },
      backtests,
    })).toMatchObject({ ok: false, errorCode: "duplicate_calibration_unit" });
  }, 20_000);

  it("derives one forecast target signature when only lock time or persistence identity changes", () => {
    const source = stage6SourceFixtureV2();
    const first = forecastLockPersistenceFixtureV2({
      source,
      lockedAt: "2026-07-19T10:01:00.000Z",
      persistedAt: "2026-07-19T10:01:00.000Z",
      version: 1,
    });
    const alias = forecastLockPersistenceFixtureV2({
      source,
      lockedAt: "2026-07-19T10:02:00.000Z",
      persistedAt: "2026-07-19T10:03:00.000Z",
      streamId: "outcome_calibration_stream_v2_forecast_alias",
      version: 9,
      idempotencyKey: "stage7_idempotency_v2_forecast_alias",
    });

    expect(alias.forecastLock.forecastUnits[0]!.forecastUnitSignature).toBe(
      first.forecastLock.forecastUnits[0]!.forecastUnitSignature,
    );
  });

  it("rejects distinct Outcome aliases for one forecast target even when their locks and persistence versions differ", async () => {
    const source = stage6SourceFixtureV2();
    const first = (await buildBacktest({ index: 0, source, lockedAt: "2026-07-19T10:01:00.000Z" })).backtest;
    const alias = (await buildBacktest({ index: 1, source, lockedAt: "2026-07-19T10:02:00.000Z" })).backtest;

    expect(calibrateBacktestsV2({
      calibrationSpecId: "calibration_spec_v2_forecast_target_alias_attack",
      method: {
        name: CALIBRATION_METHOD_NAME_V2,
        version: CALIBRATION_METHOD_VERSION_V2,
        minimumSampleSize: MIN_CALIBRATION_SAMPLE_SIZE_V2,
      },
      backtests: [first, alias],
    })).toMatchObject({ ok: false, errorCode: "duplicate_calibration_unit" });
  }, 20_000);

  it("rejects a lock made after the forecast window began even when it predates the occurred Outcome", async () => {
    const source = stage6SourceFixtureV2();
    const outcome = capture(0, source);
    const late = await persistedForecastLockReferenceFixtureV2({
      source,
      lockedAt: "2026-07-20T10:00:00.001Z",
      persistedAt: "2026-07-20T10:00:00.002Z",
    });

    expect(await backtestClaimsReportV2({
      backtestSpecId: "backtest_spec_v2_lock_after_window_start",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      forecastLockReference: late.forecastLockReference,
      outcome,
      outcomeRealityBoundary: outcome.realityBoundarySnapshot,
    }, late.repository)).toMatchObject({ ok: false, errorCode: "invalid_forecast_lock" });
  });

  it("loads the exact Forecast Lock record from the repository instead of accepting a caller-assembled receipt", async () => {
    const source = stage6SourceFixtureV2();
    const outcome = capture(0, source);
    const lock = forecastLockPersistenceFixtureV2({ source });
    const repository = createInMemoryOutcomeCalibrationRepositoryV2();
    const persisted = await repository.append({
      streamId: lock.persistenceVersion.streamId,
      expectedVersion: 0,
      idempotencyKey: lock.persistenceVersion.idempotencyKey,
      persistedAt: lock.persistenceVersion.persistedAt,
      artifact: lock.persistenceVersion.artifact,
    });
    if (!persisted.ok) throw new Error(persisted.errorCode);
    const input = {
      backtestSpecId: "backtest_spec_v2_repository_loaded_lock",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      forecastLockReference: {
        streamId: lock.persistenceVersion.streamId,
        version: persisted.data.version,
      },
      outcome,
      outcomeRealityBoundary: outcome.realityBoundarySnapshot,
    };

    await expect(backtestClaimsReportV2(input, repository)).resolves.toMatchObject({ ok: true });
    await expect(backtestClaimsReportV2({
      ...input,
      forecastLockPersistenceVersion: lock.persistenceVersion,
    }, repository)).resolves.toMatchObject({ ok: false, errorCode: "invalid_backtest_input" });
  });

  it("rejects a self-consistent Lock envelope that is not present in the referenced repository version chain", async () => {
    const source = stage6SourceFixtureV2();
    const outcome = capture(0, source);
    const fixture = forecastLockPersistenceFixtureV2({ source });
    const unpersistedRepository = {
      append: async () => ({ ok: false as const, data: null, errorCode: "missing_dependency" as const }),
      loadLatest: async () => ({ ok: true as const, data: null, errorCode: null }),
      loadVersion: async () => ({ ok: true as const, data: fixture.persistenceVersion, errorCode: null }),
      loadHistory: async () => ({ ok: true as const, data: [], errorCode: null }),
    };

    await expect(backtestClaimsReportV2({
      backtestSpecId: "backtest_spec_v2_unpersisted_envelope",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      forecastLockReference: { streamId: fixture.persistenceVersion.streamId, version: 1 },
      outcome,
      outcomeRealityBoundary: outcome.realityBoundarySnapshot,
    }, unpersistedRepository)).resolves.toMatchObject({ ok: false, errorCode: "invalid_forecast_lock" });
  });

  it("exports the Forecast Lock builder and validator from the Stage 7 public index", () => {
    const source = stage6SourceFixtureV2();
    const built = buildForecastLockFromIndexV2({
      forecastLockSpecId: "forecast_lock_spec_v2_index_export",
      lockedAt: "2026-07-19T10:01:00.000Z",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
    });
    if (!built.ok) throw new Error(built.errorCode);
    expect(parseForecastLockFromIndexV2(built.forecastLock)).toEqual({
      ok: true,
      forecastLock: built.forecastLock,
    });
  });
});
