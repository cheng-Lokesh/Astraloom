import { ANALYSIS_ENGINE_VERSION_V2, CLUSTERING_ALGORITHM_V2, CLUSTERING_VERSION_V2, FEATURE_SCHEMA_VERSION_V2, type SimulationFrequencyItemV2, type TrajectoryClusterV2, type TrajectoryFeatureV2 } from "./types";
import { clusterTrajectoryFeaturesV2 } from "./clustering";
import { canonicalJsonV2 } from "./ids";

export function buildSimulationFrequencyV2(clustersInput: readonly TrajectoryClusterV2[], featuresInput: readonly TrajectoryFeatureV2[]) {
  try {
    if (!Array.isArray(featuresInput) || featuresInput.length === 0) return { ok: false as const, errorCode: "frequency_without_samples" as const };
    if (!Array.isArray(clustersInput) || clustersInput.length === 0) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const features = featuresInput.map((item) => structuredClone(item));
    const clusters: TrajectoryClusterV2[] = clustersInput.map((item) => structuredClone(item));
    const canonicalClusters = clusterTrajectoryFeaturesV2(features);
    if (!canonicalClusters.ok || canonicalJsonV2(canonicalClusters.clusters) !== canonicalJsonV2(clusters)) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const first = features[0]!;
    if (features.some((item) => item.seedContextId !== first.seedContextId || item.trajectoryEngineVersion !== first.trajectoryEngineVersion || item.policyVersion !== first.policyVersion || item.featureSchemaVersion !== FEATURE_SCHEMA_VERSION_V2 || item.analysisEngineVersion !== ANALYSIS_ENGINE_VERSION_V2 || item.realityBoundaryRevision !== first.realityBoundaryRevision)) return { ok: false as const, errorCode: "version_mismatch" as const };
    const frequencies: SimulationFrequencyItemV2[] = clusters.map((cluster) => ({
      clusterId: cluster.clusterId,
      numerator: cluster.memberTrajectoryIds.length,
      denominator: features.length,
      totalSampleCount: features.length,
      trajectorySeeds: [...cluster.memberTrajectorySeeds],
      trajectoryEngineVersion: first.trajectoryEngineVersion,
      analysisEngineVersion: ANALYSIS_ENGINE_VERSION_V2,
      policyVersion: first.policyVersion,
      featureSchemaVersion: FEATURE_SCHEMA_VERSION_V2,
      clusteringAlgorithm: CLUSTERING_ALGORITHM_V2,
      clusteringVersion: CLUSTERING_VERSION_V2,
      realityBoundaryRevision: first.realityBoundaryRevision,
      assumptionIds: [...cluster.inputAssumptionIds],
      inputAssumptionIds: [...cluster.inputAssumptionIds],
      causalAssumptionIds: [...cluster.causalAssumptionIds],
    }));
    if (frequencies.reduce((sum, item) => sum + item.numerator, 0) !== features.length || frequencies.some((item) => item.denominator !== features.length)) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    return { ok: true as const, frequencies, uncertaintyStatement: "This is sampled simulation frequency from fixed trajectory seeds, not a backtested real-world probability." as const };
  } catch {
    return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
  }
}
