import { describe, expect, it } from "vitest";

import { claimsFingerprintV2 } from "../claims-reports/ids";
import { backtestClaimsReportV2, parseValidatedBacktestV2 } from "./backtesting";
import { calibrateBacktestsV2, parseValidatedCalibrationV2 } from "./calibration";
import { captureOutcomeV2 } from "./outcome-capture";
import {
  outcomeCaptureInputFixtureV2,
  outcomeRealityBoundaryFixtureV2,
  stage6SensitivitySourceFixtureV2,
  stage6SourceFixtureV2,
} from "./test-fixtures";
import {
  BACKTEST_SCHEMA_VERSION_V2,
  CALIBRATION_METHOD_NAME_V2,
  CALIBRATION_METHOD_VERSION_V2,
  CALIBRATION_SCHEMA_VERSION_V2,
  MIN_CALIBRATION_SAMPLE_SIZE_V2,
} from "./types";

function capturedOutcome({
  index = 0,
  observed = true,
  boundary = outcomeRealityBoundaryFixtureV2({ count: Math.max(1, index + 1) }),
}: {
  index?: number;
  observed?: boolean;
  boundary?: ReturnType<typeof outcomeRealityBoundaryFixtureV2>;
} = {}) {
  const result = captureOutcomeV2(outcomeCaptureInputFixtureV2({ index, observed, boundary }));
  if (!result.ok) throw new Error(result.errorCode);
  return result.outcome;
}

function backtestInput(outcome = capturedOutcome()) {
  const source = stage6SourceFixtureV2();
  return {
    backtestSpecId: `backtest_spec_v2_${outcome.outcomeSpecId.slice("outcome_spec_v2_".length)}`,
    run: source.run,
    claimSet: source.claimSet,
    claims: source.claims,
    report: source.report,
    outcome,
    outcomeRealityBoundary: outcome.realityBoundarySnapshot,
  };
}

function builtBacktest(outcome = capturedOutcome()) {
  const result = backtestClaimsReportV2(backtestInput(outcome));
  if (!result.ok) throw new Error(result.errorCode);
  return result.backtest;
}

function calibrationInput(backtests: ReturnType<typeof builtBacktest>[]) {
  return {
    calibrationSpecId: "calibration_spec_v2_stage_7_fixture",
    method: {
      name: CALIBRATION_METHOD_NAME_V2,
      version: CALIBRATION_METHOD_VERSION_V2,
      minimumSampleSize: MIN_CALIBRATION_SAMPLE_SIZE_V2,
    },
    backtests,
  };
}

describe("Stage 7 Backtesting", () => {
  it("revalidates the Stage 6 Report and canonical Claim Set and completely binds Run, samples, Outcome, versions, and both Reality Boundary revisions", () => {
    const input = backtestInput();
    const before = structuredClone(input);
    const first = backtestClaimsReportV2(input);
    const second = backtestClaimsReportV2(structuredClone(input));

    expect(first).toEqual(second);
    expect(input).toEqual(before);
    expect(first).toMatchObject({
      ok: true,
      backtest: {
        status: "completed",
        claimId: input.outcome.claimReference.claimId,
        reportId: input.report.id,
        outcomeId: input.outcome.id,
        claimType: "scenario_frequency",
        evaluation: {
          metricLabel: "simulation_frequency",
          observedValue: 1,
          calibrationEligible: true,
        },
        sampleBinding: {
          numerator: expect.any(Number),
          denominator: input.claims[0]!.denominator,
          sampleCount: input.claims[0]!.sampleCount,
          trajectoryIds: input.claims[0]!.trajectoryIds,
        },
        runBinding: {
          kind: "batch",
          sourceAnalysisId: input.claims[0]!.sourceAnalysisId,
          analysisRunSpecIds: [input.claimSet.payload.spec.analysisRunSpecId],
          trajectorySeeds: input.claimSet.payload.spec.trajectorySeeds,
        },
        realityBoundaryBinding: {
          forecastRevision: input.claimSet.realityBoundary.revision,
          outcomeRevision: input.outcomeRealityBoundary.revision,
          evidenceLedgerId: input.claimSet.realityBoundary.evidenceLedger.id,
          assumptionLedgerId: input.claimSet.realityBoundary.assumptionLedger.id,
        },
        versions: { backtestSchemaVersion: BACKTEST_SCHEMA_VERSION_V2 },
      },
    });
    if (!first.ok) throw new Error(first.errorCode);
    expect(first.backtest.sourceSnapshots.claimSetIntegritySignature).toBe(
      claimsFingerprintV2(input.claimSet),
    );
    expect(parseValidatedBacktestV2(first.backtest)).toEqual({ ok: true, backtest: first.backtest });
  });

  it("atomically rejects non-canonical Claims, escalated Reports, mismatched Runs, and corrupt nested objects", () => {
    const tamperedClaim = backtestInput();
    tamperedClaim.claims[0]!.numerator = 0;
    const escalatedReport = backtestInput();
    escalatedReport.report.sections[0]!.statement = "Guaranteed real-world outcome.";
    const mismatchedRun = backtestInput();
    mismatchedRun.run.payload.spec.sampleCount = 2;
    const corruptNested = backtestInput();
    (corruptNested.claimSet.payload.spec as unknown as Record<string, unknown>).unexpected = true;

    for (const result of [
      backtestClaimsReportV2(tamperedClaim),
      backtestClaimsReportV2(escalatedReport),
      backtestClaimsReportV2(mismatchedRun),
      backtestClaimsReportV2(corruptNested),
    ]) {
      expect(result.ok).toBe(false);
      expect(result).not.toHaveProperty("backtest");
    }
  });

  it("rejects cross-Seed and cross-Ledger Outcomes even when each Outcome is independently valid", () => {
    const otherSeedBoundary = outcomeRealityBoundaryFixtureV2({
      count: 1,
      seedContextId: "seed_context_v2_other",
    });
    const otherSeedOutcome = capturedOutcome({ boundary: otherSeedBoundary });
    const otherLedgerBoundary = outcomeRealityBoundaryFixtureV2({ count: 1, alternateLedger: true });
    const otherLedgerOutcome = capturedOutcome({ boundary: otherLedgerBoundary });

    expect(backtestClaimsReportV2(backtestInput(otherSeedOutcome))).toMatchObject({
      ok: false,
      errorCode: "cross_seed_reference",
    });
    expect(backtestClaimsReportV2(backtestInput(otherLedgerOutcome))).toMatchObject({
      ok: false,
      errorCode: "cross_ledger_reference",
    });
  });

  it("rejects a Stage 6 version drift and a historical-boundary rewrite", () => {
    const versionDrift = backtestInput();
    (versionDrift.claims[0]!.versions.claimSchemaVersion as string) = "claim-v2.999";
    const rewrittenBoundary = backtestInput();
    rewrittenBoundary.outcomeRealityBoundary.evidenceLedger.items[0]!.statement = "Historical evidence was rewritten.";

    expect(backtestClaimsReportV2(versionDrift)).toMatchObject({ ok: false });
    const rewriteResult = backtestClaimsReportV2(rewrittenBoundary);
    expect(rewriteResult.ok).toBe(false);
    expect(rewriteResult).not.toHaveProperty("backtest");
  });

  it("rejects an independently valid Outcome boundary that rewrites the historical boundary creation time", () => {
    const boundary = outcomeRealityBoundaryFixtureV2({ count: 1 });
    boundary.createdAt = "2026-07-19T10:00:00.001Z";
    const outcome = capturedOutcome({ boundary });

    expect(backtestClaimsReportV2(backtestInput(outcome))).toMatchObject({
      ok: false,
      errorCode: "cross_ledger_reference",
    });
  });

  it("detects Backtest schema-version drift after a successful canonical replay", () => {
    const backtest = builtBacktest();
    (backtest.versions.backtestSchemaVersion as string) = "backtest-v2.999";

    expect(parseValidatedBacktestV2(backtest)).toMatchObject({
      ok: false,
      errorCode: "version_mismatch",
    });
  });

  it("does not treat a single actual Outcome as an observable causal counterfactual for a sensitivity Claim", () => {
    const source = stage6SensitivitySourceFixtureV2();
    const boundary = outcomeRealityBoundaryFixtureV2({ count: 1 });
    const captured = captureOutcomeV2(outcomeCaptureInputFixtureV2({
      boundary,
      claim: source.targetClaim,
    }));
    if (!captured.ok) throw new Error(captured.errorCode);
    const tested = backtestClaimsReportV2({
      backtestSpecId: "backtest_spec_v2_sensitivity_counterfactual",
      run: source.run,
      claimSet: source.claimSet,
      claims: source.claims,
      report: source.report,
      outcome: captured.outcome,
      outcomeRealityBoundary: boundary,
    });

    expect(tested).toMatchObject({
      ok: true,
      backtest: {
        claimType: "sensitivity_difference",
        evaluation: {
          metricLabel: "sampled_frequency_difference",
          predictedValue: null,
          brierScore: null,
          calibrationEligible: false,
          evaluationStatus: "counterfactual_not_observable",
        },
      },
    });
    if (!tested.ok) throw new Error(tested.errorCode);
    const calibrated = calibrateBacktestsV2(calibrationInput([tested.backtest]));
    expect(calibrated).toMatchObject({
      ok: true,
      calibration: {
        status: "insufficient_data",
        metricLabel: "simulation_frequency",
        sampleCount: 0,
        excludedSampleCount: 1,
        causalConclusion: false,
      },
    });
  }, 15_000);
});

describe("Stage 7 Calibration", () => {
  it("returns a stable insufficient-data result and keeps the metric named simulation frequency", () => {
    const input = calibrationInput([builtBacktest()]);
    const first = calibrateBacktestsV2(input);
    const second = calibrateBacktestsV2(structuredClone(input));

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      ok: true,
      calibration: {
        status: "insufficient_data",
        metricLabel: "simulation_frequency",
        sampleCount: 1,
        minimumSampleSize: MIN_CALIBRATION_SAMPLE_SIZE_V2,
        method: {
          name: CALIBRATION_METHOD_NAME_V2,
          version: CALIBRATION_METHOD_VERSION_V2,
        },
        brierScore: null,
        causalConclusion: false,
        deterministicPrediction: false,
        versions: { calibrationSchemaVersion: CALIBRATION_SCHEMA_VERSION_V2 },
      },
    });
    if (!first.ok) throw new Error(first.errorCode);
    expect(first.calibration.limitations.join(" ").toLowerCase()).toContain("insufficient");
  });

  it("deterministically computes a disclosed Brier calibration from enough unique actual Outcomes without causal or certainty escalation", () => {
    const boundary = outcomeRealityBoundaryFixtureV2({ count: 5 });
    const observations = [true, true, true, false, false];
    const backtests = observations.map((observed, index) =>
      builtBacktest(capturedOutcome({ index, observed, boundary })),
    );
    const input = calibrationInput(backtests);
    const result = calibrateBacktestsV2(input);
    const shuffled = calibrateBacktestsV2(calibrationInput([...backtests].reverse()));
    const probability = backtests[0]!.evaluation.predictedValue!;
    const expectedBrier = observations.reduce(
      (sum, observed) => sum + (probability - Number(observed)) ** 2,
      0,
    ) / observations.length;

    expect(result).toEqual(shuffled);
    expect(result).toMatchObject({
      ok: true,
      calibration: {
        status: "calibrated",
        metricLabel: "calibrated_simulation_frequency",
        sampleCount: 5,
        observedRate: 0.6,
        meanSimulationFrequency: probability,
        brierScore: expectedBrier,
        causalConclusion: false,
        deterministicPrediction: false,
      },
    });
    if (!result.ok) throw new Error(result.errorCode);
    expect(result.calibration.limitations.join(" ").toLowerCase()).toContain("not a causal");
    expect(parseValidatedCalibrationV2(result.calibration)).toEqual({
      ok: true,
      calibration: result.calibration,
    });
  }, 15_000);

  it("rejects extra fields, duplicate Outcomes, version drift, and mixed Seed or Ledger cohorts without partial Calibration", () => {
    const backtest = builtBacktest();
    const extra = { ...calibrationInput([backtest]), unexpected: true };
    const duplicate = calibrationInput([backtest, backtest]);
    const drift = calibrationInput([backtest]);
    (drift.method.version as string) = "999";
    const corrupt = calibrationInput([backtest]);
    corrupt.backtests[0]!.evaluation.observedValue = 0;

    for (const result of [
      calibrateBacktestsV2(extra),
      calibrateBacktestsV2(duplicate),
      calibrateBacktestsV2(drift),
      calibrateBacktestsV2(corrupt),
    ]) {
      expect(result.ok).toBe(false);
      expect(result).not.toHaveProperty("calibration");
    }
  });

  it("detects Calibration schema-version drift after a successful deterministic build", () => {
    const result = calibrateBacktestsV2(calibrationInput([builtBacktest()]));
    if (!result.ok) throw new Error(result.errorCode);
    const drifted = structuredClone(result.calibration);
    (drifted.versions.calibrationSchemaVersion as string) = "calibration-v2.999";

    expect(parseValidatedCalibrationV2(drifted)).toMatchObject({
      ok: false,
      errorCode: "version_mismatch",
    });
  });
});
