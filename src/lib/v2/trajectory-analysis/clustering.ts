import { canonicalJsonV2, stableAnalysisFingerprintV2, trajectoryClusterIdV2 } from "./ids";
import { parseTrajectoryFeatureIntegrityV2 } from "./feature-integrity";
import {
  CLUSTERING_ALGORITHM_V2,
  CLUSTERING_VERSION_V2,
  type TrajectoryClusterV2,
  type TrajectoryFeatureV2,
} from "./types";

const uniqueSorted = <T extends string>(values: T[]) => [...new Set(values)].sort() as T[];

export function clusterTrajectoryFeaturesV2(featuresInput: unknown) {
  try {
    if (!Array.isArray(featuresInput) || featuresInput.length === 0) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const parsedFeatures = featuresInput.map((item) => parseTrajectoryFeatureIntegrityV2(item));
    if (parsedFeatures.some((item) => item === null)) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const features = parsedFeatures as TrajectoryFeatureV2[];
    if (new Set(features.map((item) => item.trajectoryId)).size !== features.length || new Set(features.map((item) => item.trajectorySeed)).size !== features.length) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const first = features[0]!;
    if (features.some((item) => item.seedContextId !== first.seedContextId || item.policyId !== first.policyId || item.policyVersion !== first.policyVersion || item.trajectoryEngineVersion !== first.trajectoryEngineVersion || item.agentWorldEngineVersion !== first.agentWorldEngineVersion || item.realityBoundaryRevision !== first.realityBoundaryRevision || canonicalJsonV2(item.inputAssumptionIds) !== canonicalJsonV2(first.inputAssumptionIds))) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const groups = new Map<string, TrajectoryFeatureV2[]>();
    for (const feature of features) groups.set(feature.outcomeSignature, [...(groups.get(feature.outcomeSignature) ?? []), feature]);
    const clusters: TrajectoryClusterV2[] = [...groups.entries()].map(([outcomeSignature, members]) => {
      const ordered = [...members].sort((a, b) => a.trajectorySeed - b.trajectorySeed || a.trajectoryId.localeCompare(b.trajectoryId));
      const featureSignature = stableAnalysisFingerprintV2(JSON.parse(outcomeSignature));
      return {
        clusterId: trajectoryClusterIdV2(outcomeSignature),
        seedContextId: first.seedContextId,
        featureSignature,
        outcomeSignature,
        representativeTrajectoryId: ordered[0]!.trajectoryId,
        memberTrajectoryIds: ordered.map((item) => item.trajectoryId),
        memberTrajectorySeeds: ordered.map((item) => item.trajectorySeed),
        simulationEventIds: uniqueSorted(ordered.flatMap((item) => item.simulationEventIds)),
        causalRealEvidenceIds: uniqueSorted(ordered.flatMap((item) => item.causalRealEvidenceIds)),
        causalAssumptionIds: uniqueSorted(ordered.flatMap((item) => item.causalAssumptionIds)),
        inputAssumptionIds: uniqueSorted(ordered.flatMap((item) => item.inputAssumptionIds)),
        clusteringAlgorithm: CLUSTERING_ALGORITHM_V2,
        clusteringVersion: CLUSTERING_VERSION_V2,
      };
    }).sort((a, b) => a.clusterId.localeCompare(b.clusterId));
    return { ok: true as const, clusters };
  } catch {
    return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
  }
}
