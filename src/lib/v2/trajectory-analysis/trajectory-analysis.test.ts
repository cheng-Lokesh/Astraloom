import { describe, expect, it } from "vitest";

import { idsV2 } from "../agent-world/test-fixtures";
import { createStableAgentWorldIdFactoryV2 } from "../agent-world/ids";
import { trajectoryPolicyFixtureV2, trajectoryRunSpecFixtureV2 } from "../trajectory/test-fixtures";
import { createLocalTrajectoryAnalysisAdapterV2 } from "./local-adapter";
import { analyzeTrajectoryBatchV2, runTrajectoryBatchV2 } from "./batch-runner";
import { clusterTrajectoryFeaturesV2 } from "./clustering";
import { extractTrajectoryFeatureV2 } from "./feature-extraction";
import { buildSimulationFrequencyV2 } from "./simulation-frequency";
import { compareSensitivityV2 } from "./sensitivity";
import { comparePreRunInterventionsV2 } from "./intervention-comparison";
import { ANALYSIS_ENGINE_VERSION_V2, FEATURE_SCHEMA_VERSION_V2, CLUSTERING_ALGORITHM_V2, CLUSTERING_VERSION_V2 } from "./types";

function adapter() {
  return createLocalTrajectoryAnalysisAdapterV2({
    policyFactory: () => trajectoryPolicyFixtureV2(),
    trajectoryRuntimeFactory: ({ seed }) => ({
      agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`stage-5-child-${seed}`),
    }),
    interventionRuntimeFactory: ({ interventionId }) => ({
      clock: () => "2026-07-19T10:00:00.001Z",
      idFactory: createStableAgentWorldIdFactoryV2(`stage-5-intervention-${interventionId}`),
    }),
  });
}

function batchSpec(seeds = [7, 11, 19]) {
  const template = trajectoryRunSpecFixtureV2();
  return {
    analysisRunSpecId: "analysis_run_spec_v2_fixture",
    seedContextId: template.seedContextId,
    trajectoryTemplate: template,
    trajectorySeeds: seeds,
    sampleCount: seeds.length,
    horizonDays: template.horizonDays,
    policyId: template.policyId,
    policyVersion: template.policyVersion,
    trajectoryEngineVersion: template.trajectoryEngineVersion,
    analysisEngineVersion: ANALYSIS_ENGINE_VERSION_V2,
    featureSchemaVersion: FEATURE_SCHEMA_VERSION_V2,
    clusteringAlgorithm: CLUSTERING_ALGORITHM_V2,
    clusteringVersion: CLUSTERING_VERSION_V2,
  } as const;
}

function featureContext(seed: number, spec = batchSpec([seed])) {
  return { seedContextId: spec.seedContextId, trajectorySeed: seed, policyId: spec.policyId, policyVersion: spec.policyVersion, trajectoryEngineVersion: spec.trajectoryEngineVersion, batchRunSpec: spec };
}

function sensitivityProposal(spec: ReturnType<typeof batchSpec>, value: number) {
  const world = spec.trajectoryTemplate.initialWorld;
  return {
    id: "action_proposal_v2_sensitivity_fixture",
    seedContextId: world.seedContextId,
    actorAgentId: idsV2.self,
    actionType: "update_external_variable",
    targetEntityIds: [], targetResourceIds: [], targetRelationIds: [], targetVariableIds: [idsV2.promotionBudget],
    parameters: { actionType: "update_external_variable", variableId: idsV2.promotionBudget, value },
    realEvidenceIds: [world.realityBoundarySnapshot.evidenceLedger.items[1]!.id],
    assumptionIds: [world.realityBoundarySnapshot.assumptionLedger.assumptions[0]!.id],
    priorWorldEventIds: [], rationaleSummary: "Controlled sensitivity proposal.", createdAt: "2026-07-19T10:00:00.001Z",
  } as const;
}

describe("Stage 5 strict batch execution", () => {
  it("rejects malformed, unknown, duplicate, non-uint32, empty, and count-mismatched inputs without throwing", () => {
    const inputs = [
      null,
      { ...batchSpec(), surprise: true },
      batchSpec([7, 7]),
      batchSpec([-1]),
      batchSpec([]),
      { ...batchSpec(), sampleCount: 99 },
    ];
    for (const input of inputs) {
      expect(() => runTrajectoryBatchV2(input, adapter())).not.toThrow();
      expect(runTrajectoryBatchV2(input, adapter()).ok).toBe(false);
    }
    expect(runTrajectoryBatchV2(batchSpec([7, 7]), adapter())).toMatchObject({ ok: false, errorCode: "duplicate_trajectory_seed" });
  });

  it("is reproducible and canonical regardless of seed input order", () => {
    const first = runTrajectoryBatchV2(batchSpec([19, 7, 11]), adapter());
    const second = runTrajectoryBatchV2(batchSpec([7, 11, 19]), adapter());
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.trajectories.map((item) => item.trajectorySeed)).toEqual([7, 11, 19]);
    expect(new Set(first.trajectories.map((item) => item.trajectoryId)).size).toBe(3);
    expect(first.trajectories.every((item) => item.runSpecId.startsWith("trajectory_run_spec_v2_stage5_"))).toBe(true);
  });

  it("fails atomically when any child trajectory fails", () => {
    const failingAdapter = createLocalTrajectoryAnalysisAdapterV2({
      policyFactory: ({ seed }) => seed === 11 ? trajectoryPolicyFixtureV2({ invalidAmount: 999 }) : trajectoryPolicyFixtureV2(),
      trajectoryRuntimeFactory: ({ seed }) => ({ agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`atomic-${seed}`) }),
      interventionRuntimeFactory: ({ interventionId }) => ({ clock: () => "2026-07-19T10:00:00.001Z", idFactory: createStableAgentWorldIdFactoryV2(interventionId) }),
    });
    const result = runTrajectoryBatchV2(batchSpec(), failingAdapter);
    expect(result).toMatchObject({ ok: false, errorCode: "child_trajectory_failed", failedSeed: 11 });
    expect(result).not.toHaveProperty("trajectories");
    expect(result).not.toHaveProperty("clusters");
    expect(result).not.toHaveProperty("frequency");
  });

  it("maps cross-seed, version, and factory failures to stable analysis errors", () => {
    const crossSeed = { ...structuredClone(batchSpec([7])), seedContextId: "seed_other" };
    expect(runTrajectoryBatchV2(crossSeed, adapter())).toMatchObject({ ok: false, errorCode: "cross_seed_reference" });
    const drift = { ...batchSpec([7]), policyVersion: "drift" };
    expect(runTrajectoryBatchV2(drift, adapter())).toMatchObject({ ok: false, errorCode: "version_mismatch" });
    expect(runTrajectoryBatchV2({ ...batchSpec([7]), analysisEngineVersion: "analysis-drift" }, adapter())).toMatchObject({ ok: false, errorCode: "version_mismatch" });
    const broken = createLocalTrajectoryAnalysisAdapterV2({
      ...adapter(),
      policyFactory: () => { throw new Error("factory failure"); },
    });
    expect(runTrajectoryBatchV2(batchSpec([7]), broken)).toMatchObject({ ok: false, errorCode: "child_trajectory_failed", causeCode: "factory_failed" });
    expect(analyzeTrajectoryBatchV2(null, adapter())).toMatchObject({ ok: false, errorCode: "invalid_analysis_run_spec" });
  });
});

describe("features, exact clustering, and sampled frequency", () => {
  it("extracts only auditable event/world facts without mutating inputs", () => {
    const initialWorld = structuredClone(batchSpec().trajectoryTemplate.initialWorld);
    const before = structuredClone(initialWorld);
    const batch = runTrajectoryBatchV2(batchSpec([7]), adapter());
    expect(batch.ok).toBe(true);
    if (!batch.ok) return;
    const trajectoryBefore = structuredClone(batch.trajectories[0]);
    const feature = extractTrajectoryFeatureV2(initialWorld, batch.trajectories[0], featureContext(7));
    expect(feature.ok).toBe(true);
    if (!feature.ok) return;
    expect(feature.feature.simulationEventIds).toEqual(batch.trajectories[0]!.steps.flatMap((step) => step.worldEventId ? [step.worldEventId] : []));
    expect(feature.feature.affectedResourceIds).toContain(idsV2.time);
    expect(feature.feature.revisionDelta).toBe(3);
    expect(feature.feature).not.toHaveProperty("claim");
    expect(feature.feature).not.toHaveProperty("probability");
    expect(initialWorld).toEqual(before);
    expect(batch.trajectories[0]).toEqual(trajectoryBefore);
  });

  it("models no_actions as a real, stable sample", () => {
    const noActions = createLocalTrajectoryAnalysisAdapterV2({
      policyFactory: () => trajectoryPolicyFixtureV2({ candidateCount: 0 }),
      trajectoryRuntimeFactory: ({ seed }) => ({ agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`none-${seed}`) }),
      interventionRuntimeFactory: ({ interventionId }) => ({ clock: () => "2026-07-19T10:00:00.001Z", idFactory: createStableAgentWorldIdFactoryV2(interventionId) }),
    });
    const spec = batchSpec([1, 2]);
    const batch = runTrajectoryBatchV2(spec, noActions);
    expect(batch.ok).toBe(true);
    if (!batch.ok) return;
    const features = batch.trajectories.map((item) => extractTrajectoryFeatureV2(spec.trajectoryTemplate.initialWorld, item, featureContext(item.trajectorySeed, spec)));
    expect(features.every((item) => item.ok && item.feature.terminalStatus === "no_actions")).toBe(true);
    const clusters = clusterTrajectoryFeaturesV2(features.flatMap((item) => item.ok ? [item.feature] : []));
    expect(clusters).toMatchObject({ ok: true, clusters: [{ memberTrajectorySeeds: [1, 2] }] });
  });

  it("creates complete disjoint stable clusters and exact rational frequencies", () => {
    const spec = batchSpec();
    const batch = runTrajectoryBatchV2(spec, adapter());
    expect(batch.ok).toBe(true);
    if (!batch.ok) return;
    const features = batch.trajectories.map((item) => {
      const value = extractTrajectoryFeatureV2(spec.trajectoryTemplate.initialWorld, item, featureContext(item.trajectorySeed, spec));
      if (!value.ok) throw new Error(value.errorCode);
      return value.feature;
    });
    const clustered = clusterTrajectoryFeaturesV2([...features].reverse());
    expect(clustered.ok).toBe(true);
    if (!clustered.ok) return;
    const members = clustered.clusters.flatMap((item) => item.memberTrajectoryIds);
    expect(new Set(members).size).toBe(features.length);
    expect(members.slice().sort()).toEqual(features.map((item) => item.trajectoryId).sort());
    const frequency = buildSimulationFrequencyV2(clustered.clusters, features);
    expect(frequency.ok).toBe(true);
    if (!frequency.ok) return;
    expect(frequency.frequencies.reduce((sum, item) => sum + item.numerator, 0)).toBe(features.length);
    expect(frequency.frequencies.every((item) => item.denominator === features.length)).toBe(true);
    expect(JSON.stringify(frequency)).not.toMatch(/"(probability|likelihood|confidence)"\s*:/i);
    expect(frequency.uncertaintyStatement).toMatch(/sampled simulation frequency/i);
  });

  it("rejects missing samples and invalid cluster membership", () => {
    expect(buildSimulationFrequencyV2([], [])).toMatchObject({ ok: false, errorCode: "frequency_without_samples" });
    const batch = runTrajectoryBatchV2(batchSpec([7]), adapter());
    if (!batch.ok) throw new Error(batch.errorCode);
    const feature = extractTrajectoryFeatureV2(batchSpec().trajectoryTemplate.initialWorld, batch.trajectories[0], featureContext(7));
    if (!feature.ok) throw new Error(feature.errorCode);
    expect(buildSimulationFrequencyV2([], [feature.feature])).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
  });

  it("rejects fabricated features, duplicate membership, cross-version aggregation, and malformed values", () => {
    expect(extractTrajectoryFeatureV2(null, null, null)).toMatchObject({ ok: false, errorCode: "invalid_feature_input" });
    const batch = runTrajectoryBatchV2(batchSpec([7]), adapter());
    if (!batch.ok) throw new Error(batch.errorCode);
    const tampered = structuredClone(batch.trajectories[0]);
    tampered.steps[0]!.worldEventId = "world_event_v2_missing";
    expect(extractTrajectoryFeatureV2(batchSpec().trajectoryTemplate.initialWorld, tampered, featureContext(7))).toMatchObject({ ok: false, errorCode: "invalid_feature_input" });
    const feature = extractTrajectoryFeatureV2(batchSpec().trajectoryTemplate.initialWorld, batch.trajectories[0], featureContext(7));
    if (!feature.ok) throw new Error(feature.errorCode);
    expect(clusterTrajectoryFeaturesV2([feature.feature, feature.feature])).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
    expect(clusterTrajectoryFeaturesV2(null as never)).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
    expect(clusterTrajectoryFeaturesV2([{ ...feature.feature, outcomeSignature: "not-json" }])).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
    const clusters = clusterTrajectoryFeaturesV2([feature.feature]);
    if (!clusters.ok) throw new Error(clusters.errorCode);
    const drifted = structuredClone(feature.feature);
    drifted.policyVersion = "drift";
    drifted.trajectoryId = "trajectory_v2_drift";
    drifted.trajectorySeed = 8;
    const twoClusters = clusterTrajectoryFeaturesV2([feature.feature, drifted]);
    expect(twoClusters).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
    const duplicated = [{ ...clusters.clusters[0]!, memberTrajectoryIds: [feature.feature.trajectoryId, feature.feature.trajectoryId] }];
    expect(buildSimulationFrequencyV2(duplicated, [feature.feature])).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
  });
});

describe("controlled comparisons", () => {
  it("accepts one declared sensitivity axis and returns paired-seed raw differences", () => {
    const baseline = batchSpec([7, 11]);
    const result = compareSensitivityV2({
      sensitivityAnalysisId: "sensitivity_analysis_v2_budget",
      baseline,
      variants: [{ variantId: "sensitivity_variant_v2_budget_60", axis: { kind: "external_variable", targetId: idsV2.promotionBudget, variantValue: 60 }, proposal: sensitivityProposal(baseline, 60) }],
    }, adapter());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.variants[0]!.pairedSeedDifferences.map((item) => item.trajectorySeed)).toEqual([7, 11]);
    expect(result.variants[0]!.frequencyDifferences).toBeDefined();
  });

  it("rejects uncontrolled changes, version drift, and unconfirmed high-impact third-party assumptions", () => {
    const baseline = batchSpec([7]);
    expect(compareSensitivityV2({ sensitivityAnalysisId: "sensitivity_analysis_v2_bad", baseline, variants: [{ variantId: "sensitivity_variant_v2_bad", axis: { kind: "external_variable", targetId: idsV2.offerAvailability, variantValue: "closed" }, proposal: sensitivityProposal(baseline, 60) }] }, adapter())).toMatchObject({ ok: false, errorCode: "uncontrolled_sensitivity_change" });

    const unconfirmed = structuredClone(baseline);
    const assumption = unconfirmed.trajectoryTemplate.initialWorld.realityBoundarySnapshot.assumptionLedger.assumptions.find((item) => item.subjectType === "third_party" && item.impactLevel === "high")!;
    assumption.confirmationStatus = "pending";
    assumption.epistemicStatus = "inferred";
    expect(runTrajectoryBatchV2(unconfirmed, adapter())).toMatchObject({ ok: false, errorCode: "invalid_analysis_run_spec" });

    expect(compareSensitivityV2({ sensitivityAnalysisId: "sensitivity_analysis_v2_version", baseline, variants: [{ variantId: "sensitivity_variant_v2_drift", axis: { kind: "external_variable", targetId: idsV2.promotionBudget, variantValue: 60 }, proposal: sensitivityProposal(baseline, 60), spec: baseline }] }, adapter())).toMatchObject({ ok: false, errorCode: "incomparable_variant" });
    expect(compareSensitivityV2(null, adapter())).toMatchObject({ ok: false, errorCode: "incomparable_variant" });
  });

  it("applies each intervention through Stage 3 transition on isolated worlds and preserves real evidence", () => {
    const baseline = batchSpec([7, 11]);
    const world = baseline.trajectoryTemplate.initialWorld;
    const intervention = {
      id: "action_proposal_v2_pre_run_time",
      seedContextId: world.seedContextId,
      actorAgentId: idsV2.self,
      actionType: "allocate_resource",
      targetEntityIds: [idsV2.offer],
      targetResourceIds: [idsV2.time],
      targetRelationIds: [],
      targetVariableIds: [],
      parameters: { actionType: "allocate_resource", resourceId: idsV2.time, amount: 1 },
      realEvidenceIds: [world.realityBoundarySnapshot.evidenceLedger.items[0]!.id],
      assumptionIds: [],
      priorWorldEventIds: [],
      rationaleSummary: "Reserve one day before the independent rerun.",
      createdAt: "2026-07-19T10:00:00.001Z",
    } as const;
    const before = structuredClone(world);
    const result = comparePreRunInterventionsV2({ interventionComparisonId: "intervention_comparison_v2_fixture", baseline, variants: [{ variantId: "intervention_variant_v2_reserve_day", intervention }] }, adapter());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const variant = result.variants[0]!;
    expect(variant.interventionEventId).toMatch(/^world_event_v2_/);
    expect(variant.interventionWorldRevision).toBe(world.revision + 1);
    expect(variant.pairedSeedDifferences.map((item) => item.trajectorySeed)).toEqual([7, 11]);
    expect(variant.realEvidenceLedgerAfter).toEqual(world.realityBoundarySnapshot.evidenceLedger);
    expect(world).toEqual(before);
    expect(result.baseline.spec.trajectorySeeds).toEqual(variant.spec.trajectorySeeds);
  });

  it("fails interventions atomically for invalid approval or transition", () => {
    const baseline = batchSpec([7]);
    const world = baseline.trajectoryTemplate.initialWorld;
    const invalid = {
      id: "action_proposal_v2_invalid_intervention",
      seedContextId: world.seedContextId,
      actorAgentId: idsV2.self,
      actionType: "allocate_resource",
      targetEntityIds: [], targetResourceIds: [idsV2.time], targetRelationIds: [], targetVariableIds: [],
      parameters: { actionType: "allocate_resource", resourceId: idsV2.time, amount: 999 },
      realEvidenceIds: [world.realityBoundarySnapshot.evidenceLedger.items[0]!.id], assumptionIds: [], priorWorldEventIds: [],
      rationaleSummary: "Invalid amount.", createdAt: "2026-07-19T10:00:00.001Z",
    } as const;
    const result = comparePreRunInterventionsV2({ interventionComparisonId: "intervention_comparison_v2_invalid", baseline, variants: [{ variantId: "intervention_variant_v2_invalid", intervention: invalid }] }, adapter());
    expect(result).toMatchObject({ ok: false, errorCode: "intervention_approval_failed" });
    expect(result).not.toHaveProperty("baseline");
    expect(result).not.toHaveProperty("variants");
    expect(world.resources.find((item) => item.id === idsV2.time)!.available).toBe(6);

    const throwingAdapter = createLocalTrajectoryAnalysisAdapterV2({
      ...adapter(),
      interventionRuntimeFactory: () => { throw new Error("factory failure"); },
    });
    expect(comparePreRunInterventionsV2({ interventionComparisonId: "intervention_comparison_v2_factory", baseline, variants: [{ variantId: "intervention_variant_v2_factory", intervention: invalid }] }, throwingAdapter)).toMatchObject({ ok: false, errorCode: "invalid_intervention" });
    expect(comparePreRunInterventionsV2(null, adapter())).toMatchObject({ ok: false, errorCode: "invalid_intervention" });
  });
});
