import { canonicalJsonV2 } from "./ids";
import { analyzeTrajectoryBatchV2 } from "./batch-runner";
import { applyPreRunActionV2 } from "./pre-run-transition";
import type { BatchAnalysisV2, PairedSeedDifferenceV2, TrajectoryAnalysisAdapterV2 } from "./types";
import { parseSensitivityComparisonInputV2 } from "./validation";

function paired(baseline: BatchAnalysisV2, variant: BatchAnalysisV2): PairedSeedDifferenceV2[] {
  const variants = new Map(variant.features.map((item) => [item.trajectorySeed, item]));
  return baseline.features.map((item) => {
    const comparison = variants.get(item.trajectorySeed)!;
    return { trajectorySeed: item.trajectorySeed, baselineFeatureSignature: item.featureSignature, variantFeatureSignature: comparison.featureSignature, changed: item.outcomeSignature !== comparison.outcomeSignature };
  });
}

function frequencyDifferences(baseline: BatchAnalysisV2, variant: BatchAnalysisV2) {
  const left = new Map(baseline.frequencies.map((item) => [item.clusterId, item.numerator]));
  const right = new Map(variant.frequencies.map((item) => [item.clusterId, item.numerator]));
  return [...new Set([...left.keys(), ...right.keys()])].sort().map((clusterId) => ({ clusterId, baselineNumerator: left.get(clusterId) ?? 0, variantNumerator: right.get(clusterId) ?? 0, denominator: baseline.spec.sampleCount }));
}

export function compareSensitivityV2(input: unknown, adapter: TrajectoryAnalysisAdapterV2) {
  const parsed = parseSensitivityComparisonInputV2(input);
  if (!parsed.ok) return parsed;
  const value = parsed.value;
  const prepared = [];
  for (let variantIndex = 0; variantIndex < value.variants.length; variantIndex += 1) {
    const item = value.variants[variantIndex]!;
    const world = structuredClone(value.baseline.trajectoryTemplate.initialWorld);
    const variable = world.externalVariables.find((candidate) => candidate.id === item.axis.targetId);
    const proposal = item.proposal;
    if (
      !variable || proposal.seedContextId !== value.baseline.seedContextId || proposal.actionType !== "update_external_variable" ||
      proposal.parameters.actionType !== "update_external_variable" || proposal.parameters.variableId !== item.axis.targetId ||
      !Object.is(proposal.parameters.value, item.axis.variantValue) || canonicalJsonV2(proposal.targetVariableIds) !== canonicalJsonV2([item.axis.targetId]) ||
      proposal.targetEntityIds.length !== 0 || proposal.targetResourceIds.length !== 0 || proposal.targetRelationIds.length !== 0
    ) return { ok: false as const, errorCode: "uncontrolled_sensitivity_change" as const, failedVariantIndex: variantIndex, issues: [`variants.${variantIndex}: axis and Proposal must describe one identical external variable change`] };
    const transition = applyPreRunActionV2({ proposal, world, variantId: item.variantId, variantIndex, spec: value.baseline, adapter });
    if (!transition.ok) return { ok: false as const, errorCode: transition.phase === "input" ? "uncontrolled_sensitivity_change" as const : transition.phase === "approval" ? "intervention_approval_failed" as const : "intervention_transition_failed" as const, failedVariantIndex: variantIndex, causeCode: transition.causeCode };
    const spec = structuredClone(value.baseline);
    spec.trajectoryTemplate.initialWorld = structuredClone(transition.transition.world);
    spec.trajectoryTemplate.expectedInitialWorldRevision = transition.transition.world.revision;
    spec.trajectoryTemplate.startAt = transition.transition.world.updatedAt;
    prepared.push({ item, variable, spec, transition: transition.transition });
  }
  const baseline = analyzeTrajectoryBatchV2(value.baseline, adapter);
  if (!baseline.ok) return baseline;
  const variants = [];
  for (const preparedVariant of prepared) {
    const analyzed = analyzeTrajectoryBatchV2(preparedVariant.spec, adapter);
    if (!analyzed.ok) return analyzed;
    variants.push({
      variantId: preparedVariant.item.variantId,
      axis: { ...preparedVariant.item.axis, baselineValue: preparedVariant.variable.value },
      transitionEventId: preparedVariant.transition.event.id,
      transitionWorldRevision: preparedVariant.transition.world.revision,
      analysis: analyzed.analysis,
      pairedSeedDifferences: paired(baseline.analysis, analyzed.analysis),
      frequencyDifferences: frequencyDifferences(baseline.analysis, analyzed.analysis),
    });
  }
  return { ok: true as const, sensitivityAnalysisId: value.sensitivityAnalysisId, baseline: baseline.analysis, variants };
}
