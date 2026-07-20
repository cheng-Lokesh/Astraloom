import { z } from "zod";

import { parseActionProposalInputV2 } from "../agent-world/validation";
import { evaluateAssumptionReadinessV2 } from "../reality-boundary/assumption-ledger";
import { parseTrajectoryRunSpecV2 } from "../trajectory/validation";
import {
  parseAnalysisRunSpecIdV2,
  parseInterventionComparisonIdV2,
  parseInterventionVariantIdV2,
  parseSensitivityAnalysisIdV2,
  parseSensitivityVariantIdV2,
} from "./ids";
import {
  ANALYSIS_ENGINE_VERSION_V2,
  CLUSTERING_ALGORITHM_V2,
  CLUSTERING_VERSION_V2,
  FEATURE_SCHEMA_VERSION_V2,
  MAX_TRAJECTORY_SAMPLES_V2,
  type AnalysisErrorCodeV2,
  type BatchRunSpecV2,
  type InterventionComparisonInputV2,
  type SensitivityComparisonInputV2,
} from "./types";

const MAX_COMPARISON_VARIANTS_V2 = 20;
const nonEmpty = z.string().trim().min(1).max(1000);
const id = (parser: (value: unknown) => unknown) => z.string().refine((value) => parser(value) !== null, "invalid namespaced ID");

const batchSchema = z.object({
  analysisRunSpecId: id(parseAnalysisRunSpecIdV2),
  seedContextId: nonEmpty,
  trajectoryTemplate: z.unknown(),
  trajectorySeeds: z.array(z.number().finite().int().min(0).max(0xffff_ffff)).min(1).max(MAX_TRAJECTORY_SAMPLES_V2),
  sampleCount: z.number().finite().int().positive().max(MAX_TRAJECTORY_SAMPLES_V2),
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  policyId: nonEmpty,
  policyVersion: nonEmpty,
  trajectoryEngineVersion: z.literal("trajectory-engine-v2-stage-4"),
  analysisEngineVersion: z.literal(ANALYSIS_ENGINE_VERSION_V2),
  featureSchemaVersion: z.literal(FEATURE_SCHEMA_VERSION_V2),
  clusteringAlgorithm: z.literal(CLUSTERING_ALGORITHM_V2),
  clusteringVersion: z.literal(CLUSTERING_VERSION_V2),
}).strict();

const sensitivityAxisSchema = z.object({
  kind: z.literal("external_variable"),
  targetId: z.string().regex(/^world_variable_v2_[a-z0-9][a-z0-9_-]*$/),
  variantValue: z.union([z.number().finite(), z.string()]),
}).strict();

const sensitivityVariantSchema = z.object({
  variantId: id(parseSensitivityVariantIdV2),
  axis: sensitivityAxisSchema,
  proposal: z.unknown(),
}).strict();

const sensitivitySchema = z.object({
  sensitivityAnalysisId: id(parseSensitivityAnalysisIdV2),
  baseline: z.unknown(),
  variants: z.array(z.unknown()).min(1).max(MAX_COMPARISON_VARIANTS_V2),
}).strict();

const interventionVariantSchema = z.object({
  variantId: id(parseInterventionVariantIdV2),
  intervention: z.unknown(),
}).strict();

const interventionSchema = z.object({
  interventionComparisonId: id(parseInterventionComparisonIdV2),
  baseline: z.unknown(),
  variants: z.array(z.unknown()).min(1).max(MAX_COMPARISON_VARIANTS_V2),
}).strict();

function issues(error: z.ZodError, prefix = "") {
  return error.issues.map((item) => `${prefix}${item.path.join(".")}: ${item.message}`).sort();
}

function fail(errorCode: AnalysisErrorCodeV2, issueList?: string[]) {
  return { ok: false as const, errorCode, ...(issueList?.length ? { issues: [...issueList].sort() } : {}) };
}

export function parseBatchRunSpecV2(input: unknown) {
  if (input && typeof input === "object") {
    const candidate = input as Record<string, unknown>;
    if (
      ("analysisEngineVersion" in candidate && candidate.analysisEngineVersion !== ANALYSIS_ENGINE_VERSION_V2) ||
      ("featureSchemaVersion" in candidate && candidate.featureSchemaVersion !== FEATURE_SCHEMA_VERSION_V2) ||
      ("clusteringAlgorithm" in candidate && candidate.clusteringAlgorithm !== CLUSTERING_ALGORITHM_V2) ||
      ("clusteringVersion" in candidate && candidate.clusteringVersion !== CLUSTERING_VERSION_V2) ||
      ("trajectoryEngineVersion" in candidate && candidate.trajectoryEngineVersion !== "trajectory-engine-v2-stage-4")
    ) return fail("version_mismatch");
  }
  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_analysis_run_spec", issues(parsed.error));
  if (new Set(parsed.data.trajectorySeeds).size !== parsed.data.trajectorySeeds.length) return fail("duplicate_trajectory_seed", ["trajectorySeeds: duplicate seed"]);
  if (parsed.data.sampleCount !== parsed.data.trajectorySeeds.length) return fail("invalid_analysis_run_spec", ["sampleCount: must equal trajectorySeeds.length"]);
  const child = parseTrajectoryRunSpecV2(parsed.data.trajectoryTemplate);
  if (!child.ok) return fail(child.errorCode === "cross_seed_reference" ? "cross_seed_reference" : "invalid_analysis_run_spec", child.issues?.map((item) => `trajectoryTemplate.${item}`));
  const spec = { ...parsed.data, trajectoryTemplate: child.value } as BatchRunSpecV2;
  if (spec.seedContextId !== child.value.seedContextId) return fail("cross_seed_reference");
  if (spec.horizonDays !== child.value.horizonDays || spec.policyId !== child.value.policyId || spec.policyVersion !== child.value.policyVersion || spec.trajectoryEngineVersion !== child.value.trajectoryEngineVersion) return fail("version_mismatch");
  for (const assumption of child.value.initialWorld.realityBoundarySnapshot.assumptionLedger.assumptions) {
    if (assumption.subjectType === "third_party" && assumption.impactLevel === "high" && !evaluateAssumptionReadinessV2(assumption).downstreamReady) return fail("invalid_analysis_run_spec", ["trajectoryTemplate.initialWorld: high_impact_third_party_confirmation_required"]);
  }
  return { ok: true as const, value: structuredClone({ ...spec, trajectorySeeds: [...spec.trajectorySeeds].sort((a, b) => a - b) }) };
}

export function parseSensitivityComparisonInputV2(input: unknown) {
  const parsed = sensitivitySchema.safeParse(input);
  if (!parsed.success) return fail("incomparable_variant", issues(parsed.error));
  const baseline = parseBatchRunSpecV2(parsed.data.baseline);
  if (!baseline.ok) return baseline;
  const parsedVariants = [];
  for (let index = 0; index < parsed.data.variants.length; index += 1) {
    const variant = sensitivityVariantSchema.safeParse(parsed.data.variants[index]);
    if (!variant.success) return fail("incomparable_variant", issues(variant.error, `variants.${index}.`));
    parsedVariants.push(variant.data);
  }
  const variantIds = parsedVariants.map((item) => item.variantId);
  if (new Set(variantIds).size !== variantIds.length) return fail("incomparable_variant", ["variants.variantId: duplicate ID"]);
  const proposalIds = new Set<string>();
  const variants = [];
  for (let index = 0; index < parsedVariants.length; index += 1) {
    const item = parsedVariants[index]!;
    const proposal = parseActionProposalInputV2(item.proposal);
    if (!proposal.ok) return fail("uncontrolled_sensitivity_change", proposal.issues.map((issue) => `variants.${index}.proposal.${issue}`));
    if (proposalIds.has(proposal.value.id)) return fail("incomparable_variant", [`variants.${index}.proposal.id: duplicate ID`]);
    proposalIds.add(proposal.value.id);
    variants.push({ ...item, proposal: proposal.value });
  }
  return { ok: true as const, value: structuredClone({ sensitivityAnalysisId: parsed.data.sensitivityAnalysisId, baseline: baseline.value, variants }) as SensitivityComparisonInputV2 };
}

export function parseInterventionComparisonInputV2(input: unknown) {
  const parsed = interventionSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_intervention", issues(parsed.error));
  const baseline = parseBatchRunSpecV2(parsed.data.baseline);
  if (!baseline.ok) return baseline;
  const parsedVariants = [];
  for (let index = 0; index < parsed.data.variants.length; index += 1) {
    const variant = interventionVariantSchema.safeParse(parsed.data.variants[index]);
    if (!variant.success) return fail("invalid_intervention", issues(variant.error, `variants.${index}.`));
    parsedVariants.push(variant.data);
  }
  const variantIds = parsedVariants.map((item) => item.variantId);
  if (new Set(variantIds).size !== variantIds.length) return fail("invalid_intervention", ["variants.variantId: duplicate ID"]);
  const proposalIds = new Set<string>();
  const variants = [];
  for (let index = 0; index < parsedVariants.length; index += 1) {
    const item = parsedVariants[index]!;
    const proposal = parseActionProposalInputV2(item.intervention);
    if (!proposal.ok) return fail("invalid_intervention", proposal.issues.map((issue) => `variants.${index}.intervention.${issue}`));
    if (proposalIds.has(proposal.value.id)) return fail("invalid_intervention", [`variants.${index}.intervention.id: duplicate ID`]);
    proposalIds.add(proposal.value.id);
    variants.push({ ...item, intervention: proposal.value });
  }
  return { ok: true as const, value: structuredClone({ interventionComparisonId: parsed.data.interventionComparisonId, baseline: baseline.value, variants }) as InterventionComparisonInputV2 };
}
