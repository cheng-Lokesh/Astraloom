import type { RealityBoundarySnapshotV2 } from "../agent-world/types";
import type { ClaimV2, ClaimsReportV2 } from "../claims-reports/types";
import type {
  EvidenceSourceKindV2,
  EvidenceVerificationStatusV2,
  RealEvidenceIdV2,
} from "../reality-boundary/types";

export const OUTCOME_CALIBRATION_ENGINE_VERSION_V2 =
  "outcome-calibration-engine-v2-stage-7" as const;
export const OUTCOME_SCHEMA_VERSION_V2 = "outcome-v2.0" as const;
export const BACKTEST_SCHEMA_VERSION_V2 = "backtest-v2.0" as const;
export const CALIBRATION_SCHEMA_VERSION_V2 = "calibration-v2.0" as const;
export const PERSISTENCE_SCHEMA_VERSION_V2 = "outcome-calibration-persistence-v2.0" as const;
export const CALIBRATION_METHOD_NAME_V2 = "binary-brier-score" as const;
export const CALIBRATION_METHOD_VERSION_V2 = "1" as const;
export const MIN_CALIBRATION_SAMPLE_SIZE_V2 = 5 as const;

export type OutcomeIdV2 = `outcome_v2_${string}`;
export type BacktestIdV2 = `backtest_v2_${string}`;
export type CalibrationIdV2 = `calibration_v2_${string}`;
export type OutcomeCalibrationPersistenceVersionIdV2 = `outcome_calibration_version_v2_${string}`;

export type OutcomeSourceV2 = {
  realEvidenceId: RealEvidenceIdV2;
  sourceKind: Exclude<EvidenceSourceKindV2, "search_summary">;
  sourceRef: string;
  verificationStatus: Extract<
    EvidenceVerificationStatusV2,
    "user_confirmed" | "source_verified"
  >;
};

export type OutcomeUncertaintyV2 = {
  level: "low" | "medium" | "high";
  statement: string;
  limitations: string[];
};

export type OutcomeV2 = {
  id: OutcomeIdV2;
  outcomeSpecId: `outcome_spec_v2_${string}`;
  seedContextId: string;
  status: "actual_observation";
  evidenceClass: "real_world";
  claimReference: {
    claimId: ClaimV2["id"];
    clusterId: ClaimV2["clusterIds"][number];
  };
  observed: "occurred" | "did_not_occur";
  occurredAt: string;
  recordedAt: string;
  realEvidenceIds: RealEvidenceIdV2[];
  source: OutcomeSourceV2;
  uncertainty: OutcomeUncertaintyV2;
  realityBoundarySnapshot: RealityBoundarySnapshotV2;
  versions: {
    outcomeCalibrationEngineVersion: typeof OUTCOME_CALIBRATION_ENGINE_VERSION_V2;
    outcomeSchemaVersion: typeof OUTCOME_SCHEMA_VERSION_V2;
    realityBoundarySchemaVersion: "2.0";
    realityBoundaryRevision: number;
  };
  outcomeIntegritySignature: string;
};

export type Stage7RunSnapshotV2 = {
  kind: "batch" | "sensitivity" | "intervention";
  payload: unknown;
};

export type Stage7ClaimSetSnapshotV2 = Stage7RunSnapshotV2 & {
  realityBoundary: RealityBoundarySnapshotV2;
};

export type BacktestV2 = {
  id: BacktestIdV2;
  backtestSpecId: `backtest_spec_v2_${string}`;
  seedContextId: string;
  status: "completed";
  claimId: ClaimV2["id"];
  reportId: ClaimsReportV2["id"];
  outcomeId: OutcomeV2["id"];
  claimType: ClaimV2["claimType"];
  evaluation: {
    metricLabel: "simulation_frequency" | "sampled_frequency_difference";
    predictedValue: number | null;
    observedValue: 0 | 1;
    brierScore: number | null;
    calibrationEligible: boolean;
    evaluationStatus: "scored" | "counterfactual_not_observable";
  };
  sampleBinding: {
    numerator: number;
    denominator: number;
    sampleCount: number;
    trajectoryIds: ClaimV2["trajectoryIds"];
    clusterIds: ClaimV2["clusterIds"];
  };
  runBinding: {
    kind: Stage7RunSnapshotV2["kind"];
    sourceAnalysisId: string;
    analysisRunSpecIds: string[];
    trajectoryRunSpecIds: string[];
    trajectoryIds: ClaimV2["trajectoryIds"];
    trajectorySeeds: number[];
    horizonDays: Array<30 | 90>;
    policyVersions: string[];
    runIntegritySignature: string;
  };
  realityBoundaryBinding: {
    seedContextId: string;
    schemaVersion: "2.0";
    forecastRevision: number;
    outcomeRevision: number;
    evidenceLedgerId: string;
    assumptionLedgerId: string;
  };
  versions: {
    outcomeCalibrationEngineVersion: typeof OUTCOME_CALIBRATION_ENGINE_VERSION_V2;
    backtestSchemaVersion: typeof BACKTEST_SCHEMA_VERSION_V2;
    outcomeSchemaVersion: typeof OUTCOME_SCHEMA_VERSION_V2;
    claimsReportsEngineVersion: ClaimV2["versions"]["claimsReportsEngineVersion"];
    claimSchemaVersion: ClaimV2["versions"]["claimSchemaVersion"];
    claimPolicyVersion: ClaimV2["versions"]["claimPolicyVersion"];
    reportSchemaVersion: ClaimsReportV2["reportSchemaVersion"];
    reportPolicyVersion: ClaimsReportV2["reportPolicyVersion"];
    trajectoryEngineVersion: string;
    analysisEngineVersion: string;
    featureSchemaVersion: string;
    clusteringAlgorithm: string;
    clusteringVersion: string;
    policyVersion: string;
  };
  limitations: string[];
  sourceSnapshots: {
    run: Stage7RunSnapshotV2;
    claimSet: Stage7ClaimSetSnapshotV2;
    claims: ClaimV2[];
    report: ClaimsReportV2;
    outcome: OutcomeV2;
    outcomeRealityBoundary: RealityBoundarySnapshotV2;
    claimSetIntegritySignature: string;
    runIntegritySignature: string;
  };
  backtestIntegritySignature: string;
};

export type CalibrationV2 = {
  id: CalibrationIdV2;
  calibrationSpecId: `calibration_spec_v2_${string}`;
  seedContextId: string;
  status: "insufficient_data" | "calibrated";
  metricLabel: "simulation_frequency" | "calibrated_simulation_frequency";
  sampleCount: number;
  excludedSampleCount: number;
  minimumSampleSize: typeof MIN_CALIBRATION_SAMPLE_SIZE_V2;
  method: {
    name: typeof CALIBRATION_METHOD_NAME_V2;
    version: typeof CALIBRATION_METHOD_VERSION_V2;
    description: string;
  };
  brierScore: number | null;
  meanSimulationFrequency: number | null;
  observedRate: number | null;
  causalConclusion: false;
  deterministicPrediction: false;
  backtestIds: BacktestV2["id"][];
  outcomeIds: OutcomeV2["id"][];
  realityBoundaryBinding: {
    evidenceLedgerId: string;
    assumptionLedgerId: string;
    minimumRevision: number;
    maximumRevision: number;
  };
  limitations: string[];
  sourceBacktests: BacktestV2[];
  versions: {
    outcomeCalibrationEngineVersion: typeof OUTCOME_CALIBRATION_ENGINE_VERSION_V2;
    calibrationSchemaVersion: typeof CALIBRATION_SCHEMA_VERSION_V2;
    backtestSchemaVersion: typeof BACKTEST_SCHEMA_VERSION_V2;
    methodVersion: typeof CALIBRATION_METHOD_VERSION_V2;
  };
  calibrationIntegritySignature: string;
};

export type OutcomeCalibrationArtifactV2 =
  | { kind: "outcome"; value: OutcomeV2 }
  | { kind: "backtest"; value: BacktestV2 }
  | { kind: "calibration"; value: CalibrationV2 };

export type OutcomeCalibrationPersistenceVersionV2 = {
  id: OutcomeCalibrationPersistenceVersionIdV2;
  streamId: `outcome_calibration_stream_v2_${string}`;
  seedContextId: string;
  evidenceLedgerId: string;
  assumptionLedgerId: string;
  realityBoundaryRevision: number;
  version: number;
  parentVersionId: OutcomeCalibrationPersistenceVersionIdV2 | null;
  idempotencyKey: `stage7_idempotency_v2_${string}`;
  requestFingerprint: string;
  persistedAt: string;
  persistenceSchemaVersion: typeof PERSISTENCE_SCHEMA_VERSION_V2;
  artifact: OutcomeCalibrationArtifactV2;
  persistenceIntegritySignature: string;
};

export type OutcomeCalibrationErrorCodeV2 =
  | "invalid_outcome_input"
  | "invalid_backtest_input"
  | "invalid_calibration_input"
  | "invalid_id"
  | "version_mismatch"
  | "cross_seed_reference"
  | "cross_ledger_reference"
  | "dangling_real_evidence"
  | "invalid_observation_time"
  | "invalid_outcome_source"
  | "outcome_tampering"
  | "backtest_tampering"
  | "calibration_tampering"
  | "run_mismatch"
  | "unknown_claim_reference"
  | "duplicate_id";
