import { z } from "zod";

import type { RealityBoundarySnapshotV2, WorldEventIdV2 } from "../agent-world/types";
import { extractTrajectoryFeatureV2 } from "../trajectory-analysis/feature-extraction";
import { clusterTrajectoryFeaturesV2 } from "../trajectory-analysis/clustering";
import { buildSimulationFrequencyV2 } from "../trajectory-analysis/simulation-frequency";
import { canonicalJsonV2 } from "../trajectory-analysis/ids";
import { parseBatchRunSpecV2 } from "../trajectory-analysis/validation";
import type { BatchAnalysisV2, TrajectoryClusterV2, TrajectoryFeatureV2 } from "../trajectory-analysis/types";

const analysisSchema = z.object({
  spec: z.unknown(),
  trajectories: z.array(z.unknown()).min(1).max(100),
  features: z.array(z.unknown()).min(1).max(100),
  clusters: z.array(z.unknown()).min(1).max(100),
  frequencies: z.array(z.unknown()).min(1).max(100),
  uncertaintyStatement: z.literal("This is sampled simulation frequency from fixed trajectory seeds, not a backtested real-world probability."),
}).strict();

function same(left: unknown, right: unknown) {
  return canonicalJsonV2(left) === canonicalJsonV2(right);
}

export function revalidateBatchAnalysisV2(input: unknown, boundary: RealityBoundarySnapshotV2) {
  try {
    const envelope = analysisSchema.safeParse(input);
    if (!envelope.success) return { ok: false as const, errorCode: "invalid_stage5_analysis" as const };
    const parsedSpec = parseBatchRunSpecV2(envelope.data.spec);
    if (!parsedSpec.ok) return { ok: false as const, errorCode: parsedSpec.errorCode === "cross_seed_reference" ? "cross_seed_reference" as const : parsedSpec.errorCode === "version_mismatch" ? "version_mismatch" as const : "invalid_stage5_analysis" as const };
    const spec = parsedSpec.value;
    if (spec.seedContextId !== boundary.seedContextId) return { ok: false as const, errorCode: "cross_seed_reference" as const };
    if (!same(spec.trajectoryTemplate.initialWorld.realityBoundarySnapshot, boundary)) return { ok: false as const, errorCode: "cross_ledger_reference" as const };
    if (
      envelope.data.trajectories.length !== spec.sampleCount ||
      envelope.data.features.length !== spec.sampleCount
    ) return { ok: false as const, errorCode: "invalid_stage5_analysis" as const };

    const features: TrajectoryFeatureV2[] = [];
    for (let index = 0; index < envelope.data.trajectories.length; index += 1) {
      const trajectory = envelope.data.trajectories[index];
      const extracted = extractTrajectoryFeatureV2(spec.trajectoryTemplate.initialWorld, trajectory, {
        seedContextId: spec.seedContextId,
        trajectorySeed: spec.trajectorySeeds[index],
        policyId: spec.policyId,
        policyVersion: spec.policyVersion,
        trajectoryEngineVersion: spec.trajectoryEngineVersion,
        batchRunSpec: spec,
      });
      if (!extracted.ok) return { ok: false as const, errorCode: "invalid_stage5_analysis" as const };
      if (!same(extracted.feature, envelope.data.features[index])) return { ok: false as const, errorCode: "invalid_stage5_analysis" as const };
      features.push(extracted.feature);
    }
    const clustered = clusterTrajectoryFeaturesV2(features);
    if (!clustered.ok || !same(clustered.clusters, envelope.data.clusters)) return { ok: false as const, errorCode: "invalid_stage5_analysis" as const };
    const frequency = buildSimulationFrequencyV2(clustered.clusters, features);
    if (!frequency.ok || !same(frequency.frequencies, envelope.data.frequencies) || frequency.uncertaintyStatement !== envelope.data.uncertaintyStatement) {
      return { ok: false as const, errorCode: "invalid_stage5_analysis" as const };
    }

    const trajectories = envelope.data.trajectories as BatchAnalysisV2["trajectories"];
    const byTrajectory = new Map(trajectories.map((item) => [item.trajectoryId, new Set(item.steps.flatMap((step) => step.worldEventId ? [step.worldEventId] : []))]));
    const realIds = new Set(boundary.evidenceLedger.items.map((item) => item.id));
    for (const cluster of clustered.clusters) {
      if (cluster.causalRealEvidenceIds.length === 0) return { ok: false as const, errorCode: "missing_real_provenance" as const };
      if (cluster.simulationEventIds.length === 0) return { ok: false as const, errorCode: "missing_simulation_provenance" as const };
      if (cluster.causalRealEvidenceIds.some((id) => !realIds.has(id))) return { ok: false as const, errorCode: "dangling_real_evidence" as const };
      const memberEvents = new Set<WorldEventIdV2>();
      for (const trajectoryId of cluster.memberTrajectoryIds) {
        const events = byTrajectory.get(trajectoryId);
        if (!events) return { ok: false as const, errorCode: "cross_trajectory_reference" as const };
        for (const id of events) memberEvents.add(id);
      }
      if (cluster.simulationEventIds.some((id) => !memberEvents.has(id))) return { ok: false as const, errorCode: "dangling_simulation_event" as const };
    }

    const analysis: BatchAnalysisV2 = {
      spec,
      trajectories: structuredClone(trajectories),
      features,
      clusters: clustered.clusters,
      frequencies: frequency.frequencies,
      uncertaintyStatement: frequency.uncertaintyStatement,
    };
    return { ok: true as const, analysis };
  } catch {
    return { ok: false as const, errorCode: "invalid_stage5_analysis" as const };
  }
}

export function clusterByIdV2(analysis: BatchAnalysisV2, clusterId: string): TrajectoryClusterV2 | undefined {
  return analysis.clusters.find((item) => item.clusterId === clusterId);
}
