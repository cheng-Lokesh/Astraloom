import { approveActionProposalV2 } from "../agent-world/action-proposal";
import { applyWorldTransitionV2 } from "../agent-world/world-transition";
import { analyzeTrajectoryBatchV2 } from "./batch-runner";
import type { BatchAnalysisV2, InterventionComparisonInputV2, InterventionVariantResultV2, PairedSeedDifferenceV2, TrajectoryAnalysisAdapterV2 } from "./types";

function paired(baseline: BatchAnalysisV2, variant: BatchAnalysisV2): PairedSeedDifferenceV2[] {
  const bySeed = new Map(variant.features.map((item) => [item.trajectorySeed, item]));
  return baseline.features.map((item) => {
    const target = bySeed.get(item.trajectorySeed)!;
    return { trajectorySeed: item.trajectorySeed, baselineFeatureSignature: item.featureSignature, variantFeatureSignature: target.featureSignature, changed: item.featureSignature !== target.featureSignature };
  });
}

export function comparePreRunInterventionsV2(input: unknown, adapter: TrajectoryAnalysisAdapterV2) {
  try {
    const value = input as InterventionComparisonInputV2;
    if (!value || typeof value !== "object" || !/^intervention_comparison_v2_/.test(value.interventionComparisonId) || !Array.isArray(value.variants) || value.variants.length === 0 || value.variants.some((item) => !item || typeof item.variantId !== "string" || !item.variantId || !item.intervention)) return { ok: false as const, errorCode: "invalid_intervention" as const };
    const variantWorlds = [];
    for (let variantIndex = 0; variantIndex < value.variants.length; variantIndex += 1) {
      const item = value.variants[variantIndex]!;
      const world = structuredClone(value.baseline.trajectoryTemplate.initialWorld);
      if (item.intervention.seedContextId !== value.baseline.seedContextId) return { ok: false as const, errorCode: "invalid_intervention" as const };
      let runtime;
      try {
        runtime = adapter.interventionRuntimeFactory({ interventionId: item.intervention.id, variantIndex, spec: value.baseline });
      } catch {
        return { ok: false as const, errorCode: "invalid_intervention" as const };
      }
      const approval = approveActionProposalV2(structuredClone(item.intervention), world, world.revision, runtime);
      if (!approval.ok) return { ok: false as const, errorCode: "intervention_approval_failed" as const, failedVariantIndex: variantIndex, causeCode: approval.errorCode };
      const transition = applyWorldTransitionV2(world, approval.command, runtime);
      if (!transition.ok) return { ok: false as const, errorCode: "intervention_transition_failed" as const, failedVariantIndex: variantIndex, causeCode: transition.errorCode };
      if (transition.world.realityBoundarySnapshot.evidenceLedger.id !== world.realityBoundarySnapshot.evidenceLedger.id || JSON.stringify(transition.world.realityBoundarySnapshot.evidenceLedger) !== JSON.stringify(world.realityBoundarySnapshot.evidenceLedger)) return { ok: false as const, errorCode: "intervention_transition_failed" as const, failedVariantIndex: variantIndex, causeCode: "real_evidence_ledger_changed" };
      variantWorlds.push({ item, transition });
    }
    const baseline = analyzeTrajectoryBatchV2(value.baseline, adapter);
    if (!baseline.ok) return baseline;
    const variants: InterventionVariantResultV2[] = [];
    for (const { item, transition } of variantWorlds) {
      const spec = structuredClone(value.baseline);
      spec.trajectoryTemplate.initialWorld = structuredClone(transition.world);
      spec.trajectoryTemplate.expectedInitialWorldRevision = transition.world.revision;
      spec.trajectoryTemplate.startAt = transition.world.updatedAt;
      const analyzed = analyzeTrajectoryBatchV2(spec, adapter);
      if (!analyzed.ok) return analyzed;
      variants.push({ variantId: item.variantId, interventionEventId: transition.event.id, interventionWorldRevision: transition.world.revision, spec: analyzed.analysis.spec, analysis: analyzed.analysis, pairedSeedDifferences: paired(baseline.analysis, analyzed.analysis), realEvidenceLedgerAfter: structuredClone(transition.world.realityBoundarySnapshot.evidenceLedger) });
    }
    return { ok: true as const, interventionComparisonId: value.interventionComparisonId, baseline: baseline.analysis, variants };
  } catch {
    return { ok: false as const, errorCode: "invalid_intervention" as const };
  }
}
