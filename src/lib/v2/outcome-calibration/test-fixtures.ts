import { createStableAgentWorldIdFactoryV2 } from "../agent-world/ids";
import { idsV2, realityBoundaryV2 } from "../agent-world/test-fixtures";
import { trajectoryPolicyFixtureV2, trajectoryRunSpecFixtureV2 } from "../trajectory/test-fixtures";
import { addTrajectoryDaysV2, parseTrajectoryInstantV2 } from "../trajectory/time";
import { analyzeTrajectoryBatchV2 } from "../trajectory-analysis/batch-runner";
import { createLocalTrajectoryAnalysisAdapterV2 } from "../trajectory-analysis/local-adapter";
import { compareSensitivityV2 } from "../trajectory-analysis/sensitivity";
import {
  ANALYSIS_ENGINE_VERSION_V2,
  CLUSTERING_ALGORITHM_V2,
  CLUSTERING_VERSION_V2,
  FEATURE_SCHEMA_VERSION_V2,
} from "../trajectory-analysis/types";
import { buildClaimsV2 } from "../claims-reports/claim-builder";
import { buildClaimsReportV2 } from "../claims-reports/report-builder";
import type { ClaimV2 } from "../claims-reports/types";
import { buildForecastLockV2 } from "./forecast-lock";
import { createInMemoryOutcomeCalibrationRepositoryV2 } from "./in-memory-repository";
import { persistenceVersionIdV2, stage7FingerprintV2 } from "./ids";
import type { OutcomeCalibrationPersistenceVersionV2 } from "./types";
import { PERSISTENCE_SCHEMA_VERSION_V2 } from "./types";

export const OUTCOME_OCCURRED_AT_FIXTURES_V2 = [
  "2026-07-29T09:00:00.000Z",
  "2026-07-30T09:00:00.000Z",
  "2026-07-31T09:00:00.000Z",
  "2026-08-01T09:00:00.000Z",
  "2026-08-02T09:00:00.000Z",
] as const;

export const OUTCOME_RECORDED_AT_FIXTURES_V2 = [
  "2026-07-29T10:00:00.000Z",
  "2026-07-30T10:00:00.000Z",
  "2026-07-31T10:00:00.000Z",
  "2026-08-01T10:00:00.000Z",
  "2026-08-02T10:00:00.000Z",
] as const;

export const FORECAST_START_AT_FIXTURES_V2 = [
  "2026-07-20T10:00:00.000Z",
  "2026-07-20T10:00:00.000Z",
  "2026-07-20T10:00:00.000Z",
  "2026-07-20T10:00:00.000Z",
  "2026-07-20T10:00:00.000Z",
] as const;

function forecastWindow(startAt: string, horizonDays = 30) {
  const parsed = parseTrajectoryInstantV2(startAt);
  if (!parsed.ok) throw new Error(parsed.errorCode);
  const horizonEnd = addTrajectoryDaysV2(parsed.value, horizonDays);
  if (!horizonEnd.ok) throw new Error(horizonEnd.errorCode);
  return { startAt: parsed.value.isoTimestamp, horizonEnd: horizonEnd.value.isoTimestamp };
}

function adapter() {
  return createLocalTrajectoryAnalysisAdapterV2({
    policyFactory: ({ spec }) => ({
      ...trajectoryPolicyFixtureV2(),
      policyId: spec.policyId,
      policyVersion: spec.policyVersion,
    }),
    trajectoryRuntimeFactory: ({ seed }) => ({
      agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`stage-7-child-${seed}`),
    }),
    interventionRuntimeFactory: ({ interventionId }) => ({
      clock: () => "2026-07-19T10:00:00.001Z",
      idFactory: createStableAgentWorldIdFactoryV2(`stage-7-intervention-${interventionId}`),
    }),
  });
}

export function forecastRealityBoundaryFixtureV2() {
  const value = realityBoundaryV2();
  return {
    seedContextId: value.seedContextId,
    schemaVersion: value.schemaVersion,
    revision: value.revision,
    evidenceLedger: value.evidenceLedger,
    assumptionLedger: value.assumptionLedger,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function stage6SourceFixtureV2({
  unitIndex = 0,
  startAt,
  trajectorySeedOffset = 0,
}: {
  unitIndex?: number;
  startAt?: string;
  trajectorySeedOffset?: number;
} = {}) {
  const template = trajectoryRunSpecFixtureV2();
  template.runSpecId = `trajectory_run_spec_v2_stage_7_unit_${unitIndex + 1}`;
  template.trajectoryId = `trajectory_v2_stage_7_unit_${unitIndex + 1}`;
  template.startAt = startAt ?? FORECAST_START_AT_FIXTURES_V2[unitIndex] ?? FORECAST_START_AT_FIXTURES_V2[0];
  const spec = {
    analysisRunSpecId: `analysis_run_spec_v2_stage_7_unit_${unitIndex + 1}`,
    seedContextId: template.seedContextId,
    trajectoryTemplate: template,
    trajectorySeeds: [7 + trajectorySeedOffset, 11 + trajectorySeedOffset, 19 + trajectorySeedOffset],
    sampleCount: 3,
    horizonDays: template.horizonDays,
    policyId: template.policyId,
    policyVersion: template.policyVersion,
    trajectoryEngineVersion: template.trajectoryEngineVersion,
    analysisEngineVersion: ANALYSIS_ENGINE_VERSION_V2,
    featureSchemaVersion: FEATURE_SCHEMA_VERSION_V2,
    clusteringAlgorithm: CLUSTERING_ALGORITHM_V2,
    clusteringVersion: CLUSTERING_VERSION_V2,
  } as const;
  const analyzed = analyzeTrajectoryBatchV2(spec, adapter());
  if (!analyzed.ok) throw new Error(analyzed.errorCode);
  const claimSet = {
    kind: "batch" as const,
    payload: analyzed.analysis,
    realityBoundary: forecastRealityBoundaryFixtureV2(),
  };
  const builtClaims = buildClaimsV2(claimSet);
  if (!builtClaims.ok) throw new Error(builtClaims.errorCode);
  const reportResult = buildClaimsReportV2({
    reportSpecId: `claims_report_spec_v2_stage_7_unit_${unitIndex + 1}`,
    seedContextId: spec.seedContextId,
    claimSet,
    claims: builtClaims.claims,
    claimIds: builtClaims.claims.map((claim) => claim.id),
  });
  if (!reportResult.ok) throw new Error(reportResult.errorCode);
  return {
    run: { kind: "batch" as const, payload: analyzed.analysis },
    claimSet,
    claims: builtClaims.claims,
    report: reportResult.report,
    targetClaim: builtClaims.claims[0] as ClaimV2,
  };
}

export function stage6SensitivitySourceFixtureV2() {
  const baselineSource = stage6SourceFixtureV2();
  const baseline = baselineSource.run.payload.spec;
  const world = baseline.trajectoryTemplate.initialWorld;
  const comparison = compareSensitivityV2({
    sensitivityAnalysisId: "sensitivity_analysis_v2_stage_7_fixture",
    baseline,
    variants: [{
      variantId: "sensitivity_variant_v2_stage_7_budget_60",
      axis: {
        kind: "external_variable",
        targetId: idsV2.promotionBudget,
        variantValue: 60,
      },
      proposal: {
        id: "action_proposal_v2_stage_7_sensitivity",
        seedContextId: world.seedContextId,
        actorAgentId: idsV2.self,
        actionType: "update_external_variable",
        targetEntityIds: [],
        targetResourceIds: [],
        targetRelationIds: [],
        targetVariableIds: [idsV2.promotionBudget],
        parameters: {
          actionType: "update_external_variable",
          variableId: idsV2.promotionBudget,
          value: 60,
        },
        realEvidenceIds: [world.realityBoundarySnapshot.evidenceLedger.items[1]!.id],
        assumptionIds: [world.realityBoundarySnapshot.assumptionLedger.assumptions[0]!.id],
        priorWorldEventIds: [],
        rationaleSummary: "Controlled Stage 7 sensitivity fixture.",
        createdAt: "2026-07-19T10:00:00.001Z",
      },
    }],
  }, adapter());
  if (!comparison.ok) throw new Error(comparison.errorCode);
  const claimSet = {
    kind: "sensitivity" as const,
    payload: comparison,
    realityBoundary: forecastRealityBoundaryFixtureV2(),
  };
  const builtClaims = buildClaimsV2(claimSet);
  if (!builtClaims.ok) throw new Error(builtClaims.errorCode);
  const reportResult = buildClaimsReportV2({
    reportSpecId: "claims_report_spec_v2_stage_7_sensitivity",
    seedContextId: baseline.seedContextId,
    claimSet,
    claims: builtClaims.claims,
    claimIds: builtClaims.claims.map((claim) => claim.id),
  });
  if (!reportResult.ok) throw new Error(reportResult.errorCode);
  return {
    run: { kind: "sensitivity" as const, payload: comparison },
    claimSet,
    claims: builtClaims.claims,
    report: reportResult.report,
    targetClaim: builtClaims.claims[0] as ClaimV2,
  };
}

export function outcomeRealityBoundaryFixtureV2({
  count = 1,
  seedContextId,
  alternateLedger = false,
  nonOccurrenceIndices = [],
}: {
  count?: number;
  seedContextId?: string;
  alternateLedger?: boolean;
  nonOccurrenceIndices?: number[];
} = {}) {
  const boundary = structuredClone(forecastRealityBoundaryFixtureV2());
  const seed = seedContextId ?? boundary.seedContextId;
  boundary.seedContextId = seed;
  boundary.evidenceLedger.seedContextId = seed;
  boundary.assumptionLedger.seedContextId = seed;
  boundary.evidenceLedger.items = boundary.evidenceLedger.items.map((item) => ({
    ...item,
    seedContextId: seed,
  }));
  boundary.assumptionLedger.assumptions = boundary.assumptionLedger.assumptions.map((item) => ({
    ...item,
    seedContextId: seed,
  }));
  if (alternateLedger) {
    boundary.evidenceLedger.id = "real_evidence_ledger_v2_alternate01";
    boundary.assumptionLedger.id = "assumption_ledger_v2_alternate01";
  }
  for (let index = 0; index < count; index += 1) {
    const occurredAt = OUTCOME_OCCURRED_AT_FIXTURES_V2[index]!;
    const window = forecastWindow(FORECAST_START_AT_FIXTURES_V2[index]!, 30);
    const didNotOccur = nonOccurrenceIndices.includes(index);
    const recordedAt = didNotOccur ? window.horizonEnd : OUTCOME_RECORDED_AT_FIXTURES_V2[index]!;
    boundary.evidenceLedger.items.push({
      id: `real_evidence_v2_actualobservation0${index + 1}`,
      seedContextId: seed,
      statement: `Observed real-world outcome ${index + 1}.`,
      claimKey: `actual.outcome.${index + 1}`,
      sourceKind: "user_statement",
      sourceTier: "tier_1_user_confirmed",
      verificationStatus: "user_confirmed",
      provenance: [{
        sourceRef: `outcome:user-confirmation:${index + 1}`,
        capturedAt: recordedAt,
        ...(didNotOccur ? {} : { occurredAt }),
      }],
      limitations: ["This is a user-confirmed observation with bounded recall uncertainty."],
      capturedAt: recordedAt,
      ...(didNotOccur ? {} : { occurredAt }),
      createdAt: recordedAt,
      updatedAt: recordedAt,
    });
  }
  const revision = boundary.revision + count;
  const updatedAt = boundary.evidenceLedger.items.at(-1)!.capturedAt;
  boundary.revision = revision;
  boundary.updatedAt = updatedAt;
  boundary.evidenceLedger.revision = revision;
  boundary.evidenceLedger.updatedAt = updatedAt;
  boundary.assumptionLedger.revision = revision;
  boundary.assumptionLedger.updatedAt = updatedAt;
  return boundary;
}

export function outcomeCaptureInputFixtureV2({
  index = 0,
  observed = true,
  boundary = outcomeRealityBoundaryFixtureV2({ count: 1 }),
  source = stage6SourceFixtureV2({ unitIndex: index }),
  evaluatedThrough,
  observationWindow: suppliedObservationWindow,
}: {
  index?: number;
  observed?: boolean;
  boundary?: ReturnType<typeof outcomeRealityBoundaryFixtureV2>;
  source?: ReturnType<typeof stage6SourceFixtureV2> | ReturnType<typeof stage6SensitivitySourceFixtureV2>;
  evaluatedThrough?: string;
  observationWindow?: { startAt: string; horizonEnd: string };
} = {}) {
  const evidence = boundary.evidenceLedger.items.find(
    (item) => item.id === `real_evidence_v2_actualobservation0${index + 1}`,
  );
  if (!evidence) throw new Error("Missing outcome evidence fixture.");
  const runSpec = source.run.kind === "batch"
    ? source.run.payload.spec.trajectoryTemplate
    : source.run.payload.baseline.spec.trajectoryTemplate;
  const observationWindow = suppliedObservationWindow ?? forecastWindow(runSpec.startAt, runSpec.horizonDays);
  const occurredAt = evidence.occurredAt!;
  const effectiveEvaluatedThrough = evaluatedThrough ?? (
    observed ? evidence.capturedAt : observationWindow.horizonEnd
  );
  return {
    outcomeSpecId: `outcome_spec_v2_stage_7_observation_${index + 1}`,
    seedContextId: boundary.seedContextId,
    realityBoundary: boundary,
    claimReference: {
      claimId: source.targetClaim.id,
      clusterId: source.targetClaim.clusterIds[0]!,
    },
    observed: observed ? "occurred" as const : "did_not_occur" as const,
    ...(observed ? { occurredAt } : {}),
    evaluatedThrough: effectiveEvaluatedThrough,
    observationWindow,
    recordedAt: observed ? evidence.capturedAt : effectiveEvaluatedThrough,
    realEvidenceIds: [evidence.id],
    source: {
      realEvidenceId: evidence.id,
      sourceKind: evidence.sourceKind,
      sourceRef: evidence.provenance[0]!.sourceRef,
      verificationStatus: evidence.verificationStatus,
    },
    uncertainty: {
      level: "medium" as const,
      statement: "The observed event is user-confirmed; classification against the simulated cluster remains uncertain.",
      limitations: ["Recall and cluster-classification uncertainty remain."],
    },
  };
}

export function forecastLockPersistenceFixtureV2({
  source = stage6SourceFixtureV2(),
  lockedAt = "2026-07-19T10:01:00.000Z",
  persistedAt = lockedAt,
  streamId = "outcome_calibration_stream_v2_career_fixture" as const,
  version = 1,
  idempotencyKey = `stage7_idempotency_v2_forecast_lock_${version}` as const,
}: {
  source?: ReturnType<typeof stage6SourceFixtureV2> | ReturnType<typeof stage6SensitivitySourceFixtureV2>;
  lockedAt?: string;
  persistedAt?: string;
  streamId?: `outcome_calibration_stream_v2_${string}`;
  version?: number;
  idempotencyKey?: `stage7_idempotency_v2_${string}`;
} = {}) {
  const built = buildForecastLockV2({
    forecastLockSpecId: `forecast_lock_spec_v2_stage_7_fixture_${version}`,
    lockedAt,
    run: source.run,
    claimSet: source.claimSet,
    claims: source.claims,
    report: source.report,
  });
  if (!built.ok) throw new Error(built.errorCode);
  const requestFingerprint = stage7FingerprintV2({
    streamId,
    expectedVersion: version - 1,
    idempotencyKey,
    persistedAt,
    artifact: { kind: "forecast_lock", value: built.forecastLock },
  });
  const unsigned: Omit<OutcomeCalibrationPersistenceVersionV2, "id" | "persistenceIntegritySignature"> = {
    streamId,
    seedContextId: built.forecastLock.seedContextId,
    evidenceLedgerId: built.forecastLock.realityBoundaryBinding.evidenceLedgerId,
    assumptionLedgerId: built.forecastLock.realityBoundaryBinding.assumptionLedgerId,
    realityBoundaryRevision: built.forecastLock.realityBoundaryBinding.revision,
    version,
    parentVersionId: version === 1 ? null : `outcome_calibration_version_v2_parent${version - 1}`,
    idempotencyKey,
    requestFingerprint,
    persistedAt,
    persistenceSchemaVersion: PERSISTENCE_SCHEMA_VERSION_V2,
    artifact: { kind: "forecast_lock", value: built.forecastLock },
  };
  const persistenceVersion: OutcomeCalibrationPersistenceVersionV2 = {
    id: persistenceVersionIdV2(unsigned),
    ...unsigned,
    persistenceIntegritySignature: stage7FingerprintV2(unsigned),
  };
  return { forecastLock: built.forecastLock, persistenceVersion };
}

export async function persistedForecastLockReferenceFixtureV2({
  source = stage6SourceFixtureV2(),
  lockedAt = "2026-07-19T10:01:00.000Z",
  persistedAt = lockedAt,
  streamId = "outcome_calibration_stream_v2_career_fixture" as const,
}: {
  source?: ReturnType<typeof stage6SourceFixtureV2> | ReturnType<typeof stage6SensitivitySourceFixtureV2>;
  lockedAt?: string;
  persistedAt?: string;
  streamId?: `outcome_calibration_stream_v2_${string}`;
} = {}) {
  const fixture = forecastLockPersistenceFixtureV2({ source, lockedAt, persistedAt, streamId });
  const repository = createInMemoryOutcomeCalibrationRepositoryV2();
  const appended = await repository.append({
    streamId,
    expectedVersion: 0,
    idempotencyKey: fixture.persistenceVersion.idempotencyKey,
    persistedAt,
    artifact: fixture.persistenceVersion.artifact,
  });
  if (!appended.ok) throw new Error(appended.errorCode);
  return {
    repository,
    forecastLock: fixture.forecastLock,
    persistenceVersion: appended.data,
    forecastLockReference: { streamId, version: appended.data.version },
  };
}
