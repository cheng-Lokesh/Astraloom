import { canonicalJsonV2, stableAnalysisFingerprintV2, trajectoryClusterIdV2 } from "./ids";
import {
  ANALYSIS_ENGINE_VERSION_V2,
  CLUSTERING_ALGORITHM_V2,
  CLUSTERING_VERSION_V2,
  FEATURE_SCHEMA_VERSION_V2,
  type TrajectoryClusterV2,
  type TrajectoryFeatureV2,
} from "./types";

const featureKeys = [
  "affectedEntityIds", "affectedRelationIds", "affectedResourceIds", "affectedVariableIds",
  "agentWorldEngineVersion", "analysisEngineVersion", "causalAssumptionIds", "causalRealEvidenceIds",
  "executedTickCount", "featureSchemaVersion", "featureSignature", "inputAssumptionIds",
  "operationSequence", "outcomeSignature", "policyId", "policyVersion", "realityBoundaryRevision",
  "revisionDelta", "seedContextId", "simulationEventCount", "simulationEventIds", "terminalStatus",
  "trajectoryEngineVersion", "trajectoryId", "trajectorySeed",
].sort();

const uniqueSorted = <T extends string>(values: T[]) => [...new Set(values)].sort() as T[];
const isSortedUnique = (values: string[]) => canonicalJsonV2(values) === canonicalJsonV2(uniqueSorted(values));

function validFeature(feature: TrajectoryFeatureV2) {
  if (!feature || typeof feature !== "object" || canonicalJsonV2(Object.keys(feature).sort()) !== canonicalJsonV2(featureKeys)) return false;
  if (!Number.isInteger(feature.trajectorySeed) || feature.trajectorySeed < 0 || feature.trajectorySeed > 0xffff_ffff) return false;
  if (!/^trajectory_v2_[a-z0-9][a-z0-9_-]*$/.test(feature.trajectoryId) || !feature.seedContextId) return false;
  if (feature.analysisEngineVersion !== ANALYSIS_ENGINE_VERSION_V2 || feature.featureSchemaVersion !== FEATURE_SCHEMA_VERSION_V2 || feature.trajectoryEngineVersion !== "trajectory-engine-v2-stage-4") return false;
  try {
    const parsedOutcome = JSON.parse(feature.outcomeSignature);
    if (canonicalJsonV2(parsedOutcome) !== feature.outcomeSignature || stableAnalysisFingerprintV2(parsedOutcome) !== feature.featureSignature) return false;
  } catch { return false; }
  const sets = [feature.affectedEntityIds, feature.affectedResourceIds, feature.affectedRelationIds, feature.affectedVariableIds, feature.causalRealEvidenceIds, feature.causalAssumptionIds, feature.inputAssumptionIds];
  if (sets.some((items) => !Array.isArray(items) || !isSortedUnique(items))) return false;
  if (
    feature.simulationEventIds.some((id) => !/^world_event_v2_[a-z0-9][a-z0-9_-]*$/.test(id)) ||
    feature.causalRealEvidenceIds.some((id) => !/^real_evidence_v2_[a-z0-9][a-z0-9_-]*$/.test(id)) ||
    [...feature.causalAssumptionIds, ...feature.inputAssumptionIds].some((id) => !/^assumption_v2_[a-z0-9][a-z0-9_-]*$/.test(id))
  ) return false;
  return new Set(feature.simulationEventIds).size === feature.simulationEventIds.length && feature.revisionDelta === feature.simulationEventCount && feature.simulationEventCount === feature.simulationEventIds.length && feature.operationSequence.length === feature.simulationEventCount;
}

export function clusterTrajectoryFeaturesV2(featuresInput: readonly TrajectoryFeatureV2[]) {
  try {
    if (!Array.isArray(featuresInput) || featuresInput.length === 0) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
    const features = featuresInput.map((item) => structuredClone(item));
    if (features.some((item) => !validFeature(item))) return { ok: false as const, errorCode: "invalid_cluster_membership" as const };
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
