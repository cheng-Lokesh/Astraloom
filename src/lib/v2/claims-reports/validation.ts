import { z } from "zod";

import { validateAssumptionLedgerV2, validateEvidenceLedgerV2 } from "../reality-boundary/validation";
import type { RealityBoundarySnapshotV2 } from "../agent-world/types";
import type { ClaimV2 } from "./types";
import {
  CLAIM_POLICY_VERSION_V2,
  CLAIM_SCHEMA_VERSION_V2,
  CLAIMS_REPORTS_ENGINE_VERSION_V2,
} from "./types";
import { claimIdV2, claimsFingerprintV2 } from "./ids";

const bounded = z.string().trim().min(1).max(1000);
const namespaced = (prefix: string) => z.string().regex(new RegExp(`^${prefix}[a-z0-9][a-z0-9_-]*$`));
const unique = <T>(items: T[]) => new Set(items).size === items.length;

export const realityBoundarySnapshotSchemaV2 = z.object({
  seedContextId: bounded,
  schemaVersion: z.literal("2.0"),
  revision: z.number().int().nonnegative(),
  evidenceLedger: z.unknown(),
  assumptionLedger: z.unknown(),
  createdAt: bounded,
  updatedAt: bounded,
}).strict();

const versionsSchema = z.object({
  claimsReportsEngineVersion: z.literal(CLAIMS_REPORTS_ENGINE_VERSION_V2),
  claimSchemaVersion: z.literal(CLAIM_SCHEMA_VERSION_V2),
  claimPolicyVersion: z.literal(CLAIM_POLICY_VERSION_V2),
  trajectoryEngineVersion: bounded,
  agentWorldEngineVersion: bounded,
  analysisEngineVersion: bounded,
  featureSchemaVersion: bounded,
  clusteringAlgorithm: bounded,
  clusteringVersion: bounded,
  policyVersion: bounded,
  realityBoundarySchemaVersion: z.literal("2.0"),
  realityBoundaryRevision: z.number().int().nonnegative(),
}).strict();

export const claimSchemaV2 = z.object({
  id: namespaced("claim_v2_"),
  claimType: z.enum(["scenario_frequency", "sensitivity_difference", "intervention_difference"]),
  metric: z.enum(["simulation_frequency", "sampled_frequency_difference"]),
  seedContextId: bounded,
  sourceAnalysisId: bounded,
  variantId: bounded.nullable(),
  statement: bounded,
  realEvidenceIds: z.array(namespaced("real_evidence_v2_")).min(1).max(10000),
  simulationEventIds: z.array(namespaced("world_event_v2_")).min(1).max(10000),
  assumptionIds: z.array(namespaced("assumption_v2_")).max(10000),
  trajectoryIds: z.array(namespaced("trajectory_v2_")).min(1).max(1000),
  clusterIds: z.array(namespaced("trajectory_cluster_v2_")).min(1).max(1000),
  numerator: z.number().int(),
  denominator: z.number().int().positive(),
  sampleCount: z.number().int().positive(),
  versions: versionsSchema,
  uncertaintyStatement: bounded,
  claimIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
}).strict();

export function parseRealityBoundarySnapshotV2(input: unknown) {
  const parsed = realityBoundarySnapshotSchemaV2.safeParse(input);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_claims_input" as const };
  const boundary = parsed.data as RealityBoundarySnapshotV2;
  const evidence = validateEvidenceLedgerV2(boundary.evidenceLedger);
  if (!evidence.ok) return { ok: false as const, errorCode: "cross_ledger_reference" as const };
  const assumptions = validateAssumptionLedgerV2(boundary.assumptionLedger, boundary.evidenceLedger);
  const unconfirmed = boundary.assumptionLedger.assumptions.some((item) =>
    item.subjectType === "third_party" && item.impactLevel === "high" &&
    (item.confirmationRequirement !== "required" || item.confirmationStatus !== "confirmed" || item.epistemicStatus !== "confirmed_for_simulation"));
  if (unconfirmed) return { ok: false as const, errorCode: "unconfirmed_high_impact_assumption" as const };
  if (!assumptions.ok) return { ok: false as const, errorCode: "cross_ledger_reference" as const };
  if (
    boundary.evidenceLedger.seedContextId !== boundary.seedContextId ||
    boundary.assumptionLedger.seedContextId !== boundary.seedContextId ||
    boundary.evidenceLedger.revision !== boundary.revision ||
    boundary.assumptionLedger.revision !== boundary.revision
  ) return { ok: false as const, errorCode: "cross_ledger_reference" as const };
  return { ok: true as const, boundary: structuredClone(boundary) };
}

export function parseValidatedClaimV2(input: unknown) {
  const parsed = claimSchemaV2.safeParse(input);
  if (!parsed.success) return { ok: false as const, errorCode: "claim_tampering" as const };
  const claim = parsed.data as ClaimV2;
  if (
    !unique(claim.realEvidenceIds) || !unique(claim.simulationEventIds) ||
    !unique(claim.assumptionIds) || !unique(claim.trajectoryIds) || !unique(claim.clusterIds)
  ) return { ok: false as const, errorCode: "duplicate_id" as const };
  if (claim.denominator !== claim.sampleCount) return { ok: false as const, errorCode: "claim_tampering" as const };
  if (claim.claimType === "scenario_frequency" && (claim.numerator < 0 || claim.numerator > claim.denominator)) {
    return { ok: false as const, errorCode: "claim_tampering" as const };
  }
  const clusterId = claim.clusterIds.length === 1 ? claim.clusterIds[0] : null;
  const expectedStatement = claim.claimType === "scenario_frequency"
    ? clusterId && claim.variantId === null && claim.metric === "simulation_frequency" && /^analysis_run_spec_v2_[a-z0-9][a-z0-9_-]*$/.test(claim.sourceAnalysisId)
      ? `Cluster ${clusterId} appeared in ${claim.numerator}/${claim.denominator} sampled trajectories.`
      : null
    : clusterId && claim.variantId !== null && claim.metric === "sampled_frequency_difference"
      ? `${claim.claimType === "sensitivity_difference" ? "Sensitivity" : "Intervention"} variant ${claim.variantId} changed cluster ${clusterId} by ${claim.numerator}/${claim.denominator} sampled trajectories versus baseline.`
      : null;
  const expectedUncertainty = claim.claimType === "scenario_frequency"
    ? "This is sampled simulation frequency from fixed trajectory seeds, not a backtested real-world probability."
    : "This deterministic difference compares fixed seeded simulation samples; it is not a calibrated real-world probability or causal effect estimate.";
  if (claim.statement !== expectedStatement || claim.uncertaintyStatement !== expectedUncertainty) {
    return { ok: false as const, errorCode: "claim_tampering" as const };
  }
  const { id, claimIntegritySignature, ...unsigned } = claim;
  if (claimIdV2(unsigned) !== id || claimsFingerprintV2(unsigned) !== claimIntegritySignature) {
    return { ok: false as const, errorCode: "claim_tampering" as const };
  }
  return { ok: true as const, claim: structuredClone(claim) };
}
