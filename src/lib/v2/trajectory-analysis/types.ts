import type { ActionProposalInputV2, AgentWorldRuntimeV2, WorldEventIdV2, WorldStateV2 } from "../agent-world/types";
import type { AssumptionIdV2, EvidenceLedgerV2, RealEvidenceIdV2 } from "../reality-boundary/types";
import type { TrajectoryPolicyV2, TrajectoryResultV2, TrajectoryRuntimeV2, TrajectoryRunSpecV2 } from "../trajectory/types";

export const ANALYSIS_ENGINE_VERSION_V2 = "trajectory-analysis-engine-v2-stage-5" as const;
export const FEATURE_SCHEMA_VERSION_V2 = "trajectory-feature-v2.2" as const;
export const CLUSTERING_ALGORITHM_V2 = "exact_outcome_signature" as const;
export const CLUSTERING_VERSION_V2 = "1" as const;
export const MAX_TRAJECTORY_SAMPLES_V2 = 100 as const;

export type AnalysisErrorCodeV2 =
  | "invalid_analysis_run_spec"
  | "duplicate_trajectory_seed"
  | "cross_seed_reference"
  | "version_mismatch"
  | "child_trajectory_failed"
  | "invalid_feature_input"
  | "invalid_cluster_membership"
  | "frequency_without_samples"
  | "incomparable_variant"
  | "uncontrolled_sensitivity_change"
  | "invalid_intervention"
  | "intervention_approval_failed"
  | "intervention_transition_failed";

export type AnalysisRunSpecIdV2 = `analysis_run_spec_v2_${string}`;

export type BatchRunSpecV2 = {
  analysisRunSpecId: AnalysisRunSpecIdV2;
  seedContextId: string;
  trajectoryTemplate: TrajectoryRunSpecV2;
  trajectorySeeds: number[];
  sampleCount: number;
  horizonDays: 30 | 90;
  policyId: string;
  policyVersion: string;
  trajectoryEngineVersion: TrajectoryRunSpecV2["trajectoryEngineVersion"];
  analysisEngineVersion: typeof ANALYSIS_ENGINE_VERSION_V2;
  featureSchemaVersion: typeof FEATURE_SCHEMA_VERSION_V2;
  clusteringAlgorithm: typeof CLUSTERING_ALGORITHM_V2;
  clusteringVersion: typeof CLUSTERING_VERSION_V2;
};

export type TrajectoryAnalysisAdapterV2 = {
  policyFactory: (input: { seed: number; childIndex: number; spec: Readonly<BatchRunSpecV2> }) => TrajectoryPolicyV2;
  trajectoryRuntimeFactory: (input: { seed: number; childIndex: number; spec: Readonly<BatchRunSpecV2> }) => TrajectoryRuntimeV2;
  interventionRuntimeFactory: (input: { interventionId: string; variantIndex: number; spec: Readonly<BatchRunSpecV2> }) => AgentWorldRuntimeV2;
};

export type TrajectoryFeatureV2 = {
  seedContextId: string;
  trajectoryId: TrajectoryResultV2["trajectoryId"];
  trajectorySeed: number;
  terminalStatus: TrajectoryResultV2["status"];
  executedTickCount: number;
  revisionDelta: number;
  simulationEventCount: number;
  operationSequence: string[];
  affectedEntityIds: string[];
  affectedResourceIds: string[];
  affectedRelationIds: string[];
  affectedVariableIds: string[];
  outcomeSignature: string;
  featureSignature: string;
  featureIntegritySignature: string;
  simulationEventIds: WorldEventIdV2[];
  causalRealEvidenceIds: RealEvidenceIdV2[];
  causalAssumptionIds: AssumptionIdV2[];
  inputAssumptionIds: AssumptionIdV2[];
  trajectoryEngineVersion: TrajectoryResultV2["trajectoryEngineVersion"];
  agentWorldEngineVersion: TrajectoryResultV2["agentWorldEngineVersion"];
  policyId: string;
  policyVersion: string;
  analysisEngineVersion: typeof ANALYSIS_ENGINE_VERSION_V2;
  featureSchemaVersion: typeof FEATURE_SCHEMA_VERSION_V2;
  realityBoundaryRevision: number;
};

export type TrajectoryClusterV2 = {
  clusterId: `trajectory_cluster_v2_${string}`;
  seedContextId: string;
  featureSignature: string;
  outcomeSignature: string;
  representativeTrajectoryId: TrajectoryResultV2["trajectoryId"];
  memberTrajectoryIds: TrajectoryResultV2["trajectoryId"][];
  memberTrajectorySeeds: number[];
  simulationEventIds: WorldEventIdV2[];
  causalRealEvidenceIds: RealEvidenceIdV2[];
  causalAssumptionIds: AssumptionIdV2[];
  inputAssumptionIds: AssumptionIdV2[];
  clusteringAlgorithm: typeof CLUSTERING_ALGORITHM_V2;
  clusteringVersion: typeof CLUSTERING_VERSION_V2;
};

export type SimulationFrequencyItemV2 = {
  clusterId: TrajectoryClusterV2["clusterId"];
  numerator: number;
  denominator: number;
  totalSampleCount: number;
  trajectorySeeds: number[];
  trajectoryEngineVersion: string;
  analysisEngineVersion: typeof ANALYSIS_ENGINE_VERSION_V2;
  policyVersion: string;
  featureSchemaVersion: typeof FEATURE_SCHEMA_VERSION_V2;
  clusteringAlgorithm: typeof CLUSTERING_ALGORITHM_V2;
  clusteringVersion: typeof CLUSTERING_VERSION_V2;
  realityBoundaryRevision: number;
  assumptionIds: AssumptionIdV2[];
  inputAssumptionIds: AssumptionIdV2[];
  causalAssumptionIds: AssumptionIdV2[];
};

export type BatchAnalysisV2 = {
  spec: BatchRunSpecV2;
  trajectories: TrajectoryResultV2[];
  features: TrajectoryFeatureV2[];
  clusters: TrajectoryClusterV2[];
  frequencies: SimulationFrequencyItemV2[];
  uncertaintyStatement: string;
};

export type SensitivityAxisV2 = {
  kind: "external_variable";
  targetId: string;
  variantValue: number | string;
};

export type SensitivityAxisResultV2 = SensitivityAxisV2 & {
  baselineValue: number | string;
};

export type PairedSeedDifferenceV2 = {
  trajectorySeed: number;
  baselineFeatureSignature: string;
  variantFeatureSignature: string;
  changed: boolean;
};

export type SensitivityComparisonInputV2 = {
  sensitivityAnalysisId: `sensitivity_analysis_v2_${string}`;
  baseline: BatchRunSpecV2;
  variants: Array<{
    variantId: `sensitivity_variant_v2_${string}`;
    axis: SensitivityAxisV2;
    proposal: ActionProposalInputV2;
  }>;
};

export type InterventionComparisonInputV2 = {
  interventionComparisonId: `intervention_comparison_v2_${string}`;
  baseline: BatchRunSpecV2;
  variants: Array<{
    variantId: `intervention_variant_v2_${string}`;
    intervention: ActionProposalInputV2;
  }>;
};

export type InterventionVariantResultV2 = {
  variantId: string;
  interventionEventId: WorldEventIdV2;
  interventionWorldRevision: number;
  spec: BatchRunSpecV2;
  analysis: BatchAnalysisV2;
  pairedSeedDifferences: PairedSeedDifferenceV2[];
  realEvidenceLedgerAfter: EvidenceLedgerV2;
};

export type InitialWorldCarrierV2 = { trajectoryTemplate: { initialWorld: WorldStateV2 } };
