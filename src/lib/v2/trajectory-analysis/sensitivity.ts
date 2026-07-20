import { canonicalJsonV2 } from "./ids";
import { analyzeTrajectoryBatchV2 } from "./batch-runner";
import type { BatchAnalysisV2, BatchRunSpecV2, PairedSeedDifferenceV2, SensitivityAxisV2, SensitivityComparisonInputV2, TrajectoryAnalysisAdapterV2 } from "./types";

function variableValue(spec: BatchRunSpecV2, targetId: string) {
  return spec.trajectoryTemplate.initialWorld.externalVariables.find((item) => item.id === targetId)?.value;
}

function controlledOnly(baseline: BatchRunSpecV2, variant: BatchRunSpecV2, axis: SensitivityAxisV2) {
  if (axis.kind !== "external_variable") return false;
  if (variableValue(baseline, axis.targetId) !== axis.baselineValue || variableValue(variant, axis.targetId) !== axis.variantValue || Object.is(axis.baselineValue, axis.variantValue)) return false;
  const left = structuredClone(baseline);
  const right = structuredClone(variant);
  const leftVariable = left.trajectoryTemplate.initialWorld.externalVariables.find((item) => item.id === axis.targetId);
  const rightVariable = right.trajectoryTemplate.initialWorld.externalVariables.find((item) => item.id === axis.targetId);
  if (!leftVariable || !rightVariable || leftVariable.variableType !== rightVariable.variableType) return false;
  (leftVariable as { value: number | string }).value = "__controlled_axis__";
  (rightVariable as { value: number | string }).value = "__controlled_axis__";
  return canonicalJsonV2(left) === canonicalJsonV2(right);
}

function paired(baseline: BatchAnalysisV2, variant: BatchAnalysisV2): PairedSeedDifferenceV2[] {
  const variants = new Map(variant.features.map((item) => [item.trajectorySeed, item]));
  return baseline.features.map((item) => {
    const comparison = variants.get(item.trajectorySeed)!;
    return { trajectorySeed: item.trajectorySeed, baselineFeatureSignature: item.featureSignature, variantFeatureSignature: comparison.featureSignature, changed: item.featureSignature !== comparison.featureSignature };
  });
}

function frequencyDifferences(baseline: BatchAnalysisV2, variant: BatchAnalysisV2) {
  const left = new Map(baseline.frequencies.map((item) => [item.clusterId, item.numerator]));
  const right = new Map(variant.frequencies.map((item) => [item.clusterId, item.numerator]));
  return [...new Set([...left.keys(), ...right.keys()])].sort().map((clusterId) => ({ clusterId, baselineNumerator: left.get(clusterId) ?? 0, variantNumerator: right.get(clusterId) ?? 0, denominator: baseline.spec.sampleCount }));
}

export function compareSensitivityV2(input: unknown, adapter: TrajectoryAnalysisAdapterV2) {
  try {
    const value = input as SensitivityComparisonInputV2;
    if (!value || typeof value !== "object" || !/^sensitivity_analysis_v2_/.test(value.sensitivityAnalysisId) || !Array.isArray(value.variants) || value.variants.length === 0 || value.variants.some((item) => !item || typeof item.variantId !== "string" || !item.variantId || !item.axis || !item.spec)) return { ok: false as const, errorCode: "incomparable_variant" as const };
    for (const variant of value.variants) {
      if (variant.spec.trajectoryEngineVersion !== value.baseline.trajectoryEngineVersion || variant.spec.analysisEngineVersion !== value.baseline.analysisEngineVersion || variant.spec.featureSchemaVersion !== value.baseline.featureSchemaVersion || variant.spec.clusteringVersion !== value.baseline.clusteringVersion || variant.spec.clusteringAlgorithm !== value.baseline.clusteringAlgorithm || variant.spec.policyId !== value.baseline.policyId || variant.spec.policyVersion !== value.baseline.policyVersion || variant.spec.horizonDays !== value.baseline.horizonDays || canonicalJsonV2([...variant.spec.trajectorySeeds].sort()) !== canonicalJsonV2([...value.baseline.trajectorySeeds].sort())) return { ok: false as const, errorCode: "incomparable_variant" as const };
      if (!controlledOnly(value.baseline, variant.spec, variant.axis)) return { ok: false as const, errorCode: "uncontrolled_sensitivity_change" as const };
    }
    const baseline = analyzeTrajectoryBatchV2(value.baseline, adapter);
    if (!baseline.ok) return baseline;
    const variants = [];
    for (const item of value.variants) {
      const analyzed = analyzeTrajectoryBatchV2(item.spec, adapter);
      if (!analyzed.ok) return analyzed;
      variants.push({ variantId: item.variantId, axis: structuredClone(item.axis), analysis: analyzed.analysis, pairedSeedDifferences: paired(baseline.analysis, analyzed.analysis), frequencyDifferences: frequencyDifferences(baseline.analysis, analyzed.analysis) });
    }
    return { ok: true as const, sensitivityAnalysisId: value.sensitivityAnalysisId, baseline: baseline.analysis, variants };
  } catch {
    return { ok: false as const, errorCode: "incomparable_variant" as const };
  }
}
