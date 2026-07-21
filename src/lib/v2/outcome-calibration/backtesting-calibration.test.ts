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
  source = stage6SourceFixtureV2({ unitIndex: index }),
  boundary = outcomeRealityBoundaryFixtureV2({
    count: Math.max(1, index + 1),
    nonOccurrenceIndices: observed ? [] : [index],
  }),
}: {
  index?: number;
  observed?: boolean;
  source?: ReturnType<typeof stage6SourceFixtureV2>;
  boundary?: ReturnType<typeof outcomeRealityBoundaryFixtureV2>;
} = {}) {
  const result = captureOutcomeV2(outcomeCaptureInputFixtureV2({ index, observed, boundary, source }));
  if (!result.ok) throw new Error(result.errorCode);
  return result.outcome;
}

function backtestInput(outcome = capturedOutcome(), source = stage6SourceFixtureV2()) {
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

function builtBacktest(outcome = capturedOutcome(), source = stage6SourceFixtureV2()) {
  const result = backtestClaimsReportV2(backtestInput(outcome, source));
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
        evaluationWindow: {
          startAt: input.claimSet.payload.spec.trajectoryTemplate.startAt,
          horizonEnd: "2026-08-18T10:00:00.000Z",
        },
        observationUnitSignature: expect.stringMatching(/^[a-f0-9]{24}$/),
        forecastUnitSignature: expect.stringMatching(/^[a-f0-9]{24}$/),
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

  it("rejects a same-revision boundary increment and evidence captured before the forecast was locked", () => {
    const sameRevisionBoundary = outcomeRealityBoundaryFixtureV2({ count: 1 });
    sameRevisionBoundary.revision = forecastRealityRevision();
    sameRevisionBoundary.evidenceLedger.revision = forecastRealityRevision();
    sameRevisionBoundary.assumptionLedger.revision = forecastRealityRevision();
    const sameRevisionOutcome = capturedOutcome({ boundary: sameRevisionBoundary });

    const source = stage6SourceFixtureV2();
    const earlyBoundary = outcomeRealityBoundaryFixtureV2({ count: 1 });
    const evidence = earlyBoundary.evidenceLedger.items.at(-1)!;
    evidence.occurredAt = "2026-07-10T09:00:00.000Z";
    evidence.capturedAt = "2026-07-19T09:59:59.999Z";
    evidence.createdAt = evidence.capturedAt;
    evidence.updatedAt = evidence.capturedAt;
    evidence.provenance[0]!.capturedAt = evidence.capturedAt;
    evidence.provenance[0]!.occurredAt = evidence.occurredAt;
    earlyBoundary.updatedAt = evidence.capturedAt;
    earlyBoundary.evidenceLedger.updatedAt = evidence.capturedAt;
    earlyBoundary.assumptionLedger.updatedAt = evidence.capturedAt;
    const earlyInput = outcomeCaptureInputFixtureV2({
      boundary: earlyBoundary,
      source,
      observationWindow: {
        startAt: "2026-07-01T10:00:00.000Z",
        horizonEnd: "2026-07-18T10:00:00.000Z",
      },
    });
    earlyInput.occurredAt = evidence.occurredAt;
    earlyInput.recordedAt = evidence.capturedAt;
    earlyInput.evaluatedThrough = evidence.capturedAt;
    const earlyOutcome = captureOutcomeV2(earlyInput);
    if (!earlyOutcome.ok) throw new Error(earlyOutcome.errorCode);

    expect(backtestClaimsReportV2(backtestInput(sameRevisionOutcome))).toMatchObject({
      ok: false,
      errorCode: "cross_ledger_reference",
    });
    expect(backtestClaimsReportV2(backtestInput(earlyOutcome.outcome, source))).toMatchObject({
      ok: false,
      errorCode: "invalid_observation_time",
    });
  });

  it("rejects primary Outcome Evidence that was already present in the forecast snapshot", () => {
    const source = stage6SourceFixtureV2();
    const outcomeBoundary = outcomeRealityBoundaryFixtureV2({ count: 1, nonOccurrenceIndices: [0] });
    const preexistingEvidence = outcomeBoundary.evidenceLedger.items[0]!;
    const input = outcomeCaptureInputFixtureV2({ observed: false, boundary: outcomeBoundary, source });
    input.observationWindow = {
      startAt: "2026-07-01T10:00:00.000Z",
      horizonEnd: "2026-07-18T10:00:00.000Z",
    };
    input.evaluatedThrough = preexistingEvidence.capturedAt;
    input.recordedAt = preexistingEvidence.capturedAt;
    input.realEvidenceIds = [preexistingEvidence.id];
    input.source = {
      realEvidenceId: preexistingEvidence.id,
      sourceKind: preexistingEvidence.sourceKind,
      sourceRef: preexistingEvidence.provenance[0]!.sourceRef,
      verificationStatus: preexistingEvidence.verificationStatus,
    };
    const captured = captureOutcomeV2(input);
    if (!captured.ok) throw new Error(captured.errorCode);

    expect(backtestClaimsReportV2(backtestInput(captured.outcome, source))).toMatchObject({
      ok: false,
      errorCode: "invalid_observation_time",
    });
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
      source,
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
    if (!tested.ok) throw new Error(tested.errorCode);

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
    const observations = [true, true, true, false, false];
    const backtests = observations.map((observed, index) => {
      const source = stage6SourceFixtureV2({ unitIndex: index });
      const boundary = outcomeRealityBoundaryFixtureV2({
        count: index + 1,
        nonOccurrenceIndices: observed ? [] : [index],
      });
      return builtBacktest(capturedOutcome({ index, observed, boundary, source }), source);
    });
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

  it("rejects aliases for the same observation or the same pre-locked forecast unit", () => {
    const source = stage6SourceFixtureV2();
    const boundary = outcomeRealityBoundaryFixtureV2({ count: 1 });
    const firstOutcome = capturedOutcome({ boundary, source });
    const evidenceAliasBoundary = structuredClone(boundary);
    const evidenceAlias = structuredClone(evidenceAliasBoundary.evidenceLedger.items.at(-1)!);
    evidenceAlias.id = "real_evidence_v2_actualobservationalias";
    evidenceAliasBoundary.evidenceLedger.items.push(evidenceAlias);
    evidenceAliasBoundary.revision += 1;
    evidenceAliasBoundary.evidenceLedger.revision += 1;
    evidenceAliasBoundary.assumptionLedger.revision += 1;
    const aliasInput = outcomeCaptureInputFixtureV2({ boundary: evidenceAliasBoundary, source });
    aliasInput.outcomeSpecId = "outcome_spec_v2_stage_7_observation_alias";
    aliasInput.realEvidenceIds = [evidenceAlias.id];
    aliasInput.source.realEvidenceId = evidenceAlias.id;
    const aliasResult = captureOutcomeV2(aliasInput);
    if (!aliasResult.ok) throw new Error(aliasResult.errorCode);
    const first = builtBacktest(firstOutcome, source);
    const alias = builtBacktest(aliasResult.outcome, source);

    expect(alias.observationUnitSignature).toBe(first.observationUnitSignature);
    expect(alias.forecastUnitSignature).toBe(first.forecastUnitSignature);
    expect(calibrateBacktestsV2(calibrationInput([first, alias]))).toMatchObject({
      ok: false,
      errorCode: "duplicate_calibration_unit",
    });
  });

  it("rejects different observations aliased onto the same forecast target", () => {
    const source = stage6SourceFixtureV2();
    const firstBoundary = outcomeRealityBoundaryFixtureV2({ count: 1 });
    const secondBoundary = structuredClone(firstBoundary);
    const secondEvidence = structuredClone(secondBoundary.evidenceLedger.items.at(-1)!);
    secondEvidence.id = "real_evidence_v2_distinctobservation";
    secondEvidence.statement = "A distinct later real-world observation.";
    secondEvidence.claimKey = "actual.outcome.distinct";
    secondEvidence.occurredAt = "2026-07-30T09:00:00.000Z";
    secondEvidence.capturedAt = "2026-07-30T10:00:00.000Z";
    secondEvidence.createdAt = secondEvidence.capturedAt;
    secondEvidence.updatedAt = secondEvidence.capturedAt;
    secondEvidence.provenance[0] = {
      sourceRef: "outcome:user-confirmation:distinct",
      capturedAt: secondEvidence.capturedAt,
      occurredAt: secondEvidence.occurredAt,
    };
    secondBoundary.evidenceLedger.items.push(secondEvidence);
    secondBoundary.revision += 1;
    secondBoundary.updatedAt = secondEvidence.capturedAt;
    secondBoundary.evidenceLedger.revision += 1;
    secondBoundary.evidenceLedger.updatedAt = secondEvidence.capturedAt;
    secondBoundary.assumptionLedger.revision += 1;
    secondBoundary.assumptionLedger.updatedAt = secondEvidence.capturedAt;
    const secondInput = outcomeCaptureInputFixtureV2({ boundary: secondBoundary, source });
    secondInput.outcomeSpecId = "outcome_spec_v2_stage_7_distinct_observation";
    secondInput.occurredAt = secondEvidence.occurredAt;
    secondInput.evaluatedThrough = secondEvidence.capturedAt;
    secondInput.recordedAt = secondEvidence.capturedAt;
    secondInput.realEvidenceIds = [secondEvidence.id];
    secondInput.source = {
      realEvidenceId: secondEvidence.id,
      sourceKind: secondEvidence.sourceKind,
      sourceRef: secondEvidence.provenance[0]!.sourceRef,
      verificationStatus: secondEvidence.verificationStatus,
    };
    const secondOutcome = captureOutcomeV2(secondInput);
    if (!secondOutcome.ok) throw new Error(secondOutcome.errorCode);
    const first = builtBacktest(capturedOutcome({ boundary: firstBoundary, source }), source);
    const second = builtBacktest(secondOutcome.outcome, source);

    expect(second.observationUnitSignature).not.toBe(first.observationUnitSignature);
    expect(second.forecastUnitSignature).toBe(first.forecastUnitSignature);
    expect(calibrateBacktestsV2(calibrationInput([first, second]))).toMatchObject({
      ok: false,
      errorCode: "duplicate_calibration_unit",
    });
  });

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

function forecastRealityRevision() {
  return stage6SourceFixtureV2().claimSet.realityBoundary.revision;
}
