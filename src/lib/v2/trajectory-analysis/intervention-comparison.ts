import { analyzeTrajectoryBatchV2 } from "./batch-runner";
import { applyPreRunActionV2 } from "./pre-run-transition";
import type { BatchAnalysisV2, InterventionVariantResultV2, PairedSeedDifferenceV2, TrajectoryAnalysisAdapterV2 } from "./types";
import { parseInterventionComparisonInputV2 } from "./validation";

function paired(baseline: BatchAnalysisV2, variant: BatchAnalysisV2): PairedSeedDifferenceV2[] {
  const bySeed = new Map(variant.features.map((item) => [item.trajectorySeed, item]));
  return baseline.features.map((item) => {
    const target = bySeed.get(item.trajectorySeed)!;
    return { trajectorySeed: item.trajectorySeed, baselineFeatureSignature: item.featureSignature, variantFeatureSignature: target.featureSignature, changed: item.outcomeSignature !== target.outcomeSignature };
  });
}

export function comparePreRunInterventionsV2(input: unknown, adapter: TrajectoryAnalysisAdapterV2) {
  const parsed = parseInterventionComparisonInputV2(input);
  if (!parsed.ok) return parsed;
  const value = parsed.value;
  const prepared = [];
  for (let variantIndex = 0; variantIndex < value.variants.length; variantIndex += 1) {
    const item = value.variants[variantIndex]!;
    const world = structuredClone(value.baseline.trajectoryTemplate.initialWorld);
    if (item.intervention.seedContextId !== value.baseline.seedContextId) return { ok: false as const, errorCode: "invalid_intervention" as const, failedVariantIndex: variantIndex, issues: [`variants.${variantIndex}.intervention.seedContextId: cross-seed reference`] };
    const transition = applyPreRunActionV2({ proposal: item.intervention, world, variantId: item.variantId, variantIndex, spec: value.baseline, adapter });
    if (!transition.ok) return { ok: false as const, errorCode: transition.phase === "input" ? "invalid_intervention" as const : transition.phase === "approval" ? "intervention_approval_failed" as const : "intervention_transition_failed" as const, failedVariantIndex: variantIndex, causeCode: transition.causeCode };
    prepared.push({ item, transition: transition.transition });
  }
  const baseline = analyzeTrajectoryBatchV2(value.baseline, adapter);
  if (!baseline.ok) return baseline;
  const variants: InterventionVariantResultV2[] = [];
  for (const preparedVariant of prepared) {
    const spec = structuredClone(value.baseline);
    spec.trajectoryTemplate.initialWorld = structuredClone(preparedVariant.transition.world);
    spec.trajectoryTemplate.expectedInitialWorldRevision = preparedVariant.transition.world.revision;
    spec.trajectoryTemplate.startAt = preparedVariant.transition.world.updatedAt;
    const analyzed = analyzeTrajectoryBatchV2(spec, adapter);
    if (!analyzed.ok) return analyzed;
    variants.push({
      variantId: preparedVariant.item.variantId,
      interventionEventId: preparedVariant.transition.event.id,
      interventionWorldRevision: preparedVariant.transition.world.revision,
      spec: analyzed.analysis.spec,
      analysis: analyzed.analysis,
      pairedSeedDifferences: paired(baseline.analysis, analyzed.analysis),
      realEvidenceLedgerAfter: structuredClone(preparedVariant.transition.world.realityBoundarySnapshot.evidenceLedger),
    });
  }
  return { ok: true as const, interventionComparisonId: value.interventionComparisonId, baseline: baseline.analysis, variants };
}
