import { z } from "zod";

import type { RealityBoundarySnapshotV2, WorldEventIdV2, WorldEventV2, WorldStateV2 } from "../agent-world/types";
import type { AssumptionIdV2, RealEvidenceIdV2 } from "../reality-boundary/types";
import type { TrajectoryIdV2 } from "../trajectory/types";
import { canonicalJsonV2 } from "../trajectory-analysis/ids";
import type { BatchAnalysisV2, TrajectoryClusterV2 } from "../trajectory-analysis/types";
import { claimIdV2, claimsFingerprintV2 } from "./ids";
import { clusterByIdV2, revalidateBatchAnalysisV2 } from "./stage5-revalidation";
import type { ClaimTypeV2, ClaimV2 } from "./types";
import {
  CLAIM_POLICY_VERSION_V2,
  CLAIM_SCHEMA_VERSION_V2,
  CLAIMS_REPORTS_ENGINE_VERSION_V2,
} from "./types";
import { parseRealityBoundarySnapshotV2 } from "./validation";

const wrapperSchema = (key: "analysis" | "comparison") => z.object({
  [key]: z.unknown(),
  realityBoundary: z.unknown(),
}).strict();
const id = (prefix: string) => z.string().regex(new RegExp(`^${prefix}[a-z0-9][a-z0-9_-]*$`));
const pairedSchema = z.object({
  trajectorySeed: z.number().int().min(0).max(0xffff_ffff),
  baselineFeatureSignature: z.string().regex(/^[a-f0-9]{24}$/),
  variantFeatureSignature: z.string().regex(/^[a-f0-9]{24}$/),
  changed: z.boolean(),
}).strict();
const differenceSchema = z.object({
  clusterId: id("trajectory_cluster_v2_"),
  baselineNumerator: z.number().int().nonnegative(),
  variantNumerator: z.number().int().nonnegative(),
  denominator: z.number().int().positive(),
}).strict();
const axisSchema = z.object({
  kind: z.literal("external_variable"),
  targetId: id("world_variable_v2_"),
  variantValue: z.union([z.string(), z.number().finite()]),
  baselineValue: z.union([z.string(), z.number().finite()]),
}).strict();
const sensitivityVariantSchema = z.object({
  variantId: id("sensitivity_variant_v2_"),
  axis: axisSchema,
  transitionEventId: id("world_event_v2_"),
  transitionWorldRevision: z.number().int().nonnegative(),
  analysis: z.unknown(),
  pairedSeedDifferences: z.array(pairedSchema).min(1).max(100),
  frequencyDifferences: z.array(differenceSchema).min(1).max(200),
}).strict();
const sensitivitySchema = z.object({
  ok: z.literal(true),
  sensitivityAnalysisId: id("sensitivity_analysis_v2_"),
  baseline: z.unknown(),
  variants: z.array(sensitivityVariantSchema).min(1).max(20),
}).strict();
const interventionVariantSchema = z.object({
  variantId: id("intervention_variant_v2_"),
  interventionEventId: id("world_event_v2_"),
  interventionWorldRevision: z.number().int().nonnegative(),
  spec: z.unknown(),
  analysis: z.unknown(),
  pairedSeedDifferences: z.array(pairedSchema).min(1).max(100),
  realEvidenceLedgerAfter: z.unknown(),
}).strict();
const interventionSchema = z.object({
  ok: z.literal(true),
  interventionComparisonId: id("intervention_comparison_v2_"),
  baseline: z.unknown(),
  variants: z.array(interventionVariantSchema).min(1).max(20),
}).strict();

const sortedUnique = <T extends string>(values: T[]) => [...new Set(values)].sort() as T[];
const same = (left: unknown, right: unknown) => canonicalJsonV2(left) === canonicalJsonV2(right);

function versions(analysis: BatchAnalysisV2, boundary: RealityBoundarySnapshotV2) {
  const first = analysis.features[0]!;
  return {
    claimsReportsEngineVersion: CLAIMS_REPORTS_ENGINE_VERSION_V2,
    claimSchemaVersion: CLAIM_SCHEMA_VERSION_V2,
    claimPolicyVersion: CLAIM_POLICY_VERSION_V2,
    trajectoryEngineVersion: first.trajectoryEngineVersion,
    agentWorldEngineVersion: first.agentWorldEngineVersion,
    analysisEngineVersion: first.analysisEngineVersion,
    featureSchemaVersion: first.featureSchemaVersion,
    clusteringAlgorithm: analysis.spec.clusteringAlgorithm,
    clusteringVersion: analysis.spec.clusteringVersion,
    policyVersion: first.policyVersion,
    realityBoundarySchemaVersion: boundary.schemaVersion,
    realityBoundaryRevision: boundary.revision,
  } as const;
}

function createClaim(unsigned: Omit<ClaimV2, "id" | "claimIntegritySignature">): ClaimV2 {
  return {
    id: claimIdV2(unsigned),
    ...structuredClone(unsigned),
    claimIntegritySignature: claimsFingerprintV2(unsigned),
  };
}

function provenanceForClusters(clusters: Array<TrajectoryClusterV2 | undefined>) {
  const present = clusters.filter((item): item is TrajectoryClusterV2 => item !== undefined);
  return {
    realEvidenceIds: sortedUnique(present.flatMap((item) => item.causalRealEvidenceIds)) as RealEvidenceIdV2[],
    simulationEventIds: sortedUnique(present.flatMap((item) => item.simulationEventIds)) as WorldEventIdV2[],
    assumptionIds: sortedUnique(present.flatMap((item) => [...item.inputAssumptionIds, ...item.causalAssumptionIds])) as AssumptionIdV2[],
    trajectoryIds: sortedUnique(present.flatMap((item) => item.memberTrajectoryIds)) as TrajectoryIdV2[],
    clusterIds: sortedUnique(present.map((item) => item.clusterId)),
  };
}

function buildDifferenceClaim({
  claimType, sourceAnalysisId, variantId, clusterId, baselineNumerator, variantNumerator,
  baseline, variant, boundary, transition,
}: {
  claimType: Exclude<ClaimTypeV2, "scenario_frequency">;
  sourceAnalysisId: string;
  variantId: string;
  clusterId: string;
  baselineNumerator: number;
  variantNumerator: number;
  baseline: BatchAnalysisV2;
  variant: BatchAnalysisV2;
  boundary: RealityBoundarySnapshotV2;
  transition: WorldEventV2;
}) {
  const clusterProvenance = provenanceForClusters([clusterByIdV2(baseline, clusterId), clusterByIdV2(variant, clusterId)]);
  const provenance = {
    realEvidenceIds: sortedUnique([...clusterProvenance.realEvidenceIds, ...transition.causalRealEvidenceIds]) as RealEvidenceIdV2[],
    simulationEventIds: sortedUnique([...clusterProvenance.simulationEventIds, transition.id, ...transition.priorWorldEventIds]) as WorldEventIdV2[],
    assumptionIds: sortedUnique([...clusterProvenance.assumptionIds, ...transition.causalAssumptionIds]) as AssumptionIdV2[],
    trajectoryIds: clusterProvenance.trajectoryIds,
    clusterIds: clusterProvenance.clusterIds,
  };
  if (provenance.realEvidenceIds.length === 0) return { ok: false as const, errorCode: "missing_real_provenance" as const };
  if (provenance.simulationEventIds.length === 0) return { ok: false as const, errorCode: "missing_simulation_provenance" as const };
  const numerator = variantNumerator - baselineNumerator;
  const label = claimType === "sensitivity_difference" ? "Sensitivity" : "Intervention";
  return { ok: true as const, claim: createClaim({
    claimType,
    metric: "sampled_frequency_difference",
    seedContextId: baseline.spec.seedContextId,
    sourceAnalysisId,
    variantId,
    statement: `${label} variant ${variantId} changed cluster ${clusterId} by ${numerator}/${baseline.spec.sampleCount} sampled trajectories versus baseline.`,
    ...provenance,
    numerator,
    denominator: baseline.spec.sampleCount,
    sampleCount: baseline.spec.sampleCount,
    versions: versions(baseline, boundary),
    uncertaintyStatement: "This deterministic difference compares fixed seeded simulation samples; it is not a calibrated real-world probability or causal effect estimate.",
  }) };
}

function validateComparisonPair(baseline: BatchAnalysisV2, variant: BatchAnalysisV2, pairedInput: unknown) {
  const normalizedVariantSpec = structuredClone(variant.spec);
  normalizedVariantSpec.trajectoryTemplate.initialWorld = structuredClone(baseline.spec.trajectoryTemplate.initialWorld);
  normalizedVariantSpec.trajectoryTemplate.expectedInitialWorldRevision = baseline.spec.trajectoryTemplate.expectedInitialWorldRevision;
  normalizedVariantSpec.trajectoryTemplate.startAt = baseline.spec.trajectoryTemplate.startAt;
  if (!same(normalizedVariantSpec, baseline.spec)) return { ok: false as const, errorCode: "invalid_stage5_comparison" as const };
  const bySeed = new Map(variant.features.map((item) => [item.trajectorySeed, item]));
  const paired = baseline.features.map((item) => {
    const comparison = bySeed.get(item.trajectorySeed);
    if (!comparison) return null;
    return {
      trajectorySeed: item.trajectorySeed,
      baselineFeatureSignature: item.featureSignature,
      variantFeatureSignature: comparison.featureSignature,
      changed: item.outcomeSignature !== comparison.outcomeSignature,
    };
  });
  if (paired.some((item) => item === null) || !same(paired, pairedInput)) return { ok: false as const, errorCode: "invalid_stage5_comparison" as const };
  return { ok: true as const };
}

function replayTransitionEventV2(baselineWorld: WorldStateV2, event: WorldEventV2) {
  if (
    event.seedContextId !== baselineWorld.seedContextId || event.beforeRevision !== baselineWorld.revision ||
    event.afterRevision !== baselineWorld.revision + 1 || event.deltas.length !== 1 ||
    event.eventType !== event.operation.actionType || event.engineVersion !== baselineWorld.engineVersion ||
    baselineWorld.appliedTransitionCommandIds.includes(event.commandId) || baselineWorld.worldEventIds.includes(event.id)
  ) return null;
  const next = structuredClone(baselineWorld);
  const delta = event.deltas[0]!;
  const [, targetId] = delta.path.split(".");
  if (delta.valueType === "agent_state") {
    let index = -1;
    for (let candidateIndex = 0; candidateIndex < next.agentStates.length; candidateIndex += 1) {
      if (next.agentStates[candidateIndex]!.agentDefinitionId === targetId) index = candidateIndex;
    }
    if (index < 0 || !same(next.agentStates[index], delta.before)) return null;
    next.agentStates[index] = structuredClone(delta.after);
  } else if (delta.valueType === "resource") {
    let target = next.resources[0];
    for (const candidate of next.resources) if (candidate.id === targetId) target = candidate;
    if (!target || !Object.is(target.available, delta.before)) return null;
    target.available = delta.after;
  } else if (delta.valueType === "variable") {
    let target = next.externalVariables[0];
    for (const candidate of next.externalVariables) if (candidate.id === targetId) target = candidate;
    if (!target || !Object.is(target.value, delta.before)) return null;
    (target as { value: number | string }).value = delta.after;
  } else {
    let target = next.relations[0];
    for (const candidate of next.relations) if (candidate.id === targetId) target = candidate;
    if (!target || target.signal !== delta.before) return null;
    target.signal = delta.after;
  }
  next.revision = event.afterRevision;
  next.appliedTransitionCommandIds.push(event.commandId);
  next.worldEventIds.push(event.id);
  next.worldEvents.push(structuredClone(event));
  next.updatedAt = event.createdAt;
  return next;
}

function frequencyDifferences(baseline: BatchAnalysisV2, variant: BatchAnalysisV2) {
  const left = new Map(baseline.frequencies.map((item) => [item.clusterId, item.numerator]));
  const right = new Map(variant.frequencies.map((item) => [item.clusterId, item.numerator]));
  return [...new Set([...left.keys(), ...right.keys()])].sort().map((clusterId) => ({
    clusterId,
    baselineNumerator: left.get(clusterId) ?? 0,
    variantNumerator: right.get(clusterId) ?? 0,
    denominator: baseline.spec.sampleCount,
  }));
}

function validateTransitionEvent(
  baseline: BatchAnalysisV2,
  variant: BatchAnalysisV2,
  boundary: RealityBoundarySnapshotV2,
  eventId: string,
  transitionWorldRevision: number,
) {
  const baselineWorld = baseline.spec.trajectoryTemplate.initialWorld;
  const variantWorld = variant.spec.trajectoryTemplate.initialWorld;
  const event = variantWorld.worldEvents.find((item) => item.id === eventId);
  const realEvidenceIds = new Set(boundary.evidenceLedger.items.map((item) => item.id));
  const assumptionIds = new Set(boundary.assumptionLedger.assumptions.map((item) => item.id));
  const baselineEventIds = new Set(baselineWorld.worldEvents.map((item) => item.id));
  if (
    !event || baselineWorld.worldEvents.some((item) => item.id === eventId) ||
    event.causalRealEvidenceIds.some((id) => !realEvidenceIds.has(id)) ||
    event.causalAssumptionIds.some((id) => !assumptionIds.has(id)) ||
    event.priorWorldEventIds.some((id) => !baselineEventIds.has(id)) ||
    variantWorld.revision !== transitionWorldRevision ||
    transitionWorldRevision !== baselineWorld.revision + 1 ||
    variantWorld.worldEvents.length !== baselineWorld.worldEvents.length + 1 ||
    !same(variantWorld.worldEvents.slice(0, -1), baselineWorld.worldEvents) ||
    variantWorld.worldEvents.at(-1)?.id !== eventId
  ) return { ok: false as const, errorCode: "invalid_stage5_comparison" as const };
  const replayed = replayTransitionEventV2(baselineWorld, event);
  if (!replayed || !same(replayed, variantWorld)) return { ok: false as const, errorCode: "invalid_stage5_comparison" as const };
  return { ok: true as const, event };
}

function parseWrapper(input: unknown, key: "analysis" | "comparison") {
  const parsed = wrapperSchema(key).safeParse(input);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_claims_input" as const };
  const boundary = parseRealityBoundarySnapshotV2(parsed.data.realityBoundary);
  if (!boundary.ok) return boundary;
  return { ok: true as const, payload: parsed.data[key], boundary: boundary.boundary };
}

function buildScenarioFrequencyClaimsUnsafeV2(input: unknown) {
  const wrapper = parseWrapper(input, "analysis");
  if (!wrapper.ok) return wrapper;
  const validated = revalidateBatchAnalysisV2(wrapper.payload, wrapper.boundary);
  if (!validated.ok) return validated;
  const claims = validated.analysis.frequencies.map((frequency) => {
    const cluster = clusterByIdV2(validated.analysis, frequency.clusterId)!;
    const provenance = provenanceForClusters([cluster]);
    return createClaim({
      claimType: "scenario_frequency",
      metric: "simulation_frequency",
      seedContextId: validated.analysis.spec.seedContextId,
      sourceAnalysisId: validated.analysis.spec.analysisRunSpecId,
      variantId: null,
      statement: `Cluster ${cluster.clusterId} appeared in ${frequency.numerator}/${frequency.denominator} sampled trajectories.`,
      ...provenance,
      numerator: frequency.numerator,
      denominator: frequency.denominator,
      sampleCount: frequency.totalSampleCount,
      versions: versions(validated.analysis, wrapper.boundary),
      uncertaintyStatement: validated.analysis.uncertaintyStatement,
    });
  }).sort((left, right) => left.id.localeCompare(right.id));
  return { ok: true as const, claims };
}

function buildSensitivityDifferenceClaimsUnsafeV2(input: unknown) {
  const wrapper = parseWrapper(input, "comparison");
  if (!wrapper.ok) return wrapper;
  const parsed = sensitivitySchema.safeParse(wrapper.payload);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_stage5_comparison" as const };
  const baseline = revalidateBatchAnalysisV2(parsed.data.baseline, wrapper.boundary);
  if (!baseline.ok) return baseline;
  const claims: ClaimV2[] = [];
  for (const item of parsed.data.variants) {
    const variant = revalidateBatchAnalysisV2(item.analysis, wrapper.boundary);
    if (!variant.ok) return variant;
    const transition = validateTransitionEvent(baseline.analysis, variant.analysis, wrapper.boundary, item.transitionEventId, item.transitionWorldRevision);
    if (!transition.ok) return transition;
    const baselineVariable = baseline.analysis.spec.trajectoryTemplate.initialWorld.externalVariables.find((value) => value.id === item.axis.targetId);
    const variantVariable = variant.analysis.spec.trajectoryTemplate.initialWorld.externalVariables.find((value) => value.id === item.axis.targetId);
    if (
      !baselineVariable || !variantVariable || Object.is(item.axis.baselineValue, item.axis.variantValue) || !Object.is(baselineVariable.value, item.axis.baselineValue) ||
      !Object.is(variantVariable.value, item.axis.variantValue) ||
      !transition.event.targetVariableIds.some((id) => id === item.axis.targetId) || transition.event.operation.actionType !== "update_external_variable" ||
      transition.event.operation.variableId !== item.axis.targetId || !Object.is(transition.event.operation.value, item.axis.variantValue)
    ) return { ok: false as const, errorCode: "invalid_stage5_comparison" as const };
    const paired = validateComparisonPair(baseline.analysis, variant.analysis, item.pairedSeedDifferences);
    if (!paired.ok) return paired;
    const differences = frequencyDifferences(baseline.analysis, variant.analysis);
    if (!same(differences, item.frequencyDifferences)) return { ok: false as const, errorCode: "invalid_stage5_comparison" as const };
    for (const difference of differences) {
      const built = buildDifferenceClaim({
        claimType: "sensitivity_difference", sourceAnalysisId: parsed.data.sensitivityAnalysisId,
        variantId: item.variantId, ...difference, baseline: baseline.analysis, variant: variant.analysis, boundary: wrapper.boundary,
        transition: transition.event,
      });
      if (!built.ok) return built;
      claims.push(built.claim);
    }
  }
  return { ok: true as const, claims: claims.sort((left, right) => left.id.localeCompare(right.id)) };
}

function buildInterventionDifferenceClaimsUnsafeV2(input: unknown) {
  const wrapper = parseWrapper(input, "comparison");
  if (!wrapper.ok) return wrapper;
  const parsed = interventionSchema.safeParse(wrapper.payload);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_stage5_comparison" as const };
  const baseline = revalidateBatchAnalysisV2(parsed.data.baseline, wrapper.boundary);
  if (!baseline.ok) return baseline;
  const claims: ClaimV2[] = [];
  for (const item of parsed.data.variants) {
    const variant = revalidateBatchAnalysisV2(item.analysis, wrapper.boundary);
    if (!variant.ok) return variant;
    const transition = validateTransitionEvent(baseline.analysis, variant.analysis, wrapper.boundary, item.interventionEventId, item.interventionWorldRevision);
    if (!transition.ok) return transition;
    if (!same(item.spec, variant.analysis.spec) || !same(item.realEvidenceLedgerAfter, wrapper.boundary.evidenceLedger)) {
      return { ok: false as const, errorCode: "cross_ledger_reference" as const };
    }
    const paired = validateComparisonPair(baseline.analysis, variant.analysis, item.pairedSeedDifferences);
    if (!paired.ok) return paired;
    for (const difference of frequencyDifferences(baseline.analysis, variant.analysis)) {
      const built = buildDifferenceClaim({
        claimType: "intervention_difference", sourceAnalysisId: parsed.data.interventionComparisonId,
        variantId: item.variantId, ...difference, baseline: baseline.analysis, variant: variant.analysis, boundary: wrapper.boundary,
        transition: transition.event,
      });
      if (!built.ok) return built;
      claims.push(built.claim);
    }
  }
  return { ok: true as const, claims: claims.sort((left, right) => left.id.localeCompare(right.id)) };
}

export function buildScenarioFrequencyClaimsV2(input: unknown) {
  try { return buildScenarioFrequencyClaimsUnsafeV2(input); }
  catch { return { ok: false as const, errorCode: "invalid_claims_input" as const }; }
}

export function buildSensitivityDifferenceClaimsV2(input: unknown) {
  try { return buildSensitivityDifferenceClaimsUnsafeV2(input); }
  catch { return { ok: false as const, errorCode: "invalid_claims_input" as const }; }
}

export function buildInterventionDifferenceClaimsV2(input: unknown) {
  try { return buildInterventionDifferenceClaimsUnsafeV2(input); }
  catch { return { ok: false as const, errorCode: "invalid_claims_input" as const }; }
}

export function buildClaimsV2(input: unknown) {
  try {
    const schema = z.object({ kind: z.enum(["batch", "sensitivity", "intervention"]), payload: z.unknown(), realityBoundary: z.unknown() }).strict();
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { ok: false as const, errorCode: "invalid_claims_input" as const };
    if (parsed.data.kind === "batch") return buildScenarioFrequencyClaimsUnsafeV2({ analysis: parsed.data.payload, realityBoundary: parsed.data.realityBoundary });
    if (parsed.data.kind === "sensitivity") return buildSensitivityDifferenceClaimsUnsafeV2({ comparison: parsed.data.payload, realityBoundary: parsed.data.realityBoundary });
    return buildInterventionDifferenceClaimsUnsafeV2({ comparison: parsed.data.payload, realityBoundary: parsed.data.realityBoundary });
  } catch {
    return { ok: false as const, errorCode: "invalid_claims_input" as const };
  }
}
