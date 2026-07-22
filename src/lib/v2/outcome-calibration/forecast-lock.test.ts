import { describe, expect, it } from "vitest";

import { backtestClaimsReportV2 } from "./backtesting";
import { calibrateBacktestsV2 } from "./calibration";
import { buildForecastLockV2, parseValidatedForecastLockV2 } from "./forecast-lock";
import { createInMemoryOutcomeCalibrationRepositoryV2 } from "./in-memory-repository";
import { captureOutcomeV2 } from "./outcome-capture";
import {
  forecastLockPersistenceFixtureV2,
  outcomeCaptureInputFixtureV2,
  outcomeRealityBoundaryFixtureV2,
  stage6SourceFixtureV2,
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

function buildBacktest({
  index = 0,
  source = stage6SourceFixtureV2({ unitIndex: index }),
  lockedAt = "2026-07-19T10:01:00.000Z",
}: {
  index?: number;
  source?: ReturnType<typeof stage6SourceFixtureV2>;
  lockedAt?: string;
} = {}) {
  const outcome = capture(index, source);
  const lock = forecastLockPersistenceFixtureV2({ source, lockedAt });
  const result = backtestClaimsReportV2({
    backtestSpecId: `backtest_spec_v2_forecast_lock_${index + 1}`,
    run: source.run,
    claimSet: source.claimSet,
    claims: source.claims,
    report: source.report,
    forecastLockPersistenceVersion: lock.persistenceVersion,
    outcome,
    outcomeRealityBoundary: outcome.realityBoundarySnapshot,
  });
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

  it("rejects a Forecast locked or persisted after its primary Outcome Evidence was captured", () => {
    const source = stage6SourceFixtureV2();
    const outcome = capture(0, source);
    const late = forecastLockPersistenceFixtureV2({
      source,
      lockedAt: "2026-07-29T10:00:00.001Z",
      persistedAt: "2026-07-29T10:00:00.002Z",
    });

    expect(backtestClaimsReportV2({
      backtestSpecId: "backtest_spec_v2_late_forecast_lock",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      forecastLockPersistenceVersion: late.persistenceVersion,
      outcome,
      outcomeRealityBoundary: outcome.realityBoundarySnapshot,
    })).toMatchObject({ ok: false, errorCode: "invalid_forecast_lock" });
  });

  it("rejects a tampered or unpersisted Forecast Lock and enforces Lock -> Outcome -> Backtest -> Calibration", async () => {
    const values = buildBacktest();
    const tampered = structuredClone(values.persistenceVersion);
    if (tampered.artifact.kind !== "forecast_lock") throw new Error("Expected Forecast Lock fixture.");
    tampered.artifact.value.lockedAt = "2026-07-19T10:02:00.000Z";
    const source = stage6SourceFixtureV2();

    expect(backtestClaimsReportV2({
      backtestSpecId: "backtest_spec_v2_missing_forecast_lock",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      outcome: values.outcome,
      outcomeRealityBoundary: values.outcome.realityBoundarySnapshot,
    })).toMatchObject({ ok: false, errorCode: "invalid_backtest_input" });

    expect(backtestClaimsReportV2({
      backtestSpecId: "backtest_spec_v2_tampered_forecast_lock",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      forecastLockPersistenceVersion: tampered,
      outcome: values.outcome,
      outcomeRealityBoundary: values.outcome.realityBoundarySnapshot,
    })).toMatchObject({ ok: false, errorCode: "invalid_forecast_lock" });

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

  it("treats five namespace-only Forecast aliases as one unit and does not cross the calibration minimum", () => {
    const backtests = Array.from({ length: 5 }, (_, index) =>
      buildBacktest({ index, source: stage6SourceFixtureV2({ unitIndex: index }) }).backtest,
    );
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
});
