import type { WorldEventIdV2 } from "../agent-world/types";
import type { AssumptionIdV2, RealEvidenceIdV2 } from "../reality-boundary/types";
import type { TrajectoryIdV2 } from "../trajectory/types";
import type { TrajectoryClusterV2 } from "../trajectory-analysis/types";

export const CLAIMS_REPORTS_ENGINE_VERSION_V2 = "claims-reports-engine-v2-stage-6" as const;
export const CLAIM_SCHEMA_VERSION_V2 = "claim-v2.0" as const;
export const REPORT_SCHEMA_VERSION_V2 = "report-v2.0" as const;
export const CLAIM_POLICY_VERSION_V2 = "stage-5-direct-support-only-v1" as const;
export const REPORT_POLICY_VERSION_V2 = "validated-claims-only-v1" as const;

export type ClaimTypeV2 =
  | "scenario_frequency"
  | "sensitivity_difference"
  | "intervention_difference";

export type ClaimIdV2 = `claim_v2_${string}`;
export type ClaimsReportIdV2 = `claims_report_v2_${string}`;

export type ClaimVersionsV2 = {
  claimsReportsEngineVersion: typeof CLAIMS_REPORTS_ENGINE_VERSION_V2;
  claimSchemaVersion: typeof CLAIM_SCHEMA_VERSION_V2;
  claimPolicyVersion: typeof CLAIM_POLICY_VERSION_V2;
  trajectoryEngineVersion: string;
  agentWorldEngineVersion: string;
  analysisEngineVersion: string;
  featureSchemaVersion: string;
  clusteringAlgorithm: string;
  clusteringVersion: string;
  policyVersion: string;
  realityBoundarySchemaVersion: string;
  realityBoundaryRevision: number;
};

export type ClaimV2 = {
  id: ClaimIdV2;
  claimType: ClaimTypeV2;
  metric: "simulation_frequency" | "sampled_frequency_difference";
  seedContextId: string;
  sourceAnalysisId: string;
  variantId: string | null;
  statement: string;
  realEvidenceIds: RealEvidenceIdV2[];
  simulationEventIds: WorldEventIdV2[];
  assumptionIds: AssumptionIdV2[];
  trajectoryIds: TrajectoryIdV2[];
  clusterIds: TrajectoryClusterV2["clusterId"][];
  numerator: number;
  denominator: number;
  sampleCount: number;
  versions: ClaimVersionsV2;
  uncertaintyStatement: string;
  claimIntegritySignature: string;
};

export type ClaimsReportSectionV2 = {
  claimId: ClaimIdV2;
  statement: string;
  realEvidenceIds: RealEvidenceIdV2[];
  simulationEventIds: WorldEventIdV2[];
  assumptionIds: AssumptionIdV2[];
  uncertaintyStatement: string;
  claim: ClaimV2;
};

export type ClaimsReportV2 = {
  id: ClaimsReportIdV2;
  reportSpecId: `claims_report_spec_v2_${string}`;
  seedContextId: string;
  title: "Stage 6 Claims Report";
  metricLabel: "simulation frequency and deterministic differences";
  claimIds: ClaimIdV2[];
  sections: ClaimsReportSectionV2[];
  sampleCount: number;
  claimsReportsEngineVersion: typeof CLAIMS_REPORTS_ENGINE_VERSION_V2;
  reportSchemaVersion: typeof REPORT_SCHEMA_VERSION_V2;
  reportPolicyVersion: typeof REPORT_POLICY_VERSION_V2;
  uncertaintyStatements: string[];
  reportIntegritySignature: string;
};

export type ClaimsReportsErrorCodeV2 =
  | "invalid_claims_input"
  | "invalid_stage5_analysis"
  | "invalid_stage5_comparison"
  | "cross_seed_reference"
  | "cross_ledger_reference"
  | "dangling_real_evidence"
  | "dangling_simulation_event"
  | "cross_trajectory_reference"
  | "missing_real_provenance"
  | "missing_simulation_provenance"
  | "unconfirmed_high_impact_assumption"
  | "version_mismatch"
  | "duplicate_id"
  | "invalid_id"
  | "invalid_report_input"
  | "unknown_claim_reference"
  | "claim_tampering"
  | "report_claim_escalation"
  | "probability_language_forbidden";
