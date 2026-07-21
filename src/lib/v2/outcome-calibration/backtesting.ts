import { z } from "zod";

import { buildClaimsV2 } from "../claims-reports/claim-builder";
import { canonicalClaimsJsonV2, claimsFingerprintV2 } from "../claims-reports/ids";
import { validateClaimsReportV2 } from "../claims-reports/report-builder";
import type { ClaimV2, ClaimsReportV2 } from "../claims-reports/types";
import { parseRealityBoundarySnapshotV2, parseValidatedClaimV2 } from "../claims-reports/validation";
import type { BatchAnalysisV2 } from "../trajectory-analysis/types";
import { addTrajectoryDaysV2, parseTrajectoryInstantV2 } from "../trajectory/time";
import { parseTrajectoryRunSpecV2 } from "../trajectory/validation";
import { backtestIdV2, canonicalStage7JsonV2, stage7FingerprintV2 } from "./ids";
import { parseValidatedOutcomeV2 } from "./outcome-capture";
import type { BacktestV2, Stage7ClaimSetSnapshotV2, Stage7RunSnapshotV2 } from "./types";
import {
  BACKTEST_SCHEMA_VERSION_V2,
  OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
  OUTCOME_SCHEMA_VERSION_V2,
} from "./types";

const bounded = z.string().trim().min(1).max(2000);
const namespaced = (prefix: string) => z.string().regex(new RegExp(`^${prefix}[a-z0-9][a-z0-9_-]*$`));
const runSchema = z.object({
  kind: z.enum(["batch", "sensitivity", "intervention"]),
  payload: z.unknown(),
}).strict();
const claimSetSchema = z.object({
  kind: z.enum(["batch", "sensitivity", "intervention"]),
  payload: z.unknown(),
  realityBoundary: z.unknown(),
}).strict();
const inputSchema = z.object({
  backtestSpecId: namespaced("backtest_spec_v2_"),
  run: runSchema,
  claimSet: claimSetSchema,
  claims: z.array(z.unknown()).min(1).max(1000),
  report: z.unknown(),
  outcome: z.unknown(),
  outcomeRealityBoundary: z.unknown(),
}).strict();

const evaluationSchema = z.object({
  metricLabel: z.enum(["simulation_frequency", "sampled_frequency_difference"]),
  predictedValue: z.number().finite().nullable(),
  observedValue: z.union([z.literal(0), z.literal(1)]),
  brierScore: z.number().finite().min(0).max(1).nullable(),
  calibrationEligible: z.boolean(),
  evaluationStatus: z.enum(["scored", "counterfactual_not_observable"]),
}).strict();
const sampleBindingSchema = z.object({
  numerator: z.number().int(),
  denominator: z.number().int().positive(),
  sampleCount: z.number().int().positive(),
  trajectoryIds: z.array(namespaced("trajectory_v2_")).min(1),
  clusterIds: z.array(namespaced("trajectory_cluster_v2_")).min(1),
}).strict();
const runBindingSchema = z.object({
  kind: z.enum(["batch", "sensitivity", "intervention"]),
  sourceAnalysisId: bounded,
  analysisRunSpecIds: z.array(namespaced("analysis_run_spec_v2_")).min(1),
  trajectoryRunSpecIds: z.array(namespaced("trajectory_run_spec_v2_")).min(1),
  trajectoryIds: z.array(namespaced("trajectory_v2_")).min(1),
  trajectorySeeds: z.array(z.number().int().min(0).max(0xffff_ffff)).min(1),
  horizonDays: z.array(z.union([z.literal(30), z.literal(90)])).min(1),
  policyVersions: z.array(bounded).min(1),
  runIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
}).strict();
const boundaryBindingSchema = z.object({
  seedContextId: bounded,
  schemaVersion: z.literal("2.0"),
  forecastRevision: z.number().int().nonnegative(),
  outcomeRevision: z.number().int().nonnegative(),
  evidenceLedgerId: bounded,
  assumptionLedgerId: bounded,
}).strict();
const evaluationWindowSchema = z.object({
  startAt: bounded,
  horizonEnd: bounded,
}).strict();
const versionsSchema = z.object({
  outcomeCalibrationEngineVersion: z.literal(OUTCOME_CALIBRATION_ENGINE_VERSION_V2),
  backtestSchemaVersion: z.literal(BACKTEST_SCHEMA_VERSION_V2),
  outcomeSchemaVersion: z.literal(OUTCOME_SCHEMA_VERSION_V2),
  claimsReportsEngineVersion: bounded,
  claimSchemaVersion: bounded,
  claimPolicyVersion: bounded,
  reportSchemaVersion: bounded,
  reportPolicyVersion: bounded,
  trajectoryEngineVersion: bounded,
  analysisEngineVersion: bounded,
  featureSchemaVersion: bounded,
  clusteringAlgorithm: bounded,
  clusteringVersion: bounded,
  policyVersion: bounded,
}).strict();
const sourceSnapshotsSchema = z.object({
  run: runSchema,
  claimSet: claimSetSchema,
  claims: z.array(z.unknown()).min(1),
  report: z.unknown(),
  outcome: z.unknown(),
  outcomeRealityBoundary: z.unknown(),
  claimSetIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
  runIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
}).strict();
const backtestSchema = z.object({
  id: namespaced("backtest_v2_"),
  backtestSpecId: namespaced("backtest_spec_v2_"),
  seedContextId: bounded,
  status: z.literal("completed"),
  claimId: namespaced("claim_v2_"),
  reportId: namespaced("claims_report_v2_"),
  outcomeId: namespaced("outcome_v2_"),
  claimType: z.enum(["scenario_frequency", "sensitivity_difference", "intervention_difference"]),
  evaluation: evaluationSchema,
  sampleBinding: sampleBindingSchema,
  runBinding: runBindingSchema,
  realityBoundaryBinding: boundaryBindingSchema,
  evaluationWindow: evaluationWindowSchema,
  observationUnitSignature: z.string().regex(/^[a-f0-9]{24}$/),
  forecastUnitSignature: z.string().regex(/^[a-f0-9]{24}$/),
  versions: versionsSchema,
  limitations: z.array(bounded).min(1),
  sourceSnapshots: sourceSnapshotsSchema,
  backtestIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
}).strict();

function sortedUnique<T extends string | number>(values: T[]) {
  return [...new Set(values)].sort((left, right) =>
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right))) as T[];
}

function canonicalClaims(input: unknown[]) {
  const claims: ClaimV2[] = [];
  for (const candidate of input) {
    const parsed = parseValidatedClaimV2(candidate);
    if (!parsed.ok) return parsed;
    claims.push(parsed.claim);
  }
  if (new Set(claims.map((claim) => claim.id)).size !== claims.length) {
    return { ok: false as const, errorCode: "duplicate_id" as const };
  }
  return { ok: true as const, claims: claims.sort((left, right) => left.id.localeCompare(right.id)) };
}

function preservesHistoricalBoundary(forecast: Stage7ClaimSetSnapshotV2["realityBoundary"], outcome: Stage7ClaimSetSnapshotV2["realityBoundary"]) {
  if (
    outcome.revision <= forecast.revision ||
    outcome.createdAt !== forecast.createdAt ||
    outcome.evidenceLedger.id !== forecast.evidenceLedger.id ||
    outcome.assumptionLedger.id !== forecast.assumptionLedger.id ||
    outcome.evidenceLedger.createdAt !== forecast.evidenceLedger.createdAt ||
    outcome.assumptionLedger.createdAt !== forecast.assumptionLedger.createdAt ||
    outcome.assumptionLedger.assumptions.length !== forecast.assumptionLedger.assumptions.length
  ) return false;
  return canonicalStage7JsonV2(outcome.evidenceLedger.items.slice(0, forecast.evidenceLedger.items.length)) ===
      canonicalStage7JsonV2(forecast.evidenceLedger.items) &&
    canonicalStage7JsonV2(outcome.assumptionLedger.assumptions) ===
      canonicalStage7JsonV2(forecast.assumptionLedger.assumptions) &&
    canonicalStage7JsonV2(outcome.evidenceLedger.conflicts.slice(0, forecast.evidenceLedger.conflicts.length)) ===
      canonicalStage7JsonV2(forecast.evidenceLedger.conflicts);
}

function analysesForRun(run: Stage7RunSnapshotV2): BatchAnalysisV2[] {
  if (run.kind === "batch") return [run.payload as BatchAnalysisV2];
  const comparison = run.payload as { baseline: BatchAnalysisV2; variants: Array<{ analysis: BatchAnalysisV2 }> };
  return [comparison.baseline, ...comparison.variants.map((variant) => variant.analysis)];
}

function buildRunBinding(run: Stage7RunSnapshotV2, claim: ClaimV2): BacktestV2["runBinding"] | null {
  const analyses = analysesForRun(run);
  const trajectoryIds = new Set(claim.trajectoryIds);
  const matchingFeatures = analyses.flatMap((analysis) => analysis.features).filter((feature) => trajectoryIds.has(feature.trajectoryId));
  const matchingTrajectories = analyses.flatMap((analysis) => analysis.trajectories).filter((trajectory) => trajectoryIds.has(trajectory.trajectoryId));
  if (new Set(matchingFeatures.map((feature) => feature.trajectoryId)).size !== trajectoryIds.size ||
      new Set(matchingTrajectories.map((trajectory) => trajectory.trajectoryId)).size !== trajectoryIds.size) return null;
  const runIntegritySignature = stage7FingerprintV2(run);
  return {
    kind: run.kind,
    sourceAnalysisId: claim.sourceAnalysisId,
    analysisRunSpecIds: sortedUnique(analyses.map((analysis) => analysis.spec.analysisRunSpecId)),
    trajectoryRunSpecIds: sortedUnique(matchingTrajectories.map((trajectory) => trajectory.runSpecId)),
    trajectoryIds: [...claim.trajectoryIds],
    trajectorySeeds: sortedUnique(matchingFeatures.map((feature) => feature.trajectorySeed)),
    horizonDays: sortedUnique(analyses.map((analysis) => analysis.spec.horizonDays)),
    policyVersions: sortedUnique(analyses.map((analysis) => analysis.spec.policyVersion)),
    runIntegritySignature,
  };
}

function deriveEvaluationWindow(run: Stage7RunSnapshotV2) {
  const analyses = analysesForRun(run);
  const parsed = parseTrajectoryRunSpecV2(analyses[0]?.spec.trajectoryTemplate);
  if (!parsed.ok) return null;
  const start = parseTrajectoryInstantV2(parsed.value.startAt);
  if (!start.ok) return null;
  const end = addTrajectoryDaysV2(start.value, parsed.value.horizonDays);
  return end.ok ? { startAt: start.value.isoTimestamp, horizonEnd: end.value.isoTimestamp } : null;
}

function backtestUnsafeV2(input: unknown) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_backtest_input" as const };
  if (canonicalStage7JsonV2(parsed.data.run) !== canonicalStage7JsonV2({ kind: parsed.data.claimSet.kind, payload: parsed.data.claimSet.payload })) {
    return { ok: false as const, errorCode: "run_mismatch" as const };
  }
  const outcomeResult = parseValidatedOutcomeV2(parsed.data.outcome);
  if (!outcomeResult.ok) return outcomeResult;
  const outcomeBoundaryResult = parseRealityBoundarySnapshotV2(parsed.data.outcomeRealityBoundary);
  if (!outcomeBoundaryResult.ok) return { ok: false as const, errorCode: "cross_ledger_reference" as const };
  if (canonicalStage7JsonV2(outcomeBoundaryResult.boundary) !== canonicalStage7JsonV2(outcomeResult.outcome.realityBoundarySnapshot)) {
    return { ok: false as const, errorCode: "cross_ledger_reference" as const };
  }
  const forecastBoundaryResult = parseRealityBoundarySnapshotV2(parsed.data.claimSet.realityBoundary);
  if (!forecastBoundaryResult.ok) return { ok: false as const, errorCode: "cross_ledger_reference" as const };
  const forecast = forecastBoundaryResult.boundary;
  const outcomeBoundary = outcomeBoundaryResult.boundary;
  if (forecast.seedContextId !== outcomeBoundary.seedContextId || forecast.seedContextId !== outcomeResult.outcome.seedContextId) {
    return { ok: false as const, errorCode: "cross_seed_reference" as const };
  }
  if (!preservesHistoricalBoundary(forecast, outcomeBoundary)) {
    return { ok: false as const, errorCode: "cross_ledger_reference" as const };
  }
  const rebuiltClaims = buildClaimsV2(parsed.data.claimSet);
  if (!rebuiltClaims.ok) return rebuiltClaims;
  const suppliedClaims = canonicalClaims(parsed.data.claims);
  if (!suppliedClaims.ok) return suppliedClaims;
  const canonicalBuilt = canonicalClaims(rebuiltClaims.claims);
  if (!canonicalBuilt.ok || canonicalClaimsJsonV2(canonicalBuilt.claims) !== canonicalClaimsJsonV2(suppliedClaims.claims)) {
    return { ok: false as const, errorCode: "backtest_tampering" as const };
  }
  const reportValidation = validateClaimsReportV2(parsed.data.report, parsed.data.claimSet, suppliedClaims.claims);
  if (!reportValidation.ok) return reportValidation;
  const report = structuredClone(parsed.data.report) as ClaimsReportV2;
  const claim = canonicalBuilt.claims.find((item) => item.id === outcomeResult.outcome.claimReference.claimId);
  if (!claim || !report.claimIds.includes(outcomeResult.outcome.claimReference.claimId)) {
    return { ok: false as const, errorCode: "unknown_claim_reference" as const };
  }
  if (claim.clusterIds.length !== 1 || claim.clusterIds[0] !== outcomeResult.outcome.claimReference.clusterId) {
    return { ok: false as const, errorCode: "unknown_claim_reference" as const };
  }
  if (
    claim.seedContextId !== forecast.seedContextId ||
    report.seedContextId !== forecast.seedContextId ||
    claim.versions.realityBoundaryRevision !== forecast.revision ||
    claim.versions.realityBoundarySchemaVersion !== forecast.schemaVersion
  ) return { ok: false as const, errorCode: "cross_seed_reference" as const };
  const run = structuredClone(parsed.data.run) as Stage7RunSnapshotV2;
  const runBinding = buildRunBinding(run, claim);
  if (!runBinding) return { ok: false as const, errorCode: "run_mismatch" as const };
  const evaluationWindow = deriveEvaluationWindow(run);
  if (!evaluationWindow) return { ok: false as const, errorCode: "run_mismatch" as const };
  if (canonicalStage7JsonV2(evaluationWindow) !== canonicalStage7JsonV2(outcomeResult.outcome.observationWindow)) {
    return { ok: false as const, errorCode: "invalid_observation_time" as const };
  }
  const forecastStart = parseTrajectoryInstantV2(evaluationWindow.startAt);
  const primaryEvidence = outcomeBoundary.evidenceLedger.items.find(
    (item) => item.id === outcomeResult.outcome.source.realEvidenceId,
  );
  const captured = parseTrajectoryInstantV2(primaryEvidence?.capturedAt);
  if (!forecastStart.ok || !captured.ok ||
      forecast.evidenceLedger.items.some((item) => item.id === primaryEvidence?.id) ||
      captured.value.epochMilliseconds < forecastStart.value.epochMilliseconds) {
    return { ok: false as const, errorCode: "invalid_observation_time" as const };
  }
  const observedValue = outcomeResult.outcome.observed === "occurred" ? 1 : 0;
  const calibrationEligible = claim.claimType === "scenario_frequency";
  const predictedValue = calibrationEligible ? claim.numerator / claim.denominator : null;
  const evaluation: BacktestV2["evaluation"] = {
    metricLabel: claim.metric,
    predictedValue,
    observedValue,
    brierScore: predictedValue === null ? null : (predictedValue - observedValue) ** 2,
    calibrationEligible,
    evaluationStatus: calibrationEligible ? "scored" : "counterfactual_not_observable",
  };
  const claimSet = {
    kind: parsed.data.claimSet.kind,
    payload: structuredClone(parsed.data.claimSet.payload),
    realityBoundary: structuredClone(forecast),
  } as Stage7ClaimSetSnapshotV2;
  const sourceSnapshots: BacktestV2["sourceSnapshots"] = {
    run,
    claimSet,
    claims: structuredClone(suppliedClaims.claims),
    report,
    outcome: structuredClone(outcomeResult.outcome),
    outcomeRealityBoundary: structuredClone(outcomeBoundary),
    claimSetIntegritySignature: claimsFingerprintV2(claimSet),
    runIntegritySignature: runBinding.runIntegritySignature,
  };
  const forecastUnitSignature = stage7FingerprintV2({
    seedContextId: forecast.seedContextId,
    runIntegritySignature: runBinding.runIntegritySignature,
    claimId: claim.id,
    clusterId: outcomeResult.outcome.claimReference.clusterId,
    evaluationWindow,
  });
  const unsigned: Omit<BacktestV2, "id" | "backtestIntegritySignature"> = {
    backtestSpecId: parsed.data.backtestSpecId as BacktestV2["backtestSpecId"],
    seedContextId: forecast.seedContextId,
    status: "completed",
    claimId: claim.id,
    reportId: report.id,
    outcomeId: outcomeResult.outcome.id,
    claimType: claim.claimType,
    evaluation,
    sampleBinding: {
      numerator: claim.numerator,
      denominator: claim.denominator,
      sampleCount: claim.sampleCount,
      trajectoryIds: [...claim.trajectoryIds],
      clusterIds: [...claim.clusterIds],
    },
    runBinding,
    realityBoundaryBinding: {
      seedContextId: forecast.seedContextId,
      schemaVersion: forecast.schemaVersion,
      forecastRevision: forecast.revision,
      outcomeRevision: outcomeBoundary.revision,
      evidenceLedgerId: forecast.evidenceLedger.id,
      assumptionLedgerId: forecast.assumptionLedger.id,
    },
    evaluationWindow,
    observationUnitSignature: outcomeResult.outcome.observationUnitSignature,
    forecastUnitSignature,
    versions: {
      outcomeCalibrationEngineVersion: OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
      backtestSchemaVersion: BACKTEST_SCHEMA_VERSION_V2,
      outcomeSchemaVersion: outcomeResult.outcome.versions.outcomeSchemaVersion,
      claimsReportsEngineVersion: claim.versions.claimsReportsEngineVersion,
      claimSchemaVersion: claim.versions.claimSchemaVersion,
      claimPolicyVersion: claim.versions.claimPolicyVersion,
      reportSchemaVersion: report.reportSchemaVersion,
      reportPolicyVersion: report.reportPolicyVersion,
      trajectoryEngineVersion: claim.versions.trajectoryEngineVersion,
      analysisEngineVersion: claim.versions.analysisEngineVersion,
      featureSchemaVersion: claim.versions.featureSchemaVersion,
      clusteringAlgorithm: claim.versions.clusteringAlgorithm,
      clusteringVersion: claim.versions.clusteringVersion,
      policyVersion: claim.versions.policyVersion,
    },
    limitations: calibrationEligible
      ? [
          "The binary score evaluates sampled simulation frequency against one actual observation; it is not a causal effect estimate or deterministic prediction.",
          "Outcome-to-cluster classification retains the recorded uncertainty and limitations.",
        ]
      : [
          "A single actual observation cannot identify a sensitivity or intervention counterfactual, so this Backtest is excluded from calibration.",
          "No causal effect or deterministic prediction is inferred.",
        ],
    sourceSnapshots,
  };
  const backtest: BacktestV2 = {
    id: backtestIdV2(unsigned),
    ...unsigned,
    backtestIntegritySignature: stage7FingerprintV2(unsigned),
  };
  return { ok: true as const, backtest };
}

export function backtestClaimsReportV2(input: unknown) {
  try {
    return backtestUnsafeV2(input);
  } catch {
    return { ok: false as const, errorCode: "invalid_backtest_input" as const };
  }
}

export function parseValidatedBacktestV2(input: unknown) {
  try {
    const candidate = input as { versions?: { outcomeCalibrationEngineVersion?: unknown; backtestSchemaVersion?: unknown } };
    if (
      candidate?.versions?.outcomeCalibrationEngineVersion !== OUTCOME_CALIBRATION_ENGINE_VERSION_V2 ||
      candidate?.versions?.backtestSchemaVersion !== BACKTEST_SCHEMA_VERSION_V2
    ) return { ok: false as const, errorCode: "version_mismatch" as const };
    const parsed = backtestSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, errorCode: "backtest_tampering" as const };
    const snapshots = parsed.data.sourceSnapshots;
    const rebuilt = backtestUnsafeV2({
      backtestSpecId: parsed.data.backtestSpecId,
      run: snapshots.run,
      claimSet: snapshots.claimSet,
      claims: snapshots.claims,
      report: snapshots.report,
      outcome: snapshots.outcome,
      outcomeRealityBoundary: snapshots.outcomeRealityBoundary,
    });
    if (!rebuilt.ok || canonicalStage7JsonV2(rebuilt.backtest) !== canonicalStage7JsonV2(input)) {
      return { ok: false as const, errorCode: "backtest_tampering" as const };
    }
    return { ok: true as const, backtest: structuredClone(rebuilt.backtest) };
  } catch {
    return { ok: false as const, errorCode: "backtest_tampering" as const };
  }
}
