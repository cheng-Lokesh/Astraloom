import { executeTrajectoryV2 } from "../trajectory/trajectory-runner";
import { buildChildTrajectoryRunSpecV2 } from "./child-run-spec";
import { deepFreezeCloneV2 } from "./immutable";
import type { BatchAnalysisV2, TrajectoryAnalysisAdapterV2 } from "./types";
import { parseBatchRunSpecV2 } from "./validation";
import { extractTrajectoryFeatureV2 } from "./feature-extraction";
import { clusterTrajectoryFeaturesV2 } from "./clustering";
import { buildSimulationFrequencyV2 } from "./simulation-frequency";

export function runTrajectoryBatchV2(input: unknown, adapter: TrajectoryAnalysisAdapterV2) {
  const parsed = parseBatchRunSpecV2(input);
  if (!parsed.ok) return parsed;
  const spec = parsed.value;
  const trajectories = [];
  for (let childIndex = 0; childIndex < spec.trajectorySeeds.length; childIndex += 1) {
    const seed = spec.trajectorySeeds[childIndex]!;
    const childSpec = buildChildTrajectoryRunSpecV2(spec, seed);
    let policy;
    let runtime;
    try {
      policy = adapter.policyFactory(deepFreezeCloneV2({ seed, childIndex, spec }));
      runtime = adapter.trajectoryRuntimeFactory(deepFreezeCloneV2({ seed, childIndex, spec }));
    } catch {
      return { ok: false as const, errorCode: "child_trajectory_failed" as const, failedIndex: childIndex, failedSeed: seed, causeCode: "factory_failed" };
    }
    const child = executeTrajectoryV2(childSpec, policy, runtime);
    if (!child.ok) return { ok: false as const, errorCode: "child_trajectory_failed" as const, failedIndex: childIndex, failedSeed: seed, causeCode: child.errorCode };
    trajectories.push(child.trajectory);
  }
  return { ok: true as const, spec: structuredClone(spec), trajectories };
}

export function analyzeTrajectoryBatchV2(input: unknown, adapter: TrajectoryAnalysisAdapterV2) {
  const batch = runTrajectoryBatchV2(input, adapter);
  if (!batch.ok) return batch;
  const features = [];
  for (const trajectory of batch.trajectories) {
    const extracted = extractTrajectoryFeatureV2(
      batch.spec.trajectoryTemplate.initialWorld,
      trajectory,
      {
        seedContextId: batch.spec.seedContextId,
        trajectorySeed: trajectory.trajectorySeed,
        policyId: batch.spec.policyId,
        policyVersion: batch.spec.policyVersion,
        trajectoryEngineVersion: batch.spec.trajectoryEngineVersion,
        batchRunSpec: batch.spec,
      },
    );
    if (!extracted.ok) return extracted;
    features.push(extracted.feature);
  }
  const clustered = clusterTrajectoryFeaturesV2(features);
  if (!clustered.ok) return clustered;
  const frequency = buildSimulationFrequencyV2(clustered.clusters, features);
  if (!frequency.ok) return frequency;
  const analysis: BatchAnalysisV2 = { spec: batch.spec, trajectories: batch.trajectories, features, clusters: clustered.clusters, frequencies: frequency.frequencies, uncertaintyStatement: frequency.uncertaintyStatement };
  return { ok: true as const, analysis };
}
