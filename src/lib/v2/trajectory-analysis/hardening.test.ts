import { describe, expect, it } from "vitest";

import { createStableAgentWorldIdFactoryV2 } from "../agent-world/ids";
import { idsV2 } from "../agent-world/test-fixtures";
import { trajectoryPolicyFixtureV2, trajectoryRunSpecFixtureV2 } from "../trajectory/test-fixtures";
import { runTrajectoryBatchV2 } from "./batch-runner";
import { clusterTrajectoryFeaturesV2 } from "./clustering";
import { extractTrajectoryFeatureV2 } from "./feature-extraction";
import { comparePreRunInterventionsV2 } from "./intervention-comparison";
import { createLocalTrajectoryAnalysisAdapterV2 } from "./local-adapter";
import { compareSensitivityV2 } from "./sensitivity";
import { buildSimulationFrequencyV2 } from "./simulation-frequency";
import {
  ANALYSIS_ENGINE_VERSION_V2,
  CLUSTERING_ALGORITHM_V2,
  CLUSTERING_VERSION_V2,
  FEATURE_SCHEMA_VERSION_V2,
} from "./types";

function batchSpec(seeds = [7, 11]) {
  const trajectoryTemplate = trajectoryRunSpecFixtureV2();
  return {
    analysisRunSpecId: "analysis_run_spec_v2_hardening",
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

function adapter(clock = "2026-07-19T10:00:00.001Z") {
  return createLocalTrajectoryAnalysisAdapterV2({
    policyFactory: () => trajectoryPolicyFixtureV2(),
    trajectoryRuntimeFactory: ({ seed }) => ({
      agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`hardening-child-${seed}`),
    }),
    interventionRuntimeFactory: ({ interventionId }) => ({
      clock: () => clock,
      idFactory: createStableAgentWorldIdFactoryV2(`hardening-${interventionId}`),
    }),
  });
}

function featureContext(spec: ReturnType<typeof batchSpec>, seed: number) {
  return {
    seedContextId: spec.seedContextId,
    trajectorySeed: seed,
    policyId: spec.policyId,
    policyVersion: spec.policyVersion,
    trajectoryEngineVersion: spec.trajectoryEngineVersion,
    batchRunSpec: spec,
  };
}

function variableProposal(
  spec: ReturnType<typeof batchSpec>,
  value: number,
  createdAt = "2026-07-19T10:00:00.001Z",
) {
  const world = spec.trajectoryTemplate.initialWorld;
  return {
    id: "action_proposal_v2_sensitivity_budget",
    seedContextId: world.seedContextId,
    actorAgentId: idsV2.self,
    actionType: "update_external_variable",
    targetEntityIds: [],
    targetResourceIds: [],
    targetRelationIds: [],
    targetVariableIds: [idsV2.promotionBudget],
    parameters: {
      actionType: "update_external_variable",
      variableId: idsV2.promotionBudget,
      value,
    },
    realEvidenceIds: [world.realityBoundarySnapshot.evidenceLedger.items[1]!.id],
    assumptionIds: [world.realityBoundarySnapshot.assumptionLedger.assumptions[0]!.id],
    priorWorldEventIds: [],
    rationaleSummary: "Controlled promotion-budget sensitivity input.",
    createdAt,
  } as const;
}

function interventionProposal(
  spec: ReturnType<typeof batchSpec>,
  createdAt = "2026-07-19T10:00:00.001Z",
) {
  const world = spec.trajectoryTemplate.initialWorld;
  return {
    id: "action_proposal_v2_pre_run_time_hardening",
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
    createdAt,
  } as const;
}

function executedFeature(seed = 7) {
  const spec = batchSpec([seed]);
  const batch = runTrajectoryBatchV2(spec, adapter());
  if (!batch.ok) throw new Error(batch.errorCode);
  const result = extractTrajectoryFeatureV2(
    spec.trajectoryTemplate.initialWorld,
    batch.trajectories[0],
    featureContext(spec, seed),
  );
  if (!result.ok) throw new Error(result.errorCode);
  return { spec, trajectory: batch.trajectories[0]!, feature: result.feature };
}

describe("strict TrajectoryResult to Feature boundary", () => {
  it("rejects forged status and revision chains", () => {
    const { spec, trajectory } = executedFeature();
    const status = structuredClone(trajectory);
    status.status = "no_actions";
    expect(extractTrajectoryFeatureV2(spec.trajectoryTemplate.initialWorld, status, featureContext(spec, 7))).toMatchObject({ ok: false, errorCode: "invalid_feature_input" });

    const revision = structuredClone(trajectory);
    revision.steps[0]!.afterRevision = 999;
    expect(extractTrajectoryFeatureV2(spec.trajectoryTemplate.initialWorld, revision, featureContext(spec, 7))).toMatchObject({ ok: false, errorCode: "invalid_feature_input" });
  });

  it("rejects deleted, duplicated, reordered, replaced, extra-field, and ownership-forged history", () => {
    const { spec, trajectory } = executedFeature();
    const candidates = [];
    const deleted = structuredClone(trajectory);
    deleted.steps.splice(1, 1);
    candidates.push(deleted);
    const duplicated = structuredClone(trajectory);
    duplicated.steps[1] = structuredClone(duplicated.steps[0]!);
    candidates.push(duplicated);
    const reordered = structuredClone(trajectory);
    reordered.steps.reverse();
    candidates.push(reordered);
    const replaced = structuredClone(trajectory);
    replaced.steps[0]!.commandId = "transition_command_v2_forged";
    candidates.push(replaced);
    const suffix = structuredClone(trajectory);
    suffix.finalWorld.worldEvents.push(structuredClone(suffix.finalWorld.worldEvents.at(-1)!));
    suffix.finalWorld.worldEventIds.push(suffix.finalWorld.worldEvents.at(-1)!.id);
    candidates.push(suffix);
    const prefix = structuredClone(trajectory);
    prefix.finalWorld.worldEvents[0]!.createdAt = "2026-07-19T10:00:00.001Z";
    candidates.push(prefix);
    const ownership = structuredClone(trajectory);
    ownership.policyVersion = "forged";
    candidates.push(ownership);
    const extra = structuredClone(trajectory) as typeof trajectory & { surprise: boolean };
    extra.surprise = true;
    candidates.push(extra);
    const stepExtra = structuredClone(trajectory) as typeof trajectory & { steps: Array<(typeof trajectory.steps)[number] & { surprise?: boolean }> };
    stepExtra.steps[0]!.surprise = true;
    candidates.push(stepExtra);
    const rngExtra = structuredClone(trajectory) as typeof trajectory & { steps: Array<(typeof trajectory.steps)[number] & { rngAudit?: NonNullable<(typeof trajectory.steps)[number]["rngAudit"]> & { surprise?: boolean } }> };
    rngExtra.steps[0]!.rngAudit!.surprise = true;
    candidates.push(rngExtra);
    for (const candidate of candidates) {
      expect(extractTrajectoryFeatureV2(spec.trajectoryTemplate.initialWorld, candidate, featureContext(spec, 7))).toMatchObject({ ok: false, errorCode: "invalid_feature_input" });
    }
  });

  it("continues to accept a valid no_actions history", () => {
    const spec = batchSpec([7]);
    const noActions = createLocalTrajectoryAnalysisAdapterV2({
      ...adapter(),
      policyFactory: () => trajectoryPolicyFixtureV2({ candidateCount: 0 }),
    });
    const batch = runTrajectoryBatchV2(spec, noActions);
    if (!batch.ok) throw new Error(batch.errorCode);
    expect(extractTrajectoryFeatureV2(spec.trajectoryTemplate.initialWorld, batch.trajectories[0], featureContext(spec, 7))).toMatchObject({ ok: true, feature: { terminalStatus: "no_actions", revisionDelta: 0 } });
    const terminationExtra = structuredClone(batch.trajectories[0]) as typeof batch.trajectories[0] & { steps: Array<(typeof batch.trajectories[0]["steps"])[number] & { termination?: { reason: "no_actions"; surprise?: boolean } }> };
    (terminationExtra.steps.at(-1)!.termination as { reason: "no_actions"; surprise?: boolean }).surprise = true;
    expect(extractTrajectoryFeatureV2(spec.trajectoryTemplate.initialWorld, terminationExtra, featureContext(spec, 7))).toMatchObject({ ok: false, errorCode: "invalid_feature_input" });
  });
});

describe("factory isolation and strict identifiers", () => {
  it("keeps canonical specs and caller input unchanged when factories attempt mutation", () => {
    const input = batchSpec([7, 11]);
    const before = structuredClone(input);
    const childIntervals: number[] = [];
    const malicious = createLocalTrajectoryAnalysisAdapterV2({
      policyFactory: ({ spec }) => {
        try {
          (spec.trajectoryTemplate as { tickIntervalDays: number }).tickIntervalDays = 99;
          (spec.trajectorySeeds as number[]).push(999);
          spec.trajectoryTemplate.initialWorld.resources[0]!.available = 0;
        } catch {}
        childIntervals.push(spec.trajectoryTemplate.tickIntervalDays);
        return trajectoryPolicyFixtureV2();
      },
      trajectoryRuntimeFactory: ({ seed }) => ({ agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`isolated-${seed}`) }),
      interventionRuntimeFactory: adapter().interventionRuntimeFactory,
    });
    const result = runTrajectoryBatchV2(input, malicious);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(childIntervals).toEqual([1, 1]);
    expect(result.spec).toEqual(before);
    expect(input).toEqual(before);
    expect(result.trajectories.map((item) => item.steps.length)).toEqual([3, 3]);
  });

  it.each(["analysis_run_spec_v2_", "analysis_run_spec_v2_ bad", "analysis_run_spec_v2_bad!", "analysis_run_spec_v2_bad\n"])("rejects invalid analysis ID %s", (analysisRunSpecId) => {
    expect(runTrajectoryBatchV2({ ...batchSpec([7]), analysisRunSpecId }, adapter())).toMatchObject({ ok: false, errorCode: "invalid_analysis_run_spec" });
  });
});

describe("strict sensitivity and intervention comparisons", () => {
  it("applies sensitivity through a Stage 3 variable transition and derives baselineValue", () => {
    const baseline = batchSpec([7, 11]);
    const before = structuredClone(baseline);
    const result = compareSensitivityV2({
      sensitivityAnalysisId: "sensitivity_analysis_v2_budget",
      baseline,
      variants: [{
        variantId: "sensitivity_variant_v2_budget_60",
        axis: { kind: "external_variable", targetId: idsV2.promotionBudget, variantValue: 60 },
        proposal: variableProposal(baseline, 60),
      }],
    }, adapter());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.variants[0]!.axis.baselineValue).toBe(50);
    expect(result.variants[0]!.transitionEventId).toMatch(/^world_event_v2_/);
    expect(result.variants[0]!.analysis.spec.trajectoryTemplate.initialWorld.revision).toBe(baseline.trajectoryTemplate.initialWorld.revision + 1);
    expect(baseline).toEqual(before);
  });

  it("rejects direct World rewrites, mismatched proposals, extra fields, and duplicate variant IDs", () => {
    const baseline = batchSpec([7]);
    const direct = structuredClone(baseline);
    const variable = direct.trajectoryTemplate.initialWorld.externalVariables.find((item) => item.id === idsV2.promotionBudget)!;
    (variable as { value: number }).value = 60;
    const directResult = compareSensitivityV2({
      sensitivityAnalysisId: "sensitivity_analysis_v2_direct",
      baseline,
      variants: [{ variantId: "sensitivity_variant_v2_direct", axis: { kind: "external_variable", targetId: idsV2.promotionBudget, variantValue: 60 }, proposal: variableProposal(baseline, 60), spec: direct }],
    }, adapter());
    expect(directResult).toMatchObject({ ok: false });

    const mismatch = compareSensitivityV2({
      sensitivityAnalysisId: "sensitivity_analysis_v2_mismatch",
      baseline,
      variants: [{ variantId: "sensitivity_variant_v2_mismatch", axis: { kind: "external_variable", targetId: idsV2.offerAvailability, variantValue: "closed" }, proposal: variableProposal(baseline, 60) }],
    }, adapter());
    expect(mismatch).toMatchObject({ ok: false, errorCode: "uncontrolled_sensitivity_change" });

    const duplicateVariant = { variantId: "sensitivity_variant_v2_duplicate", axis: { kind: "external_variable", targetId: idsV2.promotionBudget, variantValue: 60 }, proposal: variableProposal(baseline, 60) };
    expect(compareSensitivityV2({ sensitivityAnalysisId: "sensitivity_analysis_v2_duplicates", baseline, variants: [duplicateVariant, duplicateVariant] }, adapter())).toMatchObject({ ok: false, errorCode: "incomparable_variant" });

    expect(comparePreRunInterventionsV2({ interventionComparisonId: "intervention_comparison_v2_extra", baseline, variants: [{ variantId: "intervention_variant_v2_extra", intervention: interventionProposal(baseline), extra: true }] }, adapter())).toMatchObject({ ok: false, errorCode: "invalid_intervention" });
  });

  it("rejects a 2099 proposal before a 2026 intervention and accepts an equivalent timezone", () => {
    const baseline = batchSpec([7]);
    const future = comparePreRunInterventionsV2({
      interventionComparisonId: "intervention_comparison_v2_future",
      baseline,
      variants: [{ variantId: "intervention_variant_v2_future", intervention: interventionProposal(baseline, "2099-01-01T00:00:00.000Z") }],
    }, adapter("2026-07-19T10:00:00.001Z"));
    expect(future).toMatchObject({ ok: false, errorCode: "invalid_intervention" });
    expect(future).not.toHaveProperty("baseline");
    expect(future).not.toHaveProperty("variants");

    const equivalent = comparePreRunInterventionsV2({
      interventionComparisonId: "intervention_comparison_v2_timezone",
      baseline,
      variants: [{ variantId: "intervention_variant_v2_timezone", intervention: interventionProposal(baseline, "2026-07-19T18:00:00.001+08:00") }],
    }, adapter("2026-07-19T10:00:00.0010Z"));
    expect(equivalent.ok).toBe(true);

    const submillisecond = comparePreRunInterventionsV2({
      interventionComparisonId: "intervention_comparison_v2_submillisecond",
      baseline,
      variants: [{ variantId: "intervention_variant_v2_submillisecond", intervention: interventionProposal(baseline, "2026-07-19T10:00:00.0011Z") }],
    }, adapter("2026-07-19T10:00:00.001Z"));
    expect(submillisecond).toMatchObject({ ok: false, errorCode: "invalid_intervention", causeCode: "invalid_intervention_time" });
  });

  it("captures an intervention clock once and rejects nested Proposal extras and duplicate Proposal IDs", () => {
    const baseline = batchSpec([7]);
    let clockCalls = 0;
    const countingAdapter = createLocalTrajectoryAnalysisAdapterV2({
      ...adapter(),
      interventionRuntimeFactory: ({ interventionId }) => ({
        clock: () => { clockCalls += 1; return "2026-07-19T10:00:00.001Z"; },
        idFactory: createStableAgentWorldIdFactoryV2(`once-${interventionId}`),
      }),
    });
    const valid = comparePreRunInterventionsV2({ interventionComparisonId: "intervention_comparison_v2_once", baseline, variants: [{ variantId: "intervention_variant_v2_once", intervention: interventionProposal(baseline) }] }, countingAdapter);
    expect(valid.ok).toBe(true);
    expect(clockCalls).toBe(1);

    const extraProposal = structuredClone(interventionProposal(baseline)) as ReturnType<typeof interventionProposal> & { parameters: ReturnType<typeof interventionProposal>["parameters"] & { surprise?: boolean } };
    extraProposal.parameters.surprise = true;
    expect(comparePreRunInterventionsV2({ interventionComparisonId: "intervention_comparison_v2_nested_extra", baseline, variants: [{ variantId: "intervention_variant_v2_nested_extra", intervention: extraProposal }] }, adapter())).toMatchObject({ ok: false, errorCode: "invalid_intervention" });

    const proposal = interventionProposal(baseline);
    expect(comparePreRunInterventionsV2({ interventionComparisonId: "intervention_comparison_v2_duplicate_proposals", baseline, variants: [{ variantId: "intervention_variant_v2_duplicate_a", intervention: proposal }, { variantId: "intervention_variant_v2_duplicate_b", intervention: proposal }] }, adapter())).toMatchObject({ ok: false, errorCode: "invalid_intervention" });
  });
});

describe("cluster and frequency integrity", () => {
  it("rejects a replaced member seed, representative, cluster ID, or provenance", () => {
    const { feature } = executedFeature();
    const clustered = clusterTrajectoryFeaturesV2([feature]);
    if (!clustered.ok) throw new Error(clustered.errorCode);
    const mutations = [
      { ...clustered.clusters[0]!, memberTrajectorySeeds: [999] },
      { ...clustered.clusters[0]!, representativeTrajectoryId: "trajectory_v2_forged" },
      { ...clustered.clusters[0]!, clusterId: "trajectory_cluster_v2_forged" },
      { ...clustered.clusters[0]!, causalAssumptionIds: ["assumption_v2_forged"] },
    ];
    for (const mutation of mutations) {
      expect(buildSimulationFrequencyV2([mutation] as never, [feature])).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
    }
  });

  it("discloses every modeled input assumption, not only event-causal assumptions", () => {
    const { feature } = executedFeature();
    expect(feature.inputAssumptionIds).toEqual([
      ...batchSpec().trajectoryTemplate.initialWorld.realityBoundarySnapshot.assumptionLedger.assumptions.map((item) => item.id),
    ].sort());
    const clustered = clusterTrajectoryFeaturesV2([feature]);
    if (!clustered.ok) throw new Error(clustered.errorCode);
    const frequency = buildSimulationFrequencyV2(clustered.clusters, [feature]);
    if (!frequency.ok) throw new Error(frequency.errorCode);
    expect(frequency.frequencies[0]!.inputAssumptionIds).toEqual(feature.inputAssumptionIds);
  });

  it("does not merge different canonical outcomes when a hash is forged", () => {
    const action = executedFeature().feature;
    const spec = batchSpec([8]);
    const noActionsAdapter = createLocalTrajectoryAnalysisAdapterV2({ ...adapter(), policyFactory: () => trajectoryPolicyFixtureV2({ candidateCount: 0 }) });
    const batch = runTrajectoryBatchV2(spec, noActionsAdapter);
    if (!batch.ok) throw new Error(batch.errorCode);
    const noActions = extractTrajectoryFeatureV2(spec.trajectoryTemplate.initialWorld, batch.trajectories[0], featureContext(spec, 8));
    if (!noActions.ok) throw new Error(noActions.errorCode);
    const forged = { ...noActions.feature, featureSignature: action.featureSignature };
    expect(clusterTrajectoryFeaturesV2([action, forged])).toMatchObject({ ok: false, errorCode: "invalid_cluster_membership" });
  });
});
