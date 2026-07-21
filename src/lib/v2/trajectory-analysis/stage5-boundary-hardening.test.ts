import { describe, expect, it } from "vitest";

import { createStableAgentWorldIdFactoryV2 } from "../agent-world/ids";
import { idsV2 } from "../agent-world/test-fixtures";
import { executeTrajectoryV2 } from "../trajectory/trajectory-runner";
import { trajectoryPolicyFixtureV2, trajectoryRunSpecFixtureV2 } from "../trajectory/test-fixtures";
import { runTrajectoryBatchV2 } from "./batch-runner";
import { clusterTrajectoryFeaturesV2 } from "./clustering";
import { extractTrajectoryFeatureV2 } from "./feature-extraction";
import { canonicalJsonV2, stableAnalysisFingerprintV2 } from "./ids";
import { createLocalTrajectoryAnalysisAdapterV2 } from "./local-adapter";
import { compareSensitivityV2 } from "./sensitivity";
import { buildSimulationFrequencyV2 } from "./simulation-frequency";
import {
  ANALYSIS_ENGINE_VERSION_V2,
  CLUSTERING_ALGORITHM_V2,
  CLUSTERING_VERSION_V2,
  FEATURE_SCHEMA_VERSION_V2,
} from "./types";

function batchSpec(seeds = [7]) {
  const trajectoryTemplate = trajectoryRunSpecFixtureV2();
  return {
    analysisRunSpecId: "analysis_run_spec_v2_child_binding",
    seedContextId: trajectoryTemplate.seedContextId,
    trajectoryTemplate,
    trajectorySeeds: seeds,
    sampleCount: seeds.length,
    horizonDays: trajectoryTemplate.horizonDays,
    policyId: trajectoryTemplate.policyId,
    policyVersion: trajectoryTemplate.policyVersion,
    trajectoryEngineVersion: trajectoryTemplate.trajectoryEngineVersion,
    analysisEngineVersion: ANALYSIS_ENGINE_VERSION_V2,
    featureSchemaVersion: FEATURE_SCHEMA_VERSION_V2,
    clusteringAlgorithm: CLUSTERING_ALGORITHM_V2,
    clusteringVersion: CLUSTERING_VERSION_V2,
  } as const;
}

function adapter(calls?: { policy: number; trajectory: number; intervention: number }) {
  return createLocalTrajectoryAnalysisAdapterV2({
    policyFactory: () => {
      if (calls) calls.policy += 1;
      return trajectoryPolicyFixtureV2();
    },
    trajectoryRuntimeFactory: ({ seed }) => {
      if (calls) calls.trajectory += 1;
      return { agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`stage5-child-binding-${seed}`) };
    },
    interventionRuntimeFactory: ({ interventionId }) => {
      if (calls) calls.intervention += 1;
      return {
        clock: () => "2026-07-19T10:00:00.001Z",
        idFactory: createStableAgentWorldIdFactoryV2(`stage5-sensitivity-${interventionId}`),
      };
    },
  });
}

function boundContext(spec: ReturnType<typeof batchSpec>, seed = 7) {
  return {
    seedContextId: spec.seedContextId,
    trajectorySeed: seed,
    policyId: spec.policyId,
    policyVersion: spec.policyVersion,
    trajectoryEngineVersion: spec.trajectoryEngineVersion,
    batchRunSpec: spec,
  };
}

function executed() {
  const spec = batchSpec();
  const batch = runTrajectoryBatchV2(spec, adapter());
  if (!batch.ok) throw new Error(batch.errorCode);
  return { spec, trajectory: batch.trajectories[0]! };
}

function expectInvalidFeature(
  spec: ReturnType<typeof batchSpec>,
  trajectory: unknown,
  issuePath: string,
) {
  const result = extractTrajectoryFeatureV2(
    spec.trajectoryTemplate.initialWorld,
    trajectory,
    boundContext(spec),
  );
  expect(result).toMatchObject({ ok: false, errorCode: "invalid_feature_input" });
  expect(!result.ok && "issues" in result ? result.issues : []).toEqual(expect.arrayContaining([expect.stringContaining(issuePath)]));
}

function variableProposal(
  spec: ReturnType<typeof batchSpec>,
  targetId: typeof idsV2.promotionBudget | typeof idsV2.offerAvailability,
  value: number | string,
  overrides: Record<string, unknown> = {},
) {
  const world = spec.trajectoryTemplate.initialWorld;
  return {
    id: `action_proposal_v2_sensitivity_${String(value)}`,
    seedContextId: world.seedContextId,
    actorAgentId: idsV2.self,
    actionType: "update_external_variable",
    targetEntityIds: [],
    targetResourceIds: [],
    targetRelationIds: [],
    targetVariableIds: [targetId],
    parameters: { actionType: "update_external_variable", variableId: targetId, value },
    realEvidenceIds: [world.realityBoundarySnapshot.evidenceLedger.items[1]!.id],
    assumptionIds: [world.realityBoundarySnapshot.assumptionLedger.assumptions[0]!.id],
    priorWorldEventIds: [],
    rationaleSummary: "One controlled external-variable sensitivity change.",
    createdAt: "2026-07-19T10:00:00.001Z",
    ...overrides,
  };
}

describe("child TrajectoryRunSpec-bound Feature extraction", () => {
  it("accepts only a result bound to the shared deterministic child Run Spec", () => {
    const { spec, trajectory } = executed();
    expect(extractTrajectoryFeatureV2(
      spec.trajectoryTemplate.initialWorld,
      trajectory,
      boundContext(spec),
    )).toMatchObject({ ok: true });

    for (const [issuePath, mutate] of [
      ["trajectory.trajectoryId", (value: typeof trajectory) => { value.trajectoryId = "trajectory_v2_forged"; }],
      ["trajectory.runSpecId", (value: typeof trajectory) => { value.runSpecId = "trajectory_run_spec_v2_forged"; }],
      ["trajectory.horizonDays", (value: typeof trajectory) => { value.horizonDays = 90; }],
    ] as const) {
      const forged = structuredClone(trajectory);
      mutate(forged);
      expectInvalidFeature(spec, forged, issuePath);
    }
  });

  it("rejects a drifted start and non-canonical Tick schedule", () => {
    const { spec, trajectory } = executed();
    const executeForgedSchedule = (overrides: { startAt?: string; tickIntervalDays?: number }, salt: string) => {
      const result = executeTrajectoryV2({
        ...structuredClone(spec.trajectoryTemplate),
        runSpecId: trajectory.runSpecId,
        trajectoryId: trajectory.trajectoryId,
        trajectorySeed: 7,
        ...overrides,
      }, trajectoryPolicyFixtureV2(), {
        agentWorldIdFactory: createStableAgentWorldIdFactoryV2(salt),
      });
      if (!result.ok) throw new Error(result.errorCode);
      return result.trajectory;
    };
    expectInvalidFeature(spec, executeForgedSchedule({ startAt: "2026-07-20T10:00:00.000Z" }, "stage5-drifted-start"), "trajectory.startedAt");
    expectInvalidFeature(spec, executeForgedSchedule({ tickIntervalDays: 2 }, "stage5-drifted-interval"), "trajectory.steps.1.occurredAt");
  });

  it("rejects completed results shorter than maxTicks while allowing bounded no_actions", () => {
    const { spec, trajectory } = executed();
    const shortSpec = {
      ...structuredClone(spec.trajectoryTemplate),
      runSpecId: trajectory.runSpecId,
      trajectoryId: trajectory.trajectoryId,
      trajectorySeed: 7,
      maxTicks: 2,
    };
    const short = executeTrajectoryV2(shortSpec, trajectoryPolicyFixtureV2(), {
      agentWorldIdFactory: createStableAgentWorldIdFactoryV2("stage5-short-completed"),
    });
    if (!short.ok) throw new Error(short.errorCode);
    expectInvalidFeature(spec, short.trajectory, "trajectory.steps");

    const noActions = createLocalTrajectoryAnalysisAdapterV2({
      ...adapter(),
      policyFactory: () => trajectoryPolicyFixtureV2({ candidateCount: 0 }),
    });
    const batch = runTrajectoryBatchV2(spec, noActions);
    if (!batch.ok) throw new Error(batch.errorCode);
    expect(extractTrajectoryFeatureV2(
      spec.trajectoryTemplate.initialWorld,
      batch.trajectories[0],
      boundContext(spec),
    )).toMatchObject({ ok: true, feature: { terminalStatus: "no_actions" } });
  });
});

describe("canonical Feature integrity", () => {
  function feature() {
    const { spec, trajectory } = executed();
    const result = extractTrajectoryFeatureV2(
      spec.trajectoryTemplate.initialWorld,
      trajectory,
      boundContext(spec),
    );
    if (!result.ok) throw new Error(result.errorCode);
    return result.feature;
  }

  it("rejects outcome payloads outside the strict canonical schema", () => {
    const value = feature();
    const payload = { ...JSON.parse(value.outcomeSignature), untrusted: true };
    const forged = {
      ...value,
      outcomeSignature: canonicalJsonV2(payload),
      featureSignature: stableAnalysisFingerprintV2(payload),
    };
    expect(clusterTrajectoryFeaturesV2([forged])).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
  });

  it("recomputes all disclosed and clustered derived fields from canonical integrity data", () => {
    const value = feature();
    const mutations = [
      { ...value, terminalStatus: "no_actions" as const },
      { ...value, executedTickCount: value.executedTickCount + 1 },
      { ...value, revisionDelta: value.revisionDelta + 1 },
      { ...value, simulationEventCount: value.simulationEventCount + 1 },
      { ...value, operationSequence: [...value.operationSequence, "forged"] },
      { ...value, affectedEntityIds: [idsV2.currentCompany] },
      { ...value, causalRealEvidenceIds: [batchSpec().trajectoryTemplate.initialWorld.realityBoundarySnapshot.evidenceLedger.items[1]!.id] },
      { ...value, causalAssumptionIds: [batchSpec().trajectoryTemplate.initialWorld.realityBoundarySnapshot.assumptionLedger.assumptions[0]!.id] },
      { ...value, inputAssumptionIds: [] },
    ];
    for (const forged of mutations) {
      expect(clusterTrajectoryFeaturesV2([forged])).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
    }
  });

  it("does not let Frequency accept a Feature whose disclosed provenance was rewritten", () => {
    const value = feature();
    const forged = { ...value, affectedVariableIds: [idsV2.offerAvailability] };
    const forgedClusters = clusterTrajectoryFeaturesV2([forged]);
    expect(forgedClusters).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
    const originalClusters = clusterTrajectoryFeaturesV2([value]);
    if (!originalClusters.ok) throw new Error(originalClusters.errorCode);
    expect(buildSimulationFrequencyV2(originalClusters.clusters, [forged])).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
  });
});

describe("controlled Sensitivity no-op and metadata boundary", () => {
  it.each([
    [idsV2.promotionBudget, 50],
    [idsV2.offerAvailability, "open"],
  ] as const)("rejects a same-value %s change before any factory is called (%s)", (targetId, value) => {
    const spec = batchSpec();
    const calls = { policy: 0, trajectory: 0, intervention: 0 };
    const result = compareSensitivityV2({
      sensitivityAnalysisId: `sensitivity_analysis_v2_noop_${String(value)}`,
      baseline: spec,
      variants: [{
        variantId: `sensitivity_variant_v2_noop_${String(value)}`,
        axis: { kind: "external_variable", targetId, variantValue: value },
        proposal: variableProposal(spec, targetId, value),
      }],
    }, adapter(calls));
    expect(result).toMatchObject({ ok: false, errorCode: "uncontrolled_sensitivity_change", failedVariantIndex: 0 });
    expect(result).not.toHaveProperty("baseline");
    expect(result).not.toHaveProperty("variants");
    expect(calls).toEqual({ policy: 0, trajectory: 0, intervention: 0 });
  });

  it("rejects cross-variant actor and provenance drift before executing any variant", () => {
    const spec = batchSpec();
    const calls = { policy: 0, trajectory: 0, intervention: 0 };
    const second = variableProposal(spec, idsV2.promotionBudget, 70, {
      id: "action_proposal_v2_sensitivity_70_metadata_drift",
      actorAgentId: idsV2.manager,
      realEvidenceIds: [spec.trajectoryTemplate.initialWorld.realityBoundarySnapshot.evidenceLedger.items[0]!.id],
      assumptionIds: [],
    });
    const result = compareSensitivityV2({
      sensitivityAnalysisId: "sensitivity_analysis_v2_metadata_drift",
      baseline: spec,
      variants: [
        {
          variantId: "sensitivity_variant_v2_metadata_60",
          axis: { kind: "external_variable", targetId: idsV2.promotionBudget, variantValue: 60 },
          proposal: variableProposal(spec, idsV2.promotionBudget, 60),
        },
        {
          variantId: "sensitivity_variant_v2_metadata_70",
          axis: { kind: "external_variable", targetId: idsV2.promotionBudget, variantValue: 70 },
          proposal: second,
        },
      ],
    }, adapter(calls));
    expect(result).toMatchObject({ ok: false, errorCode: "uncontrolled_sensitivity_change", failedVariantIndex: 1 });
    expect(calls).toEqual({ policy: 0, trajectory: 0, intervention: 0 });
  });
});
