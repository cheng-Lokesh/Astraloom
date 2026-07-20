import { z } from "zod";

import { evaluateAssumptionReadinessV2 } from "../reality-boundary/assumption-ledger";
import { parseTrajectoryRunSpecV2 } from "../trajectory/validation";
import { ANALYSIS_ENGINE_VERSION_V2, CLUSTERING_ALGORITHM_V2, CLUSTERING_VERSION_V2, FEATURE_SCHEMA_VERSION_V2, MAX_TRAJECTORY_SAMPLES_V2, type AnalysisErrorCodeV2, type BatchRunSpecV2 } from "./types";

const nonEmpty = z.string().trim().min(1).max(1000);
const schema = z.object({
  analysisRunSpecId: nonEmpty.regex(/^analysis_run_spec_v2_/),
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

function fail(errorCode: AnalysisErrorCodeV2, issues?: string[]) {
  return { ok: false as const, errorCode, ...(issues?.length ? { issues } : {}) };
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
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("invalid_analysis_run_spec", parsed.error.issues.map((item) => `${item.path.join(".")}: ${item.message}`));
  if (new Set(parsed.data.trajectorySeeds).size !== parsed.data.trajectorySeeds.length) return fail("duplicate_trajectory_seed");
  if (parsed.data.sampleCount !== parsed.data.trajectorySeeds.length) return fail("invalid_analysis_run_spec", ["sampleCount must equal trajectorySeeds.length"]);
  const child = parseTrajectoryRunSpecV2(parsed.data.trajectoryTemplate);
  if (!child.ok) return fail(child.errorCode === "cross_seed_reference" ? "cross_seed_reference" : "invalid_analysis_run_spec", child.issues);
  const spec = { ...parsed.data, trajectoryTemplate: child.value } as BatchRunSpecV2;
  if (spec.seedContextId !== child.value.seedContextId) return fail("cross_seed_reference");
  if (spec.horizonDays !== child.value.horizonDays || spec.policyId !== child.value.policyId || spec.policyVersion !== child.value.policyVersion || spec.trajectoryEngineVersion !== child.value.trajectoryEngineVersion) return fail("version_mismatch");
  for (const assumption of child.value.initialWorld.realityBoundarySnapshot.assumptionLedger.assumptions) {
    if (assumption.subjectType === "third_party" && assumption.impactLevel === "high" && !evaluateAssumptionReadinessV2(assumption).downstreamReady) return fail("invalid_analysis_run_spec", ["high_impact_third_party_confirmation_required"]);
  }
  return { ok: true as const, value: structuredClone({ ...spec, trajectorySeeds: [...spec.trajectorySeeds].sort((a, b) => a - b) }) };
}
