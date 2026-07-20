import { stableAnalysisFingerprintV2, trajectoryClusterIdV2 } from "./ids";
import { ANALYSIS_ENGINE_VERSION_V2, CLUSTERING_ALGORITHM_V2, CLUSTERING_VERSION_V2, FEATURE_SCHEMA_VERSION_V2, type TrajectoryClusterV2, type TrajectoryFeatureV2 } from "./types";

const uniqueSorted = <T extends string>(values: T[]) => [...new Set(values)].sort() as T[];

export function clusterTrajectoryFeaturesV2(featuresInput: readonly TrajectoryFeatureV2[]) {
  try {
    if (!Array.isArray(featuresInput) || featuresInput.length === 0) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const features = featuresInput.map((item) => structuredClone(item));
    if (new Set(features.map((item) => item.trajectoryId)).size !== features.length || new Set(features.map((item) => item.trajectorySeed)).size !== features.length) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const seedContextId = features[0]!.seedContextId;
    if (features.some((item) => {
      if (item.seedContextId !== seedContextId || !item.featureSignature || !item.outcomeSignature || item.analysisEngineVersion !== ANALYSIS_ENGINE_VERSION_V2 || item.featureSchemaVersion !== FEATURE_SCHEMA_VERSION_V2) return true;
      try { return stableAnalysisFingerprintV2(JSON.parse(item.outcomeSignature)) !== item.featureSignature; } catch { return true; }
    })) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const groups = new Map<string, TrajectoryFeatureV2[]>();
    for (const feature of features) groups.set(feature.featureSignature, [...(groups.get(feature.featureSignature) ?? []), feature]);
    const clusters: TrajectoryClusterV2[] = [...groups.entries()].map(([signature, members]) => {
      const ordered = [...members].sort((a, b) => a.trajectorySeed - b.trajectorySeed || a.trajectoryId.localeCompare(b.trajectoryId));
      return {
        clusterId: trajectoryClusterIdV2(signature),
        seedContextId,
        featureSignature: signature,
        representativeTrajectoryId: ordered[0]!.trajectoryId,
        memberTrajectoryIds: ordered.map((item) => item.trajectoryId),
        memberTrajectorySeeds: ordered.map((item) => item.trajectorySeed),
        simulationEventIds: uniqueSorted(ordered.flatMap((item) => item.simulationEventIds)),
        causalRealEvidenceIds: uniqueSorted(ordered.flatMap((item) => item.causalRealEvidenceIds)),
        causalAssumptionIds: uniqueSorted(ordered.flatMap((item) => item.causalAssumptionIds)),
        clusteringAlgorithm: CLUSTERING_ALGORITHM_V2,
        clusteringVersion: CLUSTERING_VERSION_V2,
      };
    }).sort((a, b) => a.clusterId.localeCompare(b.clusterId));
    return { ok: true as const, clusters };
  } catch {
    return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
  }
}
