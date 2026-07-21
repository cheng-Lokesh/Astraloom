import { describe, expect, it } from "vitest";

import { createStableAgentWorldIdFactoryV2 } from "../agent-world/ids";
import { idsV2, realityBoundaryV2 } from "../agent-world/test-fixtures";
import { trajectoryPolicyFixtureV2, trajectoryRunSpecFixtureV2 } from "../trajectory/test-fixtures";
import { analyzeTrajectoryBatchV2 } from "../trajectory-analysis/batch-runner";
import { comparePreRunInterventionsV2 } from "../trajectory-analysis/intervention-comparison";
import { createLocalTrajectoryAnalysisAdapterV2 } from "../trajectory-analysis/local-adapter";
import { compareSensitivityV2 } from "../trajectory-analysis/sensitivity";
import {
  ANALYSIS_ENGINE_VERSION_V2,
  CLUSTERING_ALGORITHM_V2,
  CLUSTERING_VERSION_V2,
  FEATURE_SCHEMA_VERSION_V2,
} from "../trajectory-analysis/types";
import {
  buildClaimsV2,
  buildInterventionDifferenceClaimsV2,
  buildScenarioFrequencyClaimsV2,
  buildSensitivityDifferenceClaimsV2,
} from "./claim-builder";
import { buildClaimsReportV2, validateClaimsReportV2 } from "./report-builder";
import { parseValidatedClaimV2 } from "./validation";
import { claimIdV2, claimsFingerprintV2 } from "./ids";

function adapter() {
  return createLocalTrajectoryAnalysisAdapterV2({
    policyFactory: () => trajectoryPolicyFixtureV2(),
    trajectoryRuntimeFactory: ({ seed }) => ({
      agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`stage-6-child-${seed}`),
    }),
    interventionRuntimeFactory: ({ interventionId }) => ({
      clock: () => "2026-07-19T10:00:00.001Z",
      idFactory: createStableAgentWorldIdFactoryV2(`stage-6-intervention-${interventionId}`),
    }),
  });
}

function batchSpec(seeds = [7, 11, 19]) {
  const template = trajectoryRunSpecFixtureV2();
  return {
    analysisRunSpecId: "analysis_run_spec_v2_stage_6_fixture",
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

function batchAnalysis() {
  const result = analyzeTrajectoryBatchV2(batchSpec(), adapter());
  if (!result.ok) throw new Error(result.errorCode);
  return result.analysis;
}

function sensitivityProposal(value: number) {
  const world = batchSpec().trajectoryTemplate.initialWorld;
  return {
    id: "action_proposal_v2_stage_6_sensitivity",
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

function interventionProposal() {
  const world = batchSpec().trajectoryTemplate.initialWorld;
  return {
    id: "action_proposal_v2_stage_6_intervention",
    seedContextId: world.seedContextId,
    actorAgentId: idsV2.self,
    actionType: "allocate_resource",
    targetEntityIds: [idsV2.offer], targetResourceIds: [idsV2.time], targetRelationIds: [], targetVariableIds: [],
    parameters: { actionType: "allocate_resource", resourceId: idsV2.time, amount: 1 },
    realEvidenceIds: [world.realityBoundarySnapshot.evidenceLedger.items[0]!.id],
    assumptionIds: [], priorWorldEventIds: [], rationaleSummary: "Reserve one decision day.", createdAt: "2026-07-19T10:00:00.001Z",
  } as const;
}

function boundary() {
  const value = realityBoundaryV2();
  return {
    seedContextId: value.seedContextId,
    schemaVersion: value.schemaVersion,
    revision: value.revision,
    evidenceLedger: value.evidenceLedger,
    assumptionLedger: value.assumptionLedger,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function sensitivityComparison() {
  const result = compareSensitivityV2({
    sensitivityAnalysisId: "sensitivity_analysis_v2_stage_6_fixture",
    baseline: batchSpec(),
    variants: [{
      variantId: "sensitivity_variant_v2_stage_6_60",
      axis: { kind: "external_variable", targetId: idsV2.promotionBudget, variantValue: 60 },
      proposal: sensitivityProposal(60),
    }],
  }, adapter());
  if (!result.ok) throw new Error(result.errorCode);
  return result;
}

function interventionComparison() {
  const result = comparePreRunInterventionsV2({
    interventionComparisonId: "intervention_comparison_v2_stage_6_fixture",
    baseline: batchSpec(),
    variants: [{ variantId: "intervention_variant_v2_stage_6_reserve", intervention: interventionProposal() }],
  }, adapter());
  if (!result.ok) throw new Error(result.errorCode);
  return result;
}

describe("Stage 6 Claim validation and generation", () => {
  it("builds deterministic scenario-frequency Claims with permanently separated provenance", () => {
    const input = { analysis: batchAnalysis(), realityBoundary: boundary() };
    const before = structuredClone(input);
    const first = buildScenarioFrequencyClaimsV2(input);
    const second = buildScenarioFrequencyClaimsV2(structuredClone(input));
    expect(first).toEqual(second);
    expect(input).toEqual(before);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.claims.length).toBe(input.analysis.frequencies.length);
    for (const claim of first.claims) {
      expect(claim.claimType).toBe("scenario_frequency");
      expect(claim.metric).toBe("simulation_frequency");
      expect(claim.uncertaintyStatement).toContain("not a backtested real-world probability");
      expect(claim.realEvidenceIds.every((id) => id.startsWith("real_evidence_v2_"))).toBe(true);
      expect(claim.simulationEventIds.every((id) => id.startsWith("world_event_v2_"))).toBe(true);
      expect(new Set([...claim.realEvidenceIds, ...claim.simulationEventIds]).size).toBe(claim.realEvidenceIds.length + claim.simulationEventIds.length);
      expect(claim.denominator).toBe(claim.sampleCount);
    }
  });

  it("rejects strict-envelope violations and forged Stage 5 Run, Feature, Cluster, Frequency, version, and sample data atomically", () => {
    const analysis = batchAnalysis();
    const attacks = [
      { ...structuredClone(analysis), extra: true },
      { ...structuredClone(analysis), spec: { ...structuredClone(analysis.spec), sampleCount: 99 } },
      { ...structuredClone(analysis), trajectories: [{ ...structuredClone(analysis.trajectories[0]), trajectorySeed: 88 }, ...structuredClone(analysis.trajectories.slice(1))] },
      { ...structuredClone(analysis), features: [{ ...structuredClone(analysis.features[0]), policyVersion: "forged" }, ...structuredClone(analysis.features.slice(1))] },
      { ...structuredClone(analysis), clusters: [{ ...structuredClone(analysis.clusters[0]), memberTrajectoryIds: [] }, ...structuredClone(analysis.clusters.slice(1))] },
      { ...structuredClone(analysis), frequencies: [{ ...structuredClone(analysis.frequencies[0]), numerator: 99 }, ...structuredClone(analysis.frequencies.slice(1))] },
    ];
    for (const forged of attacks) {
      const result = buildScenarioFrequencyClaimsV2({ analysis: forged, realityBoundary: boundary() });
      expect(result.ok).toBe(false);
      expect(result).not.toHaveProperty("claims");
    }
  });

  it("rejects dangling, cross-ledger, cross-seed, cross-trajectory, duplicate, illegal, and missing provenance", () => {
    const base = batchAnalysis();
    const inputs = [
      { analysis: base, realityBoundary: { ...boundary(), seedContextId: "seed_other" } },
      { analysis: base, realityBoundary: { ...boundary(), evidenceLedger: { ...boundary().evidenceLedger, items: [] } } },
      { analysis: { ...base, clusters: [{ ...base.clusters[0]!, simulationEventIds: ["world_event_v2_dangling"] }, ...base.clusters.slice(1)] }, realityBoundary: boundary() },
      { analysis: { ...base, clusters: [{ ...base.clusters[0]!, causalRealEvidenceIds: [] }, ...base.clusters.slice(1)] }, realityBoundary: boundary() },
      { analysis: { ...base, clusters: [{ ...base.clusters[0]!, memberTrajectoryIds: [base.clusters[0]!.memberTrajectoryIds[0]!, base.clusters[0]!.memberTrajectoryIds[0]!] }, ...base.clusters.slice(1)] }, realityBoundary: boundary() },
      { analysis: base, realityBoundary: { ...boundary(), extra: true } },
    ];
    for (const input of inputs) expect(buildScenarioFrequencyClaimsV2(input).ok).toBe(false);
  });

  it("rejects an unconfirmed high-impact third-party Assumption", () => {
    const value = boundary();
    value.assumptionLedger.assumptions[0]!.confirmationStatus = "pending";
    value.assumptionLedger.assumptions[0]!.epistemicStatus = "inferred";
    expect(buildScenarioFrequencyClaimsV2({ analysis: batchAnalysis(), realityBoundary: value })).toMatchObject({
      ok: false,
      errorCode: "unconfirmed_high_impact_assumption",
    });
  });

  it("builds sensitivity and intervention difference Claims only from revalidated comparisons", () => {
    const sensitivity = buildSensitivityDifferenceClaimsV2({ comparison: sensitivityComparison(), realityBoundary: boundary() });
    const intervention = buildInterventionDifferenceClaimsV2({ comparison: interventionComparison(), realityBoundary: boundary() });
    expect(sensitivity.ok).toBe(true);
    expect(intervention.ok).toBe(true);
    if (!sensitivity.ok || !intervention.ok) return;
    expect(sensitivity.claims.every((claim) => claim.claimType === "sensitivity_difference")).toBe(true);
    expect(intervention.claims.every((claim) => claim.claimType === "intervention_difference")).toBe(true);
    expect(sensitivity.claims.every((claim) => claim.sampleCount === 3)).toBe(true);
    expect(intervention.claims.every((claim) => claim.sampleCount === 3)).toBe(true);
  });

  it("rejects forged comparison differences, cross-seed variants, version drift, and extra fields", () => {
    const sensitivity = sensitivityComparison();
    const intervention = interventionComparison();
    const forgedSensitivity = structuredClone(sensitivity);
    forgedSensitivity.variants[0]!.frequencyDifferences[0]!.variantNumerator = 99;
    const forgedIntervention = structuredClone(intervention);
    forgedIntervention.variants[0]!.pairedSeedDifferences[0]!.changed = !forgedIntervention.variants[0]!.pairedSeedDifferences[0]!.changed;
    expect(buildSensitivityDifferenceClaimsV2({ comparison: forgedSensitivity, realityBoundary: boundary() }).ok).toBe(false);
    expect(buildInterventionDifferenceClaimsV2({ comparison: forgedIntervention, realityBoundary: boundary() }).ok).toBe(false);
    expect(buildSensitivityDifferenceClaimsV2({ comparison: { ...sensitivity, extra: true }, realityBoundary: boundary() }).ok).toBe(false);
    expect(buildInterventionDifferenceClaimsV2({ comparison: { ...intervention, extra: true }, realityBoundary: boundary() }).ok).toBe(false);
  });

  it("rejects forged sensitivity axes and dangling or drifted pre-run transition Event references", () => {
    const sensitivity = sensitivityComparison();
    const badAxis = structuredClone(sensitivity);
    badAxis.variants[0]!.axis.baselineValue = 99;
    const badEvent = structuredClone(sensitivity);
    badEvent.variants[0]!.transitionEventId = "world_event_v2_dangling";
    const intervention = interventionComparison();
    const badRevision = structuredClone(intervention);
    badRevision.variants[0]!.interventionWorldRevision += 1;
    expect(buildSensitivityDifferenceClaimsV2({ comparison: badAxis, realityBoundary: boundary() }).ok).toBe(false);
    expect(buildSensitivityDifferenceClaimsV2({ comparison: badEvent, realityBoundary: boundary() }).ok).toBe(false);
    expect(buildInterventionDifferenceClaimsV2({ comparison: badRevision, realityBoundary: boundary() }).ok).toBe(false);
  });

  it("dispatches all three strict Claim input kinds and rejects malformed dispatch envelopes", () => {
    expect(buildClaimsV2({ kind: "batch", payload: batchAnalysis(), realityBoundary: boundary() }).ok).toBe(true);
    expect(buildClaimsV2({ kind: "sensitivity", payload: sensitivityComparison(), realityBoundary: boundary() }).ok).toBe(true);
    expect(buildClaimsV2({ kind: "intervention", payload: interventionComparison(), realityBoundary: boundary() }).ok).toBe(true);
    expect(buildClaimsV2(null)).toEqual({ ok: false, errorCode: "invalid_claims_input" });
    expect(buildClaimsV2({ kind: "batch", payload: batchAnalysis(), realityBoundary: boundary(), extra: true }).ok).toBe(false);
  });

  it("rejects Claim integrity, duplicate-reference, count, and range tampering", () => {
    const result = buildScenarioFrequencyClaimsV2({ analysis: batchAnalysis(), realityBoundary: boundary() });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const claim = result.claims[0]!;
    expect(parseValidatedClaimV2(claim).ok).toBe(true);
    expect(parseValidatedClaimV2({ ...claim, statement: "changed" })).toMatchObject({ ok: false, errorCode: "claim_tampering" });
    expect(parseValidatedClaimV2({ ...claim, realEvidenceIds: [claim.realEvidenceIds[0]!, claim.realEvidenceIds[0]!] })).toMatchObject({ ok: false, errorCode: "duplicate_id" });
    expect(parseValidatedClaimV2({ ...claim, denominator: claim.denominator + 1 })).toMatchObject({ ok: false, errorCode: "claim_tampering" });
    expect(parseValidatedClaimV2({ ...claim, numerator: claim.denominator + 1 })).toMatchObject({ ok: false, errorCode: "claim_tampering" });
    expect(parseValidatedClaimV2({ ...claim, id: "bad" })).toMatchObject({ ok: false, errorCode: "claim_tampering" });
    const unsigned = Object.fromEntries(Object.entries(claim).filter(([key]) => key !== "id" && key !== "claimIntegritySignature")) as Omit<typeof claim, "id" | "claimIntegritySignature">;
    const strengthenedUnsigned = { ...unsigned, statement: "This outcome will definitely happen." };
    expect(parseValidatedClaimV2({
      id: claimIdV2(strengthenedUnsigned),
      ...strengthenedUnsigned,
      claimIntegritySignature: claimsFingerprintV2(strengthenedUnsigned),
    })).toMatchObject({ ok: false, errorCode: "claim_tampering" });
  });
});

describe("Stage 6 Report boundary", () => {
  function claims() {
    const result = buildScenarioFrequencyClaimsV2({ analysis: batchAnalysis(), realityBoundary: boundary() });
    if (!result.ok) throw new Error(result.errorCode);
    return result.claims;
  }

  it("renders a deterministic Report that copies validated Claims without strengthening or changing references", () => {
    const input = { reportSpecId: "claims_report_spec_v2_fixture", seedContextId: boundary().seedContextId, claims: claims(), claimIds: claims().map((claim) => claim.id) };
    const before = structuredClone(input);
    const first = buildClaimsReportV2(input);
    const second = buildClaimsReportV2(structuredClone(input));
    expect(first).toEqual(second);
    expect(input).toEqual(before);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.report.sections.map((section) => section.claim)).toEqual(input.claims);
    expect(first.report.claimIds).toEqual(input.claimIds.slice().sort());
    expect(validateClaimsReportV2(first.report, input.claims)).toEqual({ ok: true });
  });

  it("rejects added Claims, strengthened text, changed references, probability labels, duplicates, invalid ids, wrong types, and extra fields", () => {
    const sourceClaims = claims();
    const built = buildClaimsReportV2({ reportSpecId: "claims_report_spec_v2_attacks", seedContextId: boundary().seedContextId, claims: sourceClaims, claimIds: sourceClaims.map((claim) => claim.id) });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const attacks = [
      { ...structuredClone(built.report), claimIds: [...built.report.claimIds, "claim_v2_missing"] },
      { ...structuredClone(built.report), sections: [{ ...structuredClone(built.report.sections[0]), statement: "This outcome will definitely happen." }, ...structuredClone(built.report.sections.slice(1))] },
      { ...structuredClone(built.report), sections: [{ ...structuredClone(built.report.sections[0]), realEvidenceIds: [] }, ...structuredClone(built.report.sections.slice(1))] },
      { ...structuredClone(built.report), metricLabel: "real-world probability" },
      { ...structuredClone(built.report), claimIds: [built.report.claimIds[0]!, built.report.claimIds[0]!] },
      { ...structuredClone(built.report), id: "bad" },
      { ...structuredClone(built.report), sampleCount: "3" },
      { ...structuredClone(built.report), extra: true },
    ];
    for (const attack of attacks) expect(validateClaimsReportV2(attack, sourceClaims).ok).toBe(false);
    expect(buildClaimsReportV2({ reportSpecId: "claims_report_spec_v2_extra", seedContextId: boundary().seedContextId, claims: sourceClaims, claimIds: sourceClaims.map((claim) => claim.id), conclusion: "certain" }).ok).toBe(false);
  });

  it("rejects malformed source sets, duplicate source Claims, cross-seed Claims, and inconsistent sample counts", () => {
    const sourceClaims = claims();
    const base = { reportSpecId: "claims_report_spec_v2_source_attacks", seedContextId: boundary().seedContextId, claims: sourceClaims, claimIds: sourceClaims.map((claim) => claim.id) };
    expect(validateClaimsReportV2({}, null)).toEqual({ ok: false, errorCode: "invalid_report_input" });
    expect(buildClaimsReportV2({ ...base, claims: [sourceClaims[0], sourceClaims[0]] })).toMatchObject({ ok: false, errorCode: "duplicate_id" });
    expect(buildClaimsReportV2({ ...base, seedContextId: "seed_other" })).toMatchObject({ ok: false, errorCode: "cross_seed_reference" });
    expect(buildClaimsReportV2({ ...base, claims: [{ ...sourceClaims[0], statement: "forged" }] })).toMatchObject({ ok: false, errorCode: "claim_tampering" });
    if (sourceClaims.length > 1) {
      const unsigned = Object.fromEntries(Object.entries(sourceClaims[1]!).filter(([key]) => key !== "id" && key !== "claimIntegritySignature")) as Omit<(typeof sourceClaims)[number], "id" | "claimIntegritySignature">;
      const changedUnsigned = {
        ...unsigned,
        denominator: unsigned.denominator + 1,
        sampleCount: unsigned.sampleCount + 1,
        statement: `Cluster ${unsigned.clusterIds[0]} appeared in ${unsigned.numerator}/${unsigned.denominator + 1} sampled trajectories.`,
      };
      const changed = {
        id: claimIdV2(changedUnsigned),
        ...changedUnsigned,
        claimIntegritySignature: claimsFingerprintV2(changedUnsigned),
      };
      expect(buildClaimsReportV2({ ...base, claims: [sourceClaims[0], changed], claimIds: [sourceClaims[0]!.id, changed.id] })).toMatchObject({ ok: false, errorCode: "invalid_report_input" });
    }
    const built = buildClaimsReportV2(base);
    expect(built.ok).toBe(true);
    if (built.ok) expect(validateClaimsReportV2(built.report, null)).toEqual({ ok: false, errorCode: "invalid_report_input" });
  });
});
